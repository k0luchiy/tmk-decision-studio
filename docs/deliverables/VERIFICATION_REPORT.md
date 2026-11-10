# Отчёт о полной проверке — TMK Decision Studio (RadioHack 4.0)

- **Дата проверки:** 2026-11-10 (UTC)
- **HEAD:** `509574e019c258a0514245cf642e1457898d602f` (`docs: finalize TMK Decision Studio documentation`)
- **Рабочая копия:** без изменений кода; `git status --short` на старте пуст
- **Окружение:** Node v22.22.2, npm 10.9.7, Linux 6.19.14+kali-amd64, Chromium 147.0.7727.101
- **Режим API:** `INTAKE_MODE=cache`, `JEV_MODEL=jev-1.13-free`, backend `:3001`, Vite `:5180`
- **Ключ Jev:** передан только через переменную окружения `OPENCODE_API_KEY`; в файлы/репозиторий не записан.

---

## 1. Статические проверки

| Проверка | Команда | Код / результат |
|---|---|---|
| Typecheck (root) | `npm run typecheck` | `TC=0` |
| Unit-тесты (root) | `npm test` | `TEST=0`, **228 passed** |
| Lint | `npm run lint` | `LINT=0` |
| Typecheck (backend) | `npm --prefix backend run typecheck` | `BTC=0` |
| Тесты backend | `npm --prefix backend run test` | `BTEST=0`, **25 passed** |
| Тесты frontend | `npm --prefix frontend run test` | `FTEST=0`, **22 pass / 0 fail** |
| Сборка frontend | `npm --prefix frontend run build` | `BUILD=0` (`✓ built in 9.21s`; предупреждение о chunk >500 kB — не ошибка) |
| Данные | `npm run data:check` | `DATA=0`, errors=0, warnings=123 |
| Intake eval | `npm run intake:eval` | `EVAL=0`, workType 100%, flags 100%, numberRecall 100%, 12/12 |
| HelpDesk check | `npm run helpdesk:check` | `HD=0`, rowsTotal 4 / rowsOk 4 / tasks 4 / workItems 4 |
| E2E | `npm run e2e` | `E2E=0`, d1/d2/d3 `inhouse`, p50 7 677 686 / 9 540 348 / 9 703 516, weeks 13/12/16 |

### Детерминизм манифеста

- `npm run data:manifest` выполнен дважды.
- `datasetVersion` совпал: `47a8fb6b9e9ed54c08019d8ca66d79e587fb08b7d5f3e4d80a56068c389c39c7` (64 hex).
- Файлы `manifest-run1.json` / `manifest-run2.json` побайтово **не идентичны**: отличаются только поля `generatedAt` (время генерации, 14 вхождений). Хеш-версия датасетов детерминирована; сам файл манифеста — нет (это ожидаемо для timestamp-поля).

### Поиск техдолга

`grep -R "TODO\|FIXME\|@ts-ignore\|: any\|as any" shared backend/src frontend/src --include=*.ts --include=*.js --include=*.jsx`

- Результат: **0 совпадений** (`GREP_RC=1`, файл `grep-any-todo.txt` пуст).

---

## 2. Реальные данные

| Набор | Ожидание | Факт | Статус |
|---|---|---|---|
| `rate_cards` роли | 14 | 14 (×4 грейда = 56) | OK |
| `contractor_rate_cards` bands | 224 | 224 (14 ролей × 4 грейда × 4 региона) | OK |
| `work_archetypes` | 22 | 22 | OK |
| `analogue_corpus.analogues` | 49 | 49 | OK |
| `analogue_corpus.tmk_eis_rows` | 60 | 60 | OK |
| `tmk_it_contracts` | 60 | 60 | OK |
| `data/manifest.json` files | 6 | 6 | OK |
| `datasetVersion` | 64 hex | `47a8fb…c39c7`, длина 64, hex | OK |
| `data/seeds/control.json` | совпадает | `datasetVersion` совпадает с манифестом; p50/weeks в допуске ±15% | OK |

> Примечание: `npm run data:check` показывает `analogues = 109`, потому что валидатор считает `analogues (49) + tmk_eis_rows (60)`. Это не расхождение с ожидаемыми 49.

### Импорт HelpDesk через API

| Кейс | rowsTotal | rowsOk | tasks | workItems | Статус |
|---|---|---|---|---|---|
| Реальный `data/import/helpdesk-sample.xlsx` | 4 | 4 | 4 | 4 | OK (7 warnings: empty_kind/copied_effort) |
| Синтетика `/tmp/helpdesk-120.xlsx` (5 CR × 24 активности, 16 колонок) | 120 | 120 | 5 | 120 | OK (290 warnings) |

### Аналоги и USD

- В ответах `estimates` для D1/D2 — по 3 аналога, у всех есть `sourceId` и `normalizedPriceRub`.
- D3 (support) — **0 аналогов** (см. раздел «Неудачи»).
- USD-аналоги не конвертируются: прямой вызов `analogueEstimate` для `dwh_bi` даёт `excluded: [{ id: "an_dwh_vtb24", reason: "usd_no_fx" }]`; в выдаче API нет USD-аналогов с `normalizedPriceRub` (нарушений 0).

---

## 3. Живой API (D1–D3)

Параметры запроса оценок: `options = { hiring: true, model: "fixed_price", targetWeeks: 12, extras: [{ label: "Лицензии", amountRub: 100000, appliesTo: "all" }] }`, `seed = 42`.

| Кейс | Intake cache | Verdict | P50 (winner) | P50 in-house | Weeks | Confidence | Divergence |
|---|---|---|---|---|---|---|---|
| D1 | 200, `jev-cache`, 11 params | `parity` (hybrid) | 7 732 334,77 ₽ | 7 777 686,18 ₽ | 13 | 68 / medium | 10,003 |
| D2 | 200, `jev-cache`, 12 params | `inhouse` | 9 640 348,29 ₽ | 9 640 348,29 ₽ | 12 | 68 / medium | 2,232 |
| D3 | 200, `jev-cache`, 10 params | `parity` (hybrid) | 30 767 903,14 ₽ | 30 767 903,14 ₽ | 16 | 78 / high | 0 |

- **D1 live:** `POST /api/intake` mode=`live` → **200**, `status = jev-live`, 11 params. Free-лимит не сработал.
- D3 cache вернул непустой `clarification` (вопрос про объём работ) — ожидаемо для support-брифа.

### Инварианты ответа `POST /api/estimates` (201)

| Проверка | D1 | D2 | D3 |
|---|---|---|---|
| 3 estimates (`inhouse/contractor/hybrid`) | OK | OK | OK |
| `p10 < p50 < p80 < p90` (все сценарии) | OK | OK | OK |
| `duration` (p10…p90Weeks) | OK | OK | OK |
| `confidence.score/level/components` | OK | OK | OK |
| `methodDivergence` присутствует | OK (10,003) | OK (2,232) | OK (0) |
| `effortGrid.byStage` Σ = `totalHours` | OK (1256,72) | OK (1618,57) | OK (1533,33) |
| `cost.lines` Σ ≈ p50 | OK (Δ 0,00) | OK (Δ 0,00) | OK (Δ 0,00) |
| `analogues.length >= 3` | OK (3) | OK (3) | **FAIL (0)** |
| risks / assumptions непусты | OK (2 / 6) | OK (2 / 6) | OK (2 / 6) |

### История и состояние

- `GET /api/estimates` → 200, 3 записи.
- `GET /api/estimates/:id` → 200, id и p50 совпадают с созданными.
- Передача `state` в `POST /api/estimates` и чтение через `GET /api/estimates/:id` → состояние сохраняется побайтово (`state-persistence.json`, `equal: true`).

### Коды ошибок

| Сценарий | Ожидание | Факт |
|---|---|---|
| `GET /api/datasets/does_not_exist` | 404 | 404 `not_found` |
| `POST /api/estimates` без confirmed params | 409 | 409 `needs_review` (список unconfirmed) |
| `options.reservePct = 2` | 422 | 422 `validation_error` (`too_big`, max 0.5) |
| `POST /api/estimates/est_does_not_exist/export` | 404 | 404 `not_found` |
| Vite proxy `:5180/api/health` | 200 | 200 `{"status":"ok"}` |

---

## 4. Экспорт PDF / XLSX / JSON

### PDF

| Кейс | Страниц | Обязательные строки |
|---|---|---|
| D1 | 5 | TMK DECISION STUDIO, Внутренняя команда, Подрядчик, Гибрид, Вердикт, РЕКОМЕНДАЦИЯ, Риски — все найдены |
| D2 | 4 | все найдены |
| D3 | 4 | все найдены |

### XLSX

| Кейс | Листы | Σ LineItems | P50 (winner) | Δ |
|---|---|---|---|---|
| D1 | Scenarios, LineItems, Assumptions, Risks, Sensitivity, Analogues, Sources (7) | 7 732 334,77 | 7 732 334,77 | 0,00 ₽ |
| D2 | 7 | 9 640 348,29 | 9 640 348,29 | 0,00 ₽ |
| D3 | 7 | 30 767 903,14 | 30 767 903,14 | 0,00 ₽ |

Значения `valueRub` — числовые ячейки; сумма сходится с P50 в пределах ±1 ₽.

### JSON

- `schemaVersion = 1.0.0`, `datasetVersion` совпадает с манифестом, `seed = 42`.
- **Поля `hash` в теле нет** — хеш только в имени файла (`…-snapshot-<hash16>.json`).
- **Повторный экспорт того же снимка даёт другой хеш/имя:** `9fd032dfb17f9c22` → `3cbb462b43c72597`. Причина — `createdAt` снапшота = время экспорта и входит в `snapshotHash`. Это нарушает требование «тот же hash».

---

## 5. UI (Chromium 147, headless, 1440×900)

| Шаг | Результат |
|---|---|
| Открытие `http://localhost:5180`, ожидание «TMK DECISION STUDIO» | OK |
| Клик D1 → кокпит, ожидание «ТРИ ВАРИАНТА РЕАЛИЗАЦИИ» | OK |
| Индикатор API | OK — оба бейджа `demo-badge api-status api-api`, текст `API` |
| «Параметры» → изменение ставки 4200 → 9000 | OK — P50 пересчитан: `6,78 млн ₽` → `6,33 млн ₽` |
| «Аналитика» → 6 вкладок | OK — Стоимость, Сроки, TCO, Break-even, Чувствительность, Распределение |
| «Обоснование» → кнопки PDF/XLSX/JSON | OK — «Сформировать PDF» (2), JSON (1), XLSX (1) |
| «Данные» → таблица 6 датасетов | OK — `.dataset-row` = 6 |
| Console errors | **0** |
| Page errors | **0** |

Скриншоты: `.artifacts/verify/ui-start.png`, `ui-cockpit.png`, `ui-data.png`.

---

## 6. Неудачи и расхождения (точные факты)

1. **D3 (support): `analogues.length = 0` вместо ≥3.**
   - В `shared/core/src/sizing/analogues.ts` карта `ANALOGUE_TYPE_BY_WORK_TYPE` не содержит ключа `support`; `toContractAnalogues` возвращает `[]`, если тип не сопоставлен.
   - Итог: в ответе `POST /api/estimates` для D3 у всех трёх сценариев `analogues: []`. Остальные инварианты D3 выполняются.

2. **JSON-экспорт недетерминирован и не содержит поля `hash`.**
   - Тело: `schemaVersion, createdAt, datasetVersion, seed, estimateId, estimate, taskRef` — поля `hash` нет.
   - `snapshotHash(snapshot)` включает `createdAt`, который равен времени экспорта, поэтому два экспорта одного снимка дают разные хеши и имена файлов (см. `json-export-hash-evidence.txt`).

3. **Не расхождение, пояснение:** `data:check` показывает `analogues = 109` (49 published + 60 tmk_eis_rows), при ожидаемых 49 в `analogue_corpus.analogues`. Оба числа корректны.

4. **Не расхождение, пояснение:** verdict D1/D3 = `parity`, а не `inhouse` из `control.json`, потому что проверка использует `options` (hiring + fixed_price + targetWeeks 12), меняющие исход. P50 D1 при этом отличается от контроля на ~1,3% (в допуске).

---

## 7. Артефакты (`.artifacts/verify/`, gitignored)

- `api-check.json`, `state-persistence.json`
- `intake-d1.json`, `intake-d2.json`, `intake-d3.json`, `intake-d1-live.json`
- `estimate-d1.json`, `estimate-d2.json`, `estimate-d3.json`, `estimate-*-get.json`, `estimates-list.json`
- `export-d1.{pdf,xlsx,json}`, `export-d2.{pdf,xlsx,json}`, `export-d3.{pdf,xlsx,json}`, `export-d1-repeat.json`, `export-d*.txt`
- `json-export-fields.txt`, `json-export-hash-evidence.txt`
- `import-real.json`, `import-synthetic-120.json`
- `data-summary.json`, `analogue-usd-check.json`, `manifest-run1.json`, `manifest-run2.json`, `datasetVersion.txt`
- `grep-any-todo.txt`, `vite-proxy-health.txt`
- `ui-qa.json`, `ui-start.png`, `ui-cockpit.png`, `ui-data.png`
- `git-head.txt`, `git-log.txt`, `git-status.txt`

---

## 8. Вывод

**НЕ ГОТОВО** — два критерия приёмки не выполнены:

1. Для D3 (support) в ответе оценки 0 аналогов, требуется ≥3 с `source` и `normalizedPriceRub`.
2. JSON-экспорт не содержит поля `hash` и нестабилен между повторными экспортами одного снимка (хеш зависит от `createdAt`).

Всё остальное — статика, реальные данные, импорт HelpDesk (4 и 120 строк), API D1–D3, PDF/XLSX, ошибки, UI — проходит.

### Что исправить

1. В `ANALOGUE_TYPE_BY_WORK_TYPE` добавить маппинг для `support` (или fallback на `default`), чтобы для support-работ подбиралось ≥3 аналога с источником и нормализованной ценой.
2. В JSON-экспорте:
   - добавить в тело явное поле `hash`;
   - считать `snapshotHash` по неизменяемому содержимому (без `createdAt`/времени экспорта) либо брать стабильный `estimate.inputHash`;
   - использовать этот же хеш в имени файла, чтобы повторный экспорт одного снимка давал идентичный хеш.
