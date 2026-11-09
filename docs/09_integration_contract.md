# 09. Контракт интеграции: фронтенд ↔ ядро оценки

Документ фиксирует границу между UI и пакетом `@app/contract`. Он обязателен для
фронтендера: всё, что рисуется на экране, берётся из типизированного результата
`Estimate` без пересчётов на клиенте.

Связанные документы: `05_architecture_data.md` §7 (сигнатуры), `04_ux_scenario.md`
§3–§5 (экран и формулировки), `04b_design.md` §6.2 (визуальная обработка кокпита).

## 1. Что импортирует фронт

Единственный источник типов и схем — пакет `@app/contract`. В исходниках он
разрешается в `packages/contract/src/index.ts` (workspace + `paths` в корневом
`tsconfig.json`).

```ts
// Схемы (runtime-валидация) и типы (compile-time)
import { EstimateSchema, TaskSchema, CostLineSchema } from '@app/contract';
import type {
  Estimate,
  Task,
  WorkItem,
  CostLine,
  TcoRow,
  Duration,
  Assumption,
  Risk,
  Analogue,
  Rate,
  Source,
  Scenario,
  Verdict,
  ConfidenceScore,
  FormulaNode,
  Warning,
  DataQualityReport,
} from '@app/contract';
```

Правило: **любой внешний JSON сначала проходит через соответствующую zod-схему**.
`EstimateSchema.parse(raw)` — единственный допустимый способ получить `Estimate`
из сети, файла или мока. Ошибка парсинга — ошибка интеграции, а не повод
«починить» данные на клиенте.

Мок для разработки и демо:

- `packages/contract/mock/d1.scenarios.json` — массив из трёх сценариев D1:
  `inhouse`, `contractor`, `hybrid`. У всех одинаковые `taskId`, `datasetVersion`,
  `inputHash`, `seed` и разные `id`.
- `packages/contract/mock/d1.estimate.json` — одиночный снимок (сценарий `hybrid`).

```ts
import d1ScenariosJson from '../packages/contract/mock/d1.scenarios.json' assert { type: 'json' };

const scenarios: Estimate[] = EstimateSchema.array().parse(d1ScenariosJson);
```

Компилируемый пример: `examples/contract-usage.ts` (проверяется `npm run typecheck`).

## 2. Поле → что рисует фронт

Ниже — минимальный контракт отрисовки. Поля сгруппированы по сущностям
`Estimate`. Если поле не указано в таблице, фронт его не показывает.

### 2.1. Шапка и метаданные

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `id` | `string` | Идентификатор снимка (в сохранённых оценках, экспорте) | Не редактируется |
| `taskId` | `string` | Связь с задачей/брифом | Только чтение |
| `scenario` | `'inhouse' \| 'contractor' \| 'hybrid' \| 'peak'` | Активный чип сценария в верхней полосе | Один `Estimate` = один сценарий |
| `currency` | `'RUB'` | Подпись валюты у денежных KPI | Всегда RUB |
| `datasetVersion` | `string` | Бейдж «Данные vX · дата» в шапке и колонтитул PDF | См. §5 |
| `inputHash`, `seed` | `string`, `number` | Служебные; в PDF — seed | Не показывать в основном UI |
| `methodWeights` | `{ a, b, c }` | Раздел «Методика» / tooltip | Сумма = 1, не пересчитывать |
| `createdAt` | ISO-строка | Дата снимка в списке сохранённых | Формат `ru-RU` на отображении |

### 2.2. Вердикт (`verdict`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `verdict.code` | `'inhouse' \| 'contractor' \| 'hybrid' \| 'parity'` | Метка сценария-победителя, акцент в карточке | Только как акцент действия, не как «статус» |
| `verdict.templateId` | `string` | Служебный выбор шаблона текста | Не показывать пользователю |
| `verdict.text` | `string` | Блок C3 «Вывод» (1–3 фразы) | Рендерить как есть, без правок и склейки |
| `verdict.numbersRefs` | `string[]` | Кликабельные ссылки чисел → фокус графика/строки сметы | Маппинг `ref → элемент` на фронте |

### 2.3. Трудоёмкость и срок (`effort`, `duration`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `effort.p10Hours` / `p50Hours` / `p80Hours` / `p90Hours` | `number` (часы) | KPI «Трудоёмкость»: `p50` крупно, диапазон `p10–p90` | Подписи UI: Мин / Средн. / Макс = P10 / P50 / P90 |
| `effort.grid.byStage[]` | `{ stage, hours, byRole[] }` | Детали «Смета по этапам», стек/таблица | Этапы 1–7 |
| `effort.grid.byRole[]` | `{ roleId, grade, hours }` | Детали «По ролям», таблица | Часы вправо, моноширинно |
| `effort.grid.totalHours` | `number` | Итог в смете | Совпадает с суммой этапов |
| `duration.p10Weeks` / `p50Weeks` / `p80Weeks` / `p90Weeks` | `number` (недели) | KPI «Срок»: `p50` крупно, диапазон `p10–p90` | P80 — резерв, не «среднее» |
| `duration.criticalPath` | `string[]` | Подсветка критического пути, tooltip | Порядок сохранять |

### 2.4. Стоимость и TCO (`cost`, `tco`, `breakevenMonth`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `cost.p10Rub` / `p50Rub` / `p80Rub` / `p90Rub` | `number` (₽) | KPI «Стоимость»: `p50` крупно, диапазон `p10–p90` | P80 подписывать «резерв бюджета» |
| `cost.reserveRub` | `number` (₽) | Строка «Резерв бюджета» | Не пересчитывать как процент |
| `cost.lines[]` | `CostLine[]` | Вкладка «Смета»: группа, label, формула, значение | Показывать `formula` и `inputRefs` |
| `cost.lines[].group` | enum | Группировка строк сметы | `labor`, `overhead`, `risk`, `coordination`, `vat`, `extra`, `support`, `hiring`, `rampup`, `bench`, `turnover` |
| `cost.lines[].status` | `'fact' \| 'offer' \| 'assumption'` | Бейдж/метка у строки | `assumption` — визуально отличается |
| `cost.lines[].sourceId` | `string?` | Ссылка «источник» в drawer | Ведёт к `Source` |
| `tco[]` | `{ year, costRub, cumulativeRub }[]` | График «Стек TCO» + таблица | `year` начинается с 0 (реализация) |
| `tco[].costRub` | `number` (₽) | Столбец/строка года | Не суммировать на клиенте |
| `tco[].cumulativeRub` | `number` (₽) | Накопительная линия | Берётся как есть |
| `breakevenMonth` | `number \| null` | Бейдж «Break-even: М{month}» | `null` → «не достигается в горизонте» |

### 2.5. Допущения и риски (`assumptions`, `risks`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `assumptions[].label` | `string` | Чип/строка допущения | — |
| `assumptions[].value` | `string \| number \| boolean` | Значение допущения с единицей | Не форматировать как деньги, если это не деньги |
| `assumptions[].range` | `{ low, high }` | Диапазон рядом со значением | `low ≤ high` гарантируется схемой |
| `assumptions[].sensitivity` | `number?` | Сортировка/Tornado, метка `⚠` при высокой чувствительности | Не пересчитывать |
| `assumptions[].pinned` | `boolean` | Метка «закреплено» | — |
| `assumptions[].owner` | `string` | Ответственный в деталях | — |
| `assumptions[].sourceId` | `string` | Ссылка на источник | — |
| `risks[].label` | `string` | Вкладка «Риски» | — |
| `risks[].probability` | `number` 0..1 | Вероятность (показывать `%`) | Перевод в проценты — только отображение |
| `risks[].impactRub` | `{ low, mid, high }` | Диапазон влияния в ₽ | — |
| `risks[].expectedRub` | `number?` | Ожидаемое влияние | Если нет — прочерк, не считать |
| `risks[].mitigation` | `string` | Меры снижения | — |
| `risks[].party` | `'contractor' \| 'inhouse' \| 'shared'` | Бейдж стороны | — |

### 2.6. Аналоги (`analogues`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `analogues[].title` | `string` | Карточка/строка аналога | — |
| `analogues[].corpus` | `'tmk_eis' \| 'published'` | Бейдж корпуса | — |
| `analogues[].type` | `string` | Тип проекта | — |
| `analogues[].year` | `number` | Год | — |
| `analogues[].price` | `{ low, mid, high, basis }` | Диапазон цены + основание (`НМЦК`, `Цена контракта`) | Не нормализовать на клиенте |
| `analogues[].currency` | `'RUB' \| 'USD'` | Валюта исходной цены | USD не складывать с RUB |
| `analogues[].vatFlag` | `boolean` | Метка «с НДС» | — |
| `analogues[].normalizedPriceRub` | `number?` | Приведённая цена в ₽ | Готова к показу, не считать |
| `analogues[].normalization` | `{ kScope, kComplexity, kRegion, kAge, kVat }` | Раскрытие коэффициентов | Только чтение |
| `analogues[].scopeVector` | `Record<string, number \| boolean \| string>` | Теги объёма/платформы | — |
| `analogues[].included` | `boolean` | Включён/исключён | — |
| `analogues[].reasonExcluded` | `string?` | Причина исключения | — |
| `analogues[].url`, `date`, `sourceId` | `string?`, ISO?, `string` | Ссылка на источник и дата | — |

### 2.7. Уверенность (`confidence`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `confidence.score` | `number` 0..100 | «Уверенность 68 %» в KPI | Диапазон 0..100, не 0..1 |
| `confidence.level` | `'high' \| 'medium' \| 'low' \| 'order_of_magnitude'` | Бейдж класса (текст + цвет RAG) | Не выводить только цветом |
| `confidence.components[]` | `{ key, weight, value }[]` | Разложение при наведении | Веса в сумме = 1, не менять |

### 2.8. Формула-дерево и предупреждения (`formulaTree`, `warnings`)

| Поле | Тип | Что рисует фронт | Правило |
|---|---|---|---|
| `formulaTree` | рекурсивный `FormulaNode` | Drawer «Формула» по клику на число | Обход `children` рекурсивно |
| `formulaTree.label` | `string` | Заголовок узла | — |
| `formulaTree.kind` | enum | Иконка/тип узла | `total`, `group`, `line`, `hours`, `rate`, `assumption`, `source`, `const` |
| `formulaTree.valueRub` | `number?` | Значение узла | — |
| `formulaTree.formula` | `string?` | Моноширинная формула | Как есть |
| `formulaTree.inputs` | `string[]` | Ссылки на входы | Ведят к полям/источникам |
| `warnings[].message` | `string` | Баннер (C4/страница «Данные») | — |
| `warnings[].severity` | `'info' \| 'warning' \| 'error'?` | Цвет полосы: info/warn/error | Не оранжевый; warn — жёлтый |
| `warnings[].code`, `refs` | `string`, `string[]?` | Служебные, подсветка связанных элементов | — |

## 3. Планируемые функции (статус `planned`)

Ниже — контракт на будущие PR. **Сейчас функции не реализованы и не экспортируются
пакетом `@app/contract`.** Фронт не должен на них рассчитывать до появления
реализации; до тех пор используется мок из §1.

```ts
// planned — не реализовано
type Precision = 'order' | 'budget' | 'detailed';

interface EstimateOptions {
  scenario?: 'inhouse' | 'contractor' | 'hybrid' | 'peak';
  precision?: Precision;
  seed?: number;
  datasetVersion?: string;
  overrides?: Record<string, string | number | boolean>;
}

function estimateTask(task: Task, options?: EstimateOptions): Estimate;

function getD1Mock(): Estimate[];

type ExportFormat = 'pdf' | 'xlsx' | 'json';

interface ExportBundle {
  format: ExportFormat;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  datasetVersion: string;
  seed: number;
  createdAt: string;
}

function buildExportBundle(estimate: Estimate, format: ExportFormat): ExportBundle;

type ParseMode = 'rules' | 'jev' | 'auto';

interface ParseBriefResult {
  params: ExtractedParam[];
  mode: 'rules' | 'jev';
  modelVersion?: string;
  warnings: Warning[];
}

function parseBrief(text: string, mode: ParseMode): Promise<ParseBriefResult>;
```

| Функция | Сигнатура | Назначение | Ошибки |
|---|---|---|---|
| `estimateTask` | `(task: Task, options?: EstimateOptions) => Estimate` | Полный детерминированный расчёт: WBS → effort → duration → cost → TCO → verdict → confidence → formulaTree. Вход/выход валидируются схемами. | `ZodError` при невалидном `Task`; доменная ошибка при невозможном расчёте |
| `getD1Mock` | `() => Estimate[]` | Возвращает распарсенные схемой три сценария D1 из `d1.scenarios.json` для UI-разработки и e2e. | `ZodError`, если мок разошёлся со схемой |
| `buildExportBundle` | `(estimate: Estimate, format: ExportFormat) => ExportBundle` | Собирает PDF/XLSX/JSON-снимок с `datasetVersion`, `seed`, `createdAt` и источниками. Не пересчитывает оценку. | Ошибка формата/рендера |
| `parseBrief` | `(text: string, mode: ParseMode) => Promise<ParseBriefResult>` | Извлекает `ExtractedParam[]` из текста брифа: правила, Jev или авто-выбор. | Ошибка сети/таймаут Jev; деградация к `rules` с предупреждением |

Все функции планируются чистыми (кроме `parseBrief`, у которой есть I/O к Jev), с
детерминированным seed и без `Date.now()`/`Math.random()` внутри ядра.

## 4. Правила интеграции

1. **Фронт не считает сам.** Запрещено складывать `cost.lines`, умножать часы на
   ставки, выводить P80 из P50/P90 или строить TCO на клиенте. Все числа приходят
   готовыми.
2. **Не пересчитывать проценты.** `confidence.score`, `risk.probability`,
   `assumption.sensitivity`, доли `methodWeights` и `confidence.components[].weight`
   отображаются как есть. Единственное преобразование — форматирование (`0..1` →
   `%`) для показа.
3. **Не подставлять ставки.** Ставки и коэффициенты берутся только из данных и
   `sourceRefs`. UI не хранит «дефолтную ставку» и не заменяет ею значения.
4. **Валюта — RUB.** Все поля `*Rub` — рубли. `analogue.price.currency` может быть
   `USD` только как исходная цена аналога; смешивать валюты в одном итоге нельзя.
   `analogue.normalizedPriceRub` уже приведён к RUB.
5. **Диапазоны — только из квантилей.** Мин = `p10`, Средн. = `p50`, Макс = `p90`;
   `p80` = «резерв бюджета». Нельзя придумывать min/max или брать `low/high` из
   других сущностей как диапазон оценки.
6. **Confidence — 0..100.** Не нормализовать в 0..1 и не пересчитывать. Уровни
   `high/medium/low/order_of_magnitude` выводятся текстом, не только цветом.
7. **Оба сценария всегда видны.** Даже если победитель очевиден, карточки
   «Команда» и «Подрядчик» показываются вместе с Δ, риском и break-even.
8. **Предупреждения не скрывать.** `warnings` с `severity: 'error'/'warning'`
   показываются баннером; экспорт не блокируется предупреждением `info`.
9. **Форматирование, не изменение.** Деньги — `Intl.NumberFormat('ru-RU')`,
   крупные суммы — «млн ₽» с одним знаком; часы — с разделителем разрядов;
   недели — целые. Сырые значения не округлять в данных.
10. **Дисклеймер.** Внизу вердикта — «оценка порядка, а не смета».

## 5. Версионирование и неизменяемый снимок

- `Estimate.datasetVersion` — обязательное поле. Оно показывается в шапке кокпита
  (бейдж «Данные vX · дата») и попадает в колонтитул PDF и в JSON-снимок.
- Ключ воспроизводимости: `inputHash + datasetVersion + seed`. При совпадении
  трёх значений результат обязан совпадать побайтно.
- **Снимок неизменяем.** Сохранённый `Estimate` не мутируется. Любая правка
  брифа/допущений создаёт новый `Estimate` с новым `id`; старый остаётся для
  аудита.
- Замороженный сценарий помечается `Scenario.isFrozen`; UI не предлагает его
  редактировать.
- Если `datasetVersion` отличается от текущей версии датасетов, фронт показывает
  баннер «данные устарели» и не пересчитывает снимок молча.
- Экспорт (`buildExportBundle`) обязан включать `datasetVersion`, `seed`,
  `createdAt` и список источников — как в `05_architecture_data.md` §9.

## 6. Чек-лист фронта (8 пунктов)

1. **Шапка.** Название оценки, чипы сценариев `[Команда][Подрядчик][Гибрид]`,
   переключатель точности, бейдж `datasetVersion`, кнопки PDF / XLSX / Снимок.
2. **Бриф и проверка.** Textarea, кнопка «Разобрать», таблица параметров с
   уверенностью и цитатой; при неподтверждённых параметрах экспорт заблокирован
   с подсказкой.
3. **KPI вердикта.** Трудоёмкость, срок, стоимость — каждое с `p50` крупно и
   диапазоном `p10–p90`; рядом `confidence.score` с уровнем.
4. **Сравнение сценариев.** Карточки «Команда» и «Подрядчик»: P50, диапазон,
   риск-премия, срок, Δ, break-even; победитель — текстом и акцентом.
5. **Вывод C3.** `verdict.text` как есть; числа из `numbersRefs` кликабельны и
   фокусируют соответствующий график/строку.
6. **Детали C4.** Вкладки «Смета / Аналоги / Риски / Допущения / Источники»:
   строки сметы со `status` (`fact/offer/assumption`), аналоги с основанием цены,
   риски с вероятностью и влиянием, источники с датой и ссылкой.
7. **Формула-дерево.** Drawer 480 px: рекурсивный `formulaTree`, у узла —
   значение, формула, входы, источник, дата; кнопка «изменить» ведёт к полю.
8. **Предупреждения и экспорт.** Баннеры по `warnings.severity`, дисклеймер
   «оценка порядка, а не смета»; PDF/XLSX/снимок содержат `datasetVersion` и `seed`.
