import { describe, expect, it } from 'vitest';
import { EPSILON, makeLcg } from './invariants-helpers.js';
import { simulate } from './risk/monteCarlo.js';
import { schedule } from './schedule/schedule.js';
import { combineMethods } from './sizing/combine.js';

describe('invariant 3: quantile ordering', () => {
  it('seed 7 keeps P10 <= P50 <= P80 <= P90 for effort, cost and duration', () => {
    const result = simulate({
      effortHours: { p10: 800, p50: 930, p90: 1080 },
      costPerHour: { p10: 3000, p50: 3830, p90: 4500 },
      durationWeeks: { p10: 12, p50: 14, p90: 17 },
      seed: 7,
      n: 5_000,
    });

    for (const quantiles of [result.effortHours, result.costRub, result.durationWeeks]) {
      expect(quantiles.p10).toBeLessThanOrEqual(quantiles.p50);
      expect(quantiles.p50).toBeLessThanOrEqual(quantiles.p80);
      expect(quantiles.p80).toBeLessThanOrEqual(quantiles.p90);
    }
  });
});

describe('invariant 4: determinism', () => {
  it('two simulations with seed 42 are deeply equal', () => {
    const input = {
      effortHours: { p10: 800, p50: 930, p90: 1080 },
      costPerHour: { p10: 3000, p50: 3830, p90: 4500 },
      durationWeeks: { p10: 12, p50: 14, p90: 17 },
      seed: 42,
      n: 3_000,
    };

    expect(simulate(input)).toEqual(simulate(input));
  });
});

describe('invariant 7: schedule monotonicity', () => {
  it('doubling hours never reduces P50 weeks', () => {
    const team = [{ roleId: '1c_developer', grade: 'middle' as const, fte: 1 }];
    const base = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 560 }],
      byStage: [{ stage: 3, hours: 560 }],
      team,
      utilization: 0.7,
    });
    const doubled = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 1_120 }],
      byStage: [{ stage: 3, hours: 1_120 }],
      team,
      utilization: 0.7,
    });

    expect(doubled.duration.p50Weeks).toBeGreaterThanOrEqual(base.duration.p50Weeks);
  });
});

describe('invariant 8: method combination stays inside the inputs', () => {
  it('20 deterministic triples all combine into [min, max]', () => {
    const rng = makeLcg(2024);
    const draw = (): number => 1 + rng() * 4_999;

    for (let i = 0; i < 20; i += 1) {
      const a = draw();
      const b = draw();
      const c = draw();
      const result = combineMethods({ a, b, c });
      const min = Math.min(a, b, c);
      const max = Math.max(a, b, c);

      expect(result.effortHours).toBeGreaterThanOrEqual(min - EPSILON);
      expect(result.effortHours).toBeLessThanOrEqual(max + EPSILON);
    }
  });
});
