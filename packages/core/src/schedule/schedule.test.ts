import { DurationSchema } from '@app/contract';
import { describe, expect, it } from 'vitest';
import {
  RU_HOLIDAYS_2026_2027,
  addWorkingDays,
  isWorkingDay,
  workingDaysBetween,
} from './calendar.js';
import { HOURS_PER_WEEK_PER_FTE, schedule } from './schedule.js';
import type { ScheduleInput } from './schedule.js';

/** Parses an ISO date at UTC midnight, matching the calendar's convention. */
function day(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const D1_STAGE_HOURS = [
  { stage: 1, hours: 77 },
  { stage: 2, hours: 92.4 },
  { stage: 3, hours: 346.5 },
  { stage: 4, hours: 115.5 },
  { stage: 5, hours: 77 },
  { stage: 6, hours: 61.6 },
];

const TEAM_2_7_FTE = [
  { roleId: '1c_developer', grade: 'middle' as const, fte: 1 },
  { roleId: 'qa_auto', grade: 'middle' as const, fte: 1 },
  { roleId: 'architect', grade: 'senior' as const, fte: 0.7 },
];

function d1Input(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 770 }],
    byStage: D1_STAGE_HOURS,
    team: TEAM_2_7_FTE,
    utilization: 0.7,
    ...overrides,
  };
}

describe('RU_HOLIDAYS_2026_2027', () => {
  it('contains at least 20 official dates including weekend transfers', () => {
    expect(RU_HOLIDAYS_2026_2027.length).toBeGreaterThanOrEqual(20);
    expect(RU_HOLIDAYS_2026_2027).toEqual([...RU_HOLIDAYS_2026_2027].sort());
    expect(RU_HOLIDAYS_2026_2027).toEqual(
      expect.arrayContaining([
        '2026-01-09', // перенос с 3 января (№ 1466)
        '2026-12-31', // перенос с 4 января (№ 1466)
        '2027-02-22', // перенос с 20 февраля (№ 1187)
        '2027-11-05', // перенос с 2 января (№ 1187)
        '2027-12-31', // перенос с 3 января (№ 1187)
      ]),
    );
  });
});

describe('isWorkingDay', () => {
  it('rejects weekends and holidays, accepts a normal weekday', () => {
    expect(isWorkingDay(day('2026-11-10'))).toBe(true); // Tuesday
    expect(isWorkingDay(day('2026-11-07'))).toBe(false); // Saturday
    expect(isWorkingDay(day('2026-11-04'))).toBe(false); // День народного единства
    expect(isWorkingDay(day('2027-02-22'))).toBe(false); // перенос с 20 февраля
  });
});

describe('addWorkingDays', () => {
  it('skips the weekend after Friday', () => {
    expect(iso(addWorkingDays(day('2026-11-06'), 1))).toBe('2026-11-09');
  });

  it('skips the New Year holidays and transfers', () => {
    expect(iso(addWorkingDays(day('2026-12-30'), 1))).toBe('2027-01-11');
    expect(iso(addWorkingDays(day('2026-12-30'), 2))).toBe('2027-01-12');
  });

  it('skips the February 2027 transfer days', () => {
    expect(iso(addWorkingDays(day('2027-02-19'), 1))).toBe('2027-02-24');
  });

  it('returns the normalised start for zero days and walks backwards', () => {
    expect(iso(addWorkingDays(day('2026-11-10'), 0))).toBe('2026-11-10');
    expect(iso(addWorkingDays(day('2026-11-09'), -1))).toBe('2026-11-06');
  });
});

describe('workingDaysBetween', () => {
  it('excludes holidays from the count', () => {
    // With only the two statutory days (1 and 7 January) treated as holidays,
    // the 1–10 January 2027 span has four working days: 4, 5, 6 and 8 January.
    expect(
      workingDaysBetween(day('2027-01-01'), day('2027-01-10'), ['2027-01-01', '2027-01-07']),
    ).toBe(4);

    // On the full official calendar the whole span is the New Year vacation.
    expect(workingDaysBetween(day('2027-01-01'), day('2027-01-10'))).toBe(0);
  });

  it('never returns a negative value', () => {
    expect(workingDaysBetween(day('2027-01-10'), day('2027-01-01'))).toBe(0);
    expect(workingDaysBetween(new Date('invalid'), day('2027-01-01'))).toBe(0);
  });
});

describe('schedule', () => {
  it('D1 effort of 770 h over 2.7 FTE at u = 0.7 lands in the 12–17 week band', () => {
    const result = schedule(d1Input());

    expect(HOURS_PER_WEEK_PER_FTE).toBeCloseTo(27.6923, 4);
    expect(result.duration.p50Weeks).toBeGreaterThanOrEqual(12);
    expect(result.duration.p50Weeks).toBeLessThanOrEqual(17);
    // 770 / (2.7 × 27.6923 × 0.7) = 14.71 → 15 weeks.
    expect(result.duration.p50Weeks).toBe(15);
    expect(result.effortMultiplier).toBe(1);
    expect(result.warning).toBeUndefined();
    expect(result.duration.criticalPath).toEqual([
      'stage:1',
      'stage:2',
      'stage:3',
      'stage:4',
      'stage:5',
      'stage:6',
    ]);
    expect(() => DurationSchema.parse(result.duration)).not.toThrow();
    expect(result.startDate).toBe('2026-11-10');
  });

  it('keeps p10 <= p50 <= p80 <= p90', () => {
    const { duration } = schedule(d1Input({ sigmaHours: 90 }));

    expect(duration.p10Weeks).toBeLessThanOrEqual(duration.p50Weeks);
    expect(duration.p50Weeks).toBeLessThanOrEqual(duration.p80Weeks);
    expect(duration.p80Weeks).toBeLessThanOrEqual(duration.p90Weeks);
    expect(() => DurationSchema.parse(duration)).not.toThrow();
  });

  it('compresses to 11 weeks from a 14-week P50 with a Putnam multiplier and warning', () => {
    const result = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 730 }],
      byStage: [{ stage: 3, hours: 730 }],
      team: TEAM_2_7_FTE,
      utilization: 0.7,
      targetWeeks: 11,
    });

    // 730 / 52.338 = 13.95 → 14 weeks.
    expect(result.duration.p50Weeks).toBe(14);
    expect(result.effortMultiplier).toBeCloseTo((14 / 11) ** 4, 6);
    expect(result.effortMultiplier).toBeCloseTo(2.62, 1);
    expect(result.warning?.code).toBe('schedule_compression');
    expect(result.warning?.severity).toBe('warning');
    expect(result.warning?.message).toContain('трудоёмкость ×2.62');
  });

  it('does not add effort when the target is not shorter than P50', () => {
    const atP50 = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 730 }],
      byStage: [{ stage: 3, hours: 730 }],
      team: TEAM_2_7_FTE,
      utilization: 0.7,
      targetWeeks: 14,
    });
    const aboveP50 = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 730 }],
      byStage: [{ stage: 3, hours: 730 }],
      team: TEAM_2_7_FTE,
      utilization: 0.7,
      targetWeeks: 18,
    });

    expect(atP50.effortMultiplier).toBe(1);
    expect(atP50.warning).toBeUndefined();
    expect(aboveP50.effortMultiplier).toBe(1);
    expect(aboveP50.warning).toBeUndefined();
  });

  it('projects the P50 finish on the working calendar', () => {
    const result = schedule(d1Input());

    expect(isWorkingDay(new Date(`${result.plannedEndDate}T00:00:00Z`))).toBe(true);
    expect(result.plannedEndDate > result.startDate).toBe(true);
  });
});
