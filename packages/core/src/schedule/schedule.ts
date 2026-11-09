/**
 * Schedule, critical path and Putnam compression (`docs/03_estimation_model.md`
 * §7; `research/05_methodology_estimation.md` §5.2–§5.3).
 *
 * Effective capacity is `Σ fte × HPPW × utilization`, where
 * `HPPW = 120 × 12 / 52 ≈ 27.69` productive hours per week per FTE. The P50
 * duration is the ceiling of effort / capacity; P10/P80/P90 come from the
 * normal quantiles applied to the weekly sigma. Compressing the schedule below
 * P50 raises effort by Putnam's `K ∝ t⁻⁴`; compression above 25 % (measured as
 * `(P50 − target) / target`) raises a warning.
 *
 * The Monte-Carlo uncertainty pass is deliberately out of scope (task 18); this
 * module is deterministic.
 */

import type { Duration, Grade, Warning } from '@app/contract';
import { P10_Z, P80_Z } from '../cost/stageGrid.js';
import { RU_HOLIDAYS_2026_2027, addWorkingDays, formatCalendarDate } from './calendar.js';

/** Productive hours per week for one full-time equivalent. */
export const HOURS_PER_WEEK_PER_FTE = (120 * 12) / 52;

/** Default utilization from `research/05` §5.3 (0.65–0.75 band). */
export const DEFAULT_UTILIZATION = 0.7;

/** Default plan start date for the demo. */
export const DEFAULT_START_DATE = '2026-11-10';

/** Compression threshold before a warning is raised (`> 25 %`). */
export const COMPRESSION_WARNING_THRESHOLD = 0.25;

/** One person assigned to the team. */
export interface TeamMember {
  roleId: string;
  grade: Grade;
  fte: number;
}

/** Effort input for {@link schedule}. */
export interface ScheduleInput {
  byRole: { roleId: string; grade: Grade; hours: number }[];
  byStage: { stage: number; hours: number }[];
  sigmaHours?: number;
  team?: TeamMember[];
  utilization?: number;
  startDate?: string;
  holidays?: string[];
  targetWeeks?: number;
}

/** Result of {@link schedule}. */
export interface ScheduleResult {
  duration: Duration;
  warning?: Warning;
  effortMultiplier: number;
  /** Plan start (defaults to {@link DEFAULT_START_DATE}). */
  startDate: string;
  /** P50 finish projected on the Russian working calendar. */
  plannedEndDate: string;
}

/** Effort total: stage hours when available, role hours otherwise. */
function totalHours(input: ScheduleInput): number {
  const stageTotal = input.byStage.reduce((sum, entry) => sum + entry.hours, 0);
  if (input.byStage.length > 0) {
    return stageTotal;
  }
  return input.byRole.reduce((sum, entry) => sum + entry.hours, 0);
}

/**
 * Default sigma when the caller does not supply one: root-sum-square of
 * `0.15 × hours` per stage, i.e. a 15 % coefficient of variation per stage.
 */
function defaultSigmaHours(input: ScheduleInput): number {
  const hours =
    input.byStage.length > 0
      ? input.byStage.map((entry) => entry.hours)
      : input.byRole.map((entry) => entry.hours);
  const variance = hours.reduce((sum, value) => sum + (0.15 * value) ** 2, 0);
  return Math.sqrt(variance);
}

/** Falls back to one FTE per `byRole` entry when no team is supplied. */
function resolveTeam(input: ScheduleInput): TeamMember[] {
  if (input.team !== undefined && input.team.length > 0) {
    return input.team;
  }
  return input.byRole.map((entry) => ({ roleId: entry.roleId, grade: entry.grade, fte: 1 }));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds a deterministic duration estimate and the critical path.
 *
 * - `capacity = Σ fte × HOURS_PER_WEEK_PER_FTE × (utilization ?? 0.7)`
 * - `p50Weeks = max(1, ceil(Σhours / capacity))`
 * - `sigmaWeeks = (sigmaHours ?? √Σ(0.15 × hours)²) / capacity`
 * - `p10 = max(1, p50 − 1.2816σ)`, `p80 = p50 + 0.8416σ`,
 *   `p90 = p50 + 1.2816σ`
 * - `criticalPath = ['stage:1', …, 'stage:6']`
 *
 * When `targetWeeks < p50Weeks` and the compression exceeds 25 %, effort is
 * multiplied by `(p50Weeks / targetWeeks)⁴` and a `schedule_compression`
 * warning is returned. A compression of at most 25 % is treated as free and
 * leaves the multiplier at 1.
 */
export function schedule(input: ScheduleInput): ScheduleResult {
  const hours = totalHours(input);
  const team = resolveTeam(input);
  const utilization = input.utilization ?? DEFAULT_UTILIZATION;
  const capacity =
    team.reduce((sum, member) => sum + member.fte, 0) * HOURS_PER_WEEK_PER_FTE * utilization;

  // Guard against an empty team or zero utilization: assume a single FTE so the
  // function stays total instead of producing Infinity/NaN weeks.
  const effectiveCapacity = capacity > 0 ? capacity : HOURS_PER_WEEK_PER_FTE * DEFAULT_UTILIZATION;

  const p50Weeks = Math.max(1, Math.ceil(hours / effectiveCapacity));
  const sigmaHours = Math.max(0, input.sigmaHours ?? defaultSigmaHours(input));
  const sigmaWeeks = sigmaHours / effectiveCapacity;

  const p10Weeks = Math.max(1, p50Weeks - P10_Z * sigmaWeeks);
  const p80Weeks = p50Weeks + P80_Z * sigmaWeeks;
  const p90Weeks = p50Weeks + P10_Z * sigmaWeeks;

  const duration: Duration = {
    p10Weeks: round2(p10Weeks),
    p50Weeks,
    p80Weeks: round2(p80Weeks),
    p90Weeks: round2(p90Weeks),
    criticalPath: [1, 2, 3, 4, 5, 6].map((stage) => `stage:${stage}`),
  };

  const targetWeeks = input.targetWeeks;
  let effortMultiplier = 1;
  let warning: Warning | undefined;

  if (
    targetWeeks !== undefined &&
    Number.isFinite(targetWeeks) &&
    targetWeeks > 0 &&
    targetWeeks < p50Weeks
  ) {
    const ratio = p50Weeks / targetWeeks;
    // Compression is measured against the target: (P50 − target) / target.
    const compression = ratio - 1;
    if (compression > COMPRESSION_WARNING_THRESHOLD) {
      effortMultiplier = ratio ** 4;
      warning = {
        code: 'schedule_compression',
        severity: 'warning',
        message: `Сжатие ${Math.round(compression * 100)}%: трудоёмкость ×${effortMultiplier.toFixed(2)}`,
      };
    }
  }

  const startDate = input.startDate ?? DEFAULT_START_DATE;
  const start = new Date(`${startDate}T00:00:00Z`);
  const safeStart = Number.isFinite(start.getTime())
    ? start
    : new Date(`${DEFAULT_START_DATE}T00:00:00Z`);
  const holidays = input.holidays ?? RU_HOLIDAYS_2026_2027;
  // A P50 week is five working days on the five-day calendar.
  const plannedEnd = addWorkingDays(safeStart, p50Weeks * 5, holidays);

  return {
    duration,
    warning,
    effortMultiplier,
    startDate: formatCalendarDate(safeStart),
    plannedEndDate: formatCalendarDate(plannedEnd),
  };
}
