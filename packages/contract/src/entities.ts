import { z } from 'zod';
import {
  Confidence,
  Grade,
  Hours,
  IsoDate,
  MoneyRub,
  WarningSchema,
  Weeks,
} from './primitives.js';

/* -------------------------------------------------------------------------- */
/* Task & extracted parameters                                                */
/* -------------------------------------------------------------------------- */

export const ExtractedParamSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  quote: z.string().optional(),
  status: z.enum(['auto', 'confirmed', 'edited', 'rejected']),
  defaultUsed: z.boolean(),
});
export type ExtractedParam = z.infer<typeof ExtractedParamSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  descriptionRaw: z.string(),
  briefVersion: z.string(),
  createdAt: IsoDate,
  externalId: z.string().optional(),
  changeId: z.string().optional(),
  teamLine: z.string().optional(),
  platform: z.string().optional(),
  params: z.array(ExtractedParamSchema).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

/* -------------------------------------------------------------------------- */
/* Decomposition                                                              */
/* -------------------------------------------------------------------------- */

const RoleMixEntrySchema = z.object({
  roleId: z.string(),
  share: z.number().min(0).max(100),
  grade: Grade,
});

export const WorkItemSchema = z
  .object({
    id: z.string(),
    stage: z.number().int().min(1).max(7),
    archetypeId: z.string(),
    unit: z.string(),
    unitsCount: z.number().finite().nonnegative(),
    optimisticHours: Hours,
    mostLikelyHours: Hours,
    pessimisticHours: Hours,
    expectedHours: Hours,
    sigmaHours: Hours,
    roleMix: z.array(RoleMixEntrySchema),
    sourceRefs: z.array(z.string()),
    assumption: z.boolean(),
  })
  .refine(
    (item) =>
      item.optimisticHours <= item.mostLikelyHours &&
      item.mostLikelyHours <= item.pessimisticHours,
    { message: 'Require optimisticHours <= mostLikelyHours <= pessimisticHours' },
  )
  .refine(
    (item) =>
      Math.abs(item.roleMix.reduce((sum, role) => sum + role.share, 0) - 100) <
      1e-6,
    { message: 'roleMix shares must sum to 100' },
  );
export type WorkItem = z.infer<typeof WorkItemSchema>;

/* -------------------------------------------------------------------------- */
/* Effort, duration, cost                                                     */
/* -------------------------------------------------------------------------- */

export const EffortGridSchema = z
  .object({
    p10Hours: Hours,
    p50Hours: Hours,
    p80Hours: Hours,
    p90Hours: Hours,
  })
  .refine(
    (grid) =>
      grid.p10Hours <= grid.p50Hours &&
      grid.p50Hours <= grid.p80Hours &&
      grid.p80Hours <= grid.p90Hours,
    { message: 'Require p10Hours <= p50Hours <= p80Hours <= p90Hours' },
  );
export type EffortGrid = z.infer<typeof EffortGridSchema>;

export const DurationSchema = z
  .object({
    p10Weeks: Weeks,
    p50Weeks: Weeks,
    p80Weeks: Weeks,
    p90Weeks: Weeks,
    criticalPath: z.array(z.string()),
  })
  .refine(
    (duration) =>
      duration.p10Weeks <= duration.p50Weeks &&
      duration.p50Weeks <= duration.p80Weeks &&
      duration.p80Weeks <= duration.p90Weeks,
    { message: 'Require p10Weeks <= p50Weeks <= p80Weeks <= p90Weeks' },
  );
export type Duration = z.infer<typeof DurationSchema>;

export const CostLineSchema = z.object({
  id: z.string(),
  group: z.enum([
    'labor',
    'overhead',
    'risk',
    'coordination',
    'vat',
    'extra',
    'support',
    'hiring',
    'rampup',
    'bench',
    'turnover',
  ]),
  label: z.string(),
  formula: z.string(),
  inputRefs: z.array(z.string()),
  valueRub: MoneyRub,
  sourceId: z.string().optional(),
  status: z.enum(['fact', 'offer', 'assumption']),
});
export type CostLine = z.infer<typeof CostLineSchema>;

const CostSchema = z
  .object({
    p10Rub: MoneyRub,
    p50Rub: MoneyRub,
    p80Rub: MoneyRub,
    p90Rub: MoneyRub,
    reserveRub: MoneyRub,
    lines: z.array(CostLineSchema),
  })
  .refine(
    (cost) =>
      cost.p10Rub <= cost.p50Rub &&
      cost.p50Rub <= cost.p80Rub &&
      cost.p80Rub <= cost.p90Rub,
    { message: 'Require p10Rub <= p50Rub <= p80Rub <= p90Rub' },
  );
export type Cost = z.infer<typeof CostSchema>;

export const TcoRowSchema = z.object({
  year: z.number().int().positive(),
  costRub: MoneyRub,
  cumulativeRub: MoneyRub,
});
export type TcoRow = z.infer<typeof TcoRowSchema>;

/* -------------------------------------------------------------------------- */
/* Assumptions, risks, analogues, rates                                       */
/* -------------------------------------------------------------------------- */

export const AssumptionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    range: z.object({
      low: z.number().finite(),
      high: z.number().finite(),
    }),
    sourceId: z.string(),
    sensitivity: z.number().finite().optional(),
    pinned: z.boolean(),
    owner: z.string(),
  })
  .refine((item) => item.range.low <= item.range.high, {
    message: 'Require range.low <= range.high',
  });
export type Assumption = z.infer<typeof AssumptionSchema>;

export const RiskSchema = z.object({
  id: z.string(),
  label: z.string(),
  probability: z.number().min(0).max(1),
  impactRub: z.object({
    low: MoneyRub,
    mid: MoneyRub,
    high: MoneyRub,
  }),
  expectedRub: MoneyRub.optional(),
  mitigation: z.string(),
  party: z.enum(['contractor', 'inhouse', 'shared']),
  sourceId: z.string(),
});
export type Risk = z.infer<typeof RiskSchema>;

export const AnalogueSchema = z.object({
  id: z.string(),
  corpus: z.enum(['tmk_eis', 'published']),
  type: z.string(),
  title: z.string(),
  year: z.number().int(),
  currency: z.enum(['RUB', 'USD']),
  price: z.object({
    low: z.number().finite(),
    mid: z.number().finite(),
    high: z.number().finite(),
    basis: z.string(),
  }),
  vatFlag: z.boolean(),
  scopeVector: z.record(
    z.string(),
    z.union([z.number(), z.boolean(), z.string()]),
  ),
  normalization: z.object({
    kScope: z.number().finite(),
    kComplexity: z.number().finite(),
    kRegion: z.number().finite(),
    kAge: z.number().finite(),
    kVat: z.number().finite(),
  }),
  normalizedPriceRub: MoneyRub.optional(),
  included: z.boolean(),
  reasonExcluded: z.string().optional(),
  sourceId: z.string(),
  url: z.url().optional(),
  date: IsoDate.optional(),
});
export type Analogue = z.infer<typeof AnalogueSchema>;

export const RateSchema = z.object({
  id: z.string(),
  side: z.enum(['inhouse', 'contractor']),
  roleId: z.string(),
  grade: Grade,
  value: z.number().finite().nonnegative(),
  unit: z.enum(['RUB/hour', 'USD/hour']),
  geo: z.enum(['RU', 'KZ', 'IN', 'PL']),
  basis: z.enum(['net', 'gross', 'billing', 'fully_loaded']),
  sourceId: z.string(),
  confidence: Confidence,
  date: IsoDate.optional(),
});
export type Rate = z.infer<typeof RateSchema>;

/* -------------------------------------------------------------------------- */
/* Scenarios, verdict, confidence                                             */
/* -------------------------------------------------------------------------- */

export const ScenarioSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  name: z.string(),
  overrides: z.array(z.string()),
  isFrozen: z.boolean(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const VerdictSchema = z.object({
  code: z.enum(['inhouse', 'contractor', 'hybrid', 'parity']),
  templateId: z.string(),
  text: z.string(),
  numbersRefs: z.array(z.string()),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const ConfidenceScoreSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(['high', 'medium', 'low', 'order_of_magnitude']),
  components: z.array(
    z.object({
      key: z.string(),
      weight: z.number().min(0).max(1),
      value: z.number().min(0).max(1),
    }),
  ),
});
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/* -------------------------------------------------------------------------- */
/* Formula tree (recursive)                                                   */
/* -------------------------------------------------------------------------- */

export const FormulaNodeKindSchema = z.enum([
  'total',
  'group',
  'line',
  'hours',
  'rate',
  'assumption',
  'source',
  'const',
]);
export type FormulaNodeKind = z.infer<typeof FormulaNodeKindSchema>;

const FormulaNodeBaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: FormulaNodeKindSchema,
  valueRub: MoneyRub.optional(),
  formula: z.string().optional(),
  refs: z.array(z.string()).optional(),
});

export type FormulaNode = z.infer<typeof FormulaNodeBaseSchema> & {
  children?: FormulaNode[];
};

export const FormulaNodeSchema: z.ZodType<FormulaNode> =
  FormulaNodeBaseSchema.extend({
    children: z.lazy(() => z.array(FormulaNodeSchema)).optional(),
  });
export type FormulaNodeInferred = z.infer<typeof FormulaNodeSchema>;

/* -------------------------------------------------------------------------- */
/* Jev intake                                                                 */
/* -------------------------------------------------------------------------- */

export const JevAnswerSchema = z.object({
  questionId: z.string(),
  type: z.enum(['noul', 'choice', 'score']),
  value: z.union([z.boolean(), z.string(), z.number()]),
  probability: z.number().min(0).max(1),
  model: z.literal('jev-1.13'),
  promptVersion: z.string(),
  stateHash: z.string(),
});
export type JevAnswer = z.infer<typeof JevAnswerSchema>;

/* -------------------------------------------------------------------------- */
/* Data quality                                                               */
/* -------------------------------------------------------------------------- */

export const DataQualityReportSchema = z.object({
  dataset: z.string(),
  rowsTotal: z.number().int().nonnegative(),
  rowsOk: z.number().int().nonnegative(),
  rowsDropped: z.array(
    z.object({
      row: z.union([z.number(), z.string()]),
      reason: z.string(),
    }),
  ),
  anomalies: z.array(z.string()),
  warnings: z.array(z.string()),
  datasetVersion: z.string().optional(),
});
export type DataQualityReport = z.infer<typeof DataQualityReportSchema>;

/* -------------------------------------------------------------------------- */
/* Estimate (aggregate root)                                                  */
/* -------------------------------------------------------------------------- */

const MethodWeightsSchema = z
  .object({
    a: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
    c: z.number().min(0).max(1),
  })
  .refine((weights) => Math.abs(weights.a + weights.b + weights.c - 1) < 1e-6, {
    message: 'methodWeights a + b + c must equal 1',
  });

export const EstimateSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  scenario: z.enum(['inhouse', 'contractor', 'hybrid', 'peak']),
  currency: z.literal('RUB'),
  datasetVersion: z.string(),
  inputHash: z.string(),
  seed: z.number().int(),
  methodWeights: MethodWeightsSchema,
  effort: EffortGridSchema,
  duration: DurationSchema,
  cost: CostSchema,
  tco: z.array(TcoRowSchema),
  breakevenMonth: z.number().int().nonnegative().nullable(),
  verdict: VerdictSchema,
  confidence: ConfidenceScoreSchema,
  assumptions: z.array(AssumptionSchema),
  risks: z.array(RiskSchema),
  analogues: z.array(AnalogueSchema),
  warnings: z.array(WarningSchema),
  createdAt: IsoDate,
});
export type Estimate = z.infer<typeof EstimateSchema>;
