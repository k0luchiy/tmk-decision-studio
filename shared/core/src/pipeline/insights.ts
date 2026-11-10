/**
 * Tornado sensitivity and cost histogram exposed to the API/UI
 * (`docs/03_estimation_model.md` §8, FR-5.4).
 */

import type { CostLine, Verdict } from '@app/contract';
import type { HistogramBin } from '../risk/monteCarlo.js';
import type { DistributionBin, SensitivityFactor } from './types.js';

/** Winning scenario key; `parity` falls back to the hybrid scenario. */
export function winnerKey(code: Verdict['code']): 'inhouse' | 'contractor' | 'hybrid' {
  if (code === 'inhouse') return 'inhouse';
  if (code === 'contractor') return 'contractor';
  return 'hybrid';
}

/** Default relative swing applied to a cost group for the tornado. */
export const SENSITIVITY_DELTA = 0.15;
/** Extras are less certain than labour, so they swing wider. */
export const EXTRAS_DELTA = 0.2;
/** The reserve is a policy knob, not a price, and swings the most. */
export const RESERVE_DELTA = 0.5;
/** Reserve lines are labelled `Резерв (N%)` inside the `risk` group. */
const RESERVE_PREFIX = 'Резерв';

interface FactorSpec {
  name: string;
  delta: number;
  match: (line: CostLine) => boolean;
}

function isReserve(line: CostLine): boolean {
  return line.group === 'risk' && line.label.startsWith(RESERVE_PREFIX);
}

const FACTOR_SPECS: readonly FactorSpec[] = [
  { name: 'Труд', delta: SENSITIVITY_DELTA, match: (line) => line.group === 'labor' },
  {
    name: 'Подрядчик и координация',
    delta: SENSITIVITY_DELTA,
    match: (line) => (line.group === 'coordination' || line.group === 'risk') && !isReserve(line),
  },
  { name: 'Дополнительные статьи', delta: EXTRAS_DELTA, match: (line) => line.group === 'extra' },
  {
    name: 'Найм и простой',
    delta: SENSITIVITY_DELTA,
    match: (line) =>
      line.group === 'hiring' ||
      line.group === 'rampup' ||
      line.group === 'bench' ||
      line.group === 'turnover',
  },
  { name: 'Резерв', delta: RESERVE_DELTA, match: isReserve },
];

/**
 * Tornado factors for one scenario: each present cost group moves the P50 by
 * `±delta × groupShare`. Missing groups are skipped; the list is sorted by the
 * absolute swing, widest first.
 */
export function buildSensitivity(
  lines: readonly CostLine[],
  p50: number,
): SensitivityFactor[] {
  if (!(p50 > 0)) {
    return [];
  }
  const factors: SensitivityFactor[] = [];
  for (const spec of FACTOR_SPECS) {
    const groupTotal = lines.reduce(
      (sum, line) => (spec.match(line) ? sum + line.valueRub : sum),
      0,
    );
    if (!(groupTotal > 0)) {
      continue;
    }
    const share = groupTotal / p50;
    const low = -share * spec.delta;
    const high = share * spec.delta;
    factors.push({
      name: spec.name,
      low,
      high,
      lowValue: p50 * (1 + low),
      highValue: p50 * (1 + high),
    });
  }
  return factors.sort((a, b) => b.highValue - b.lowValue - (a.highValue - a.lowValue));
}

/** Turns histogram bins into chart points: bin centres with million-RUB labels. */
export function buildDistribution(histogram: readonly HistogramBin[]): DistributionBin[] {
  return histogram.map((bin) => {
    const value = (bin.low + bin.high) / 2;
    return {
      value,
      label: (value / 1_000_000).toFixed(1).replace('.', ','),
      count: bin.count,
    };
  });
}
