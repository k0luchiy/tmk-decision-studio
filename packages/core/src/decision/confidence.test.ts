import { describe, expect, it } from 'vitest';
import { CONFIDENCE_WEIGHTS, confidence } from './confidence.js';
import type { ConfidenceInput } from './confidence.js';

/** Perfect brief, perfect method agreement, three comparable analogues, fresh data. */
const ideal: ConfidenceInput = {
  briefCompleteness: 1,
  methodDivergence: 0,
  analogueCount: 3,
  analogueSufficiency: 1,
  dataFreshness: 1,
};

/** Empty brief, maximum divergence, no analogues, stale data. */
const minimal: ConfidenceInput = {
  briefCompleteness: 0,
  methodDivergence: 1,
  analogueCount: 0,
  analogueSufficiency: 0,
  dataFreshness: 0,
};

/** D1-like input: solid but not perfect brief and data. */
const d1Like: ConfidenceInput = {
  briefCompleteness: 0.8,
  methodDivergence: 0.18,
  analogueCount: 4,
  analogueSufficiency: 0.8,
  dataFreshness: 0.7,
};

describe('confidence', () => {
  it('returns exactly four components whose weights sum to 1', () => {
    const result = confidence(ideal);

    expect(result.components).toHaveLength(4);
    expect(result.components.map((component) => component.key)).toEqual([
      'brief',
      'methods',
      'analogues',
      'data',
    ]);

    const totalWeight = result.components.reduce((sum, component) => sum + component.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 12);
    expect(CONFIDENCE_WEIGHTS.brief + CONFIDENCE_WEIGHTS.methods).toBeCloseTo(0.6, 12);
  });

  it('score 100 and high level for an ideal input', () => {
    const result = confidence(ideal);

    expect(result.score).toBe(100);
    expect(result.level).toBe('high');
    expect(result.components.every((component) => component.value === 1)).toBe(true);
  });

  it('scores the D1-like input at 79 (high)', () => {
    // 0.30·0.8 + 0.30·0.82 + 0.20·0.8 + 0.20·0.7 = 0.786 → 79.
    expect(confidence(d1Like).score).toBe(79);
    expect(confidence(d1Like).level).toBe('high');
  });

  it('scores a minimal input below 40 (low)', () => {
    const result = confidence(minimal);

    expect(result.score).toBeLessThan(40);
    expect(result.level).toBe('low');
  });

  it('caps the score at 60 for the order_of_magnitude accuracy class', () => {
    const result = confidence({ ...ideal, accuracyClass: 'order_of_magnitude' });

    expect(result.score).toBe(60);
    expect(result.level).toBe('order_of_magnitude');
  });

  it('clamps every component value into 0..1', () => {
    const result = confidence({
      briefCompleteness: 5,
      methodDivergence: -2,
      analogueCount: 100,
      analogueSufficiency: 3,
      dataFreshness: -1,
    });

    for (const component of result.components) {
      expect(component.value).toBeGreaterThanOrEqual(0);
      expect(component.value).toBeLessThanOrEqual(1);
    }
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
