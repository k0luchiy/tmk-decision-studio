import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS, combineMethods } from './combine.js';

describe('combineMethods', () => {
  it('combines A/B/C with default weights and no warning when they agree', () => {
    const result = combineMethods({ a: 900, b: 850, c: 1000 });

    expect(DEFAULT_WEIGHTS).toEqual({ a: 0.5, b: 0.2, c: 0.3 });
    // 0.5·900 + 0.2·850 + 0.3·1000 = 450 + 170 + 300 = 920.
    expect(result.effortHours).toBeCloseTo(920, 10);
    expect(result.divergence).toBeCloseTo(1000 / 850 - 1, 10);
    expect(result.divergence).toBeCloseTo(0.176, 3);
    expect(result.warning).toBeUndefined();
  });

  it('warns when the methods diverge by more than 30 %', () => {
    const result = combineMethods({ a: 900, b: 300, c: 1000 });

    expect(result.divergence).toBeCloseTo(1000 / 300 - 1, 10);
    expect(result.divergence).toBeCloseTo(2.333, 3);
    expect(result.warning).toBeDefined();
    expect(result.warning?.code).toBe('method_divergence');
    expect(result.warning?.message).toContain('A=900');
    expect(result.warning?.message).toContain('B=300');
    expect(result.warning?.message).toContain('C=1000');
  });

  it('rejects weights that do not sum to 1', () => {
    expect(() => combineMethods({ a: 900, b: 850, c: 1000, weights: { a: 0.5, b: 0.2, c: 0.2 } })).toThrow(
      RangeError,
    );
  });

  it('reports infinite divergence and warns when the minimum is zero', () => {
    const result = combineMethods({ a: 900, b: 0, c: 1000 });

    expect(result.effortHours).toBeCloseTo(450 + 0 + 300, 10);
    expect(result.divergence).toBe(Infinity);
    expect(result.warning?.code).toBe('method_divergence');
  });

  it('rejects negative method values', () => {
    expect(() => combineMethods({ a: -1, b: 850, c: 1000 })).toThrow(RangeError);
  });
});
