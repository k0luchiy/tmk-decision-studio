/**
 * Confidence score (`docs/03_estimation_model.md` §9, FR-6.1).
 *
 * One number 0–100 plus a decomposition into four weighted components:
 *
 * | Component | Weight | Measures                                            |
 * |-----------|-------:|-----------------------------------------------------|
 * | brief     |   0.30 | Share of required, confirmed brief parameters       |
 * | methods   |   0.30 | `1 − min(1, divergence)` between methods A/B/C      |
 * | analogues |   0.20 | `min(1, count / 3) × sufficiency` of analogues      |
 * | data      |   0.20 | Rates freshness and source coverage                  |
 *
 * Every component value is clamped to `0…1`; the score is
 * `round(100 × Σ weight × value)`. The `order_of_magnitude` accuracy class
 * (FR-1.6) caps the score at 60: without decomposition the estimate cannot be
 * more precise than an order of magnitude.
 */

import type { ConfidenceScore } from '@app/contract';

/** Accuracy class selected by the estimator (FR-1.6). */
export type AccuracyClass = 'order_of_magnitude' | 'budget' | 'detailed';

export interface ConfidenceInput {
  /** Share of required, confirmed brief parameters, `0…1`. */
  briefCompleteness: number;
  /** Relative divergence between methods A/B/C (`max / min − 1`), `>= 0`. */
  methodDivergence: number;
  /** Number of comparable analogues available. */
  analogueCount: number;
  /** Comparability of those analogues, `0…1`. */
  analogueSufficiency: number;
  /** Data freshness and source coverage, `0…1`. */
  dataFreshness: number;
  /** Accuracy class; `order_of_magnitude` caps the score at 60. */
  accuracyClass?: AccuracyClass;
}

export interface ConfidenceWeights {
  brief: number;
  methods: number;
  analogues: number;
  data: number;
}

/** Weights from §9; they sum to `1` and are an explicit assumption. */
export const CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  brief: 0.3,
  methods: 0.3,
  analogues: 0.2,
  data: 0.2,
};

/** Score cap for the `order_of_magnitude` accuracy class (FR-1.6). */
export const ORDER_OF_MAGNITUDE_CAP = 60;

/** Thresholds for the `high` / `medium` levels. */
export const HIGH_THRESHOLD = 70;
export const MEDIUM_THRESHOLD = 40;

/** Number of analogues that makes the analogue component fully satisfied. */
const ANALOGUE_TARGET = 3;

/** Clamps a value into the closed interval `0…1`; `NaN` becomes `0`. */
function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** Clamps a raw method divergence into the `0…1` value the component needs. */
function methodsValue(divergence: number): number {
  return clamp01(1 - Math.min(1, divergence));
}

/** `min(1, count / 3) × sufficiency`, clamped to `0…1`. */
function analoguesValue(count: number, sufficiency: number): number {
  const volume = Math.min(1, Math.max(0, count) / ANALOGUE_TARGET);
  return clamp01(volume * sufficiency);
}

/**
 * Computes the confidence score and its component breakdown.
 *
 * The weight set sums to `1`, so `score = round(100 × Σ w·v)` stays within
 * `0…100`. With `accuracyClass: 'order_of_magnitude'` the score is capped at
 * {@link ORDER_OF_MAGNITUDE_CAP} and the level becomes `order_of_magnitude`
 * whenever the (capped) score does not reach `high`.
 */
export function confidence(input: ConfidenceInput): ConfidenceScore {
  const values = {
    brief: clamp01(input.briefCompleteness),
    methods: methodsValue(input.methodDivergence),
    analogues: analoguesValue(input.analogueCount, input.analogueSufficiency),
    data: clamp01(input.dataFreshness),
  } as const;

  const weighted =
    CONFIDENCE_WEIGHTS.brief * values.brief +
    CONFIDENCE_WEIGHTS.methods * values.methods +
    CONFIDENCE_WEIGHTS.analogues * values.analogues +
    CONFIDENCE_WEIGHTS.data * values.data;

  const isOrderOfMagnitude = input.accuracyClass === 'order_of_magnitude';
  let score = Math.round(100 * weighted);

  if (isOrderOfMagnitude) {
    score = Math.min(score, ORDER_OF_MAGNITUDE_CAP);
  }

  const level: ConfidenceScore['level'] =
    isOrderOfMagnitude && score <= ORDER_OF_MAGNITUDE_CAP
      ? 'order_of_magnitude'
      : score >= HIGH_THRESHOLD
        ? 'high'
        : score >= MEDIUM_THRESHOLD
          ? 'medium'
          : 'low';

  const components: ConfidenceScore['components'] = [
    { key: 'brief', weight: CONFIDENCE_WEIGHTS.brief, value: values.brief },
    { key: 'methods', weight: CONFIDENCE_WEIGHTS.methods, value: values.methods },
    { key: 'analogues', weight: CONFIDENCE_WEIGHTS.analogues, value: values.analogues },
    { key: 'data', weight: CONFIDENCE_WEIGHTS.data, value: values.data },
  ];

  return { score, level, components };
}
