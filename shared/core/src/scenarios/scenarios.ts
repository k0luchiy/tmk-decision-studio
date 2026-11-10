/**
 * Three delivery scenarios and TCO / break-even (`docs/03_estimation_model.md`
 * §5.3, §6, FR-3.4, FR-3.5).
 *
 * One work decomposition is priced with two cost bases (`inhouseLines`,
 * `contractorLines`); the three scenarios are combinations of those bases:
 *
 * - `inhouse` — everything internal;
 * - `contractor` — everything by the contractor;
 * - `hybrid` — contractor performs the selected stages (default: stage 3,
 *   "Разработка"), the rest stays internal.
 *
 * Every scenario gets:
 * - `implementationRub = Σ valueRub` of its cost lines;
 * - `p50Rub = implementationRub` (deterministic base estimate);
 * - `p80Rub = implementationRub × 1.18` — a **policy** risk reserve of 18 %
 *   (`docs/03_estimation_model.md` §6/§8). It is a fixed planning premium, not a
 *   Monte-Carlo quantile; the probabilistic P80 lives in `risk/monteCarlo.ts`;
 * - `tco` — year 0 implementation plus years 1..`years` of support at
 *   `Σlabor × rate` (12 % in-house, 18 % contractor, 12 % for hybrid support);
 * - `breakevenMonth` — first month the scenario becomes cheaper than in-house,
 *   or `null` if it never does.
 *
 * The module is pure, deterministic and never returns `NaN`/`Infinity`: invalid
 * rates or horizon raise `RangeError`.
 */

import type { CostLine, TcoRow } from '@app/contract';
import { MONTHS_PER_YEAR } from '../cost/inhouse.js';

/** Annual support as a share of labour, in-house (`docs/03_estimation_model.md` §5.3). */
export const DEFAULT_SUPPORT_RATE_INHOUSE = 0.12;
/** Annual support as a share of labour, contractor (`docs/03_estimation_model.md` §5.3). */
export const DEFAULT_SUPPORT_RATE_CONTRACTOR = 0.18;
/** Default TCO horizon in years (TCO-3). */
export const DEFAULT_YEARS = 3;
/** Default contractor stages for the hybrid scenario: stage 3, "Разработка". */
export const DEFAULT_CONTRACTOR_STAGES: readonly number[] = [3];
/** P80 risk reserve as a share of the implementation cost (policy, 18 %). */
export const RISK_PREMIUM_PCT = 0.18;
/** Break-even is evaluated over the first 36 months. */
export const BREAKEVEN_MONTHS = 36;

/** Inputs shared by all three scenarios. */
export interface ScenarioInput {
  /** Fully-loaded internal cost lines. */
  inhouseLines: CostLine[];
  /** Contractor cost lines. */
  contractorLines: CostLine[];
  /** Stage hours used to split the hybrid scenario. */
  byStage: { stage: number; hours: number }[];
  /** Stages the contractor performs in the hybrid scenario. Default `[3]`. */
  contractorStages?: number[];
  contractorStageShares?: Record<string, number>;
  /** Risk reserve in `[0, 0.5]`; scales implementation and P80 by `1 + reservePct`. */
  reservePct?: number;
  /** Annual in-house support share of labour. Default `0.12`. */
  supportRateInhouse?: number;
  /** Annual contractor support share of labour. Default `0.18`. */
  supportRateContractor?: number;
  /** TCO horizon in years after year 0. Default `3`. */
  years?: number;
}

/** One priced scenario. */
export interface ScenarioResult {
  code: 'inhouse' | 'contractor' | 'hybrid';
  implementationRub: number;
  p50Rub: number;
  p80Rub: number;
  tco: TcoRow[];
  /** First month (0..36) this scenario is cheaper than in-house, else `null`. */
  breakevenMonth: number | null;
}

/** Cash flow used to compare two scenarios month by month. */
export interface CashFlowProfile {
  /** One-off implementation cost, paid in month 0. */
  implementationRub: number;
  /** Annual support cost, spread evenly over months 1..36. */
  annualSupportRub: number;
}

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, got ${value}`);
  }
}

function sumValues(lines: CostLine[]): number {
  return lines.reduce((sum, line) => sum + line.valueRub, 0);
}

/** Sum of `labor`-group lines — the support base for TCO years 1..N. */
function sumLabor(lines: CostLine[]): number {
  return lines.reduce((sum, line) => (line.group === 'labor' ? sum + line.valueRub : sum), 0);
}

/**
 * Monthly cash flow: implementation in month 0, support in equal monthly
 * instalments (`annualSupportRub / 12`) from month 1 onward.
 */
function cumulativeAt(profile: CashFlowProfile, month: number): number {
  return profile.implementationRub + (profile.annualSupportRub / MONTHS_PER_YEAR) * month;
}

/**
 * First month (`0..36`) where scenario `a` is strictly cheaper than `b`.
 *
 * - `0` when `a` already dominates in month 0;
 * - a month `1..36` when `a` overtakes `b` within the horizon;
 * - `null` when `a` never becomes cheaper (e.g. `b` has zero support and a lower
 *   implementation, so it dominates forever).
 */
export function breakevenMonth(a: CashFlowProfile, b: CashFlowProfile): number | null {
  for (let month = 0; month <= BREAKEVEN_MONTHS; month += 1) {
    if (cumulativeAt(a, month) < cumulativeAt(b, month)) {
      return month;
    }
  }
  return null;
}

/** Builds year 0 + years 1..`years` with a strictly growing cumulative. */
function buildTco(
  implementationRub: number,
  annualSupportRub: number,
  years: number,
): TcoRow[] {
  const rows: TcoRow[] = [
    { year: 0, costRub: implementationRub, cumulativeRub: implementationRub },
  ];
  let cumulative = implementationRub;
  for (let year = 1; year <= years; year += 1) {
    cumulative += annualSupportRub;
    rows.push({ year, costRub: annualSupportRub, cumulativeRub: cumulative });
  }
  return rows;
}

/** Share of all hours that falls into the contractor-owned stages. */
function hybridShare(
  byStage: { stage: number; hours: number }[],
  stages: number[],
  shares?: Record<string, number>,
): number {
  const selected = new Set(stages);
  let totalHours = 0;
  let selectedHours = 0;
  for (const row of byStage) {
    assertFiniteNonNegative(`byStage.${row.stage}.hours`, row.hours);
    totalHours += row.hours;
    const share = shares?.[row.stage] ?? (selected.has(row.stage) ? 1 : 0);
    selectedHours += row.hours * share;
  }
  if (totalHours <= 0) {
    return 0;
  }
  return selectedHours / totalHours;
}

function makeResult(
  code: ScenarioResult['code'],
  implementationRub: number,
  annualSupportRub: number,
  years: number,
): ScenarioResult {
  return {
    code,
    implementationRub,
    p50Rub: implementationRub,
    p80Rub: implementationRub * (1 + RISK_PREMIUM_PCT),
    tco: buildTco(implementationRub, annualSupportRub, years),
    breakevenMonth: null,
  };
}

/**
 * Builds all three scenarios from one decomposition and two cost bases.
 *
 * The hybrid scenario is a weighted blend by stage hours:
 * `share = Σ hours(contractorStages) / Σ hours(all stages)`,
 * `implementationRub = contractorImpl × share + inhouseImpl × (1 − share)`.
 * Its support base is blended the same way and priced at the in-house rate
 * (`docs/03_estimation_model.md` §6: hybrid support is internal).
 *
 * Each scenario's `breakevenMonth` is computed relative to the in-house
 * scenario (`null` for in-house itself, since it never becomes strictly cheaper
 * than itself).
 *
 * @throws {RangeError} when rates are negative/not finite, `years` is not a
 *   non-negative integer, or a stage has invalid hours.
 */
export function buildScenarios(input: ScenarioInput): {
  inhouse: ScenarioResult;
  contractor: ScenarioResult;
  hybrid: ScenarioResult;
} {
  const years = input.years ?? DEFAULT_YEARS;
  if (!Number.isInteger(years) || years < 0) {
    throw new RangeError(`years must be a non-negative integer, got ${years}`);
  }

  const supportRateInhouse = input.supportRateInhouse ?? DEFAULT_SUPPORT_RATE_INHOUSE;
  const supportRateContractor = input.supportRateContractor ?? DEFAULT_SUPPORT_RATE_CONTRACTOR;
  assertFiniteNonNegative('supportRateInhouse', supportRateInhouse);
  assertFiniteNonNegative('supportRateContractor', supportRateContractor);

  const reservePct = input.reservePct ?? 0;
  assertFiniteNonNegative('reservePct', reservePct);
  if (reservePct > 0.5) throw new RangeError(`reservePct must be in [0, 0.5], got ${reservePct}`);
  const reserveFactor = 1 + reservePct;

  const contractorStages = input.contractorStages ?? [...DEFAULT_CONTRACTOR_STAGES];

  const inhouseBase = sumValues(input.inhouseLines);
  const contractorBase = sumValues(input.contractorLines);
  const inhouseLabor = sumLabor(input.inhouseLines);
  const contractorLabor = sumLabor(input.contractorLines);

  const share = hybridShare(input.byStage, contractorStages, input.contractorStageShares);
  const inhouseImpl = inhouseBase * reserveFactor;
  const contractorImpl = contractorBase * reserveFactor;
  const hybridImpl = (contractorBase * share + inhouseBase * (1 - share)) * reserveFactor;
  const hybridLabor = contractorLabor * share + inhouseLabor * (1 - share);

  const profile = (implementationRub: number, annualSupportRub: number): CashFlowProfile => ({
    implementationRub,
    annualSupportRub,
  });
  const inhouseProfile = profile(inhouseImpl, inhouseLabor * supportRateInhouse);
  const contractorProfile = profile(contractorImpl, contractorLabor * supportRateContractor);
  // Hybrid support is delivered internally (§6), so it uses the in-house rate.
  const hybridProfile = profile(hybridImpl, hybridLabor * supportRateInhouse);

  const inhouse = makeResult('inhouse', inhouseImpl, inhouseProfile.annualSupportRub, years);
  const contractor = makeResult(
    'contractor',
    contractorImpl,
    contractorProfile.annualSupportRub,
    years,
  );
  const hybrid = makeResult('hybrid', hybridImpl, hybridProfile.annualSupportRub, years);

  return {
    inhouse: { ...inhouse, breakevenMonth: breakevenMonth(inhouseProfile, inhouseProfile) },
    contractor: {
      ...contractor,
      breakevenMonth: breakevenMonth(contractorProfile, inhouseProfile),
    },
    hybrid: { ...hybrid, breakevenMonth: breakevenMonth(hybridProfile, inhouseProfile) },
  };
}
