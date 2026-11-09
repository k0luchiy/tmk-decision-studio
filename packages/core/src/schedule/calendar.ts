/**
 * Russian working calendar (`docs/03_estimation_model.md` §7).
 *
 * The holiday list is the official set of non-working days for 2026–2027:
 * statutory holidays from art. 112 of the Labour Code plus the weekend
 * transfers approved by:
 * - Постановление Правительства РФ от 24.09.2025 № 1466 (2026);
 * - Постановление Правительства РФ от 17.09.2026 № 1187 (2027).
 *
 * Deliberate limitation: the calendar models a five-day week (Mon–Fri) minus
 * holidays. It does not model the occasional working Saturday created by a
 * transfer (e.g. 2027-02-20 per decree № 1187), nor shortened pre-holiday
 * days. Weekends that coincide with holidays are kept in the list for
 * completeness even though `isWorkingDay` already rejects weekends.
 *
 * All functions treat a `Date` as a calendar day in UTC, so
 * `new Date('2027-01-01')` is handled consistently regardless of the host
 * time zone.
 */

/** Milliseconds in one civil day. */
const DAY_MS = 86_400_000;

/**
 * Official non-working days of the Russian Federation for 2026–2027
 * (`YYYY-MM-DD`), including the approved weekend transfers.
 *
 * Minimum 20 dates; the list currently holds 38: 18 for 2026 and 20 for 2027.
 */
export const RU_HOLIDAYS_2026_2027: string[] = [
  // 2026 — Новогодние каникулы и Рождество (1–8 января).
  '2026-01-01',
  '2026-01-02',
  '2026-01-03',
  '2026-01-04',
  '2026-01-05',
  '2026-01-06',
  '2026-01-07',
  '2026-01-08',
  // 2026 — перенос с субботы 3 января (№ 1466).
  '2026-01-09',
  // 2026 — День защитника Отечества.
  '2026-02-23',
  // 2026 — 8 Марта (воскресенье) и перенос на понедельник 9 марта.
  '2026-03-08',
  '2026-03-09',
  // 2026 — Праздник Весны и Труда.
  '2026-05-01',
  // 2026 — День Победы (суббота) и перенос на понедельник 11 мая.
  '2026-05-09',
  '2026-05-11',
  // 2026 — День России.
  '2026-06-12',
  // 2026 — День народного единства.
  '2026-11-04',
  // 2026 — перенос с воскресенья 4 января (№ 1466).
  '2026-12-31',

  // 2027 — Новогодние каникулы и Рождество (1–8 января).
  '2027-01-01',
  '2027-01-02',
  '2027-01-03',
  '2027-01-04',
  '2027-01-05',
  '2027-01-06',
  '2027-01-07',
  '2027-01-08',
  // 2027 — перенос с субботы 20 февраля (№ 1187) и День защитника Отечества.
  '2027-02-22',
  '2027-02-23',
  // 2027 — Международный женский день.
  '2027-03-08',
  // 2027 — 1 Мая (суббота) и перенос на понедельник 3 мая.
  '2027-05-01',
  '2027-05-03',
  // 2027 — 9 Мая (воскресенье) и перенос на понедельник 10 мая.
  '2027-05-09',
  '2027-05-10',
  // 2027 — 12 Июня (суббота) и перенос на понедельник 14 июня.
  '2027-06-12',
  '2027-06-14',
  // 2027 — День народного единства и перенос с субботы 2 января на 5 ноября.
  '2027-11-04',
  '2027-11-05',
  // 2027 — перенос с воскресенья 3 января (№ 1187).
  '2027-12-31',
];

const DEFAULT_HOLIDAY_SET = new Set(RU_HOLIDAYS_2026_2027);

/** Normalises a date to UTC midnight of the same calendar day. */
function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Formats a date as `YYYY-MM-DD` in UTC. */
function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns a holiday lookup set, falling back to the official RU list. */
function toHolidaySet(holidays?: string[]): Set<string> {
  return holidays === undefined ? DEFAULT_HOLIDAY_SET : new Set(holidays);
}

function isWorkingDayWithSet(date: Date, holidays: Set<string>): boolean {
  if (!Number.isFinite(date.getTime())) {
    return false;
  }
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) {
    return false;
  }
  return !holidays.has(toIsoDate(date));
}

/**
 * True when `date` is Monday–Friday and not a Russian holiday.
 *
 * @param holidays Overrides {@link RU_HOLIDAYS_2026_2027} when supplied.
 */
export function isWorkingDay(date: Date, holidays?: string[]): boolean {
  return isWorkingDayWithSet(date, toHolidaySet(holidays));
}

/**
 * Adds `days` working days to `start`, skipping weekends and holidays.
 *
 * The start day itself is not counted; the walk begins on the following day.
 * `days = 0` returns `start` normalised to UTC midnight. Negative values walk
 * backwards. An invalid date is returned unchanged.
 */
export function addWorkingDays(start: Date, days: number, holidays?: string[]): Date {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(days)) {
    return new Date(start);
  }

  const holidaySet = toHolidaySet(holidays);
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(Math.trunc(days));
  let cursor = startOfUTCDay(start);

  while (remaining > 0) {
    cursor = new Date(cursor.getTime() + step * DAY_MS);
    if (isWorkingDayWithSet(cursor, holidaySet)) {
      remaining -= 1;
    }
  }

  return cursor;
}

/**
 * Counts working days in the inclusive span `[start, end]`.
 *
 * Weekends and holidays are excluded. Returns `0` when `end` precedes `start`
 * or either bound is invalid, so the result is always non-negative.
 */
export function workingDaysBetween(start: Date, end: Date, holidays?: string[]): number {
  const startTime = startOfUTCDay(start).getTime();
  const endTime = startOfUTCDay(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 0;
  }

  const holidaySet = toHolidaySet(holidays);
  let count = 0;
  for (let cursor = startTime; cursor <= endTime; cursor += DAY_MS) {
    if (isWorkingDayWithSet(new Date(cursor), holidaySet)) {
      count += 1;
    }
  }
  return count;
}

/** Re-exported for callers that need to format a calendar day as ISO. */
export { toIsoDate as formatCalendarDate };
