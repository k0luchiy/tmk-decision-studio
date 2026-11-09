import { z } from 'zod';

/**
 * ISO-8601 date or date-time string (e.g. `2026-11-09` or `2026-11-09T12:00:00Z`).
 * Kept permissive on shape, strict on parseability, so both plain dates and
 * timestamps produced by the engine pass.
 */
export const IsoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Expected an ISO-8601 date or date-time string',
});
export type IsoDate = z.infer<typeof IsoDate>;

/** Money amount in Russian roubles. Never negative. */
export const MoneyRub = z.number().finite().nonnegative();
export type MoneyRub = z.infer<typeof MoneyRub>;

/** Effort measured in person-hours. Never negative. */
export const Hours = z.number().finite().nonnegative();
export type Hours = z.infer<typeof Hours>;

/** Calendar duration in weeks. Never negative. */
export const Weeks = z.number().finite().nonnegative();
export type Weeks = z.infer<typeof Weeks>;

/** Role grade used by rate cards and work archetypes. */
export const Grade = z.enum(['junior', 'middle', 'senior', 'lead']);
export type Grade = z.infer<typeof Grade>;

/** Source/data confidence qualifier (High | Medium | Low | Proxy in the research data). */
export const Confidence = z.enum(['high', 'medium', 'low', 'proxy']);
export type Confidence = z.infer<typeof Confidence>;

/** Structured, non-fatal diagnostic emitted by rules, data checks and the engine. */
export const WarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  refs: z.array(z.string()).optional(),
});
export type Warning = z.infer<typeof WarningSchema>;

/** Provenance record. Every rate / analogue / assumption points at one of these. */
export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().optional(),
  publisher: z.string().optional(),
  datePublished: IsoDate.optional(),
  dateAccessed: IsoDate.optional(),
  licence: z.string().optional(),
  type: z.enum(['primary', 'secondary', 'proxy', 'assumption']),
});
export type Source = z.infer<typeof SourceSchema>;
