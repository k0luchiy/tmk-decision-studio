/**
 * Method triangulation: combine the three sizing methods (A — bottom-up WBS,
 * B — parametric FP-lite, C — analogue) into one effort figure and expose how
 * far apart the methods are.
 *
 * The combination is a weighted mean with editable weights that must sum to 1.
 * Divergence is `max / min − 1`; when the spread exceeds the threshold the
 * result carries a `method_divergence` warning instead of silently averaging
 * the disagreement away (`docs/03_estimation_model.md` §3).
 */

import type { Warning } from '@app/contract';

/** Weights of the three sizing methods. Must sum to `1` (±1e-9). */
export interface MethodWeights {
  a: number;
  b: number;
  c: number;
}

/** Default triangulation weights from `docs/03_estimation_model.md` §3. */
export const DEFAULT_WEIGHTS: MethodWeights = { a: 0.5, b: 0.2, c: 0.3 };

/** Default relative spread above which a divergence warning is emitted (30 %). */
export const DEFAULT_DIVERGENCE_THRESHOLD = 0.3;

/** Tolerance for the weights-sum check, per the spec (`|Σw − 1| ≤ 1e-9`). */
const WEIGHT_SUM_TOLERANCE = 1e-9;

export interface CombineMethodsInput {
  /** Effort from method A (bottom-up WBS), person-hours. */
  a: number;
  /** Effort from method B (parametric FP-lite), person-hours. */
  b: number;
  /** Effort from method C (analogue), person-hours. */
  c: number;
  /** Override for {@link DEFAULT_WEIGHTS}. */
  weights?: MethodWeights;
  /** Override for {@link DEFAULT_DIVERGENCE_THRESHOLD}. */
  divergenceThreshold?: number;
}

export interface CombineMethodsResult {
  /** Weighted effort in person-hours: `a·w.a + b·w.b + c·w.c`. */
  effortHours: number;
  /** Relative spread `max / min − 1`; `Infinity` when `min === 0`. */
  divergence: number;
  /** Present only when `divergence > threshold`. */
  warning?: Warning;
}

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, got ${value}`);
  }
}

function assertWeights(weights: MethodWeights): void {
  assertFiniteNonNegative('weights.a', weights.a);
  assertFiniteNonNegative('weights.b', weights.b);
  assertFiniteNonNegative('weights.c', weights.c);

  const sum = weights.a + weights.b + weights.c;
  if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new RangeError(`Method weights must sum to 1 (±1e-9), got ${sum}`);
  }
}

/** Formats a percentage for the warning message (one decimal, no trailing `.0`). */
function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Combines the three sizing methods and reports their divergence.
 *
 * @throws {RangeError} when any method value, weight or threshold is not a
 * finite number `>= 0`, or when the weights do not sum to `1` (±1e-9).
 */
export function combineMethods(input: CombineMethodsInput): CombineMethodsResult {
  const { a, b, c } = input;
  const weights = input.weights ?? DEFAULT_WEIGHTS;
  const threshold = input.divergenceThreshold ?? DEFAULT_DIVERGENCE_THRESHOLD;

  assertFiniteNonNegative('a', a);
  assertFiniteNonNegative('b', b);
  assertFiniteNonNegative('c', c);
  assertWeights(weights);
  assertFiniteNonNegative('divergenceThreshold', threshold);

  const effortHours = a * weights.a + b * weights.b + c * weights.c;

  const max = Math.max(a, b, c);
  const min = Math.min(a, b, c);
  const divergence = min === 0 ? Infinity : max / min - 1;

  const result: CombineMethodsResult = { effortHours, divergence };

  if (divergence > threshold) {
    result.warning = {
      code: 'method_divergence',
      severity: 'warning',
      message: `Методы расходятся на ${formatPercent(divergence * 100)}% (A=${a}, B=${b}, C=${c})`,
    };
  }

  return result;
}
