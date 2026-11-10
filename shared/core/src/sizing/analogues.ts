/**
 * Method C (analogue): order-of-magnitude estimate from a corpus of published
 * project prices.
 *
 * Prices are brought to a common basis with multiplicative factors (scope,
 * complexity, region, VAT, age). USD rows are never converted: there is no
 * FX source in the dataset, so they are excluded explicitly. Rows without a
 * source or without a usable price are excluded as well.
 */

/**
 * Work type → analogue corpus `project_type`.
 * `default` is the fallback for unrecognised work types.
 */
export const ANALOGUE_TYPE_BY_WORK_TYPE: Record<string, string> = {
  integration: 'erp_1c',
  migration: 'sap_migration',
  bi: 'dwh_bi',
  mes: 'mes',
  cv: 'cv_qc',
  security: 'kii_security',
  support: 'support',
  erp: 'erp_1c',
  data: 'dwh_bi',
  default: 'erp_1c',
};

/** Annual price index applied to bring an analogue to the target year. */
export const ANALOGUE_AGE_INDEX = 1.08;

/** Default target year for age normalisation. */
export const DEFAULT_TARGET_YEAR = 2026;

/** Default minimum number of usable analogues for a sufficient sample. */
export const DEFAULT_MIN_ANALOGUES = 3;

/** Minimal corpus row accepted by {@link analogueEstimate}. */
export interface RawAnalogue {
  id: string;
  project_type: string;
  title: string;
  year: number;
  currency: 'RUB' | 'USD';
  price_low?: number | null;
  price_mid?: number | null;
  price_high?: number | null;
  source?: string | null;
  price_basis?: string;
}

export interface AnalogueEstimateInput {
  workType: string;
  /** Target year for age normalisation; defaults to {@link DEFAULT_TARGET_YEAR}. */
  targetYear?: number;
  scopeFactor?: number;
  complexityFactor?: number;
  regionFactor?: number;
  vatFactor?: number;
  /** Minimum usable analogues for `sufficient`; defaults to 3. */
  minAnalogues?: number;
  analogues: RawAnalogue[];
}

export interface UsedAnalogue {
  id: string;
  normalizedRub: number;
}

export type AnalogueExclusionReason =
  | 'type_mismatch'
  | 'no_price'
  | 'no_source'
  | 'usd_no_fx';

export interface ExcludedAnalogue {
  id: string;
  reason: AnalogueExclusionReason;
}

export interface AnalogueEstimateResult {
  medianRub: number | null;
  p10Rub: number | null;
  p90Rub: number | null;
  used: UsedAnalogue[];
  excluded: ExcludedAnalogue[];
  sufficient: boolean;
}

/** Base price: `price_mid`, else the midpoint of the low/high range. */
function basePrice(analogue: RawAnalogue): number | null {
  if (typeof analogue.price_mid === 'number' && Number.isFinite(analogue.price_mid)) {
    return analogue.price_mid > 0 ? analogue.price_mid : null;
  }
  if (
    typeof analogue.price_low === 'number' &&
    Number.isFinite(analogue.price_low) &&
    typeof analogue.price_high === 'number' &&
    Number.isFinite(analogue.price_high)
  ) {
    const midpoint = (analogue.price_low + analogue.price_high) / 2;
    return midpoint > 0 ? midpoint : null;
  }
  return null;
}

/** Nearest-rank percentile over an ascending-sorted array. */
function percentileNearestRank(values: readonly number[], percentile: number): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil((percentile / 100) * sorted.length);
  const index = Math.min(Math.max(rank, 1), sorted.length) - 1;
  const value = sorted[index];
  return value === undefined ? null : value;
}

/**
 * Estimates a RUB range from analogues of one work type.
 *
 * Normalisation: `base = price_mid ?? (low + high) / 2`, then
 * `normalized = base × scope × complexity × region × VAT × age`, where
 * `age = 1.08^(targetYear − year)` for rows not newer than the target year.
 */
export function analogueEstimate(input: AnalogueEstimateInput): AnalogueEstimateResult {
  const expectedType =
    ANALOGUE_TYPE_BY_WORK_TYPE[input.workType] ??
    ANALOGUE_TYPE_BY_WORK_TYPE.default ??
    'erp_1c';
  const targetYear = input.targetYear ?? DEFAULT_TARGET_YEAR;
  const scope = input.scopeFactor ?? 1;
  const complexity = input.complexityFactor ?? 1;
  const region = input.regionFactor ?? 1;
  const vat = input.vatFactor ?? 1;
  const minAnalogues = input.minAnalogues ?? DEFAULT_MIN_ANALOGUES;

  const used: UsedAnalogue[] = [];
  const excluded: ExcludedAnalogue[] = [];

  for (const analogue of input.analogues) {
    if (analogue.project_type !== expectedType) {
      excluded.push({ id: analogue.id, reason: 'type_mismatch' });
      continue;
    }
    if (analogue.currency !== 'RUB') {
      excluded.push({ id: analogue.id, reason: 'usd_no_fx' });
      continue;
    }
    if (typeof analogue.source !== 'string' || analogue.source.trim() === '') {
      excluded.push({ id: analogue.id, reason: 'no_source' });
      continue;
    }
    const base = basePrice(analogue);
    if (base === null) {
      excluded.push({ id: analogue.id, reason: 'no_price' });
      continue;
    }
    const age =
      analogue.year <= targetYear
        ? Math.pow(ANALOGUE_AGE_INDEX, targetYear - analogue.year)
        : 1;
    used.push({
      id: analogue.id,
      normalizedRub: base * scope * complexity * region * vat * age,
    });
  }

  const normalized = used.map((row) => row.normalizedRub);

  return {
    medianRub: percentileNearestRank(normalized, 50),
    p10Rub: percentileNearestRank(normalized, 10),
    p90Rub: percentileNearestRank(normalized, 90),
    used,
    excluded,
    sufficient: used.length >= minAnalogues,
  };
}
