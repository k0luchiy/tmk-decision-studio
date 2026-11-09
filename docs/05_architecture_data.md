# 05. Архитектура, модель данных, импорт

Требования: `02_requirements.md`. Оценивается по критерию «Архитектура и код» (15) и «Данные и интеграции» (15) — это треть рубрики.

## 1. Принципы

1. **Ядро — чистый TypeScript без I/O.** Функции `(вход, датасеты, версия) → результат`. Никаких `Date.now()`, `Math.random()` без seed, сетевых вызовов.
2. **Данные отделены от кода.** Ставки, нормативы, коэффициенты, аналоги — JSON/CSV с источником. Код не содержит чисел, кроме математических констант.
3. **Провенанс сквозной.** Каждое число несёт `source_id`, дату и метод. Формула-дерево строится из этих ссылок.
4. **Оффлайн по умолчанию.** Весь расчёт и демо работают без сети. Jev подключается адаптером с режимами `off / cache / live` и может быть выключена.
5. **Оценка неизменяема.** Сохранённая оценка — снимок с хешем входов и версией датасетов. Пересчёт создаёт новую версию.

## 2. Стек (предложение, решение D-02 в `DECISIONS.md`)

| Слой | Выбор | Почему |
|---|---|---|
| Язык | TypeScript (strict) | Типы для модели данных, одна среда для ядра и UI |
| Ядро | Чистый TS, Vitest | Тесты без браузера, быстрые |
| UI | React + Vite (SPA) | Просто собрать и запустить оффлайн; без серверной части |
| Стили | Tailwind CSS + собственные токены (`04_ux_scenario` §6) | Быстрая плотная вёрстка, токены в одном месте |
| Графики | Recharts (MIT) | Break-even, tornado, waterfall через stacked bar |
| Монте-Карло | Своя реализация в ядре (~150 строк) | Детерминированный seed, без зависимостей |
| Хранение | IndexedDB (через простую обёртку) или JSON-файлы экспорта | Без сервера; снимки переносимы |
| XLSX | SheetJS (Apache-2.0) | Экспорт листов |
| PDF | Печатный стиль браузера (P0) → `pdf-lib` при необходимости | Нет серверного рендера |
| Тесты | Vitest (ядро, данные), Playwright (сквозной сценарий D1) | Регламент требует тесты ядра и ≥ 1 e2e |
| Запуск | `npm ci && npm run dev`; `docker compose up` как альтернатива (статический сервер) | Воспроизводимость |
| Линтинг | ESLint + Prettier, `tsc --noEmit` | Качество кода |

Шрифты: свободные (Barlow Condensed, Inter) с лицензией OFL, встраиваются локально. Коммерческий PF DIN не используется.

**Альтернатива, если команда сильнее в Python:** ядро на Python (pydantic, numpy), UI на Streamlit или FastAPI + простой фронт. Решение зависит от состава команды (`08_open_questions` Q1).

## 3. Структура репозитория

```
RadioHack4.0/
├── README.md                    # что это, как запустить, роли, ссылки
├── LICENSE                      # MIT
├── .env.example                 # ключ OpenCode (Jev), без значений
├── docs/                        # эта папка
├── research/                    # исследование (как есть)
├── data/                        # версионируемые датасеты (копии для запуска)
│   ├── rates/                   # rate_cards.json, contractor_rate_cards.json
│   ├── archetypes/              # work_archetypes.json
│   ├── analogues/               # analogue_corpus.json, tmk_contracts.json
│   ├── coefficients/            # coefficients.json
│   ├── seeds/                   # D1.json, D2.json, D3.json (демо-брифы и ожидаемые результаты)
│   └── manifest.json            # версия каждого файла, дата, хеш, источник
├── packages/
│   ├── core/                    # ЧИСТОЕ ЯДРО
│   │   ├── model/               # типы: Task, WorkItem, Estimate, CostLine, Assumption, Risk, Analogue
│   │   ├── sizing/              # методы A (WBS), B (FP-lite), C (аналоги)
│   │   ├── effort/              # O/M/P, PERT, роли и грейды
│   │   ├── cost/                # in-house, contractor, статьи затрат, НДС
│   │   ├── schedule/            # критический путь, календарь, сжатие срока
│   │   ├── risk/                # Монте-Карло, корреляция, P-квантили, RE
│   │   ├── scenarios/           # in-house / contractor / hybrid / peak, TCO, break-even
│   │   ├── verdict/             # правила вердикта, текст из шаблонов
│   │   ├── confidence/          # Confidence Score и его компоненты
│   │   └── explain/             # формула-дерево из результатов
│   ├── data/                    # загрузка и валидация датасетов, импорт HelpDesk
│   │   ├── loaders/
│   │   ├── validators/          # схемы (zod), отчёт о качестве
│   │   └── importers/helpdesk.ts
│   ├── intake/                  # извлечение параметров: правила + Jev-адаптер
│   │   ├── rules/               # словарь ключевых слов и шаблоны
│   │   └── jev/                 # адаптер Jev (systemone), вопросы, валидация ответа
│   └── export/                  # PDF (print), XLSX, JSON-снимок
├── apps/
│   └── web/                     # React UI (кокпит)
├── scripts/                     # пересборка данных из research/, проверка манифеста
└── tests/
    ├── core/                    # unit: формулы, Монте-Карло (фиксированный seed), граничные случаи
    ├── data/                    # валидация, импорт 4 строк и 100+ строк
    ├── e2e/                     # Playwright: D1 от брифа до PDF
    └── control/                 # контрольные задачи D1–D3 с ожидаемыми диапазонами (TEST_REPORT)
```

Правило: `packages/core` не импортирует `apps/`, `intake/llm` и `export/`. Зависимости только вниз. Проверка — линтер-правило или скрипт.

**Размер файлов:** ≤ 250 строк на файл (внутреннее правило команды — принять в `DECISIONS.md`). Длинные таблицы — в JSON, не в коде.

## 4. Модель данных

Основная цепочка из регламента: **`Task → WorkItem → Estimate → CostLine → Assumption / Risk`**, один `estimate_id`.

### 4.1. Сущности

```
Task            id, title, description_raw, brief_version, created_at
  ├─ params[]   ExtractedParam { key, value, unit, confidence, quote, status: auto|confirmed|edited|rejected, default_used }
  └─ WorkItem[] (декомпозиция)
        id, stage (1..7), archetype_id, unit, units_count,
        O, M, P (часы на единицу), E, sigma (вычисляются),
        role_mix[] { role_id, share, grade },
        source_refs[] (source_id)

Estimate        id, task_id, scenario (inhouse|contractor|hybrid|peak),
                dataset_version, input_hash, seed, method_weights, created_at
  ├─ effort     { p10, p50, p80, p90, by_stage[], by_role[] }
  ├─ duration   { p10, p50, p80, p90, weeks, critical_path[] }
  ├─ cost       { p10, p50, p80, p90, reserve, lines: CostLine[] }
  ├─ tco[]      { year, cost, cumulative }
  ├─ breakeven  { month | null }
  ├─ verdict    { code, text_template_id, numbers_ref[] }
  └─ confidence { score, components[] }

CostLine        id, estimate_id, group (labor|overhead|risk|coordination|vat|extra|support),
                label, formula, inputs[] (ссылки), value, source_id, status (fact|offer|assumption)

Assumption      id, label, value, range { low, high }, source_id, sensitivity (вычисляется), pinned, owner

Risk            id, label, probability, impact_rub { low, mid, high }, expected = p × impact,
                mitigation, party (contractor|inhouse|shared), source_id

Analogue        id, corpus (tmk_eis|published), type, title, year, price { low, mid, high, basis },
                vat_flag, scope_vector {...}, normalization { K_scope, K_complexity, K_region, K_age, K_vat },
                normalized_price, included (bool), reason_excluded, source_id, url, date

Rate            id, side (inhouse|contractor), role_id, grade, value, unit, geo, basis (net|gross|billing),
                source_id, confidence (High|Medium|Low|Proxy), date

Source          id, title, url, publisher, date_published, date_accessed, licence, type (primary|secondary|proxy|assumption)

Scenario        id, task_id, name, overrides[] (ссылки на изменённые допущения), is_frozen

DataQualityReport  dataset, rows_total, rows_ok, rows_dropped[{row, reason}], anomalies[], warnings[]
```

### 4.2. Провенанс и «формула по клику»

- Каждая `CostLine` хранит `formula` (строка) и `inputs` (ссылки на `Rate`, `WorkItem`, `Assumption`).
- Каждый вход ссылается на `source_id`. Из `Source` берутся название, дата и URL.
- Дерево строится обходом ссылок. Для демо D1 формула: `Стоимость = Σ(часы_роли × ставка_роли) + координация + ...`, и каждый узел раскрывается.

### 4.3. Версии

- `dataset_version` — хеш всех файлов из `manifest.json`. Меняется при любом изменении данных.
- `input_hash` — хеш параметров задачи и допущений.
- Одинаковые `input_hash` + `dataset_version` + `seed` ⇒ одинаковый результат. Это тестируется.

## 5. Импорт HelpDesk

Источник: `research/data/Выгрузка полей.xlsx` (4 строки × 16 колонок) и схема `data/product/helpdesk_import_schema.json`. Анализ — `research/20`.

### 5.1. Маппинг

| Поле выгрузки | Сущность | Поле |
|---|---|---|
| Номер (IM…) | Task | `external_id` |
| Изменение.Номер (CR…) | Task | `change_id` |
| Заголовок | Task | `title` |
| Тип активности ЗНИ | WorkItem | `activity_type` → маппинг на `stage` и `archetype` |
| Рабочая группа | Task | `team_line`, `platform` (Л3 / организация / платформа) |
| Специалист | WorkItem | `specialist_ref` (обезличен, не ФИО) |
| Дата создания / Фактическое завершение | WorkItem | `lead_time` (вычисляется) |
| Плановая дата завершения | WorkItem | `deadline` (SLA, **не** прогноз) |
| Плановая трудоёмкость | Effort | `plan_h` |
| Фактическая трудоёмкость | Effort | `actual_h` |
| Заквотированное время | Effort | `quoted_h` (предъявленное заказчику) |

### 5.2. Правила валидации (FR-8.2)

| Проверка | Действие |
|---|---|
| Пустой Номер | строка отбрасывается, причина в отчёте |
| Тип даты не распознан | поле пустое, строка не отбрасывается |
| План = 0 и факт > 0 | предупреждение «недооценка / нет плана» |
| Факт = план = квота для всех строк CR | предупреждение «возможно, копирование из факта» (`research/20` §4) |
| Дробные часы у квоты | округление с предупреждением |
| Дубликат (Номер, тип, специалист, дата) | одна строка, дубликат в отчёте |
| Персональные данные (ФИО в поле специалиста) | маскирование до `Специалист N`, предупреждение |

Отчёт о качестве показывается пользователю и попадает в PDF (раздел «Данные»).

### 5.3. Что делаем с данными

- **Демо:** 4 строки → 4 Task с декомпозицией по архетипу (3–6 работ на задачу, синтетические), плюс реальные часы как «факт» для показа калибровки.
- **Калибровка (P1):** при ≥ 10 парах план/факт считаем MAPE и PRED(25). При 4 строках — честная пометка «недостаточно данных».
- **Ставка:** 3 400 ₽/ч как дефолт из `research/20` §8 **заменяем** расчётом по `rate_cards.json` (fully loaded middle ≈ 3 380 ₽/ч) с пометкой источника. Оба значения видны, чтобы совпадение было проверяемым.

## 6. Импорт аналогов и ставок

| Датасет | Файл | Валидация | Нормализация |
|---|---|---|---|
| Ставки in-house | `rate_cards.json` | 14 ролей × 4 грейда, порядок `net` < `gross` < `fully` | net → gross по НДФЛ (уже в файле) |
| Ставки подрядчика | `contractor_rate_cards.json` | `low ≤ mid ≤ high`, `vat_included = false` | валюта не конвертируется, ₽ и USD раздельно |
| Архетипы | `work_archetypes.json` | роль-микс = 100 %, `O ≤ M ≤ P`, `p50 = M` | — |
| Аналоги | `analogue_corpus.json` + `tmk_contracts.json` | `low ≤ mid ≤ high`, валюта RUB/USD, `source` обязателен | приведение (§10 `03`), `included` по правилам |
| Коэффициенты | `coefficients.json` | схема по разделам | — |

Все проверки — в `scripts/validate-data` и в тестах `tests/data`. Версия в `manifest.json`.

## 7. Модульные границы и контракты

Основные функции ядра (сигнатуры — концептуально):

```
extractParams(brief, rules, jev?)        → ExtractedParam[]          // intake, не ядро
buildWbs(task, archetypes)               → WorkItem[]                 // sizing A
fpLite(task, fpWeights)                  → { fp, effortHours }        // sizing B
analogueEstimate(task, analogues, rules) → { median, range, used[] }  // sizing C
combineMethods(A, B, C, weights)         → { effortHours, divergence }
toEstimateGrid(workItems, rates)         → EffortGrid                 // по этапам и ролям
costInhouse(effortGrid, rateCards, opts) → CostLine[]
costContractor(effortGrid, rates, opts)  → CostLine[]
costExtras(task.extras)                  → CostLine[]
schedule(effortGrid, team, calendar)     → Duration
simulate(model, n=10000, seed)           → Quantiles
scenarios(...)                           → { inhouse, contractor, hybrid, peak }
tco(scenario, years, rates)              → TcoRow[]
breakEven(a, b)                          → month | null
verdict(results, rules)                  → Verdict
confidence(results, brief, analogues)    → ConfidenceScore
explain(estimate)                        → FormulaTree
```

Все функции — чистые. Входы типизированы (`zod` или TS-типы + проверки на входе). Выходы содержат ссылки на входы.

## 8. Монте-Карло (детали реализации)

- Генератор: детерминированный PRNG (например, mulberry32) с фиксированным seed; seed хранится в `Estimate`.
- Для каждой итерации: сэмпл логнормального E по P10/P90 для работ; корреляция ролей через одно-факторный копула (ρ = 0,5); сэмпл ставок в пределах диапазона; сэмпл срока.
- 10 000 итераций × ~200 работ ≈ 2·10⁶ операций — укладывается в < 2 с в браузере. Замер в тестах (NFR-5).
- Выход: квантили P10 / P50 / P80 / P90 и гистограмма (для UI).
- Тест на инвариант: при ρ = 0 дисперсия суммы ≈ Σ дисперсий (допуск 2 %), при ρ = 1 — почти линейная сумма.

## 9. Экспорт и снимки

- **JSON-снимок** = вход + `dataset_version` + `seed` + результаты + список источников. Из него можно повторить расчёт и сравнить побайтно (тест воспроизводимости).
- **PDF** — печатный макет по `04_ux_scenario` §8.
- **XLSX** — листы из `04_ux_scenario` §8; значения и, где уместно, формулы.

## 10. Тестирование

| Уровень | Что | Минимум |
|---|---|---|
| Unit (core) | Формулы O/M/P, PERT, НДФЛ-gross, взносы 30 %/15,1 %, fully loaded, НДС, break-even, Монте-Карло | ~40 тестов |
| Property | Монотонность: рост объёма не уменьшает часы; рост ставки не уменьшает стоимость; P10 ≤ P50 ≤ P90 | 5–6 тестов |
| Data | Валидация всех датасетов, негативные кейсы импорта (пустые, битые, дубликаты) | по тесту на правило из `05` §5.2 |
| Контрольные задачи | D1–D3: ожидаемый диапазон ± допуск, MAPE по контрольным точкам | `TEST_REPORT.md` |
| E2E | Playwright: бриф D1 → подтверждение → расчёт → PDF | 1 сценарий |
| Воспроизводимость | Два запуска с одинаковым входом → побайтно одинаковый JSON | 1 тест |

Регламент требует «результаты тестирования на контрольных задачах» (`research/22` §10, артефакт 5). Файл `TEST_REPORT.md` генерируется скриптом из тестов D1–D3 — так он не расходится с кодом.

## 11. Безопасность и данные

- Ключ OpenCode (Jev) — только в `.env`, в репозитории `.env.example` без значений. Перед пушем — проверка на секреты (grep по шаблонам ключей).
- Выгрузка HelpDesk обезличена на входе (`research/20`); в репозиторий попадает только обезличенный файл.
- В Jev не отправляются персональные данные и реальные внутренние ставки заказчика. Для демо используются публичные и синтетические тексты (см. `06_jev_strategy.md`).
- Лицензии: проверка `package.json` (только MIT/Apache/BSD/ISC/OFL).

## 12. Что будет в v1 (после хакатона), но не в MVP

- Подключение CPI-ряда Росстата и КЗ-статистики.
- Калибровка на закрытых проектах заказчика (пилот, `research/10` §6).
- Интеграция с каталогом услуг ТМК (загрузка прайса).
- Многопользовательский режим и роли.
- Учёт эффекта (выгоды) и NPV как полноценный блок.
- Серверная часть для хранения истории оценок.
