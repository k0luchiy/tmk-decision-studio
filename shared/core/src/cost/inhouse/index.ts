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

import type { CostLine } from '@app/contract';
import {
  assertFiniteNonNegative,
  assertFinitePositive,
  collectBuckets,
  formatNumber,
  rateRef,
  resolveRate,
} from './helpers.js';
import {
  DEFAULT_UTILIZATION,
  HIRING_MONTHS,
  MONTHS_PER_YEAR,
  PRODUCTIVE_HOURS_PER_MONTH,
  RAMPUP_MONTHS,
  RAMPUP_PRODUCTIVITY,
  TURNOVER_REPLACEMENT_SHARE,
  type InhouseInput,
} from './types.js';

export {
  DEFAULT_UTILIZATION,
  HIRING_MONTHS,
  MissingRateError,
  MONTHS_PER_YEAR,
  PRODUCTIVE_HOURS_PER_MONTH,
  RAMPUP_MONTHS,
  RAMPUP_PRODUCTIVITY,
  TURNOVER_REPLACEMENT_SHARE,
} from './types.js';
export type { EffortByRole, InhouseInput, InhouseOptions } from './types.js';

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

  const hourlyRateOverride = opts.hourlyRateOverride;
  if (hourlyRateOverride !== undefined) {
    assertFinitePositive('opts.hourlyRateOverride', hourlyRateOverride);
  }

  const buckets = collectBuckets(input);
  const lines: CostLine[] = buckets.map((bucket) => {
    const { roleId, grade, hours, role, gradeRow } = bucket;
    const isOverride = hourlyRateOverride !== undefined;
    const rate = hourlyRateOverride ?? gradeRow.fully_loaded_hour;
    const sourceId = isOverride ? 'override:team_rate' : rateRef(roleId, grade);
    return {
      id: `labor:${roleId}:${grade}`,
      group: 'labor',
      label: `Труд in-house: ${role.role_ru} (${gradeRow.grade_label})`,
      formula: isOverride
        ? `${formatNumber(hours)} h × ${formatNumber(rate)} ₽/ч (override)`
        : `${formatNumber(hours)} h × ${formatNumber(rate)} ₽/ч`,
      inputRefs: [sourceId],
      valueRub: hours * rate,
      sourceId,
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
