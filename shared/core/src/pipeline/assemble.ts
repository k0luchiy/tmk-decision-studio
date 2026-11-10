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
import type { Quantiles } from '../risk/monteCarlo.js';
import { confidence } from '../decision/confidence.js';
import { buildFormulaTree } from '../decision/formulaTree.js';
import { HYBRID_CONTRACTOR_STAGES } from './types.js';

/** Stage-hours share owned by the contractor in the hybrid scenario. */
export function hybridShare(
  byStage: EffortGrid['byStage'],
  stages: readonly number[] = HYBRID_CONTRACTOR_STAGES,
  shares?: Record<string, number>,
): number {
  let total = 0;
  let selected = 0;
  const owned = new Set(stages);
  for (const row of byStage) {
    total += row.hours;
    const share = shares?.[row.stage] ?? (owned.has(row.stage) ? 1 : 0);
    selected += row.hours * share;
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
