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

import { createHash } from 'node:crypto';
import type {
  Analogue,
  Assumption,
  ConfidenceScore,
  CostLine,
  Duration,
  EffortGrid,
  Estimate,
  FormulaNode,
  Grade,
  Risk,
  Task,
  Verdict,
  Warning,
  WorkItem,
} from '@app/contract';
import { EstimateSchema } from '@app/contract';
import type { Datasets } from '@app/data';
import {
  ANALOGUE_AGE_INDEX,
  ANALOGUE_TYPE_BY_WORK_TYPE,
  DEFAULT_MIN_ANALOGUES,
  analogueEstimate,
} from './sizing/analogues.js';
import { combineMethods, DEFAULT_WEIGHTS, type MethodWeights } from './sizing/combine.js';
import { fpLite, type FpComponent } from './sizing/fpLite.js';
import { buildWbs, resolveWorkType, WORK_TYPE_TO_ARCHETYPE } from './sizing/wbs.js';
import { costContractor, type ContractModel } from './cost/contractor.js';
import {
  PRODUCTIVE_HOURS_PER_MONTH,
  costInhouse,
  type EffortByRole,
} from './cost/inhouse.js';
import { toStageGrid } from './cost/stageGrid.js';
import { buildScenarios, type ScenarioResult } from './scenarios/scenarios.js';
import { schedule } from './schedule/schedule.js';
import { simulate, type Quantiles } from './risk/monteCarlo.js';
import { buildVerdict, type VerdictScenarioInput } from './decision/verdict.js';
import { confidence } from './decision/confidence.js';
import { buildFormulaTree } from './decision/formulaTree.js';

/** Hiring default: the most loaded role, or `1c_developer` when present. */
const TURNOVER_RATE = 0.13;
/** Monte Carlo iterations per scenario: enough for stable P10/P90, still fast. */
const SIMULATION_ITERATIONS = 4000;
/** One-factor copula correlation used by `simulate` (docs §8). */
const SIMULATION_CORRELATION = 0.5;
/** Contractor stages owned by the contractor in the hybrid scenario. */
const HYBRID_CONTRACTOR_STAGES: readonly number[] = [3];

/** Options that shape the two cost bases. All are optional. */
export interface EstimateTaskOptions {
  /** Add a hiring line for the most loaded role. */
  hiring?: boolean;
  /** Team utilisation in `(0, 1]`. Default `0.7`. */
  utilization?: number;
  /** Contractor contract model. Default `t_and_m`. */
  model?: ContractModel;
  /** Add a 20 % VAT line to contractor costs. Default `false`. */
  vat?: boolean;
}

/** Input of {@link estimateTask}. */
export interface EstimateTaskInput {
  task: Task;
  datasets: Datasets;
  seed: number;
  datasetVersion: string;
  options?: EstimateTaskOptions;
}

/** Result of {@link estimateTask}. */
export interface EstimateTaskResult {
  estimates: {
    inhouse: Estimate;
    contractor: Estimate;
    hybrid: Estimate;
  };
  verdict: Verdict;
  confidence: ConfidenceScore;
  effortGrid: EffortGrid;
  formulaTree: FormulaNode;
}

/** Parameter keys that map onto an archetype unit count. */
const UNIT_PARAM_KEYS: Record<string, readonly string[]> = {
  integration_flow: ['flows', 'integrations'],
  report: ['reports'],
  endpoint: ['flows', 'integrations'],
  kii_object: ['workstations', 'users'],
  control_point: ['control_points'],
  source_system: ['sources'],
  service: ['services'],
};

function numericParam(task: Task, key: string): number | undefined {
  const param = task.params?.find((entry) => entry.key === key);
  return typeof param?.value === 'number' ? param.value : undefined;
}

function stringParam(task: Task, key: string): string | undefined {
  const param = task.params?.find((entry) => entry.key === key);
  return typeof param?.value === 'string' ? param.value : undefined;
}

/** Explicit unit count only when the archetype unit maps to a brief number. */
function resolveUnitsCount(task: Task, archetypeId: string, datasets: Datasets): number | undefined {
  const archetype = datasets.archetypes.archetypes.find((entry) => entry.id === archetypeId);
  const keys = archetype ? UNIT_PARAM_KEYS[archetype.unit] : undefined;
  if (!keys) return undefined;
  for (const key of keys) {
    const value = numericParam(task, key);
    if (value !== undefined && value > 0) return value;
  }
  return undefined;
}

function fpCounts(task: Task): Partial<Record<FpComponent, number>> {
  const flows = numericParam(task, 'flows') ?? 0;
  const integrations = numericParam(task, 'integrations') ?? 0;
  const screens = numericParam(task, 'screens') ?? 0;
  const reports = numericParam(task, 'reports') ?? 0;
  const forms = numericParam(task, 'forms') ?? 0;
  const users = numericParam(task, 'users') ?? 0;

  return {
    ei: flows + integrations + forms,
    eo: reports + Math.min(screens, 20),
    eq: users > 0 ? 1 : 0,
    ilf: screens > 0 || reports > 0 ? 1 : 0,
  };
}

function platformPdr(task: Task): string | undefined {
  const raw = task.platform ?? stringParam(task, 'platform');
  if (raw === undefined) return undefined;
  const key = raw.toLowerCase();
  if (key === '1c' || key === '1с') return 'traditional';
  if (key === 'sap') return 'sap';
  if (key === 'mobile') return 'mobile';
  if (key === 'lowcode') return 'lowcode';
  return 'traditional';
}

/** Hours-weighted in-house rate over the WBS role mix, RUB/hour. */
function blendedInhouseRate(datasets: Datasets, byRole: EffortGrid['byRole']): number {
  let cost = 0;
  let hours = 0;
  for (const entry of byRole) {
    const card = datasets.rateCards.roles.find((role) => role.role_id === entry.roleId);
    const grade = card?.grades.find((row) => row.grade === entry.grade);
    if (grade === undefined) continue;
    cost += grade.fully_loaded_hour * entry.hours;
    hours += entry.hours;
  }
  return hours > 0 ? cost / hours : 0;
}

/** Applies a uniform scale to every hour field, preserving O ≤ M ≤ P. */
function scaleWorkItems(items: WorkItem[], scale: number): WorkItem[] {
  if (!Number.isFinite(scale) || scale <= 0 || Math.abs(scale - 1) < 1e-9) return items;
  return items.map((item) => ({
    ...item,
    optimisticHours: item.optimisticHours * scale,
    mostLikelyHours: item.mostLikelyHours * scale,
    pessimisticHours: item.pessimisticHours * scale,
    expectedHours: item.expectedHours * scale,
    sigmaHours: item.sigmaHours * scale,
  }));
}

function cleanScopeVector(
  raw: Record<string, unknown>,
): Record<string, number | boolean | string> {
  const result: Record<string, number | boolean | string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

/** Maps corpus rows to contract analogues; only matching project types. */
function toContractAnalogues(datasets: Datasets, workType: string): Analogue[] {
  const expectedType = ANALOGUE_TYPE_BY_WORK_TYPE[workType];
  if (expectedType === undefined) return [];

  return datasets.analogues.analogues
    .filter((row) => row.project_type === expectedType)
    .slice(0, 3)
    .map((row) => {
      const low = row.price_low ?? 0;
      const high = row.price_high ?? low;
      const mid = row.price_mid ?? (low + high) / 2;
      const vatFlag = row.vat_included === true;
      return {
        id: row.id,
        corpus: 'published' as const,
        type: row.project_type,
        title: row.title,
        year: row.year,
        currency: row.currency === 'USD' ? ('USD' as const) : ('RUB' as const),
        price: { low, mid, high, basis: row.price_basis },
        vatFlag,
        scopeVector: cleanScopeVector(row.scope_vector),
        normalization: {
          kScope: 1,
          kComplexity: 1,
          kRegion: 1,
          kAge: ANALOGUE_AGE_INDEX,
          kVat: 1,
        },
        ...(row.currency === 'RUB' ? { normalizedPriceRub: mid } : {}),
        included: true,
        sourceId: row.source,
      };
    });
}

function buildAssumptions(
  utilization: number,
  hiring: boolean,
  model: ContractModel,
): Assumption[] {
  const assumptions: Assumption[] = [
    {
      id: 'utilization',
      label: 'Загрузка команды',
      value: utilization,
      range: { low: 0.65, high: 0.75 },
      sourceId: 'coefficients:productive_hours',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'support_inhouse',
      label: 'Поддержка in-house, %/год от труда',
      value: 0.12,
      range: { low: 0.1, high: 0.15 },
      sourceId: 'docs:03_estimation_model §5.3',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'support_contractor',
      label: 'Поддержка подрядчика, %/год от труда',
      value: 0.18,
      range: { low: 0.15, high: 0.2 },
      sourceId: 'docs:03_estimation_model §5.3',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'risk_reserve',
      label: 'Резерв P80 к P50',
      value: 0.18,
      range: { low: 0.15, high: 0.3 },
      sourceId: 'coefficients:contingency_policy',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'contract_model',
      label: 'Модель контракта подрядчика',
      value: model,
      range: { low: 0, high: 1 },
      sourceId: 'contractor_rate_cards:pricing_basis',
      pinned: false,
      owner: 'R2',
    },
  ];

  if (hiring) {
    assumptions.push({
      id: 'hiring',
      label: 'Найм под ключевую роль',
      value: true,
      range: { low: 1.5, high: 1.5 },
      sourceId: 'research/05 §5.3',
      pinned: false,
      owner: 'R2',
    });
  }

  return assumptions;
}

function buildRisks(implementationRub: number): Risk[] {
  const base = Math.max(0, implementationRub);
  return [
    {
      id: 'scope_growth',
      label: 'Рост объёма и неопределённость требований',
      probability: 0.4,
      impactRub: { low: base * 0.05, mid: base * 0.1, high: base * 0.2 },
      expectedRub: base * 0.04,
      mitigation: 'Фиксация объёма, этапная приёмка, change-request',
      party: 'shared',
      sourceId: 'assumption:risk_scope',
    },
    {
      id: 'schedule_slip',
      label: 'Сдвиг срока из-за согласований',
      probability: 0.3,
      impactRub: { low: base * 0.03, mid: base * 0.06, high: base * 0.12 },
      expectedRub: base * 0.018,
      mitigation: 'Календарный план с резервом и контрольными точками',
      party: 'shared',
      sourceId: 'assumption:risk_schedule',
    },
  ];
}

/** Stage-hours share owned by the contractor in the hybrid scenario. */
function hybridShare(byStage: EffortGrid['byStage']): number {
  let total = 0;
  let selected = 0;
  const owned = new Set(HYBRID_CONTRACTOR_STAGES);
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
function blendLines(
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

function lastCumulative(rows: { cumulativeRub: number }[]): number {
  const last = rows[rows.length - 1];
  return last === undefined ? 0 : last.cumulativeRub;
}

/**
 * Simulates a cost distribution centred on the deterministic implementation
 * cost: `simulate` supplies the shape, the scale pins P50 to the line sum.
 */
function simulateCost(
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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function hashInput(
  task: Task,
  seed: number,
  datasetVersion: string,
  options: EstimateTaskOptions,
): string {
  return createHash('sha256')
    .update(stableStringify({ task, seed, datasetVersion, options }), 'utf8')
    .digest('hex');
}

function makeEstimate(
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

/**
 * Runs the full estimation pipeline for one task.
 *
 * @throws {RangeError} when `seed` is not an integer or utilisation is invalid.
 * @throws {MissingRateError | MissingBandError} when a role/grade pair has no
 *   rate in the datasets.
 */
export function estimateTask(input: EstimateTaskInput): EstimateTaskResult {
  const { task, datasets, seed, datasetVersion } = input;
  const options = input.options ?? {};
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

  const baseItems = buildWbs(
    task,
    datasets.archetypes.archetypes,
    unitsCount === undefined ? undefined : { unitsCount },
  );
  const baseGrid = toStageGrid(baseItems);

  // Method A — WBS; B — FP-lite; C — analogue (converted to hours at the
  // blended in-house rate). C falls back to A when there is no corpus type.
  const methodA = baseGrid.p50Hours;
  const fp = fpLite({ counts: fpCounts(task), platform: platformPdr(task) });
  const methodB = fp.fp > 0 ? fp.effortHours : methodA;
  const analogueType = ANALOGUE_TYPE_BY_WORK_TYPE[workType];
  const analogueEstimateResult =
    analogueType === undefined
      ? undefined
      : analogueEstimate({
          workType,
          analogues: datasets.analogues.analogues.map((row) => ({
            id: row.id,
            project_type: row.project_type,
            title: row.title,
            year: row.year,
            currency: row.currency === 'USD' ? 'USD' : 'RUB',
            price_low: row.price_low,
            price_mid: row.price_mid,
            price_high: row.price_high,
            source: row.source,
            price_basis: row.price_basis,
          })),
        });
  const blendedRate = blendedInhouseRate(datasets, baseGrid.byRole);
  const methodC =
    analogueEstimateResult?.medianRub !== null &&
    analogueEstimateResult?.medianRub !== undefined &&
    blendedRate > 0
      ? analogueEstimateResult.medianRub / blendedRate
      : methodA;

  const combined = combineMethods({ a: methodA, b: methodB, c: methodC });
  const scale = methodA > 0 ? combined.effortHours / methodA : 1;
  const workItems = scaleWorkItems(baseItems, scale);
  const effortGrid = toStageGrid(workItems);

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
    },
  });
  const contractorLines = costContractor({
    effortByRole,
    bands: datasets.contractorRates.bands,
    opts: { geo: 'RU', model, vat: options.vat === true },
  });

  const scenarioResult = buildScenarios({
    inhouseLines,
    contractorLines,
    byStage: effortGrid.byStage.map((entry) => ({ stage: entry.stage, hours: entry.hours })),
    contractorStages: [...HYBRID_CONTRACTOR_STAGES],
  });

  const scheduleResult = schedule({
    byRole: effortGrid.byRole.map((entry) => ({
      roleId: entry.roleId,
      grade: entry.grade,
      hours: entry.hours,
    })),
    byStage: effortGrid.byStage.map((entry) => ({ stage: entry.stage, hours: entry.hours })),
    utilization,
  });
  const duration = scheduleResult.duration;

  const share = hybridShare(effortGrid.byStage);
  const hybridLines = blendLines(inhouseLines, contractorLines, share);

  const inhouseCost = simulateCost(
    scenarioResult.inhouse.implementationRub,
    effortGrid.totalHours,
    effortGrid,
    duration,
    seed,
    0,
  );
  const contractorCost = simulateCost(
    scenarioResult.contractor.implementationRub,
    effortGrid.totalHours,
    effortGrid,
    duration,
    seed,
    1,
  );
  const hybridCost = simulateCost(
    scenarioResult.hybrid.implementationRub,
    effortGrid.totalHours,
    effortGrid,
    duration,
    seed,
    2,
  );

  const verdictInputOf = (cost: Quantiles, scenario: ScenarioResult): VerdictScenarioInput => ({
    p50Rub: cost.p50,
    p80Rub: cost.p80,
    tcoRub: lastCumulative(scenario.tco),
    weeks: duration.p50Weeks,
    breakevenMonth: scenario.breakevenMonth,
  });
  const verdict = buildVerdict({
    inhouse: verdictInputOf(inhouseCost, scenarioResult.inhouse),
    contractor: verdictInputOf(contractorCost, scenarioResult.contractor),
    hybrid: verdictInputOf(hybridCost, scenarioResult.hybrid),
  });

  const params = task.params ?? [];
  const confirmed = params.filter((param) => param.status === 'confirmed').length;
  const analogueRows = toContractAnalogues(datasets, workType);
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

  const assumptions = buildAssumptions(utilization, options.hiring === true, model);
  const risks = buildRisks(scenarioResult.inhouse.implementationRub);
  const inputHash = hashInput(task, seed, datasetVersion, options);
  const meta = {
    datasetVersion,
    inputHash,
    seed,
    methodWeights: { ...DEFAULT_WEIGHTS },
  };

  const inhouse = makeEstimate(
    'inhouse',
    task,
    inhouseLines,
    scenarioResult.inhouse,
    inhouseCost,
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
  const contractor = makeEstimate(
    'contractor',
    task,
    contractorLines,
    scenarioResult.contractor,
    contractorCost,
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
  const hybrid = makeEstimate(
    'hybrid',
    task,
    hybridLines,
    scenarioResult.hybrid,
    hybridCost,
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

  return {
    estimates: { inhouse, contractor, hybrid },
    verdict,
    confidence: confidenceScore,
    effortGrid,
    formulaTree: inhouse.formulaTree,
  };
}

function pickHiringRole(byRole: EffortByRole[]): { roleId: string; grade: Grade } | undefined {
  if (byRole.length === 0) return undefined;
  const preferred =
    byRole.find((entry) => entry.roleId === '1c_developer') ??
    byRole.reduce((best, entry) => (entry.hours > best.hours ? entry : best));
  return { roleId: preferred.roleId, grade: preferred.grade };
}
