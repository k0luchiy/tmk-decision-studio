/**
 * Cost simulation for one scenario: `simulate` supplies the distribution shape,
 * the scale pins P50 to the deterministic line sum, and the histogram keeps the
 * same scale so the UI can draw the real Monte-Carlo spread.
 */

import type { Duration, EffortGrid } from '@app/contract';
import {
  simulate,
  type HistogramBin,
  type Quantiles,
} from '../risk/monteCarlo.js';
import { SIMULATION_CORRELATION, SIMULATION_ITERATIONS } from './types.js';

/** Quantiles plus the histogram of the simulated cost. */
export interface SimulatedCost extends Quantiles {
  histogram: HistogramBin[];
}

function degenerateCost(value: number): SimulatedCost {
  const histogram = Array.from({ length: 11 }, (_unused, index) => ({
    low: value,
    high: value,
    count: index === 5 ? SIMULATION_ITERATIONS : 0,
  }));
  return { p10: value, p50: value, p80: value, p90: value, histogram };
}

export function simulateCost(
  implementationRub: number,
  totalHours: number,
  grid: EffortGrid,
  duration: Duration,
  seed: number,
  salt: number,
): SimulatedCost {
  if (implementationRub <= 0 || totalHours <= 0) {
    return degenerateCost(implementationRub);
  }

  const rate = implementationRub / totalHours;
  const p50Hours = Math.max(1e-6, grid.p50Hours);
  const p10Hours = grid.p10Hours > 0 ? grid.p10Hours : p50Hours * 0.6;
  const p90Hours = Math.max(grid.p90Hours, p50Hours);
  const p10Weeks = Math.max(1e-6, duration.p10Weeks);
  const p50Weeks = Math.max(p10Weeks, duration.p50Weeks);
  const p90Weeks = Math.max(p50Weeks, duration.p90Weeks);

  const result = simulate({
    effortHours: { p10: p10Hours, p50: p50Hours, p90: p90Hours },
    costPerHour: { p10: rate * 0.85, p50: rate, p90: rate * 1.15 },
    durationWeeks: { p10: p10Weeks, p50: p50Weeks, p90: p90Weeks },
    correlation: SIMULATION_CORRELATION,
    n: SIMULATION_ITERATIONS,
    seed: seed + salt,
  });

  const simulatedP50 = result.costRub.p50;
  const scale = simulatedP50 > 0 ? implementationRub / simulatedP50 : 1;

  return {
    p10: result.costRub.p10 * scale,
    p50: implementationRub,
    p80: result.costRub.p80 * scale,
    p90: result.costRub.p90 * scale,
    histogram: result.histogram.map((bin) => ({
      low: bin.low * scale,
      high: bin.high * scale,
      count: bin.count,
    })),
  };
}
