# DATA_MODEL — сущности, поля, связи

Модель данных задана **zod-схемами** в `packages/contract/src/` — это и runtime-
валидация, и TypeScript-типы (`z.infer`). Никакой другой источник истины для
формы данных не используется: API, файлы, моки и экспорт проходят через те же
схемы.

- Примитивы: `packages/contract/src/primitives.ts`
- Задачи и декомпозиция: `packages/contract/src/entities/task.ts`
- Стоимость/риски/ставки: `packages/contract/src/entities/costing.ts`
- Аналоги и формула-дерево: `packages/contract/src/entities/analogue.ts`
- Вердикт/confidence/Estimate: `packages/contract/src/entities/decision.ts`
- Единая точка экспорта: `packages/contract/src/index.ts`

## 1. Основная цепочка

```
Task ─┬─ params: ExtractedParam[]
      └─ workItems: WorkItem[]

Estimate (aggregate root)
  ├─ effort: EffortGrid
  ├─ duration: Duration
  ├─ cost: Cost + CostLine[]
  ├─ tco: TcoRow[]
  ├─ verdict: Verdict
  ├─ confidence: ConfidenceScore
  ├─ assumptions: Assumption[]
  ├─ risks: Risk[]
  ├─ analogues: Analogue[]
  ├─ warnings: Warning[]
  └─ formulaTree: FormulaNode
```

Один `Estimate` — один сценарий. Три сценария одной задачи имеют одинаковые
`taskId`, `datasetVersion`, `inputHash`, `seed`, `methodWeights` и различаются
`id` и `scenario`.

## 2. Task

Схема: `TaskSchema` (`entities/task.ts`). Наследуется от брифа HelpDesk
(`docs/05` §5).

| Поле | Тип | Обяз. | Смысл |
|---|---|---|---|
| `id` | string | да | Внутренний id задачи |
| `title` | string | да | Заголовок |
| `descriptionRaw` | string | да | Исходный текст брифа |
| `briefVersion` | string | да | Версия разбора/брифа |
| `createdAt` | ISO date | да | Дата создания |
| `externalId`, `changeId` | string? | нет | Номер IM… / CR… из HelpDesk |
| `teamLine`, `platform` | string? | нет | Рабочая группа, платформа |
| `params` | `ExtractedParam[]?` | нет | Извлечённые параметры |
| `workItems` | `WorkItem[]?` | нет | Готовая декомпозиция |

### ExtractedParam

| Поле | Тип | Смысл |
|---|---|---|
| `key` | string | `work_type`, `flows`, `duration`, `security_kii`, … |
| `value` | string \| number \| boolean | Значение |
| `unit` | string | Единица (`поток`, `мес`, …) |
| `confidence` | number 0..1 | Уверенность извлечения |
| `quote` | string? | Цитата из брифа |
| `status` | `auto \| confirmed \| edited \| rejected` | Статус ревью |
| `defaultUsed` | boolean | Использовано значение по умолчанию |

`status: 'auto'` блокирует экспорт: `buildExportBundle` требует, чтобы все
параметры были `confirmed` (`packages/export/src/bundle.ts`).

### WorkItem

| Поле | Тип | Смысл |
|---|---|---|
| `id` | string | `<archetype>:s<stage>` |
| `stage` | int 1..7 | Этап методики |
| `archetypeId` | string | Архетип из `work_archetypes.json` |
| `unit`, `unitsCount` | string, number | Единица и объём |
| `optimisticHours`, `mostLikelyHours`, `pessimisticHours` | hours | O/M/P |
| `expectedHours`, `sigmaHours` | hours | PERT E и σ |
| `roleMix` | `{roleId, share, grade}[]` | Сумма share = 100 |
| `sourceRefs` | string[] | `archetype:<id>` |
| `assumption` | boolean | Объём взят типичный, не из брифа |
| `effort` | `{planHours, actualHours, quotedHours}?` | Факт HelpDesk |

Схема проверяет `O ≤ M ≤ P` и `Σ share = 100`.

## 3. Estimate (aggregate root)

Схема: `EstimateSchema` (`entities/decision.ts`).

| Поле | Тип | Смысл |
|---|---|---|
| `id` | string | `<taskId>-<scenario>` |
| `taskId` | string | Ссылка на `Task` |
| `scenario` | `inhouse \| contractor \| hybrid \| peak` | Сценарий |
| `currency` | literal `'RUB'` | Валюта |
| `datasetVersion` | string | Хеш датасетов из `data/manifest.json` |
| `inputHash` | string | sha256 входа |
| `seed` | int | Seed Монте-Карло |
| `methodWeights` | `{a,b,c}` | Сумма = 1 (`0.5/0.2/0.3`) |
| `effort` | `{p10,p50,p80,p90, grid}` | Часы |
| `duration` | `Duration` | Недели и критический путь |
| `cost` | `Cost` | Стоимость и строки сметы |
| `tco` | `TcoRow[]` | Год 0 — реализация |
| `breakevenMonth` | int ≥ 0 \| null | Месяц окупаемости |
| `verdict` | `Verdict` | Код, шаблон, текст, ссылки |
| `confidence` | `ConfidenceScore` | 0..100 + компоненты |
| `assumptions` | `Assumption[]` | Допущения |
| `risks` | `Risk[]` | Риски |
| `analogues` | `Analogue[]` | Аналоги |
| `warnings` | `Warning[]` | Диагностика |
| `formulaTree` | `FormulaNode` | Дерево формулы |
| `createdAt` | ISO date | Дата снимка |

### EffortGrid

`EffortGridSchema` (`entities/task.ts`): `p10Hours ≤ p50Hours ≤ p80Hours ≤
p90Hours`; `byStage[]` (`{stage, hours, byRole[]}`), `byRole[]`
(`{roleId, grade, hours}`), `totalHours = p50Hours`.

### Duration

`DurationSchema` (`entities/decision.ts`): `p10Weeks ≤ p50Weeks ≤ p80Weeks ≤
p90Weeks`; `criticalPath: string[]` (`stage:1` … `stage:6`).

### Cost и CostLine

`CostSchema` / `CostLineSchema` (`entities/costing.ts`).

| Поле CostLine | Тип | Смысл |
|---|---|---|
| `id` | string | `labor:<role>:<grade>`, `coordination`, `risk`, `vat`, … |
| `group` | enum | `labor/overhead/risk/coordination/vat/extra/support/hiring/rampup/bench/turnover` |
| `label` | string | Подпись для UI |
| `formula` | string | Человекочитаемая формула |
| `inputRefs` | string[] | Ссылки на ставки/допущения |
| `valueRub` | money ≥ 0 | Значение |
| `sourceId` | string? | Источник |
| `status` | `fact \| offer \| assumption` | Природа числа |

`Cost` дополнительно: `p10Rub ≤ p50Rub ≤ p80Rub ≤ p90Rub`, `reserveRub`,
`lines[]`.

### TcoRow

`TcoRowSchema`: `{year: int ≥ 0, costRub, cumulativeRub}`. Год 0 — реализация,
годы 1..3 — поддержка.

### Assumption / Risk

`AssumptionSchema`: `id, label, value (string|number|boolean), range{low,high},
sourceId, sensitivity?, pinned, owner`; проверяется `low ≤ high`.

`RiskSchema`: `id, label, probability 0..1, impactRub{low,mid,high},
expectedRub?, mitigation, party (contractor|inhouse|shared), sourceId`.

### Analogue

`AnalogueSchema` (`entities/analogue.ts`): `id, corpus (tmk_eis|published), type,
title, year, currency (RUB|USD), price{low,mid,high,basis}, vatFlag,
scopeVector, normalization{kScope,kComplexity,kRegion,kAge,kVat},
normalizedPriceRub?, included, reasonExcluded?, sourceId, url?, date?`.

### Verdict / ConfidenceScore

`VerdictSchema`: `code (inhouse|contractor|hybrid|parity), templateId, text,
numbersRefs[]`.

`ConfidenceScoreSchema`: `score 0..100, level (high|medium|low|
order_of_magnitude), components[{key, weight, value}]`; веса в сумме 1.

### FormulaNode

`FormulaNodeSchema` (`entities/analogue.ts`) — рекурсивный узел:
`id, label, kind (total|group|line|hours|rate|assumption|source|const),
valueRub?, formula?, inputs[], children?`.

### Warning и Source

`WarningSchema` (`primitives.ts`): `code, message, severity? (info|warning|error),
refs?[]`.

`SourceSchema`: `id, title, url?, publisher?, datePublished?, dateAccessed?,
licence?, type (primary|secondary|proxy|assumption)`.

## 4. Датасеты

Код загрузки: `packages/data/src/loaders.ts`, список файлов —
`packages/data/src/files.ts`, типы сырых строк — `packages/data/src/types.ts`,
валидация — `packages/data/src/validators.ts`.

| Файл | Что содержит | Версия |
|---|---|---|
| `research/data/product/rate_cards.json` | 14 ролей × 4 грейда, fully loaded ₽/ч и ₽/мес | `data/manifest.json` |
| `research/data/product/contractor_rate_cards.json` | 224 полосы `(geo, role, grade)` | `data/manifest.json` |
| `research/data/product/work_archetypes.json` | архетипы, O/M/P, роль-микс, typical units | `data/manifest.json` |
| `research/data/product/analogue_corpus.json` | 49 аналогов + строки ЕИС | `data/manifest.json` |
| `research/data/product/coefficients.json` | коэффициенты, налоги, WACC, политики | `data/manifest.json` |
| `research/data/tmk_it_contracts.json` | 60 контрактов ТМК | `data/manifest.json` |

`data/manifest.json` — версия каждого файла, SHA-256, число строк, дата и
источник; `datasetVersion` — хеш манифеста. Пересборка: `npm run data:manifest`,
проверка: `npm run data:check`.

Прочие данные:

| Файл | Формат | Назначение |
|---|---|---|
| `data/eval/briefs.json` | `EvalBrief[]` | 12 брифов с метками для intake |
| `data/cache/jev-responses.json` | `{version, entries[]}` | Кэш ответов Jev по хешу брифа |
| `data/seeds/control.json` | `{tolerance, tasks[]}` | Ожидаемые P50 ±15 % и вердикт D1–D3 |
| `out/control.json` | `E2EControlFile` | Фактические метрики e2e (генерируется, gitignored) |

## 5. Правила целостности

1. **Внешний JSON → zod.** Любой `Estimate` из сети/файла проходит
   `EstimateSchema.parse`; ошибка парсинга — ошибка интеграции, не повод чинить
   данные на клиенте.
2. **Снимок неизменяем.** Правка брифа создаёт новый `Estimate` с новым `id`;
   старый остаётся для аудита.
3. **Воспроизводимость.** `inputHash + datasetVersion + seed` однозначно
   определяют результат; повторный расчёт с тем же входом побайтно совпадает.
4. **Провенанс.** Каждая `CostLine` несёт `formula` и `inputRefs`; каждая
   ссылка указывает на `Source`/допущение.
5. **Валюта.** Все поля `*Rub` — рубли; `Analogue.currency` может быть `USD`
   только как исходная цена, `normalizedPriceRub` уже приведён к RUB (или
   отсутствует, если FX нет).
