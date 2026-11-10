/**
 * Scenario-specific schedules derived from the shared baseline `schedule()`.
 *
 * The three delivery scenarios do not share a timeline in real life:
 * - an in-house team pays a hiring/onboarding delay before it reaches full speed;
 * - a contractor mobilises quickly, so its critical path is shorter;
 * - a hybrid keeps most of the in-house pace but borrows contractor mobility.
 *
 * These factors are documented assumptions, not market benchmarks
 * (`docs/deliverables/METHOD.md` §11).
 */

import type { Duration } from '@app/contract';
import { calendarAssumption } from '../schedule/assumptions.js';

/** Hiring + onboarding delay added to the in-house schedule, weeks. */
export const HIRING_WEEKS = 2;
/** Contractor mobilisation factor applied to the baseline schedule. */
export const CONTRACTOR_DURATION_FACTOR = 0.85;
/** Hybrid mobilisation factor applied to the baseline schedule. */
export const HYBRID_DURATION_FACTOR = 0.92;

/** Ceil a scaled week count, never below one week. */
function scaleWeeks(baseWeeks: number, factor: number): number {
  return Math.max(1, Math.ceil(baseWeeks * factor));
}

/**
 * Scales every baseline quantile by `factor` and keeps the quantile ordering.
 * `minP50` nudges the median up when two scenarios would otherwise collide.
 */
function scaledDuration(base: Duration, factor: number, minP50 = 1): Duration {
  const p50Weeks = Math.max(minP50, scaleWeeks(base.p50Weeks, factor));
  const p10Weeks = Math.min(p50Weeks, scaleWeeks(base.p10Weeks, factor));
  const p80Weeks = Math.max(p50Weeks, scaleWeeks(base.p80Weeks, factor));
  const p90Weeks = Math.max(p80Weeks, scaleWeeks(base.p90Weeks, factor));
  return {
    p10Weeks,
    p50Weeks,
    p80Weeks,
    p90Weeks,
    criticalPath: [...base.criticalPath],
  };
}

/** Shifts every in-house quantile by the hiring/onboarding delay. */
function inhouseDuration(base: Duration, hiring: boolean): Duration {
  const shift = hiring ? HIRING_WEEKS : 0;
  return {
    p10Weeks: base.p10Weeks + shift,
    p50Weeks: base.p50Weeks + shift,
    p80Weeks: base.p80Weeks + shift,
    p90Weeks: base.p90Weeks + shift,
    criticalPath: [...base.criticalPath],
  };
}

function calendarize(base: Duration, workType: string): Duration {
  const assumption = calendarAssumption(workType);
  const scale = Math.min(1, Math.max(0, base.p50Weeks / 12));
  const lag = assumption.stageLagWeeks.reduce((sum, value) => sum + value, 0) * scale;
  const buffer = Math.ceil(lag + assumption.pilotWeeks);
  const floor = assumption.supportTermWeeks ?? assumption.minCalendarWeeks;
  const p50Weeks = Math.max(floor, base.p50Weeks + buffer);
  const p10Weeks = Math.min(p50Weeks, Math.max(1, base.p10Weeks + buffer));
  const p80Weeks = Math.max(p50Weeks, base.p80Weeks + buffer);
  const p90Weeks = Math.max(p80Weeks, base.p90Weeks + buffer);
  return { p10Weeks, p50Weeks, p80Weeks, p90Weeks, criticalPath: [...base.criticalPath] };
}

/** Result of {@link scenarioDurations}. */
export interface ScenarioDurations {
  inhouse: Duration;
  contractor: Duration;
  hybrid: Duration;
}

/**
 * Builds the three scenario durations from the shared baseline.
 *
 * `ceil` can collapse `contractor` and `hybrid` onto the same week for short
 * projects; the hybrid median is nudged to at least one week above the
 * contractor so the three scenarios stay distinguishable.
 */
export function scenarioDurations(
  base: Duration,
  hiring: boolean,
  workType = 'default',
): ScenarioDurations {
  const calendarBase = calendarize(base, workType);
  const contractor = scaledDuration(calendarBase, CONTRACTOR_DURATION_FACTOR);
  const hybrid = scaledDuration(calendarBase, HYBRID_DURATION_FACTOR, contractor.p50Weeks + 1);
  return {
    inhouse: inhouseDuration(calendarBase, hiring),
    contractor,
    hybrid,
  };
}
