# ARCHITECTURE — пакеты и поток данных

Архитектура — это **чистое ядро + CLI/экспорт**, без сервера и без вычислений в
браузере. Подробности модели — `METHOD.md`, `DATA_MODEL.md`; контракт фронта —
`../../docs/09_integration_contract.md`.

## 1. Пакеты

```mermaid
graph TD
  subgraph Contract["@app/contract — ../../packages/contract"]
    C1["primitives.ts — Warning, Source, Grade"]
    C2["entities/task.ts — Task, WorkItem, EffortGrid"]
    C3["entities/costing.ts — CostLine, Risk, Assumption, Rate"]
    C4["entities/analogue.ts — Analogue, FormulaNode"]
    C5["entities/decision.ts — Estimate, Verdict, ConfidenceScore"]
  end

  subgraph Data["@app/data — ../../packages/data"]
    D1["files.ts / loaders.ts — 6 датасетов + manifest"]
    D2["validators.ts / quality.ts — zod + отчёт о качестве"]
    D3["helpdesk.ts / manifest.ts — импорт и хеши"]
  end

  subgraph Core["@app/core — ../../packages/core"]
    K1["sizing/ — wbs, fpLite, analogues, combine"]
    K2["cost/ — inhouse, contractor, stageGrid"]
    K3["risk/ — monteCarlo, prng"]
    K4["schedule/ — schedule, calendar"]
    K5["scenarios/ — buildScenarios, TCO, break-even"]
    K6["decision/ — verdict, confidence, formulaTree"]
    K7["pipeline.ts — estimateTask"]
  end

  subgraph Intake["@app/intake — ../../packages/intake"]
    I1["rules/ — classify, numbers, flags"]
    I2["jev/ — adapter, contract"]
    I3["merge.ts / cache.ts / pipeline.ts — classifyBrief"]
  end

  subgraph Export["@app/export — ../../packages/export"]
    E1["snapshot.ts — канонический JSON + hash"]
    E2["xlsx.ts / pdf.ts"]
    E3["bundle.ts — export gate"]
  end

  subgraph CLI["@app/cli — ../../packages/cli"]
    L1["src/e2e.ts — D1–D3 smoke"]
  end

  Contract --> Data
  Contract --> Core
  Contract --> Intake
  Contract --> Export
  Data --> Core
  Core --> Export
  Intake --> CLI
  Core --> CLI
  Export --> CLI
```

Правила зависимостей (`../../packages/*/package.json`):

- `@app/contract` не зависит ни от кого — только `zod`.
- `@app/core` зависит от `@app/contract` и `@app/data`; **не** импортирует
  `@app/intake`, `@app/export`, `apps/`.
- `@app/export` зависит от `@app/core` (типы/константы) и рендерит готовый
  `Estimate`.
- `@app/cli` — единственное место, где встречаются intake + core + export.
- Ядро не делает I/O: файлы читает `@app/data`, пишет CLI/export.

## 2. Поток данных

```mermaid
sequenceDiagram
  participant B as Бриф
  participant I as @app/intake
  participant T as Task
  participant P as @app/core/pipeline
  participant D as @app/data
  participant E as @app/export
  participant F as .artifacts/*.json|xlsx|pdf

  B->>I: classifyBrief(text, mode=cache)
  I->>I: rules + Jev cache → mergeIntake
  I-->>T: params[status=auto]
  T->>P: estimateTask({task, datasets, seed, datasetVersion})
  D-->>P: rate_cards, contractor bands, archetypes, analogues, manifest
  P->>P: WBS (A) + FP-lite (B) + аналоги (C) → combineMethods
  P->>P: toStageGrid → costInhouse + costContractor
  P->>P: buildScenarios (inhouse/contractor/hybrid, TCO, break-even)
  P->>P: simulate (seed) + schedule + buildVerdict + confidence + formulaTree
  P-->>E: три Estimate + verdict + confidence + EffortGrid + FormulaNode
  E->>E: gate: все params confirmed?
  E-->>F: JSON snapshot / XLSX / PDF
```

точка входа CLI: `../../packages/cli/src/e2e.ts` → `../../scripts/e2e.mjs`. Она для D1–D3
читает `../../data/eval/briefs.json`, вызывает `classifyBrief` → `estimateTask` →
`buildExportBundle` и пишет `.artifacts/<id>.{json,xlsx,pdf}` плюс `.artifacts/control.json`.

## 3. Компоненты ядра

| Модуль | Файлы | Ответственность |
|---|---|---|
| sizing | `../../packages/core/src/sizing/wbs.ts`, `fpLite.ts`, `analogues.ts`, `combine.ts`, `stageShares.ts` | методы A/B/C, триангуляция |
| cost | `../../packages/core/src/cost/inhouse.ts`, `contractor.ts`, `stageGrid.ts`, `extras.ts` | строки сметы, сетка часов |
| risk | `../../packages/core/src/risk/monteCarlo.ts`, `prng.ts` | seeded Монте-Карло |
| schedule | `../../packages/core/src/schedule/schedule.ts`, `calendar.ts` | срок, критический путь, Putnam |
| scenarios | `../../packages/core/src/scenarios/scenarios.ts` | inhouse/contractor/hybrid, TCO, break-even |
| decision | `../../packages/core/src/decision/verdict.ts`, `confidence.ts`, `formulaTree.ts`, `templates.ts` | вердикт, уверенность, дерево |
| pipeline | `../../packages/core/src/pipeline.ts` | сборка `Estimate` и валидация схемой |

## 4. Данные и версионирование

```mermaid
graph LR
  R["../../data/datasets/*.json"] --> M["../../scripts/build-manifest.mjs"]
  M --> MAN["../../data/manifest.json — datasetVersion"]
  MAN --> L["../../packages/data/src/loaders.ts — loadDatasets()"]
  L --> PIPE["estimateTask"]
  PIPE --> EST["Estimate.datasetVersion"]
  EST --> SNAP["JSON snapshot + hash"]
```

- `datasetVersion` — хеш манифеста; попадает в каждый `Estimate`, PDF и JSON.
- `inputHash` — sha256 входа `{task, seed, datasetVersion, options}`.
- `seed` — целое, фиксирует Монте-Карло.
- Одинаковые `inputHash + datasetVersion + seed` ⇒ байт-в-байт одинаковый
  результат (`../../packages/core/src/pipeline.test.ts`).

## 5. Экспорт и gate

`../../packages/export/src/bundle.ts`:

1. Проверяет, что `params.length > 0` и все `status === 'confirmed'`
   (`needs_review` / `incomplete`).
2. JSON — `snapshot.ts` (канонический JSON, SHA-256 в имени файла).
3. XLSX — 7 листов (`Scenarios`, `LineItems`, `Assumptions`, `Risks`,
   `Sensitivity`, `Analogues`, `Sources`).
4. PDF — страница решения + приложения (формулы, аналоги, риски, источники,
   версия/seed).

## 6. Frontend

Кокпит (React + Vite) — отдельный потребитель контракта. Он **не считает**:
получает `Estimate` JSON и валидирует `EstimateSchema.parse`. Импорт ядра
(`@app/core`), intake (`@app/intake`) и экспорта (`@app/export`) — только на
серверной стороне (Vite SSR / API / CLI). Подробно — `../../docs/09_integration_contract.md`
§3.4 и `../../packages/contract/examples/contract-usage.ts`.
