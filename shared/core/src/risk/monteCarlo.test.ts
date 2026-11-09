import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CORRELATION,
  DEFAULT_ITERATIONS,
  type MonteCarloInput,
  type Quantiles,
  simulate,
} from './monteCarlo.js';
import { mulberry32, normalPair } from './prng.js';

/** D1 fixture: integration, ~930 h, middle in-house rate, 12–17 weeks. */
function d1Input(overrides: Partial<MonteCarloInput> = {}): MonteCarloInput {
  return {
    effortHours: { p10: 800, p50: 930, p90: 1080 },
    costPerHour: { p10: 3000, p50: 3830, p90: 4500 },
    durationWeeks: { p10: 12, p50: 14, p90: 17 },
    correlation: 0.5,
    n: 10_000,
    seed: 42,
    ...overrides,
  };
}

function expectOrdered(quantiles: Quantiles): void {
  expect(quantiles.p10).toBeLessThanOrEqual(quantiles.p50);
  expect(quantiles.p50).toBeLessThanOrEqual(quantiles.p80);
  expect(quantiles.p80).toBeLessThanOrEqual(quantiles.p90);
}

describe('mulberry32', () => {
  it('replays the same sequence for the same seed', () => {
    const first = mulberry32(42);
    const second = mulberry32(42);
    for (let i = 0; i < 1_000; i += 1) {
      expect(first()).toBe(second());
    }
  });

  it('produces different sequences for different seeds', () => {
    expect(mulberry32(42)()).not.toBe(mulberry32(43)());
  });
});

describe('normalPair', () => {
  it('returns two finite standard normal deviates', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i += 1) {
      const [a, b] = normalPair(rng);
      expect(Number.isFinite(a)).toBe(true);
      expect(Number.isFinite(b)).toBe(true);
    }
  });
});

describe('simulate', () => {
  it('is byte-identical across two runs with the same seed', () => {
    expect(simulate(d1Input())).toEqual(simulate(d1Input()));
  });

  it('keeps P10 <= P50 <= P80 <= P90 for every output', () => {
    const result = simulate(d1Input());
    expectOrdered(result.effortHours);
    expectOrdered(result.costRub);
    expectOrdered(result.durationWeeks);
  });

  it('widens the cost band as correlation grows from 0 to 0.9', () => {
    // The shared factor ties effort and rate together, so the cost
    // distribution (effort × rate) spreads out as ρ rises. The effort and rate
    // marginals are variance-preserving under the copula by construction; the
    // extra risk shows up in the correlated product that drives the reserve.
    const independent = simulate(d1Input({ correlation: 0 }));
    const correlated = simulate(d1Input({ correlation: 0.9 }));

    const independentWidth = independent.costRub.p80 - independent.costRub.p50;
    const correlatedWidth = correlated.costRub.p80 - correlated.costRub.p50;

    expect(correlatedWidth).toBeGreaterThan(independentWidth);
  });

  it('completes 10 000 iterations in under two seconds', () => {
    const started = performance.now();
    const result = simulate(d1Input({ n: 10_000 }));
    const elapsed = performance.now() - started;

    expect(result.iterations).toBe(10_000);
    expect(elapsed).toBeLessThan(2_000);
  });

  it('throws a TypeError when the seed is missing', () => {
    const withoutSeed = {
      effortHours: { p10: 800, p50: 930, p90: 1080 },
      costPerHour: { p10: 3000, p50: 3830, p90: 4500 },
      durationWeeks: { p10: 12, p50: 14, p90: 17 },
    } as unknown as MonteCarloInput;

    expect(() => simulate(withoutSeed)).toThrow(TypeError);
    expect(() => simulate(withoutSeed)).toThrow('seed is required');
  });

  it('does not crash with a single iteration', () => {
    const result = simulate(d1Input({ n: 1 }));

    expect(result.iterations).toBe(1);
    expect(Number.isFinite(result.effortHours.p50)).toBe(true);
    expectOrdered(result.effortHours);
  });

  it('defaults to 10 000 iterations', () => {
    const result = simulate({ ...d1Input(), n: undefined });
    expect(result.iterations).toBe(DEFAULT_ITERATIONS);
  });

  it('defaults the correlation to 0.5', () => {
    const withDefault = simulate({ ...d1Input(), correlation: undefined });
    const explicit = simulate(d1Input({ correlation: DEFAULT_CORRELATION }));
    expect(withDefault).toEqual(explicit);
  });

  it('reports the iterations and seed it ran with', () => {
    const result = simulate(d1Input({ seed: 123, n: 5_000 }));
    expect(result.seed).toBe(123);
    expect(result.iterations).toBe(5_000);
  });
});
