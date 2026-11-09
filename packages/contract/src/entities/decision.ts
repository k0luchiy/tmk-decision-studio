import { z } from 'zod';
import { Hours, IsoDate, WarningSchema, Weeks } from '../primitives.js';
import { EffortGridSchema } from './task.js';
import { AssumptionSchema, CostSchema, RiskSchema, TcoRowSchema } from './costing.js';
import { AnalogueSchema, FormulaNodeSchema } from './analogue.js';

/* -------------------------------------------------------------------------- */
/* Duration                                                                   */
/* -------------------------------------------------------------------------- */

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

const EffortSchema = z.object({
  p10Hours: Hours,
  p50Hours: Hours,
  p80Hours: Hours,
  p90Hours: Hours,
  grid: EffortGridSchema,
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
  effort: EffortSchema,
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
  formulaTree: FormulaNodeSchema,
  createdAt: IsoDate,
});
export type Estimate = z.infer<typeof EstimateSchema>;
