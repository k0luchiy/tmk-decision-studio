# @app/contract

Типы и zod-схемы данных TMK Decision Studio: Task, WorkItem, Estimate, CostLine, Assumption, Risk, Analogue, Rate, Source, Scenario, Verdict, ConfidenceScore, FormulaNode, Warning, DataQualityReport. Правила интеграции — `docs/09_integration_contract.md`.

## Импорт
```ts
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
```
Пакет разрешается в `src/index.ts` (workspace, `paths` в корневом `tsconfig.json`).

## Мок
`mock/d1.scenarios.json` — три сценария D1 (inhouse, contractor, hybrid); `mock/d1.estimate.json` — снимок hybrid. Валидируются `EstimateSchema` в `src/mock.test.ts`.

## Проверка
```bash
npm run typecheck && npm test && npm run lint
```
