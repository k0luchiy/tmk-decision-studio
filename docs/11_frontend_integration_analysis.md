# 11. Анализ фронтенда и план интеграции с backend

**Статус: интегрировано (10.11.2026).** Анализ ниже оставлен как история
решений; актуальное состояние — в таблице и в `docs/10_api_contract.md`.

**Реализовано**

- Fastify BFF (`backend/`) со всеми эндпоинтами: health, meta, datasets,
  intake/confirm, estimates (POST/GET list/GET by id), export PDF/XLSX/JSON,
  multipart-импорт HelpDesk.
- Адаптер фронта (`frontend/src/core/api.js`, `apiModel.js`, `apiRequest.js`):
  `VITE_DATA_MODE=local|api`, debounce 500 мс, локальный fallback при ошибке API.
- Backend — единственный источник цифр; `calc.js` работает только в `local`/
  fallback и для короткого брифа.
- История оценок через `GET /api/estimates` и `GET /api/estimates/:id`.
- Матрица решений (scoreParts/recommended), sensitivity, distribution,
  tco1/3/5, supportMonthly, per-stage `days`/`external` — собираются адаптером
  из ответа API.
- Брендированный PDF с полной матрицей трёх сценариев; XLSX; JSON-снимок.
- UI: экран «Данные» на `/api/datasets`, импорт HelpDesk, intake-режимы
  `off/cache/live`, статус API в шапке.

**Осталось / осознанно не сделано**

- Playwright-сценарий как обязательный CI-шаг (визуальный QA выполняется
  отдельно, см. `docs/deliverables/TEST_REPORT.md` §5).
- Авторизация, rate limiting, disk persistence, SSE-прогресс Jev.
- `POST /api/estimates/:id/recalculate` — заменён новым POST с `options`.
- Полный переход фронта на TypeScript: сейчас JS + адаптер и JSDoc-контракт.

---

**Дата анализа:** 9.11.2026 · **Исходный статус:** анализ, решение не принято · **Фронт:** `frontend/` (добавлен вторым разработчиком).

## 1. Что это за приложение

| Параметр | Значение |
|---|---|
| Стек | Vite 6 + React 18 (JSX, **без TypeScript**), Recharts, lucide-react, `@fontsource/*` |
| Размер | ~3 500 строк JSX/JS + CSS; 7 страниц, 6 компонентов |
| Запуск | `cd frontend && npm i && npm run dev` (порт 5173) |
| Тесты | `node --test tests/calc.test.js` — 8 тестов на локальный движок |
| API | **нет**; ни одного `fetch`; все данные захардкожены в `src/data/cases.js` |
| Расчёт | **собственный клиентский движок** `src/core/calc.js` (~412 строк) |
| Экспорт | JSON-снимок, CSV, PDF через `window.print()` |
| Тема | светлая/тёмная, дизайн в духе ТМК (Barlow Condensed, Inter, JetBrains Mono) |

### Экраны

| Экран | Что делает | Данные |
|---|---|---|
| Старт | бриф, файлы, 3 демо-кейса, последние оценки | `CASES`, локальный расчёт |
| Параметры | бриф → извлечение параметров → подтверждение; ставка, резерв, надзор, найм, срок | `state`, `parseBrief` |
| Обзор | вердикт, confidence, структура затрат, факторы выбора | `model` |
| Аналитика | 6 графиков: стоимость, сроки, TCO, break-even, tornado, распределение | `model` |
| Структура оценки | 7 этапов, часы/ставки/подрядчик/дни, доли гибрида, доп. статьи | `state.stages`, `state.extras` |
| Обоснование | вердикт, confidence, допущения, риски, аналоги, источники, экспорт | `model.meta` |
| Методика | статические формулы и модель данных | константы |
| Данные | «реестр датасетов», фейковый импорт HelpDesk | захардкожено |

### Сильные стороны

- Целостный сценарий: старт → бриф → параметры → 3 сценария → графики → обоснование → экспорт.
- Плотный, аккуратный UI; тёмная/светлая темы; адаптив.
- Есть редактирование этапов, доп. статей, гибрида; мгновенный пересчёт.
- 6 аналитических представлений и формула-панель.
- Понятные ограничения и дисклеймеры.

### Слабые места (для интеграции)

- **Второй источник истины:** свой `calc.js` со своими формулами, весами confidence и цифрами.
- **Данные вымышлены:** аналоги подписаны «ЕИС · 223-ФЗ», суммы и риски — демо; это нельзя показывать как факт.
- **Нет API, загрузки данных, сохранения на сервере.**
- **Нет TypeScript** — контракт `@app/contract` напрямую не переиспользуется.
- Импорт HelpDesk и реестр данных — имитация.
- PDF — печать браузера, а не серверный PDF.

## 2. Что ожидает фронт (форма `model`)

```
model = {
  meta: CASES[caseId], state,
  effort, effortRange, stageRows, stageDays,
  scenarios: { internal, vendor, hybrid }:
    { id, cost, p10, p50, p90, weeks, rawWeeks, compressed, savedWeeks,
      compressionMultiplier, supportMonthly, tco1, tco3, tco5,
      score, scoreParts{cost,time,risk,flexibility}, lines[{label,value}] },
  recommended, ranking, scores,
  confidence: { score, components[{id,label,weight,value}] },
  analogMedian, methodDiff, breakEven, breakEvenSeries[37],
  tcoSeries[6], sensitivity[5], distribution[11],
  risks[{name,probability,impact,expected,note}], risksTotal,
  warnings[{tone,title,text}], pending, rawWeeks, deadline
}
```

`state`:
```
{ caseId, name, type, description, complexity, integrations, screens, users,
  deadlineWeeks, teamRate, reserve, hiring, contractType, oversight, hybridSplit,
  stages[7]: {id,name,desc,hours,rate,external,days,split,owner,category},
  extras[]: {id,name,kind,internal,external,hybrid},
  confirmedParams, rejectedParams }
```

## 3. Что уже есть на бэке

| Возможность | Пакет | Готово |
|---|---|---|
| Типы/zod-схемы | `@app/contract` | да |
| Датасеты, версия, валидация | `@app/data` | да |
| WBS 6 этапов + support, O/M/P, роли | `@app/core` | да |
| FP-lite, аналоги с нормализацией | `@app/core` | да |
| In-house / contractor / hybrid, extras | `@app/core` | да |
| Срок, Putnam, Монте-Карло (quantiles) | `@app/core` | да |
| TCO 1/3/5, break-even (функция) | `@app/core` | да |
| Вердикт по правилам, confidence, формула-дерево | `@app/core` | да |
| `estimateTask` (полный пайплайн) | `@app/core` | да |
| Intake: правила + Jev + кэш + подтверждение | `@app/intake` | да |
| JSON/XLSX/PDF + gate | `@app/export` | да |
| **HTTP API** | `backend/` | **нет** |
| **Per-stage contractor cost/days** | — | **нет** |
| **scoreParts / decision matrix** | — | **частично** (вердикт есть, матрицы нет) |
| **Tornado / sensitivity** | — | **нет** |
| **Histogram распределения** | — | **нет** (только квантили) |
| **tco1/tco3/tco5, supportMonthly** | — | вычисляется, но не в форме фронта |
| **Сохранение оценок / импорт файла** | — | нет |

## 4. Сопоставление моделей

| Фронт | Бэк | Статус |
|---|---|---|
| `internal` / `vendor` / `hybrid` | `inhouse` / `contractor` / `hybrid` | переименовать в адаптере |
| `p10/p50/p90` | `cost.p10Rub/p50Rub/p90Rub` (+p80) | маппинг |
| `weeks` | `duration.p50Weeks` | маппинг |
| `cost` | `cost.p50Rub` | маппинг |
| `lines[{label,value}]` | `cost.lines: CostLine[]` | сгруппировать по `group` |
| `tco1/tco3/tco5` | `tco: TcoRow[]` | выбрать год 1/3/5 |
| `supportMonthly` | ставка поддержки 12/18 % | вычислить в адаптере |
| `scoreParts` | нет | **добавить на бэке** |
| `recommended` | `verdict code` (inhouse/contractor/hybrid/parity) | маппинг; `parity` → текущий сценарий |
| `confidence.components` | 4 компонента (brief/methods/analogues/data) | переименовать и перевесить |
| `analogMedian` | медиана аналогов | есть |
| `methodDiff` | `divergence` | маппинг |
| `breakEven` / `breakEvenSeries` | `breakevenMonth` | серию построить в адаптере |
| `tcoSeries` | `tco` | построить |
| `sensitivity` | нет | **добавить на бэке** |
| `distribution` | квантили | **добавить histogram** или построить |
| `risks` | `Risk[]` (impactRub) | маппинг |
| `meta.assumptions` | `Assumption[]` | маппинг |
| `meta.analogs` | `Analogue[]` | маппинг + `source`/дата |
| `stageRows` | `effort.grid.byStage` | есть; **нет `external` и `days`** |
| `state.stages` | `WorkItem[]` (O/M/P) | **нет прямого маппинга 7 этапов** |
| `state.extras` | подключаемые статьи | есть |
| `state.teamRate` | `rate_cards` / override | нужен override |
| `state.reserve` | P80−P50 | семантика разная |
| `state.oversight` | coordination/acceptance % | параметр есть |
| `state.hybridSplit` | `contractorStages` | маппинг шэр→этапы |
| `deadlineWeeks` | `targetWeeks` | есть |

## 5. Ключевые пробелы и конфликты

1. **Два расчётных ядра.** Если оставить `calc.js` и добавить API, получим две разные цифры. Нужно выбрать одно: **бэк — источник истины**, локальный `calc.js` — только fallback/демо-режим.
2. **7 этапов фронта ≠ 6+support бэка.** Нужно либо расширить `STAGE_SHARES` до 7 (выделить интеграции), либо маппить: бэк 3 → фронт development + integration (70/30).
3. **Фронт ждёт per-stage `external` и `days`.** Бэк считает подрядчика по ролям и срок по критическому пути; этих полей нет. Нужен либо расчёт в адаптере (пропорционально), либо расширение `EffortGrid`.
4. **Confidence-веса разные:** фронт 0.30/0.25/0.25/0.20 (brief/data/analog/method), бэк 0.30/0.30/0.20/0.20 (brief/methods/analogues/data). Нужно унифицировать.
5. **Резерв:** фронт — процент (0–30 %), бэк — P80−P50. Либо адаптер пересчитывает, либо UI меняет смысл.
6. **Ставка:** фронт — одна `teamRate` (4200), бэк — 14 ролей × 4 грейда. Нужен либо override средней ставки, либо отказ от ручной ставки в пользу rate card.
7. **Подрядчик:** фронт задаёт `external` по этапам и `oversight`, `fixed` +15 %, тендер 180k; бэк — rate card + координация + приёмка + риск-премия 15–30 % + НДС. Цифры не совпадут.
8. **Тесты фронта** ждут D1 → hybrid, D3 → vendor. Текущий бэк на e2e даёт **inhouse** для D1–D3. Если подключить API без настройки, тесты и демо-история изменятся.
9. **Аналоги фронта вымышлены** и подписаны как ЕИС — при интеграции заменить на реальные 60 контрактов + 49 якорей, иначе это ложное утверждение.
10. **Нет API** — его нужно построить (Fastify) по `docs/10_api_contract.md`.
11. **Нет TypeScript на фронте** — типы не переиспользуются; нужен JSDoc/адаптер или постепенный переход.
12. **Нет сохранения и импорта** — DataPage и «последние оценки» имитируют.

## 6. Стратегия интеграции

**Рекомендуемая: адаптер + HTTP API, без переписывания страниц.**

```
frontend (UI не меняем)
   └── useModel()  ── fetch ──► backend API (Fastify)
          │                        └── @app/core / intake / data / export
          └── buildModelFromApi(response) → legacy `model`
                 (feature flag VITE_DATA_MODE=local|api; local — fallback)
```

Почему так:
- Сохраняем весь UI и дизайн, которые уже готовы.
- Бэк становится единственным источником цифр и данных.
- Локальный `calc.js` остаётся демо-фолбэком, если API недоступен.
- Адаптер — один файл, а не правки 7 страниц.

Что придётся изменить на бэке (чтобы фронт не переделывать):
- добавить `scoreParts`/`recommended` (матрица решений);
- `sensitivity` (tornado) по допущениям;
- `distribution` (11 бинов из Монте-Карло);
- `tco1/tco3/tco5`, `supportMonthly` в ответе;
- `stageRows` с `external` и `days` (или adapter-расчёт);
- `meta` в форме фронта: `analogs`, `assumptions`, `risks`, `sources`;
- принимать overrides (ставка, резерв, надзор, hiring, contractType, hybridSplit, правки этапов);
- store оценок и эндпоинт импорта HelpDesk.

## 7. План задач

### Фаза 0 — развести сборку (2–3 ч)

| # | Задача | Кто | Приёмка |
|---|---|---|---|
| 0.1 | Убрать `frontend` из корневых `workspaces` (оставить `shared/*`, `backend`) | интегратор | `npm i` в корне не тянет React; `cd frontend && npm ci` работает |
| 0.2 | Корневые скрипты `dev:frontend`, `dev:backend`, `dev` (concurrently) | интегратор | оба стартуют, `/api` проксируется |
| 0.3 | Проверить, что `frontend/node_modules`, `frontend/dist` не в git | интегратор | `git ls-files frontend` без node_modules/dist |

### Фаза 1 — backend API (P0, 12–16 ч)

| # | Задача | Приёмка |
|---|---|---|
| 1.1 | `backend/package.json`, Fastify, `health`, `meta`, CORS | `GET /api/health` 200 |
| 1.2 | `GET /api/datasets`, `GET /api/datasets/:name` | манифест и строки |
| 1.3 | `POST /api/intake` (rules/cache/live), `POST /api/intake/confirm` | D1 → параметры с цитатами |
| 1.4 | `POST /api/estimates` → `estimateTask`, store in-memory | 201 + 3 сценария |
| 1.5 | `GET /api/estimates/:id` | снимок |
| 1.6 | `POST /api/estimates/:id/export` PDF/XLSX/JSON + gate | бинарник/409 |
| 1.7 | Единый error handler, zod-валидация, `inject`-тесты | тесты маршрутов зелёные |
| 1.8 | `POST /api/import/helpdesk` (multipart) + quality report | 4 строки → отчёт |

### Фаза 2 — обогащение ответа под UI (P0, 8–10 ч)

| # | Задача | Приёмка |
|---|---|---|
| 2.1 | `scoreParts` + `recommended` (матрица 45/25/20/10) | D1 имеет scoreParts |
| 2.2 | `sensitivity` (tornado) по допущениям | 5 факторов |
| 2.3 | `distribution` 11 бинов из `simulate` | сумма ≈ 1 |
| 2.4 | `tco1/tco3/tco5`, `supportMonthly` | поля в ответе |
| 2.5 | `stageRows` c `external` и `days` | 7 строк |
| 2.6 | `meta`: analogues/assumptions/risks/sources в форме фронта | поля совпадают |
| 2.7 | Overrides: teamRate, reserve, oversight, hiring, contractType, hybridSplit, правки этапов | пересчёт меняет цифры |

### Фаза 3 — адаптер фронта (P0, 6–8 ч)

| # | Задача | Приёмка |
|---|---|---|
| 3.1 | `frontend/src/core/api.js` — fetch, таймаут, ошибки | unit-тест на моках |
| 3.2 | `buildModelFromApi()` → legacy `model` | фикстура API → модель без ошибок |
| 3.3 | `useModel` с `VITE_DATA_MODE=local|api`, локальный fallback | переключение без правок страниц |
| 3.4 | Loading/error/empty состояния в `App`/`Cockpit` | UI не падает при 500 |
| 3.5 | Debounce 300–500 мс на изменения параметров | один запрос на серию правок |
| 3.6 | Параметры: intake/confirm через API, цитаты | таблица показывает provenance |
| 3.7 | Экспорт: JSON/XLSX/PDF из API, print как fallback | файлы скачиваются |
| 3.8 | «Последние оценки» через `GET /api/estimates/:id` | reopen работает |

### Фаза 4 — данные и старт (P1, 4–6 ч)

| # | Задача | Приёмка |
|---|---|---|
| 4.1 | DataPage → `/api/datasets` (версия, строки, статус) | нет хардкода |
| 4.2 | Импорт HelpDesk → `/api/import/helpdesk` | реальный отчёт о качестве |
| 4.3 | StartScreen: бриф → `/api/intake` | параметры приходят из API |
| 4.4 | D1–D3 как пресеты API или локальные seeds | кейсы открываются |

### Фаза 5 — согласование методики (P0, 4–6 ч)

| # | Задача | Приёмка |
|---|---|---|
| 5.1 | Решить: бэк — источник истины; `calc.js` — fallback | один набор цифр в API-режиме |
| 5.2 | Согласовать 7 этапов ↔ 6+support | одна таблица этапов |
| 5.3 | Согласовать confidence-веса и резерв (P80−P50) | UI и METHOD совпадают |
| 5.4 | Заменить вымышленные аналоги на реальные | source/date из датасета |
| 5.5 | Обновить страницу «Методика» под бэк | формулы = METHOD.md |

### Фаза 6 — тесты и QA (P0/P1, 5–7 ч)

| # | Задача | Приёмка |
|---|---|---|
| 6.1 | Тесты маршрутов API (`inject`) | 200/409/422 |
| 6.2 | Тесты адаптера на фикстуре D1 | поля не undefined |
| 6.3 | Playwright: старт → параметры → обзор → экспорт (api-режим) | сценарий зелёный |
| 6.4 | Детерминизм: одинаковый вход/seed → одинаковый ответ | deep equal |
| 6.5 | Производительность: estimate < 2 с, export < 5 с | замер |

### Фаза 7 — уборка (P2, 2–3 ч)

| # | Задача | Приёмка |
|---|---|---|
| 7.1 | Удалить/пометить `CASES`-аналоги после стабилизации API | нет ложных «ЕИС» |
| 7.2 | Линт фронта (ESLint) + `npm run lint:frontend` | 0 ошибок |
| 7.2 | README: запуск двух приложений, proxy, режимы | инструкция работает |

**Итого:** ~40–55 ч; MVP-интеграция (Фазы 0–3) — ~28–37 ч.

## 8. Риски

| Риск | Влияние | Митигация |
|---|---|---|
| Две правды (calc.js vs API) | Высокое | API-режим по умолчанию, local только fallback |
| Тесты фронта ждут D1 hybrid / D3 vendor | Среднее | либо настроить модель/кейсы, либо обновить ожидания и демо-историю |
| Формы не совпадают | Высокое | адаптер + контрактные фикстуры |
| Нет per-stage external/days | Среднее | расширить EffortGrid или считать в адаптере |
| Нет sensitivity/distribution | Среднее | добавить на бэке (Фаза 2) |
| Jev недоступна | Низкое | cache/off, правила |
| Фронт на JS без типов | Среднее | JSDoc + фикстуры, позже TS |
| Вымышленные аналоги | Высокое (репутация) | заменить до защиты |

## 9. Решение, которое нужно принять

1. **Интеграция через адаптер и API** (рекомендуется) или полный переход фронта на `@app/contract` (дольше, risky).
2. **Кто источник истины:** бэк (рекомендуется) или локальный `calc.js`.
3. **Судьба 7 этапов:** расширить бэк до 7 или маппить 3 → development+integration.
4. **Демо-история:** оставить D1 hybrid / D3 vendor (настроить бэк) или принять новые вердикты.
5. **Кто пишет `backend/`:** я по `docs/10_api_contract.md` (рекомендуется) или второй разработчик.
