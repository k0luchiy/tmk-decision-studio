import { describe, expect, it } from 'vitest';
import { DEFAULT_PDR_HOURS_PER_FP, FP_WEIGHTS, PDR_BY_PLATFORM, fpLite } from './fpLite.js';

describe('fpLite', () => {
  it('sums weighted function points from the Moscow-2018 weights', () => {
    const result = fpLite({
      counts: { ilf: 2, eif: 1, ei: 5, eo: 3, eq: 2 },
    });

    expect(FP_WEIGHTS).toEqual({ ilf: 11, eif: 8, ei: 5, eo: 5, eq: 4 });
    expect(result.fp).toBe(2 * 11 + 1 * 8 + 5 * 5 + 3 * 5 + 2 * 4);
    expect(result.fp).toBe(78);
    expect(result.pdrHoursPerFp).toBe(DEFAULT_PDR_HOURS_PER_FP);
    expect(result.effortHours).toBe(78 * DEFAULT_PDR_HOURS_PER_FP);
    expect(result.sourceRefs).toEqual(['rule:fp_weights_moscow2018', 'benchmark:isbsg_pdr']);
  });

  it('uses platform PDR and makes low-code cheaper than traditional', () => {
    const counts = { ilf: 2, eif: 1, ei: 5, eo: 3, eq: 2 };
    const traditional = fpLite({ counts, platform: 'traditional' });
    const lowcode = fpLite({ counts, platform: 'lowcode' });

    expect(PDR_BY_PLATFORM.lowcode).toBe(1.8);
    expect(lowcode.pdrHoursPerFp).toBe(1.8);
    expect(lowcode.effortHours).toBeLessThan(traditional.effortHours);
  });

  it('falls back to the default PDR for an unknown platform', () => {
    const counts = { ei: 1 };
    const unknown = fpLite({ counts, platform: 'unknown-platform' });
    const explicit = fpLite({ counts, platform: 'unknown-platform', pdrHoursPerFp: 2 });

    expect(unknown.pdrHoursPerFp).toBe(DEFAULT_PDR_HOURS_PER_FP);
    expect(explicit.pdrHoursPerFp).toBe(2);
    expect(explicit.effortHours).toBe(2 * FP_WEIGHTS.ei);
  });
});
