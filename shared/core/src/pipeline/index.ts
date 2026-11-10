/**
 * End-to-end estimate pipeline (`docs/05_architecture_data.md` §7).
 *
 * `estimateTask` turns a confirmed `Task` and the loaded datasets into three
 * complete `Estimate` snapshots (`inhouse`, `contractor`, `hybrid`), one shared
 * verdict, one confidence score and one effort grid. It is the single entry
 * point the CLI / e2e harness use; the frontend only renders the result.
 *
 * The pipeline is deterministic: the same `{task, datasets, seed,
 * datasetVersion, options}` always yields byte-identical snapshots. Every
 * quantity is either folded from the WBS (`toStageGrid`), scheduled
 * (`schedule`) or simulated with a seeded Monte Carlo (`simulate`). No clock
 * or `Math.random()` is used except in the export layer.
 */

import type { CostLine, Estimate } from '@app/contract';
import { costContractor, type ContractModel } from '../cost/contractor.js';
import { PRODUCTIVE_HOURS_PER_MONTH, costInhouse, type EffortByRole } from '../cost/inhouse.js';
import { toStageGrid } from '../cost/stageGrid.js';
import type { Quantiles } from '../risk/monteCarlo.js';
import { buildScenarios } from '../scenarios/scenarios.js';
import type { ScenarioResult } from '../scenarios/scenarios.js';
import { schedule } from '../schedule/schedule.js';
import { DEFAULT_WEIGHTS } from '../sizing/combine.js';
import { buildWbs, resolveWorkType, WORK_TYPE_TO_ARCHETYPE } from '../sizing/wbs.js';
import {
  blendLines,
  buildConfidenceAndWarnings,
  hybridShare,
  makeEstimate,
} from './assemble.js';
import { adjustScenarios, simulateScenarios } from './adjust.js';
import { buildDistribution, buildSensitivity, winnerKey } from './insights.js';
import { buildAssumptions, buildRisks, toContractAnalogues } from './dataBridge.js';
import { scenarioDurations } from './durations.js';
import { buildScenarioVerdict } from './verdict.js';
import {
  combineEffort,
  hashInput,
  pickHiringRole,
  resolveUnitsCount,
  scaleWorkItemsByStage,
} from './inputs.js';
import { HYBRID_CONTRACTOR_STAGES, TURNOVER_RATE } from './types.js';
import type {
  EstimateTaskInput,
  EstimateTaskOptions,
  EstimateTaskResult,
} from './types.js';

export type { DistributionBin, EstimateTaskInput, EstimateTaskOptions, EstimateTaskResult, SensitivityFactor } from './types.js';

/**
 * Runs the full estimation pipeline for one task.
 *
 * @throws {RangeError} when `seed` is not an integer or utilisation is invalid.
 * @throws {MissingRateError | MissingBandError} when a role/grade pair has no
 *   rate in the datasets.
 */
export function estimateTask(input: EstimateTaskInput): EstimateTaskResult {
  const { task, datasets, seed, datasetVersion } = input;
  const options: EstimateTaskOptions = input.options ?? {};
  if (!Number.isInteger(seed)) {
    throw new RangeError(`seed must be an integer, got ${seed}`);
  }

  const utilization = options.utilization ?? 0.7;
  if (!Number.isFinite(utilization) || utilization <= 0 || utilization > 1) {
    throw new RangeError(`options.utilization must be in (0, 1], got ${utilization}`);
  }
  const model: ContractModel = options.model ?? 't_and_m';

  const workType = resolveWorkType(task);
  const archetypeId =
    WORK_TYPE_TO_ARCHETYPE[workType] ?? WORK_TYPE_TO_ARCHETYPE.default ?? 'functional_extension_1c';
  const unitsCount = resolveUnitsCount(task, archetypeId, datasets);

  const supportCoverage =
    workType === 'support' && /24\s*\/\s*7|круглосуточ/i.test(`${task.title} ${task.descriptionRaw}`)
      ? 2.5
      : 1;
  const wbsOptions = {
    ...(unitsCount === undefined ? {} : { unitsCount }),
    ...(supportCoverage === 1 ? {} : { coverageFactor: supportCoverage }),
  };
  const baseItems = buildWbs(task, datasets.archetypes.archetypes, wbsOptions);
  const baseGrid = toStageGrid(baseItems);

  const { effortGrid: combinedGrid, workItems, combined, analogueEstimateResult } = combineEffort({
    task,
    datasets,
    workType,
    baseItems,
    baseGrid,
  });
  const effortGrid =
    options.stageHours === undefined
      ? combinedGrid
      : toStageGrid(scaleWorkItemsByStage(workItems, options.stageHours));

  const effortByRole: EffortByRole[] = effortGrid.byRole.map((entry) => ({
    roleId: entry.roleId,
    grade: entry.grade,
    hours: entry.hours,
  }));

  const months = Math.max(1, Math.ceil(effortGrid.totalHours / PRODUCTIVE_HOURS_PER_MONTH));
  const hiringTarget = options.hiring === true ? pickHiringRole(effortByRole) : undefined;
  const inhouseLines = costInhouse({
    effortByRole,
    rateCards: datasets.rateCards.roles,
    opts: {
      ...(hiringTarget === undefined ? {} : { hiring: hiringTarget }),
      utilization,
      turnoverRate: TURNOVER_RATE,
      months,
      ...(options.teamRate === undefined ? {} : { hourlyRateOverride: options.teamRate }),
    },
  });
  const contractorLines = costContractor({
    effortByRole,
    bands: datasets.contractorRates.bands,
    opts: {
      geo: 'RU',
      model,
      vat: options.vat === true,
      ...(options.oversightPct === undefined ? {} : { acceptancePct: options.oversightPct }),
    },
  });

  const contractorStages = [...(options.contractorStages ?? HYBRID_CONTRACTOR_STAGES)];
  const byStage = effortGrid.byStage.map((entry) => ({ stage: entry.stage, hours: entry.hours }));
  const scenarioResult = buildScenarios({
    inhouseLines,
    contractorLines,
    byStage,
    contractorStages,
    ...(options.contractorStageShares === undefined
      ? {}
      : { contractorStageShares: options.contractorStageShares }),
    ...(options.reservePct === undefined ? {} : { reservePct: options.reservePct }),
  });

  const scheduleResult = schedule({
    byRole: effortGrid.byRole.map((entry) => ({
      roleId: entry.roleId,
      grade: entry.grade,
      hours: entry.hours,
    })),
    byStage,
    utilization,
    ...(options.targetWeeks === undefined ? {} : { targetWeeks: options.targetWeeks }),
  });
  const durations = scenarioDurations(scheduleResult.duration, options.hiring === true, workType);

  const share = hybridShare(effortGrid.byStage, contractorStages, options.contractorStageShares);
  const hybridLines = blendLines(inhouseLines, contractorLines, share);
  const adjusted = adjustScenarios({
    scenarios: scenarioResult,
    lines: { inhouse: inhouseLines, contractor: contractorLines, hybrid: hybridLines },
    compressionFactor: scheduleResult.effortMultiplier,
    extras: options.extras ?? [],
    reservePct: options.reservePct ?? 0,
  });
  const inhouseCost = simulateScenarios(adjusted.scenarios, effortGrid, durations, seed);
  const verdict = buildScenarioVerdict(inhouseCost, adjusted.scenarios, durations);
  const analogueRows = toContractAnalogues(datasets, workType);
  const { confidenceScore, warnings } = buildConfidenceAndWarnings({
    task,
    datasets,
    workType,
    combined,
    analogueEstimateResult,
    scheduleResult,
    analogueRows,
  });

  const assumptions = buildAssumptions(utilization, options.hiring === true, model);
  const risks = buildRisks(adjusted.scenarios.inhouse.implementationRub);
  const inputHash = hashInput(task, seed, datasetVersion, options);
  const meta = {
    datasetVersion,
    inputHash,
    seed,
    methodWeights: { ...DEFAULT_WEIGHTS },
  };

  const buildEstimate = (
    code: 'inhouse' | 'contractor' | 'hybrid',
    lines: CostLine[],
    scenario: ScenarioResult,
    cost: Quantiles,
    duration: Estimate['duration'],
  ): Estimate =>
    makeEstimate(
      code,
      task,
      lines,
      scenario,
      cost,
      effortGrid,
      duration,
      verdict,
      confidenceScore,
      assumptions,
      risks,
      analogueRows,
      warnings,
      meta,
    );

  const inhouse = buildEstimate(
    'inhouse',
    adjusted.lines.inhouse,
    adjusted.scenarios.inhouse,
    inhouseCost.inhouse,
    durations.inhouse,
  );
  const contractor = buildEstimate(
    'contractor',
    adjusted.lines.contractor,
    adjusted.scenarios.contractor,
    inhouseCost.contractor,
    durations.contractor,
  );
  const hybrid = buildEstimate(
    'hybrid',
    adjusted.lines.hybrid,
    adjusted.scenarios.hybrid,
    inhouseCost.hybrid,
    durations.hybrid,
  );

  const winnerCode = winnerKey(verdict.code);
  const winnerCost = inhouseCost[winnerCode];
  return {
    estimates: { inhouse, contractor, hybrid },
    verdict,
    confidence: confidenceScore,
    effortGrid,
    formulaTree: inhouse.formulaTree,
    sensitivity: buildSensitivity(adjusted.lines[winnerCode], winnerCost.p50),
    distribution: buildDistribution(winnerCost.histogram),
    methodDivergence: combined.divergence,
  };
}
