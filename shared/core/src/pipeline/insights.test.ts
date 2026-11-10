import { describe, expect, it } from 'vitest';
import type { CostLine } from '@app/contract';
import { buildDistribution, buildSensitivity, winnerKey } from './insights.js';
import { EXTRAS_DELTA, RESERVE_DELTA, SENSITIVITY_DELTA } from './insights.js';

function line(
  group: CostLine['group'],
  label: string,
  valueRub: number,
): CostLine {
  return { id: `${group}:${label}`, group, label, formula: 'test', inputRefs: [], valueRub, status: 'assumption' };
}

const P50 = 1_000_000;

const FULL_LINES: CostLine[] = [
  line('labor', 'Труд', 400_000),
  line('coordination', 'Координация', 100_000),
  line('risk', 'Риск-премия', 50_000),
  line('extra', 'Лицензии', 100_000),
  line('hiring', 'Найм', 50_000),
  line('rampup', 'Ramp-up', 20_000),
  line('bench', 'Bench', 30_000),
  line('turnover', 'Текучесть', 10_000),
  line('risk', 'Резерв (12%)', 40_000),
];

describe('buildSensitivity', () => {
  it('returns the five tornado factors sorted by absolute swing', () => {
    const factors = buildSensitivity(FULL_LINES, P50);

    expect(factors).toHaveLength(5);
    expect(new Set(factors.map((factor) => factor.name))).toEqual(
      new Set(['Труд', 'Подрядчик и координация', 'Дополнительные статьи', 'Найм и простой', 'Резерв']),
    );
    const swings = factors.map((factor) => factor.highValue - factor.lowValue);
    for (let index = 1; index < swings.length; index += 1) {
      expect(swings[index - 1]).toBeGreaterThanOrEqual(swings[index] ?? 0);
    }
  });

  it('keeps low <= 0 <= high and lowValue <= P50 <= highValue', () => {
    for (const factor of buildSensitivity(FULL_LINES, P50)) {
      expect(factor.low).toBeLessThanOrEqual(0);
      expect(factor.high).toBeGreaterThanOrEqual(0);
      expect(factor.lowValue).toBeLessThanOrEqual(P50);
      expect(factor.highValue).toBeGreaterThanOrEqual(P50);
      expect(factor.low).toBeCloseTo(-factor.high, 12);
    }
  });

  it('applies the extras and reserve policy deltas', () => {
    const factors = buildSensitivity(FULL_LINES, P50);
    const extras = factors.find((factor) => factor.name === 'Дополнительные статьи');
    const reserve = factors.find((factor) => factor.name === 'Резерв');
    const labor = factors.find((factor) => factor.name === 'Труд');

    expect(labor?.high).toBeCloseTo((400_000 / P50) * SENSITIVITY_DELTA, 12);
    expect(extras?.high).toBeCloseTo((100_000 / P50) * EXTRAS_DELTA, 12);
    expect(reserve?.high).toBeCloseTo((40_000 / P50) * RESERVE_DELTA, 12);
  });

  it('keeps five factors with zero swing for absent groups', () => {
    const factors = buildSensitivity([line('labor', 'Труд', 10_000)], P50);

    expect(factors).toHaveLength(5);
    const nonzero = factors.filter((factor) => factor.high > 0);
    expect(nonzero).toHaveLength(1);
    expect(nonzero[0]?.name).toBe('Труд');
    expect(buildSensitivity(FULL_LINES, 0)).toEqual([]);
  });
});

describe('buildDistribution', () => {
  it('maps histogram bins to centres, million labels and counts', () => {
    const histogram = [
      { low: 1_000_000, high: 1_200_000, count: 3 },
      { low: 1_200_000, high: 1_400_000, count: 7 },
    ];
    const distribution = buildDistribution(histogram);

    expect(distribution).toEqual([
      { value: 1_100_000, label: '1,1', count: 3 },
      { value: 1_300_000, label: '1,3', count: 7 },
    ]);
  });
});

describe('winnerKey', () => {
  it('maps parity to hybrid', () => {
    expect(winnerKey('inhouse')).toBe('inhouse');
    expect(winnerKey('contractor')).toBe('contractor');
    expect(winnerKey('hybrid')).toBe('hybrid');
    expect(winnerKey('parity')).toBe('hybrid');
  });
});
