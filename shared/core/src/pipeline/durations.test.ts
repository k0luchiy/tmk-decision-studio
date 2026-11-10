import type { Duration } from '@app/contract';
import { describe, expect, it } from 'vitest';
import { scenarioDurations } from './durations.js';

const base: Duration = {
  p10Weeks: 2,
  p50Weeks: 3,
  p80Weeks: 4,
  p90Weeks: 5,
  criticalPath: ['stage:1', 'stage:2'],
};

describe('scenarioDurations calendar layer', () => {
  it('keeps small projects at a realistic minimum', () => {
    const durations = scenarioDurations(base, false, 'chatbot');
    expect(durations.inhouse.p50Weeks).toBeGreaterThanOrEqual(3);
    expect(durations.inhouse.p10Weeks).toBeLessThanOrEqual(durations.inhouse.p50Weeks);
  });

  it('adds pilot and calendar floor for MES', () => {
    const durations = scenarioDurations(base, false, 'mes');
    expect(durations.inhouse.p50Weeks).toBeGreaterThanOrEqual(24);
  });

  it('uses the support contract term instead of a project-only duration', () => {
    const durations = scenarioDurations(base, false, 'support');
    expect(durations.inhouse.p50Weeks).toBeGreaterThanOrEqual(52);
  });
});
