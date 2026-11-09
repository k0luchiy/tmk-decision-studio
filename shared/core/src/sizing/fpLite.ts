/**
 * Method B (FP-lite): parametric sizing by functional points.
 *
 * The weights are the simplified single-level IFPUG-like values from the
 * Moscow 2018 methodology (one weight per function type, no low/average/high
 * split). The effort driver is an ISBSG-style PDR in hours per function point.
 * This method never converts through SLOC or story points.
 */

/** Complexity weights per functional component (Moscow 2018, table 1). */
export const FP_WEIGHTS = {
  ilf: 11,
  eif: 8,
  ei: 5,
  eo: 5,
  eq: 4,
} as const;

/** Functional component understood by {@link fpLite}. */
export type FpComponent = keyof typeof FP_WEIGHTS;

/**
 * Planning PDR (hours per function point) by platform, from ISBSG-style
 * benchmarks. `traditional` is the default when a platform is unknown.
 */
export const PDR_BY_PLATFORM = {
  traditional: 8.3,
  java: 8.7,
  lowcode: 1.8,
  sap: 16.7,
  mobile: 12,
  gov: 9.7,
} as const;

/** Platform understood by {@link fpLite}. */
export type FpPlatform = keyof typeof PDR_BY_PLATFORM;

/** Fallback PDR, hours per function point. */
export const DEFAULT_PDR_HOURS_PER_FP = 8.3;

export interface FpLiteInput {
  /** Count of each functional component; missing keys count as zero. */
  counts: Partial<Record<FpComponent, number>>;
  /** Platform key from {@link PDR_BY_PLATFORM}; unknown keys fall back to default. */
  platform?: string;
  /** Explicit PDR override in hours per FP; wins over `platform`. */
  pdrHoursPerFp?: number;
}

export interface FpLiteResult {
  /** Unadjusted function points: Σ count × weight. */
  fp: number;
  /** PDR applied, hours per function point. */
  pdrHoursPerFp: number;
  /** Effort in person-hours: fp × PDR. */
  effortHours: number;
  /** Provenance identifiers for the rule and the benchmark. */
  sourceRefs: string[];
}

const FP_COMPONENTS = Object.keys(FP_WEIGHTS) as FpComponent[];

/**
 * Computes unadjusted function points and effort in hours.
 *
 * `fp = Σ count × weight`, `effortHours = fp × pdr`.
 */
export function fpLite(input: FpLiteInput): FpLiteResult {
  const fp = FP_COMPONENTS.reduce((total, component) => {
    const count = input.counts[component] ?? 0;
    return total + count * FP_WEIGHTS[component];
  }, 0);

  const pdrHoursPerFp =
    input.pdrHoursPerFp ??
    (input.platform !== undefined && input.platform in PDR_BY_PLATFORM
      ? PDR_BY_PLATFORM[input.platform as FpPlatform]
      : DEFAULT_PDR_HOURS_PER_FP);

  return {
    fp,
    pdrHoursPerFp,
    effortHours: fp * pdrHoursPerFp,
    sourceRefs: ['rule:fp_weights_moscow2018', 'benchmark:isbsg_pdr'],
  };
}
