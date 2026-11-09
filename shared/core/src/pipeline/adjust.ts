/**
 * Post-processing of priced scenarios: deadline compression
 * (`docs/03_estimation_model.md` §7) and attachable extras (§5.3).
 *
 * Compression multiplies the implementation cost by the Putnam factor and
 * records the premium as a `risk` line; extras add `extra` lines. Neither
 * touches annual support, so TCO years 1..N stay support-only.
 */

import type { CostLine, Duration, EffortGrid } from '@app/contract';
import type { Quantiles } from '../risk/monteCarlo.js';
import { RISK_PREMIUM_PCT, breakevenMonth, type ScenarioResult } from '../scenarios/scenarios.js';
import { simulateCost } from './assemble.js';
import type { EstimateExtra, ExtraTarget } from './types.js';

export interface ScenarioSet {
  inhouse: ScenarioResult;
  contractor: ScenarioResult;
  hybrid: ScenarioResult;
}

export interface LineSet {
  inhouse: CostLine[];
  contractor: CostLine[];
  hybrid: CostLine[];
}

export const COMPRESSION_LABEL = 'Сжатие срока (Putnam)';
export const EXTRA_FORMULA = 'sticky extra';

function sumLines(lines: readonly CostLine[]): number {
  return lines.reduce((sum, line) => sum + line.valueRub, 0);
}

function applies(extra: EstimateExtra, scenario: ExtraTarget): boolean {
  const target = extra.appliesTo ?? 'all';
  return target === 'all' || target === scenario;
}

function extraLines(extras: readonly EstimateExtra[], scenario: ExtraTarget): CostLine[] {
  return extras
    .filter((extra) => applies(extra, scenario))
    .map((extra, index) => ({
      id: `extra:${scenario}:${index}`,
      group: 'extra' as const,
      label: extra.label,
      formula: EXTRA_FORMULA,
      inputRefs: [],
      valueRub: extra.amountRub,
      status: 'assumption' as const,
    }));
}

function compressionLine(scenario: ScenarioResult, factor: number): CostLine | undefined {
  if (factor <= 1) return undefined;
  return {
    id: `risk:compression:${scenario.code}`,
    group: 'risk',
    label: COMPRESSION_LABEL,
    formula: `P50 × (${factor.toFixed(4)} − 1)`,
    inputRefs: [],
    valueRub: scenario.implementationRub * (factor - 1),
    status: 'assumption',
  };
}

function withImplementation(scenario: ScenarioResult, implementationRub: number): ScenarioResult {
  const annualSupport = scenario.tco[1]?.costRub ?? 0;
  const years = Math.max(0, scenario.tco.length - 1);
  const tco = [{ year: 0, costRub: implementationRub, cumulativeRub: implementationRub }];
  let cumulative = implementationRub;
  for (let year = 1; year <= years; year += 1) {
    cumulative += annualSupport;
    tco.push({ year, costRub: annualSupport, cumulativeRub: cumulative });
  }
  return {
    ...scenario,
    implementationRub,
    p50Rub: implementationRub,
    p80Rub: implementationRub * (1 + RISK_PREMIUM_PCT),
    tco,
  };
}

function adjustOne(
  scenario: ScenarioResult,
  lines: readonly CostLine[],
  factor: number,
  extras: readonly EstimateExtra[],
): { scenario: ScenarioResult; lines: CostLine[] } {
  const additions = extraLines(extras, scenario.code);
  const extrasRub = additions.reduce((sum, line) => sum + line.valueRub, 0);
  const nextLines = [...lines];
  const compressed = compressionLine(scenario, factor);
  if (compressed !== undefined) nextLines.push(compressed);
  nextLines.push(...additions);
  const implementationRub = scenario.implementationRub * factor + extrasRub;
  return { scenario: withImplementation(scenario, implementationRub), lines: nextLines };
}

function profile(scenario: ScenarioResult): {
  implementationRub: number;
  annualSupportRub: number;
} {
  return {
    implementationRub: scenario.implementationRub,
    annualSupportRub: scenario.tco[1]?.costRub ?? 0,
  };
}

/**
 * Applies deadline compression and extras to all three scenarios, returning
 * adjusted scenarios plus the matching cost lines and recomputed break-even.
 */
export function adjustScenarios(args: {
  scenarios: ScenarioSet;
  lines: LineSet;
  compressionFactor: number;
  extras: readonly EstimateExtra[];
}): { scenarios: ScenarioSet; lines: LineSet } {
  const factor =
    Number.isFinite(args.compressionFactor) && args.compressionFactor > 0
      ? args.compressionFactor
      : 1;
  const inhouse = adjustOne(args.scenarios.inhouse, args.lines.inhouse, factor, args.extras);
  const contractor = adjustOne(args.scenarios.contractor, args.lines.contractor, factor, args.extras);
  const hybrid = adjustOne(args.scenarios.hybrid, args.lines.hybrid, factor, args.extras);
  const base = profile(inhouse.scenario);
  return {
    scenarios: {
      inhouse: { ...inhouse.scenario, breakevenMonth: breakevenMonth(base, base) },
      contractor: {
        ...contractor.scenario,
        breakevenMonth: breakevenMonth(profile(contractor.scenario), base),
      },
      hybrid: { ...hybrid.scenario, breakevenMonth: breakevenMonth(profile(hybrid.scenario), base) },
    },
    lines: { inhouse: inhouse.lines, contractor: contractor.lines, hybrid: hybrid.lines },
  };
}

/** Simulates cost quantiles for adjusted scenarios (same seed, distinct salts). */
export function simulateScenarios(
  scenarios: ScenarioSet,
  effortGrid: EffortGrid,
  duration: Duration,
  seed: number,
): { inhouse: Quantiles; contractor: Quantiles; hybrid: Quantiles } {
  const run = (code: keyof ScenarioSet, salt: number): Quantiles =>
    simulateCost(
      scenarios[code].implementationRub,
      effortGrid.totalHours,
      effortGrid,
      duration,
      seed,
      salt,
    );
  return { inhouse: run('inhouse', 0), contractor: run('contractor', 1), hybrid: run('hybrid', 2) };
}

/** Sum of a scenario's cost lines, exposed for tests and formula checks. */
export function scenarioLineTotal(lines: readonly CostLine[]): number {
  return sumLines(lines);
}
