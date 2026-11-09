/**
 * Deterministic Monte Carlo for effort, cost and duration
 * (`docs/03_estimation_model.md` §8, `research/05_methodology_estimation.md`
 * §3.2).
 *
 * Each uncertain quantity is reconstructed as a lognormal from its P10/P90 pair:
 *
 *   mu    = (ln p10 + ln p90) / 2
 *   sigma = (ln p90 − ln p10) / (2 · 1.2816)
 *   value = exp(mu + sigma · z)
 *
 * The deviate `z` comes from a one-factor Gaussian copula. A shared factor `zg`
 * is drawn once per iteration and links effort, rate and duration, while `zi` is
 * the quantity-specific deviate:
 *
 *   z' = ρ · zg + √(1 − ρ²) · zi
 *
 * Because `cost = effort × rate`, a shared shock pushes both the effort and the
 * hourly rate in the same direction, which widens the cost distribution as `ρ`
 * grows. Everything is drawn from a seeded `mulberry32` PRNG, so two runs with
 * the same seed produce byte-identical output.
 */

import { mulberry32, normalPair } from './prng.js';

/** Default number of Monte Carlo iterations. */
export const DEFAULT_ITERATIONS = 10_000;
/** Default one-factor copula correlation `ρ`. */
export const DEFAULT_CORRELATION = 0.5;
/** `z` such that `Φ(1.2816) ≈ 0.90` — the P10/P90 normal quantile. */
const Z90 = 1.2816;

/** A three-point estimate of one uncertain quantity. */
export interface EstimateRange {
  p10: number;
  p50: number;
  p90: number;
}

/** P10/P50/P80/P90 quantiles of a simulated quantity. */
export interface Quantiles {
  p10: number;
  p50: number;
  p80: number;
  p90: number;
}

/** Inputs of a Monte Carlo run. `seed` is mandatory for reproducibility. */
export interface MonteCarloInput {
  effortHours: EstimateRange;
  costPerHour: EstimateRange;
  durationWeeks: EstimateRange;
  /** One-factor copula correlation `ρ` in `[0, 1]`. Defaults to `0.5`. */
  correlation?: number;
  /** Iteration count. Defaults to `10_000`; recommended range `1e3..1e5`. */
  n?: number;
  /** PRNG seed. Required — no clock or `Math.random()` fallback exists. */
  seed: number;
}

/** Simulated quantiles plus the parameters that produced them. */
export interface MonteCarloResult {
  effortHours: Quantiles;
  costRub: Quantiles;
  durationWeeks: Quantiles;
  iterations: number;
  seed: number;
}

interface LognormalParams {
  mu: number;
  sigma: number;
}

function lognormalParams(range: EstimateRange): LognormalParams {
  const { p10, p90 } = range;
  if (!Number.isFinite(p10) || !Number.isFinite(p90) || p10 <= 0 || p90 <= 0) {
    throw new RangeError('p10 and p90 must be finite and positive');
  }
  return {
    mu: (Math.log(p10) + Math.log(p90)) / 2,
    sigma: (Math.log(p90) - Math.log(p10)) / (2 * Z90),
  };
}

/** Nearest-rank percentile of an already sorted array. */
function nearestRank(sorted: number[], percentile: number): number {
  const n = sorted.length;
  if (n === 0) {
    return Number.NaN;
  }
  const rank = Math.ceil((percentile / 100) * n);
  const index = Math.min(Math.max(rank - 1, 0), n - 1);
  const value = sorted[index];
  return value === undefined ? Number.NaN : value;
}

function quantilesOf(values: number[]): Quantiles {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p10: nearestRank(sorted, 10),
    p50: nearestRank(sorted, 50),
    p80: nearestRank(sorted, 80),
    p90: nearestRank(sorted, 90),
  };
}

/**
 * Simulates the joint distribution of effort, cost and duration.
 *
 * - Effort, hourly rate and duration are lognormal marginals built from their
 *   P10/P90 bounds.
 * - A one-factor Gaussian copula with correlation `ρ` (`correlation`, default
 *   `0.5`) ties the three series to a shared factor.
 * - `costRub = effortHours × costPerHour` per iteration.
 * - `n` defaults to `10_000`; `n = 1` is accepted (all quantiles collapse to the
 *   single sample).
 *
 * @throws {TypeError} when `seed` is missing — a run must be reproducible.
 * @throws {RangeError} when `n` is not a positive integer, `correlation` is
 *   outside `[0, 1]`, or a P10/P90 bound is not finite and positive.
 */
export function simulate(input: MonteCarloInput): MonteCarloResult {
  const seed = input.seed as number | undefined;
  if (typeof seed !== 'number') {
    throw new TypeError('seed is required');
  }

  const iterations = input.n ?? DEFAULT_ITERATIONS;
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new RangeError('n must be a positive integer');
  }

  const correlation = input.correlation ?? DEFAULT_CORRELATION;
  if (!Number.isFinite(correlation) || correlation < 0 || correlation > 1) {
    throw new RangeError('correlation must be within [0, 1]');
  }

  const effort = lognormalParams(input.effortHours);
  const rate = lognormalParams(input.costPerHour);
  const duration = lognormalParams(input.durationWeeks);

  const independent = Math.sqrt(1 - correlation * correlation);
  const rng = mulberry32(seed);

  const effortSamples = new Array<number>(iterations);
  const costSamples = new Array<number>(iterations);
  const durationSamples = new Array<number>(iterations);

  for (let i = 0; i < iterations; i += 1) {
    const [shared, effortDeviate] = normalPair(rng);
    const [rateDeviate, durationDeviate] = normalPair(rng);

    const effortValue = Math.exp(
      effort.mu + effort.sigma * (correlation * shared + independent * effortDeviate),
    );
    const rateValue = Math.exp(
      rate.mu + rate.sigma * (correlation * shared + independent * rateDeviate),
    );
    const durationValue = Math.exp(
      duration.mu + duration.sigma * (correlation * shared + independent * durationDeviate),
    );

    effortSamples[i] = effortValue;
    costSamples[i] = effortValue * rateValue;
    durationSamples[i] = durationValue;
  }

  return {
    effortHours: quantilesOf(effortSamples),
    costRub: quantilesOf(costSamples),
    durationWeeks: quantilesOf(durationSamples),
    iterations,
    seed,
  };
}
