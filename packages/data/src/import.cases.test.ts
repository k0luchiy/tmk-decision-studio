import { describe, expect, it } from 'vitest';
import { HEADERS, countWarnings, hasWarning, makeRow, parse } from './test-helpers.js';

describe('HelpDesk import edge cases', () => {
  it('1. header-only sheet yields zero rows and no tasks without throwing', () => {
    expect(() => parse([HEADERS])).not.toThrow();

    const result = parse([HEADERS]);
    expect(result.report.rowsTotal).toBe(0);
    expect(result.report.rowsOk).toBe(0);
    expect(result.tasks).toEqual([]);
    expect(result.workItems).toEqual([]);
    expect(result.report.rowsDropped).toEqual([]);
  });

  it('2. unparseable date keeps the row and emits bad_date', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000002', 8: 'не-дата' })]);

    expect(result.report.rowsTotal).toBe(1);
    expect(result.report.rowsOk).toBe(1);
    expect(result.report.rowsDropped).toEqual([]);
    expect(hasWarning(result.report.warnings, 'bad_date')).toBe(true);
    expect(result.tasks).toHaveLength(1);
  });

  it('3. plan=0 with actual>0 emits plan_zero but accepts the row', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000003', 13: 5, 14: 0, 15: 3 })]);

    expect(result.report.rowsOk).toBe(1);
    expect(hasWarning(result.report.warnings, 'plan_zero')).toBe(true);
    expect(result.workItems).toHaveLength(1);
  });

  it('4. plan=actual=quoted emits copied_effort on all three matching rows', () => {
    const activities = ['Разработка ФС', 'Реализация изменения', 'Оценка трудоёмкости'];
    const rows: Array<Array<string | number>> = [HEADERS];
    activities.forEach((activity, index) => {
      rows.push(
        makeRow({
          0: `IM0000001${index}`,
          1: `CR0000001${index}`,
          7: activity,
          13: 4,
          14: 4,
          15: 4,
        }),
      );
    });

    const result = parse(rows);

    expect(result.report.rowsOk).toBe(3);
    expect(countWarnings(result.report.warnings, 'copied_effort')).toBe(3);
  });

  it('5. fractional quota 1.5 emits fractional_quota', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000005', 13: 1, 14: 2, 15: 1.5 })]);

    expect(result.workItems[0]?.effort?.quotedHours).toBe(1.5);
    expect(hasWarning(result.report.warnings, 'fractional_quota')).toBe(true);
  });

  it('6. empty Вид emits empty_kind but keeps the row', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000006', 2: '' })]);

    expect(result.report.rowsOk).toBe(1);
    expect(hasWarning(result.report.warnings, 'empty_kind')).toBe(true);
  });

  it('7. duplicate (number, type, specialist, date) is recorded once', () => {
    const row = makeRow({ 0: 'IM00000007', 1: 'CR00000007' });
    const result = parse([HEADERS, row, [...row]]);

    expect(result.report.rowsTotal).toBe(2);
    expect(result.report.rowsOk).toBe(1);
    expect(result.report.rowsDropped).toHaveLength(1);
    expect(result.report.rowsDropped[0]?.reason).toBe('duplicate');
  });

  it('8. empty Номер is recorded as missing_id', () => {
    const result = parse([HEADERS, makeRow({ 0: '' })]);

    expect(result.report.rowsTotal).toBe(1);
    expect(result.report.rowsOk).toBe(0);
    expect(result.report.rowsDropped).toHaveLength(1);
    expect(result.report.rowsDropped[0]?.reason).toBe('missing_id');
  });

  it('9. unknown activity emits unknown_activity and maps to stage 3', () => {
    const result = parse([
      HEADERS,
      makeRow({ 0: 'IM00000009', 7: 'Неизвестная активность ЗНИ' }),
    ]);

    expect(hasWarning(result.report.warnings, 'unknown_activity')).toBe(true);
    expect(result.workItems[0]?.stage).toBe(3);
  });
});
