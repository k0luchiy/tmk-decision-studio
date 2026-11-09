import { beforeAll, describe, expect, it } from 'vitest';
import { loadDatasets } from '@app/data';
import type { RateCardsFile } from '@app/data';
import { MissingRateError, costInhouse } from './inhouse.js';

let rateCards: RateCardsFile['roles'];
let oneCMiddle: { fully_loaded_hour: number; fully_loaded_month: number };

beforeAll(async () => {
  const datasets = await loadDatasets();
  rateCards = datasets.rateCards.roles;
  const role = rateCards.find((card) => card.role_id === '1c_developer');
  const grade = role?.grades.find((row) => row.grade === 'middle');
  if (!grade) {
    throw new Error('1c_developer/middle is missing from rate_cards.json');
  }
  oneCMiddle = {
    fully_loaded_hour: grade.fully_loaded_hour,
    fully_loaded_month: grade.fully_loaded_month,
  };
});

describe('costInhouse', () => {
  it('D1: prices 930 h of 1C middle at the file rate and marks it fact', () => {
    const lines = costInhouse({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      rateCards,
    });

    const labor = lines.filter((line) => line.group === 'labor');
    expect(labor).toHaveLength(1);

    const [line] = labor;
    expect(line?.id).toBe('labor:1c_developer:middle');
    expect(line?.valueRub).toBe(930 * oneCMiddle.fully_loaded_hour);
    expect(line?.valueRub).toBe(2_927_640);
    expect(line?.status).toBe('fact');
    expect(line?.sourceId).toBe('rate_cards:1c_developer:middle');
    expect(line?.formula).toBe(`930 h × ${oneCMiddle.fully_loaded_hour} ₽/ч`);
    expect(line?.inputRefs).toContain('rate_cards:1c_developer:middle');

    const total = lines.reduce((sum, item) => sum + item.valueRub, 0);
    expect(total).toBeGreaterThan(0);
  });

  it('adds hiring, ramp-up, bench and turnover lines as assumptions', () => {
    const lines = costInhouse({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      rateCards,
      opts: {
        hiring: { roleId: '1c_developer', grade: 'middle' },
        utilization: 0.7,
        turnoverRate: 0.13,
      },
    });

    const groups = new Set(lines.map((line) => line.group));
    expect(groups.has('hiring')).toBe(true);
    expect(groups.has('rampup')).toBe(true);
    expect(groups.has('bench')).toBe(true);
    expect(groups.has('turnover')).toBe(true);

    for (const group of ['hiring', 'rampup', 'bench', 'turnover'] as const) {
      const line = lines.find((item) => item.group === group);
      expect(line).toBeDefined();
      expect(line?.status).toBe('assumption');
      expect(line?.sourceId).toBeTruthy();
      expect(line?.valueRub).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(line?.valueRub)).toBe(true);
    }

    const hiring = lines.find((line) => line.group === 'hiring');
    expect(hiring?.valueRub).toBe(1.5 * oneCMiddle.fully_loaded_month);
  });

  it('raises MissingRateError with role and grade for an unknown role', () => {
    let caught: unknown;
    try {
      costInhouse({
        effortByRole: [{ roleId: 'no_such_role', grade: 'middle', hours: 10 }],
        rateCards,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(MissingRateError);
    const error = caught as MissingRateError;
    expect(error.code).toBe('MISSING_RATE');
    expect(error.roleId).toBe('no_such_role');
    expect(error.grade).toBe('middle');
  });

  it('rejects a non-positive project duration with RangeError', () => {
    expect(() =>
      costInhouse({
        effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
        rateCards,
        opts: { months: 0 },
      }),
    ).toThrow(RangeError);
  });
});
