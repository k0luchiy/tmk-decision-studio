/**
 * Assembles the per-scenario `Estimate` snapshots: effort, duration, cost,
 * TCO, analogues, risks, assumptions, warnings and the formula tree.
 */

import type {
  Analogue,
  Assumption,
  ConfidenceScore,
  CostLine,
  Duration,
  EffortGrid,
  Estimate,
  Risk,
  Task,
  Verdict,
  Warning,
} from '@app/contract';
import { EstimateSchema } from '@app/contract';
import type { Datasets } from '@app/data';
import { DEFAULT_MIN_ANALOGUES } from '../sizing/analogues.js';
import type { AnalogueEstimateResult } from '../sizing/analogues.js';
import type { CombineMethodsResult, MethodWeights } from '../sizing/combine.js';
import type { ScenarioResult } from '../scenarios/scenarios.js';
import type { ScheduleResult } from '../schedule/schedule.js';
import { simulate, type Quantiles } from '../risk/monteCarlo.js';
import { confidence } from '../decision/confidence.js';
import { buildFormulaTree } from '../decision/formulaTree.js';
import { HYBRID_CONTRACTOR_STAGES, SIMULATION_CORRELATION, SIMULATION_ITERATIONS } from './types.js';

/** Stage-hours share owned by the contractor in the hybrid scenario. */
export function hybridShare(
  byStage: EffortGrid['byStage'],
  stages: readonly number[] = HYBRID_CONTRACTOR_STAGES,
): number {
  let total = 0;
  let selected = 0;
  const owned = new Set(stages);
  for (const row of byStage) {
    total += row.hours;
    if (owned.has(row.stage)) selected += row.hours;
  }
  return total > 0 ? selected / total : 0;
}

function formatShare(value: number): string {
  return String(Number((value * 100).toFixed(1)));
}

/** Blends in-house and contractor lines by hybrid stage share. */
export function blendLines(
  inhouse: CostLine[],
  contractor: CostLine[],
  share: number,
): CostLine[] {
  const inhouseShare = 1 - share;
  const blended: CostLine[] = [];
  if (share > 0) {
    for (const line of contractor) {
      blended.push({
        ...line,
        id: `hybrid:c:${line.id}`,
        label: `Гибрид / подряд (${formatShare(share)} %): ${line.label}`,
        formula: `${line.formula} × ${formatShare(share)} %`,
        valueRub: line.valueRub * share,
      });
    }
  }
  if (inhouseShare > 0) {
    for (const line of inhouse) {
      blended.push({
        ...line,
        id: `hybrid:i:${line.id}`,
        label: `Гибрид / внутри (${formatShare(inhouseShare)} %): ${line.label}`,
        formula: `${line.formula} × ${formatShare(inhouseShare)} %`,
        valueRub: line.valueRub * inhouseShare,
      });
    }
  }
  return blended;
}

export function lastCumulative(rows: { cumulativeRub: number }[]): number {
  const last = rows[rows.length - 1];
  return last === undefined ? 0 : last.cumulativeRub;
}

/**
 * Simulates a cost distribution centred on the deterministic implementation
 * cost: `simulate` supplies the shape, the scale pins P50 to the line sum.
 */
export function simulateCost(
  implementationRub: number,
  totalHours: number,
  grid: EffortGrid,
  duration: Duration,
  seed: number,
  salt: number,
): Quantiles {
  if (implementationRub <= 0 || totalHours <= 0) {
    return {
      p10: implementationRub,
      p50: implementationRub,
      p80: implementationRub,
      p90: implementationRub,
    };
  }

  const rate = implementationRub / totalHours;
  const p50Hours = Math.max(1e-6, grid.p50Hours);
  const p10Hours = grid.p10Hours > 0 ? grid.p10Hours : p50Hours * 0.6;
  const p90Hours = Math.max(grid.p90Hours, p50Hours);
  const p10Weeks = Math.max(1e-6, duration.p10Weeks);
  const p50Weeks = Math.max(p10Weeks, duration.p50Weeks);
  const p90Weeks = Math.max(p50Weeks, duration.p90Weeks);

  const result = simulate({
    effortHours: { p10: p10Hours, p50: p50Hours, p90: p90Hours },
    costPerHour: { p10: rate * 0.85, p50: rate, p90: rate * 1.15 },
    durationWeeks: { p10: p10Weeks, p50: p50Weeks, p90: p90Weeks },
    correlation: SIMULATION_CORRELATION,
    n: SIMULATION_ITERATIONS,
    seed: seed + salt,
  });

  const simulatedP50 = result.costRub.p50;
  const scale = simulatedP50 > 0 ? implementationRub / simulatedP50 : 1;

  return {
    p10: result.costRub.p10 * scale,
    p50: implementationRub,
    p80: result.costRub.p80 * scale,
    p90: result.costRub.p90 * scale,
  };
}

export function makeEstimate(
  code: 'inhouse' | 'contractor' | 'hybrid',
  task: Task,
  lines: CostLine[],
  scenario: ScenarioResult,
  cost: Quantiles,
  effortGrid: EffortGrid,
  duration: Duration,
  verdict: Verdict,
  confidenceScore: ConfidenceScore,
  assumptions: Assumption[],
  risks: Risk[],
  analogues: Analogue[],
  warnings: Warning[],
  meta: { datasetVersion: string; inputHash: string; seed: number; methodWeights: MethodWeights },
): Estimate {
  const id = `${task.id}-${code}`;
  const estimate: Estimate = {
    id,
    taskId: task.id,
    scenario: code,
    currency: 'RUB',
    datasetVersion: meta.datasetVersion,
    inputHash: meta.inputHash,
    seed: meta.seed,
    methodWeights: meta.methodWeights,
    effort: {
      p10Hours: effortGrid.p10Hours,
      p50Hours: effortGrid.p50Hours,
      p80Hours: effortGrid.p80Hours,
      p90Hours: effortGrid.p90Hours,
      grid: effortGrid,
    },
    duration,
    cost: {
      p10Rub: cost.p10,
      p50Rub: cost.p50,
      p80Rub: cost.p80,
      p90Rub: cost.p90,
      reserveRub: Math.max(0, cost.p80 - cost.p50),
      lines,
    },
    tco: scenario.tco,
    breakevenMonth: scenario.breakevenMonth,
    verdict,
    confidence: confidenceScore,
    assumptions,
    risks,
    analogues,
    warnings,
    formulaTree: buildFormulaTree({
      estimateId: id,
      costLines: lines,
      effortHours: { p50: effortGrid.p50Hours, p80: effortGrid.p80Hours },
    }),
    createdAt: task.createdAt,
  };

  return EstimateSchema.parse(estimate);
}

/** Computes the shared confidence score and the ordered warning list. */
export function buildConfidenceAndWarnings(args: {
  task: Task;
  datasets: Datasets;
  workType: string;
  combined: CombineMethodsResult;
  analogueEstimateResult: AnalogueEstimateResult | undefined;
  scheduleResult: ScheduleResult;
  analogueRows: Analogue[];
}): { confidenceScore: ConfidenceScore; warnings: Warning[] } {
  const { task, datasets, workType, combined, analogueEstimateResult, scheduleResult, analogueRows } =
    args;
  const params = task.params ?? [];
  const confirmed = params.filter((param) => param.status === 'confirmed').length;
  const confidenceScore = confidence({
    briefCompleteness: params.length === 0 ? 0 : confirmed / params.length,
    methodDivergence: combined.divergence,
    analogueCount: analogueEstimateResult?.used.length ?? 0,
    analogueSufficiency:
      analogueEstimateResult?.sufficient === true
        ? 1
        : Math.min(1, (analogueEstimateResult?.used.length ?? 0) / DEFAULT_MIN_ANALOGUES),
    dataFreshness: datasets.manifest === null ? 0.7 : 0.9,
    accuracyClass: workType === 'default' ? 'order_of_magnitude' : 'budget',
  });

  const warnings: Warning[] = [];
  if (combined.warning !== undefined) warnings.push(combined.warning);
  if (scheduleResult.warning !== undefined) warnings.push(scheduleResult.warning);
  if (workType === 'default') {
    warnings.push({
      code: 'unknown_work_type',
      severity: 'warning',
      message: 'Тип работы не распознан: декомпозиция по архетипу по умолчанию.',
    });
  }
  if (analogueRows.length === 0) {
    warnings.push({
      code: 'analogue_none',
      severity: 'info',
      message: 'Аналоги не найдены: метод C совпал с WBS.',
    });
  }
  if (datasets.manifest === null) {
    warnings.push({
      code: 'no_manifest',
      severity: 'warning',
      message: 'data/manifest.json отсутствует: версия датасетов не подтверждена.',
    });
  }

  return { confidenceScore, warnings };
}
