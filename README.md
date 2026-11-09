# Decision Cockpit — «Сделать или заказать»

Инструмент для оценки ИТ-задач ТМК++: принимает описание задачи, раскладывает
её на этапы и считает **два сценария** — собственной командой (fully loaded) и
подрядчиком (rate card + координация + риск), а также гибрид. Результат —
диапазон стоимости и срока (P10/P50/P80/P90), TCO, break-even, аналоги,
допущения, риски, уровень уверенности, вердикт и формула-дерево «по клику».

Репозиторий содержит **ядро, данные, intake, экспорт и CLI**; React-кокпит
«TMK Decision Studio» подключается по контракту `docs/09_integration_contract.md` и сам ничего не
считает.

## Быстрый старт

```bash
npm ci
npm run data:check     # валидация датасетов и манифеста
npm run test           # unit + property + data + export tests
npm run calc           # демо D1: таблица этапов и две базы стоимости → .artifacts/calc-d1.json
npm run e2e            # D1–D3: бриф → estimateTask → JSON/XLSX/PDF в .artifacts/
npm run report         # docs/deliverables/TEST_REPORT.md из .artifacts/control.json и npm test
```

Требуется Node.js 22+ (см. `package.json`, `target: node22`).

> В этом репозитории **нет** `npm run dev`: браузерный кокпит не входит в
> поставку ядра. Запуск и проверка — через реальные скрипты выше.

## Скрипты

| Скрипт | Что делает | Выход |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` по всем пакетам и `shared/*/examples` | код возврата |
| `npm test` | Vitest: unit, property (invariants), data, export | 210+ тестов |
| `npm run lint` | ESLint по `shared`, `scripts` | код возврата |
| `npm run data:manifest` | пересобирает `data/manifest.json` и `datasetVersion` | `data/manifest.json` |
| `npm run data:check` | проверяет датасеты, схемы, порядок ставок | отчёт в `.artifacts/` |
| `npm run calc` | демо-расчёт D1 по этапам | `.artifacts/calc-d1.json` |
| `npm run e2e` | D1–D3 от брифа до экспорта | 9 файлов в `.artifacts/` + `.artifacts/control.json` |
| `npm run report` | генерирует `docs/deliverables/TEST_REPORT.md` | `docs/deliverables/TEST_REPORT.md` |
| `npm run intake:eval` | метрики правил/кэша Jev на 12 брифах | `.artifacts/intake-eval.json` |
| `npm run helpdesk:check` | импорт и качество выгрузки HelpDesk | `.artifacts/helpdesk.json` |

`.artifacts/` — gitignored: артефакты генерируются, а не коммитятся.

## Что где лежит

В корне — только `README.md`, `LICENSE`, конфиги (`package.json`, `tsconfig*.json`,
`eslint.config.js`, `vitest.config.ts`, `.prettierrc`, …), `frontend/`, `backend/`,
`shared/`, `data/`, `docs/`, `research/`, `scripts/`.

```
├── README.md                 # этот файл
├── LICENSE                   # MIT
├── package.json              # workspace-скрипты (typecheck, test, lint, …)
├── tsconfig.json             # корневая проверка типов
├── eslint.config.js          # ESLint
├── frontend/                 # React/Vite кокпит
├── backend/                  # Fastify backend-for-frontend
├── shared/
│   ├── contract/             # zod-схемы и типы (единый контракт) + examples/contract-usage.ts
│   ├── data/                 # загрузка, валидация, импорт HelpDesk
│   ├── core/                 # чистый расчёт: sizing, cost, risk, schedule, decision, pipeline
│   ├── intake/               # правила + Jev-адаптер + кэш
│   ├── export/               # JSON-снимок, XLSX, PDF, export gate
│   └── cli/                  # e2e-сценарий D1–D3
├── data/                     # версионируемые рабочие данные запуска
│   ├── datasets/             # 6 рабочих JSON-датасетов (ставки, архетипы, аналоги, коэффициенты, контракты)
│   ├── schemas/              # helpdesk_import_schema.json
│   ├── import/               # helpdesk-sample.xlsx (обезличенный пример)
│   ├── eval/briefs.json      # 12 брифов с метками
│   ├── cache/               # кэш ответов Jev
│   ├── seeds/control.json    # ожидания D1–D3 (регрессия)
│   └── manifest.json         # версия датасетов
├── docs/                     # проектная документация (см. docs/README.md)
│   └── deliverables/         # METHOD.md, DATA_MODEL.md, ARCHITECTURE.md, TEST_REPORT.md
├── research/                 # архив исследования и исходников (не runtime-зависимость)
├── scripts/                  # esbuild-обёртки и генераторы отчётов
└── .artifacts/               # генерируемые артефакты (gitignored)
```

Deliverables (итоговые документы поставки) лежат в `docs/deliverables/`,
артефакты прогонов — в gitignored `.artifacts/`, `research/` — архив исходных
материалов.

`research/` — архив исходных материалов для провенанса, а **не** runtime-зависимость:
код читает рабочие копии из `data/`, а исходные пути зафиксированы в
`data/manifest.json` (поле `source`).

## Роли

| Роль | Ответственность | Блоки |
|---|---|---|
| R1 Техлид / ядро | архитектура, `shared/core`, интеграция, ревью | Архитектура и код |
| R2 Расчёт | формулы, Монте-Карло, аналоги, `docs/deliverables/METHOD.md` | Рыночная оценка, объяснимость |
| R3 Данные | загрузчики, валидаторы, HelpDesk, `docs/deliverables/DATA_MODEL.md` | Данные и интеграции |
| R4 UI/UX | кокпит, графики, формула-дерево, PDF/XLSX | Прототип, удобство |
| R5 Intake / Jev | правила, адаптер, кэш, таблица ревью | Объяснимость |
| R6 Качество | тесты, `docs/deliverables/TEST_REPORT.md`, `DECISIONS.md`, README | Тесты, защита |

## Документы

- `docs/README.md` — карта проектной документации.
- `docs/03_estimation_model.md` — расчётная модель.
- `docs/05_architecture_data.md` — архитектура, модель данных, импорт.
- `docs/09_integration_contract.md` — контракт фронта, включая React/Vite.
- `docs/deliverables/METHOD.md`, `docs/deliverables/DATA_MODEL.md`,
  `docs/deliverables/ARCHITECTURE.md` — сжатая выжимка с ссылками на реальные
  файлы кода.
- `docs/deliverables/TEST_REPORT.md` — контрольные D1–D3, unit/property, intake.
- `DECISIONS.md` — журнал решений.

## Границы и честность

- Оценка — **порядок, а не смета**; дисклеймер есть в UI и PDF.
- MAPE/PRED(25) **не считаются**: в HelpDesk всего 4 строки, нужно ≥ 10 пар
  план/факт (`docs/deliverables/TEST_REPORT.md` §4).
- Датасеты — публичные/синтетические, без персональных данных и внутренних
  ставок заказчика.
- Лицензия: MIT (`LICENSE`); сторонние пакеты — MIT/Apache/BSD/ISC.
