import { z } from 'zod';
import { IsoDate, MoneyRub } from '../primitives.js';

/* -------------------------------------------------------------------------- */
/* Analogues                                                                  */
/* -------------------------------------------------------------------------- */

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
  scopeVector: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])),
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
  inputs: z.array(z.string()),
});

export type FormulaNode = z.infer<typeof FormulaNodeBaseSchema> & {
  children?: FormulaNode[];
};

export const FormulaNodeSchema: z.ZodType<FormulaNode> = FormulaNodeBaseSchema.extend({
  children: z.lazy(() => z.array(FormulaNodeSchema)).optional(),
});
export type FormulaNodeInferred = z.infer<typeof FormulaNodeSchema>;
