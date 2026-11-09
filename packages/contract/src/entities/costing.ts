import { z } from 'zod';
import { Confidence, Grade, IsoDate, MoneyRub } from '../primitives.js';

/* -------------------------------------------------------------------------- */
/* Cost lines and TCO                                                         */
/* -------------------------------------------------------------------------- */

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

export const CostSchema = z
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
  year: z.number().int().min(0),
  costRub: MoneyRub,
  cumulativeRub: MoneyRub,
});
export type TcoRow = z.infer<typeof TcoRowSchema>;

/* -------------------------------------------------------------------------- */
/* Assumptions, risks, rates                                                  */
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
