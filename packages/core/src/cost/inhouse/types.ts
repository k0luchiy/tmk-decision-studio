/** Public types, error and constants for the in-house cost model. */

import type { Grade } from '@app/contract';
import type { RoleCard } from '@app/data';

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
