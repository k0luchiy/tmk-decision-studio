# Decision Cockpit — «Сделать или заказать»

Инструмент для оценки ИТ-задач ТМК++: принимает описание задачи, раскладывает
её на этапы и считает **два сценария** — собственной командой (fully loaded) и
подрядчиком (rate card + координация + риск), а также гибрид. Результат —
диапазон стоимости и срока (P10/P50/P80/P90), TCO, break-even, аналоги,
допущения, риски, уровень уверенности, вердикт и формула-дерево «по клику».

Репозиторий содержит **ядро, данные, intake, экспорт и CLI**; React-кокпит
подключается по контракту `docs/09_integration_contract.md` и сам ничего не
считает.

## Быстрый старт

```bash
npm ci
npm run data:check     # валидация датасетов и манифеста
npm run test           # unit + property + data + export tests
npm run calc           # демо D1: таблица этапов и две базы стоимости → out/calc-d1.json
npm run e2e            # D1–D3: бриф → estimateTask → JSON/XLSX/PDF в out/
npm run report         # TEST_REPORT.md из out/control.json и npm test
```

Требуется Node.js 22+ (см. `package.json`, `target: node22`).

> В этом репозитории **нет** `npm run dev`: браузерный кокпит не входит в
> поставку ядра. Запуск и проверка — через реальные скрипты выше.

## Скрипты

| Скрипт | Что делает | Выход |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` по всем пакетам и `examples/` | код возврата |
| `npm test` | Vitest: unit, property (invariants), data, export | 210+ тестов |
| `npm run lint` | ESLint по `packages`, `scripts`, `examples` | код возврата |
| `npm run data:manifest` | пересобирает `data/manifest.json` и `datasetVersion` | `data/manifest.json` |
| `npm run data:check` | проверяет датасеты, схемы, порядок ставок | отчёт в `out/` |
| `npm run calc` | демо-расчёт D1 по этапам | `out/calc-d1.json` |
| `npm run e2e` | D1–D3 от брифа до экспорта | 9 файлов в `out/` + `out/control.json` |
| `npm run report` | генерирует `TEST_REPORT.md` | `TEST_REPORT.md` |
| `npm run intake:eval` | метрики правил/кэша Jev на 12 брифах | `out/intake-eval.json` |
| `npm run helpdesk:check` | импорт и качество выгрузки HelpDesk | `out/helpdesk.json` |

`out/` — gitignored: артефакты генерируются, а не коммитятся.

## Что где лежит

```
├── README.md                 # этот файл
├── METHOD.md                 # формулы, коэффициенты, источники, допущения
├── DATA_MODEL.md             # сущности, поля, связи, схемы
├── ARCHITECTURE.md           # Mermaid: пакеты и поток данных
├── TEST_REPORT.md            # генерируемый отчёт D1–D3 + тесты + intake
├── docs/                     # проектная документация (см. docs/README.md)
├── research/                 # исследование и исходные данные (не меняем)
├── data/                     # версионируемые данные запуска
│   ├── eval/briefs.json      # 12 брифов с метками
│   ├── cache/               # кэш ответов Jev
│   ├── seeds/control.json    # ожидания D1–D3 (регрессия)
│   └── manifest.json         # версия датасетов
├── packages/
│   ├── contract/             # zod-схемы и типы (единый контракт)
│   ├── data/                 # загрузка, валидация, импорт HelpDesk
│   ├── core/                 # чистый расчёт: sizing, cost, risk, schedule, decision, pipeline
│   ├── intake/               # правила + Jev-адаптер + кэш
│   ├── export/               # JSON-снимок, XLSX, PDF, export gate
│   └── cli/                  # e2e-сценарий D1–D3
├── scripts/                  # esbuild-обёртки и генераторы отчётов
└── examples/contract-usage.ts# компилируемый пример контракта
```

## Роли

| Роль | Ответственность | Блоки |
|---|---|---|
| R1 Техлид / ядро | архитектура, `packages/core`, интеграция, ревью | Архитектура и код |
| R2 Расчёт | формулы, Монте-Карло, аналоги, `METHOD.md` | Рыночная оценка, объяснимость |
| R3 Данные | загрузчики, валидаторы, HelpDesk, `DATA_MODEL.md` | Данные и интеграции |
| R4 UI/UX | кокпит, графики, формула-дерево, PDF/XLSX | Прототип, удобство |
| R5 Intake / Jev | правила, адаптер, кэш, таблица ревью | Объяснимость |
| R6 Качество | тесты, `TEST_REPORT.md`, `DECISIONS.md`, README | Тесты, защита |

## Документы

- `docs/README.md` — карта проектной документации.
- `docs/03_estimation_model.md` — расчётная модель.
- `docs/05_architecture_data.md` — архитектура, модель данных, импорт.
- `docs/09_integration_contract.md` — контракт фронта, включая React/Vite.
- `METHOD.md`, `DATA_MODEL.md`, `ARCHITECTURE.md` — сжатая выжимка с ссылками
  на реальные файлы кода.
- `TEST_REPORT.md` — контрольные D1–D3, unit/property, intake.
- `DECISIONS.md` — журнал решений.

## Границы и честность

- Оценка — **порядок, а не смета**; дисклеймер есть в UI и PDF.
- MAPE/PRED(25) **не считаются**: в HelpDesk всего 4 строки, нужно ≥ 10 пар
  план/факт (`TEST_REPORT.md` §4).
- Датасеты — публичные/синтетические, без персональных данных и внутренних
  ставок заказчика.
- Лицензия: MIT (`LICENSE`); сторонние пакеты — MIT/Apache/BSD/ISC.
