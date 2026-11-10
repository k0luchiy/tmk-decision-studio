/**
 * Shared verdict built from simulated costs, scenario TCO and the
 * scenario-specific schedules.
 *
 * Each scenario contributes its own median duration, so the "contractor is
 * faster" rule in `buildVerdict` compares real scenario timelines rather than a
 * single shared schedule.
 */

import type { Verdict } from '@app/contract';
import { buildVerdict, type VerdictScenarioInput } from '../decision/verdict.js';
import type { Quantiles } from '../risk/monteCarlo.js';
import type { ScenarioResult } from '../scenarios/scenarios.js';
import { lastCumulative } from './assemble.js';
import type { ScenarioDurations } from './durations.js';

/** Simulated cost quantiles for the three scenarios. */
export interface ScenarioCosts {
  inhouse: Quantiles;
  contractor: Quantiles;
  hybrid: Quantiles;
}

/** Adjusted scenario cashflows for the three scenarios. */
export interface ScenarioCashflows {
  inhouse: ScenarioResult;
  contractor: ScenarioResult;
  hybrid: ScenarioResult;
}

function verdictInputOf(
  cost: Quantiles,
  scenario: ScenarioResult,
  weeks: number,
): VerdictScenarioInput {
  return {
    p50Rub: cost.p50,
    p80Rub: cost.p80,
    tcoRub: lastCumulative(scenario.tco),
    weeks,
    breakevenMonth: scenario.breakevenMonth,
  };
}

/** Builds the shared verdict; each scenario uses its own median duration. */
export function buildScenarioVerdict(
  costs: ScenarioCosts,
  cashflows: ScenarioCashflows,
  durations: ScenarioDurations,
): Verdict {
  return buildVerdict({
    inhouse: verdictInputOf(costs.inhouse, cashflows.inhouse, durations.inhouse.p50Weeks),
    contractor: verdictInputOf(costs.contractor, cashflows.contractor, durations.contractor.p50Weeks),
    hybrid: verdictInputOf(costs.hybrid, cashflows.hybrid, durations.hybrid.p50Weeks),
  });
}
