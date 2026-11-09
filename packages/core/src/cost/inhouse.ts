/**
 * In-house fully-loaded cost (`docs/03_estimation_model.md` §5.1).
 *
 * Labour is priced straight from `rate_cards.json`: the model never recomputes
 * the hourly rate, it multiplies the reported `fully_loaded_hour` by the effort.
 * One-off costs (hiring, ramp-up, bench, turnover) become separate assumption
 * lines so the UI can show a formula tree instead of one opaque number.
 *
 * The function is pure and deterministic. It never returns `NaN` or `Infinity`:
 * a missing rate raises {@link MissingRateError}, an invalid option raises
 * `RangeError`.
 */

import type { CostLine, Grade } from '@app/contract';
import type { GradeRow, RoleCard } from '@app/data';

/** Raised when a role/grade pair has no row in `rate_cards.json`. */
export class MissingRateError extends Error {
  readonly roleId: string;
  readonly grade: Grade;
  readonly code = 'MISSING_RATE' as const;

  constructor(roleId: string, grade: Grade) {
    super(`No rate card for role "${roleId}" grade "${grade}"`);
    this.name = 'MissingRateError';
    this.roleId = roleId;
    this.grade = grade;
  }
}

/** One role/grade effort bucket, in person-hours. */
export interface EffortByRole {
  roleId: string;
  grade: Grade;
  hours: number;
}

/** One-off cost switches. Every field is optional; defaults are documented below. */
export interface InhouseOptions {
  /** Target role/grade to hire; adds a `hiring` line. */
  hiring?: { roleId: string; grade: Grade };
  /** Team utilisation, `(0, 1]`. Default `0.7` (`research/05` §5.3). */
  utilization?: number;
  /** Project duration in months used by bench/turnover. Default `1`. */
  months?: number;
  /** Annual turnover rate, e.g. `0.13`; adds a `turnover` line. */
  turnoverRate?: number;
}

export interface InhouseInput {
  effortByRole: EffortByRole[];
  rateCards: RoleCard[];
  opts?: InhouseOptions;
}

/** Default utilisation when the caller does not model it (`research/05` §5.3). */
export const DEFAULT_UTILIZATION = 0.7;
/** Productive hours per person-month (`docs/03_estimation_model.md` §5.1). */
export const PRODUCTIVE_HOURS_PER_MONTH = 120;
/** Hiring cost in monthly salaries: `1.5 × fully_loaded_month`. */
export const HIRING_MONTHS = 1.5;
/** Ramp-up duration in months. */
export const RAMPUP_MONTHS = 2;
/** Productivity during ramp-up (50 %). */
export const RAMPUP_PRODUCTIVITY = 0.5;
/** Replacement cost in annual salaries: `0.5 × fully_loaded_month_year`. */
export const TURNOVER_REPLACEMENT_SHARE = 0.5;
/** Months per year. */
export const MONTHS_PER_YEAR = 12;

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, got ${value}`);
  }
}

function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0, got ${value}`);
  }
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const rounded = Number(value.toFixed(6));
  return String(rounded);
}

function rateRef(roleId: string, grade: Grade): string {
  return `rate_cards:${roleId}:${grade}`;
}

interface ResolvedRate {
  role: RoleCard;
  gradeRow: GradeRow;
}

function resolveRate(rateCards: RoleCard[], roleId: string, grade: Grade): ResolvedRate {
  const role = rateCards.find((card) => card.role_id === roleId);
  const gradeRow = role?.grades.find((row) => row.grade === grade);
  if (!role || !gradeRow) {
    throw new MissingRateError(roleId, grade);
  }
  assertFinitePositive(`rate_cards.${roleId}.${grade}.fully_loaded_hour`, gradeRow.fully_loaded_hour);
  assertFinitePositive(
    `rate_cards.${roleId}.${grade}.fully_loaded_month`,
    gradeRow.fully_loaded_month,
  );
  return { role, gradeRow };
}

/** A unique effort bucket with its resolved rate, in input order. */
interface EffortBucket {
  roleId: string;
  grade: Grade;
  hours: number;
  role: RoleCard;
  gradeRow: GradeRow;
}

function collectBuckets(input: InhouseInput): EffortBucket[] {
  const seen = new Map<string, EffortBucket>();
  const order: string[] = [];

  for (const entry of input.effortByRole) {
    assertFiniteNonNegative(`effortByRole.${entry.roleId}.${entry.grade}.hours`, entry.hours);
    const key = `${entry.roleId}:${entry.grade}`;
    const bucket = seen.get(key);
    if (bucket) {
      bucket.hours += entry.hours;
      continue;
    }
    const { role, gradeRow } = resolveRate(input.rateCards, entry.roleId, entry.grade);
    seen.set(key, {
      roleId: entry.roleId,
      grade: entry.grade,
      hours: entry.hours,
      role,
      gradeRow,
    });
    order.push(key);
  }

  return order.map((key) => {
    const bucket = seen.get(key);
    if (!bucket) {
      // Unreachable: `order` only contains keys inserted into `seen`.
      throw new Error(`Internal error: missing bucket ${key}`);
    }
    return bucket;
  });
}

/**
 * Builds the fully-loaded in-house cost lines.
 *
 * Labour lines are `hours × fully_loaded_hour` with `status: 'fact'`. One-off
 * lines are `status: 'assumption'`:
 *
 * - `hiring`: `1.5 × fully_loaded_month` of the target role/grade.
 * - `rampup`: `2 × 0.5 × avg fully_loaded_month`.
 * - `bench`: `max(0, billable / u − billable) × avg fully_loaded_month × months`,
 *   where `billable = Σhours / (months × 120)` and `u = opts.utilization ?? 0.7`.
 * - `turnover`: `billable × rate × 0.5 × (avg fully_loaded_month × 12)`.
 *
 * `avg fully_loaded_month` is the hours-weighted mean across the effort buckets.
 *
 * @throws {MissingRateError} when a role/grade pair has no rate-card row.
 * @throws {RangeError} when hours, months, utilisation or turnover are invalid.
 */
export function costInhouse(input: InhouseInput): CostLine[] {
  const opts = input.opts ?? {};
  const months = opts.months ?? 1;
  assertFinitePositive('opts.months', months);

  const utilization = opts.utilization ?? DEFAULT_UTILIZATION;
  if (!Number.isFinite(utilization) || utilization <= 0 || utilization > 1) {
    throw new RangeError(`opts.utilization must be in (0, 1], got ${utilization}`);
  }

  if (opts.turnoverRate !== undefined) {
    assertFiniteNonNegative('opts.turnoverRate', opts.turnoverRate);
  }

  const buckets = collectBuckets(input);
  const lines: CostLine[] = buckets.map((bucket) => {
    const { roleId, grade, hours, role, gradeRow } = bucket;
    const rate = gradeRow.fully_loaded_hour;
    return {
      id: `labor:${roleId}:${grade}`,
      group: 'labor',
      label: `Труд in-house: ${role.role_ru} (${gradeRow.grade_label})`,
      formula: `${formatNumber(hours)} h × ${formatNumber(rate)} ₽/ч`,
      inputRefs: [rateRef(roleId, grade)],
      valueRub: hours * rate,
      sourceId: rateRef(roleId, grade),
      status: 'fact',
    };
  });

  if (opts.hiring) {
    const { roleId, grade } = opts.hiring;
    const { role, gradeRow } = resolveRate(input.rateCards, roleId, grade);
    const monthly = gradeRow.fully_loaded_month;
    lines.push({
      id: 'hiring',
      group: 'hiring',
      label: `Найм: ${role.role_ru} (${gradeRow.grade_label})`,
      formula: `${formatNumber(HIRING_MONTHS)} × ${formatNumber(monthly)} ₽/мес`,
      inputRefs: [rateRef(roleId, grade)],
      valueRub: HIRING_MONTHS * monthly,
      sourceId: rateRef(roleId, grade),
      status: 'assumption',
    });
  }

  if (buckets.length === 0) {
    return lines;
  }

  const totalHours = buckets.reduce((sum, bucket) => sum + bucket.hours, 0);
  const avgFullyLoadedMonth =
    totalHours > 0
      ? buckets.reduce((sum, bucket) => sum + bucket.hours * bucket.gradeRow.fully_loaded_month, 0) /
        totalHours
      : buckets.reduce((sum, bucket) => sum + bucket.gradeRow.fully_loaded_month, 0) /
        buckets.length;

  const rateRefs = buckets.map((bucket) => rateRef(bucket.roleId, bucket.grade));

  lines.push({
    id: 'rampup',
    group: 'rampup',
    label: `Ramp-up (${formatNumber(RAMPUP_MONTHS)} мес × ${formatNumber(RAMPUP_PRODUCTIVITY * 100)} %)`,
    formula: `${formatNumber(RAMPUP_MONTHS)} × ${formatNumber(RAMPUP_PRODUCTIVITY)} × ${formatNumber(avgFullyLoadedMonth)} ₽/мес`,
    inputRefs: rateRefs,
    valueRub: RAMPUP_MONTHS * RAMPUP_PRODUCTIVITY * avgFullyLoadedMonth,
    sourceId: 'assumption:rampup',
    status: 'assumption',
  });

  const billableFte = totalHours / (months * PRODUCTIVE_HOURS_PER_MONTH);
  const extraFte = Math.max(0, billableFte / utilization - billableFte);
  lines.push({
    id: 'bench',
    group: 'bench',
    label: `Bench (загрузка ${formatNumber(utilization * 100)} %)`,
    formula: `max(0, ${formatNumber(billableFte)} / ${formatNumber(utilization)} − ${formatNumber(billableFte)}) FTE × ${formatNumber(avgFullyLoadedMonth)} ₽/мес × ${formatNumber(months)} мес`,
    inputRefs: rateRefs,
    valueRub: extraFte * avgFullyLoadedMonth * months,
    sourceId: 'assumption:bench',
    status: 'assumption',
  });

  if (opts.turnoverRate !== undefined) {
    const fullyLoadedMonthYear = avgFullyLoadedMonth * MONTHS_PER_YEAR;
    lines.push({
      id: 'turnover',
      group: 'turnover',
      label: `Текучесть (${formatNumber(opts.turnoverRate * 100)} % в год)`,
      formula: `${formatNumber(billableFte)} × ${formatNumber(opts.turnoverRate)} × ${formatNumber(TURNOVER_REPLACEMENT_SHARE)} × ${formatNumber(fullyLoadedMonthYear)} ₽/год`,
      inputRefs: rateRefs,
      valueRub: billableFte * opts.turnoverRate * TURNOVER_REPLACEMENT_SHARE * fullyLoadedMonthYear,
      sourceId: 'assumption:turnover',
      status: 'assumption',
    });
  }

  return lines;
}
