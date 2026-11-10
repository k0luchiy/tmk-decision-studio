# TMK Decision Studio — сделать или заказать

**TMK Decision Studio** — инструмент для оценки ИТ-задач ТМК++: принимает
описание задачи, раскладывает её на этапы и считает **три сценария** —
собственной командой (fully loaded), подрядчиком (rate card + координация +
риск) и гибридом. Результат — диапазон стоимости и срока (P10/P50/P80/P90),
TCO, break-even, аналоги, допущения, риски, уверенность, вердикт и
формула-дерево «по клику».

Проект состоит из трёх частей:

| Часть | Технологии | Роль |
|---|---|---|
| `frontend/` | React 18 + Vite 6 (SPA) | кокпит: бриф, параметры, сценарии, графики, обоснование, экспорт |
| `backend/` | Fastify 5 (BFF, TypeScript) | HTTP API, intake, расчёт, хранение снимков, PDF/XLSX |
| `shared/` | чистый TypeScript + zod | контракт, данные, расчётное ядро, intake (правила + Jev), экспорт |

UI **не считает** финансы сам: в режиме `api` модель приходит из
`POST /api/estimates` и приводится к прежней форме адаптером
`frontend/src/core/apiModel.js`. Локальный `frontend/src/core/calc.js`
остаётся демо-фолбэком, если API недоступен.

## Быстрый старт

Требуется Node.js 22+.

```bash
npm ci
(cd frontend && npm ci)

npm run dev:api        # Fastify на :3001
npm run dev:frontend   # Vite на :5173 (strictPort; освободите порт)
# или оба сразу:
npm run dev
```

Порт `5173` закреплён (`strictPort: true`): если он занят — освободите порт,
Vite не переедет молча на другой. В dev Vite проксирует `/api` на `:3001`,
поэтому CORS в браузере не нужен.

Минимальная проверка без браузера:

```bash
npm run data:check     # валидация датасетов и манифеста
npm test               # unit + property + data + export
npm run e2e            # D1–D3: бриф → estimateTask → JSON/XLSX/PDF
npm run report         # docs/deliverables/TEST_REPORT.md
```

## Jev

Jev (System One) используется **только для классификации брифа** — тип работы,
платформа, флаги. Числа извлекаются правилами (regex + словарь), текст вердикта
— шаблоны. Jev не считает деньги и не генерирует текст.

| Переменная | Значение | Смысл |
|---|---|---|
| `OPENCODE_API_KEY` | ключ OpenCode | **только в env сервера**, никогда не в файлах и не в браузере |
| `JEV_MODEL` | `jev-1.13-free` | модель классификации для демо; без переменной — `jev-1.13` |
| `INTAKE_MODE` | `cache` \| `live` | `cache` — коммитнутый кэш ответов; `live` — реальный вызов Jev |

```bash
cp backend/.env.example backend/.env        # заполните OPENCODE_API_KEY локально
OPENCODE_API_KEY='...' JEV_MODEL=jev-1.13-free INTAKE_MODE=live npm run dev:api
```

Без ключа и без сети всё работает в режимах `cache`/`rules`: `npm run dev`
поднимает демо на правилах и кэше, расчёт и экспорт остаются доступны.
Ключ читается только backend-процессом; в браузер он не попадает.

## Эксперту

Что проверить на демо:

1. **D1 — интеграция 1С:ERP ↔ WMS** (6 потоков): основной кейс, ближайший к
   реальным задачам ТМК. Смотрите вердикт, диапазон P10–P90 и сравнение трёх
   сценариев.
2. **D2 — мобильное приложение** (12 экранов): показывает, что модель не
   привязана к 1С, и как меняется декомпозиция.
3. **D3 — сопровождение 24/7**: гибридный сценарий и TCO на 1/3/5 лет.

Чек-лист сценария:

- [ ] **Бриф → параметры**: вставьте текст или выберите демо-кейс; параметры
      показывают источник/цитату и требуют подтверждения.
- [ ] **Параметры → вердикт**: экран «Обзор» — рекомендация, уверенность,
      структура затрат, факторы выбора.
- [ ] **Вердикт → экспорт**: `PDF` (брендированный отчёт с матрицей трёх
      сценариев), `XLSX` (этапы и строки затрат), `JSON` (снимок состояния).
- [ ] **Импорт HelpDesk**: `POST /api/import/helpdesk` принимает
      `data/import/helpdesk-sample.xlsx` и возвращает отчёт о качестве (4 строки).
- [ ] **Срок и доп. статьи**: `targetWeeks` добавляет строку «Сжатие срока
      (Putnam)», `extras` — строки `extra`; P50 меняется предсказуемо.

**Известные ограничения** (честно):

- Оценка — **порядок, а не смета**; дисклеймер есть в UI и PDF.
- MAPE/PRED(25) **не считаются**: в HelpDesk всего 4 строки, нужно ≥ 10 пар
  план/факт (`docs/deliverables/TEST_REPORT.md` §4).
- Датасеты — публичные/синтетические, без персональных данных и внутренних
  ставок заказчика.
- Jev работает только с текстом брифа; HelpDesk и внутренние данные в модель не
  отправляются.
- «Последние оценки» живут в памяти backend с TTL 24 ч и не переживают рестарт.

## Скрипты

| Скрипт | Что делает | Выход |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` по всем пакетам и `shared/*/examples` | код возврата |
| `npm test` | Vitest: unit, property (invariants), data, export | 255 тестов |
| `npm run lint` | ESLint по `shared`, `scripts` | код возврата |
| `npm run data:manifest` | пересобирает `data/manifest.json` и `datasetVersion` | `data/manifest.json` |
| `npm run data:check` | проверяет датасеты, схемы, порядок ставок | отчёт в `.artifacts/` |
| `npm run calc` | демо-расчёт D1 по этапам | `.artifacts/calc-d1.json` |
| `npm run e2e` | D1–D3 от брифа до экспорта | 9 файлов в `.artifacts/` + `.artifacts/control.json` |
| `npm run report` | генерирует `docs/deliverables/TEST_REPORT.md` | `docs/deliverables/TEST_REPORT.md` |
| `npm run intake:eval` | метрики правил/кэша Jev на 12 брифах | `.artifacts/intake-eval.json` |
| `npm run helpdesk:check` | импорт и качество выгрузки HelpDesk | `.artifacts/helpdesk.json` |

Проверки подпроектов:

```bash
npm --prefix backend run typecheck
npm --prefix backend run test        # Fastify inject-тесты
npm --prefix frontend run test       # node --test: calc + apiModel
npm --prefix frontend run build      # vite build
```

`.artifacts/` — gitignored: артефакты генерируются, а не коммитятся.

## Структура

```
├── frontend/                 # React/Vite кокпит TMK Decision Studio
├── backend/                  # Fastify BFF: API, intake, расчёт, экспорт
├── shared/
│   ├── contract/             # zod-схемы и типы (единый контракт)
│   ├── data/                 # загрузка, валидация, импорт HelpDesk
│   ├── core/                 # sizing, cost, risk, schedule, decision, pipeline
│   ├── intake/               # правила + Jev-адаптер + кэш
│   ├── export/               # JSON-снимок, XLSX, PDF, export gate
│   └── cli/                  # e2e-сценарий D1–D3
├── data/                     # версионируемые рабочие данные
│   ├── datasets/             # 6 рабочих JSON-датасетов
│   ├── schemas/              # helpdesk_import_schema.json
│   ├── import/               # helpdesk-sample.xlsx
│   ├── eval/briefs.json      # 12 брифов с метками
│   ├── cache/                # кэш ответов Jev
│   ├── seeds/control.json    # ожидания D1–D3 (регрессия)
│   └── manifest.json         # версия датасетов
├── docs/                     # проектная документация (см. docs/README.md)
│   └── deliverables/         # METHOD.md, DATA_MODEL.md, ARCHITECTURE.md, TEST_REPORT.md
├── research/                 # архив исследования (не runtime-зависимость)
├── scripts/                  # esbuild-обёртки и генераторы отчётов
└── .artifacts/               # генерируемые артефакты (gitignored)
```

`research/` — архив исходных материалов для провенанса, а **не** runtime-
зависимость: код читает рабочие копии из `data/`, исходные пути зафиксированы в
`data/manifest.json` (поле `source`).

## Документы

- `docs/README.md` — карта проектной документации.
- `docs/03_estimation_model.md` — расчётная модель.
- `docs/05_architecture_data.md` — архитектура, модель данных, импорт.
- `docs/09_integration_contract.md` — контракт фронта, включая React/Vite.
- `docs/10_api_contract.md` — REST API frontend ↔ backend.
- `docs/11_frontend_integration_analysis.md` — статус интеграции и остатки.
- `docs/deliverables/METHOD.md`, `DATA_MODEL.md`, `ARCHITECTURE.md` — сжатая
  выжимка с ссылками на реальные файлы кода.
- `docs/deliverables/TEST_REPORT.md` — контрольные D1–D3, unit/property, intake.
- `docs/DECISIONS.md` — журнал решений.

## Границы и честность

- Оценка — **порядок, а не смета**; дисклеймер есть в UI и PDF.
- MAPE/PRED(25) **не считаются**: в HelpDesk всего 4 строки, нужно ≥ 10 пар
  план/факт (`docs/deliverables/TEST_REPORT.md` §4).
- Датасеты — публичные/синтетические, без персональных данных и внутренних
  ставок заказчика.
- Лицензия: MIT (`LICENSE`); сторонние пакеты — MIT/Apache/BSD/ISC.
