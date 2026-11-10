/**
 * Task/dataset readers and small numeric helpers used to prepare pipeline
 * inputs. Kept free of orchestration so `index.ts` stays readable.
 */

import { createHash } from 'node:crypto';
import type { EffortGrid, Grade, Task, WorkItem } from '@app/contract';
import type { Datasets } from '@app/data';
import type { EffortByRole } from '../cost/inhouse.js';
import { toStageGrid } from '../cost/stageGrid.js';
import {
  ANALOGUE_TYPE_BY_WORK_TYPE,
  analogueEstimate,
  type AnalogueEstimateResult,
} from '../sizing/analogues.js';
import { combineMethods, type CombineMethodsResult } from '../sizing/combine.js';
import { fpLite, type FpComponent } from '../sizing/fpLite.js';
import { supportAnaloguesFromContracts } from '../sizing/supportAnalogues.js';
import type { EstimateTaskOptions } from './types.js';

/** Parameter keys that map onto an archetype unit count. */
const UNIT_PARAM_KEYS: Record<string, readonly string[]> = {
  integration_flow: ['flows', 'integrations'],
  report: ['reports'],
  endpoint: ['flows', 'integrations'],
  kii_object: ['workstations', 'users'],
  control_point: ['control_points'],
  source_system: ['sources'],
  service: ['services'],
  FP: ['fp', 'function_points'],
  intent: ['intents', 'scenarios'],
};

const FP_PER_SCREEN: Record<string, number> = {
  new_web_app: 3,
  mobile_app: 2.5,
  functional_extension_1c: 2,
  portal_gis: 3,
  mes_module: 4,
  sap_dev: 3,
  low_code: 2,
  erp_1c_rollout: 3,
  legacy_modernization: 3,
  document_management: 3,
  observability_monitoring: 2,
};

export function numericParam(task: Task, key: string): number | undefined {
  const param = task.params?.find((entry) => entry.key === key);
  return typeof param?.value === 'number' ? param.value : undefined;
}

export function stringParam(task: Task, key: string): string | undefined {
  const param = task.params?.find((entry) => entry.key === key);
  return typeof param?.value === 'string' ? param.value : undefined;
}

/** Explicit unit count only when the archetype unit maps to a brief number. */
export function resolveUnitsCount(
  task: Task,
  archetypeId: string,
  datasets: Datasets,
): number | undefined {
  const archetype = datasets.archetypes.archetypes.find((entry) => entry.id === archetypeId);
  if (!archetype) return undefined;

  const explicitFp = numericParam(task, 'fp') ?? numericParam(task, 'function_points');
  if (archetype.unit === 'FP') {
    if (explicitFp !== undefined && explicitFp > 0) return explicitFp;
    const screens = numericParam(task, 'screens');
    if (screens !== undefined && screens > 0) {
      return Math.max(1, Math.round(screens * (FP_PER_SCREEN[archetype.id] ?? 3)));
    }
    return undefined;
  }

  const keys = UNIT_PARAM_KEYS[archetype.unit];
  if (!keys) return undefined;
  for (const key of keys) {
    const value = numericParam(task, key);
    if (value !== undefined && value > 0) return value;
  }
  return undefined;
}

export function fpCounts(task: Task): Partial<Record<FpComponent, number>> {
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

export function platformPdr(task: Task): string | undefined {
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
export function blendedInhouseRate(
  datasets: Datasets,
  byRole: EffortGrid['byRole'],
): number {
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
export function scaleWorkItems(items: WorkItem[], scale: number): WorkItem[] {
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

/**
 * Rescales the work items of each targeted stage so its expected hours equal
 * `target[stage]`. Stages absent from `target` are left untouched; stages with
 * no current expected hours are skipped to keep the result finite.
 *
 * @throws {RangeError} when a target value is not a finite number > 0.
 */
export function scaleWorkItemsByStage(
  items: WorkItem[],
  target: Record<number, number>,
): WorkItem[] {
  const targets = new Map<number, number>();
  for (const [key, value] of Object.entries(target)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`stageHours.${key} must be a finite number > 0, got ${value}`);
    }
    targets.set(Number(key), value);
  }
  if (targets.size === 0) return items;

  const current = new Map<number, number>();
  for (const item of items) {
    current.set(item.stage, (current.get(item.stage) ?? 0) + item.expectedHours);
  }

  const factors = new Map<number, number>();
  for (const [stage, targetHours] of targets) {
    const currentHours = current.get(stage) ?? 0;
    factors.set(stage, currentHours > 0 ? targetHours / currentHours : 1);
  }

  return items.map((item) => {
    const factor = factors.get(item.stage);
    if (factor === undefined || Math.abs(factor - 1) < 1e-9) return item;
    return {
      ...item,
      optimisticHours: item.optimisticHours * factor,
      mostLikelyHours: item.mostLikelyHours * factor,
      pessimisticHours: item.pessimisticHours * factor,
      expectedHours: item.expectedHours * factor,
      sigmaHours: item.sigmaHours * factor,
    };
  });
}

/**
 * Folds the WBS into the final effort grid by blending three methods —
 * A (WBS), B (FP-lite) and C (analogue converted at the blended rate).
 */
export function combineEffort(input: {
  task: Task;
  datasets: Datasets;
  workType: string;
  baseItems: WorkItem[];
  baseGrid: EffortGrid;
}): {
  effortGrid: EffortGrid;
  workItems: WorkItem[];
  combined: CombineMethodsResult;
  analogueEstimateResult: AnalogueEstimateResult | undefined;
} {
  const { task, datasets, workType, baseItems, baseGrid } = input;
  // Method A — WBS; B — FP-lite; C — analogue (converted to hours at the
  // blended in-house rate). C falls back to A when there is no corpus type.
  const methodA = baseGrid.p50Hours;
  const fp = fpLite({ counts: fpCounts(task), platform: platformPdr(task) });
  const methodB = fp.fp >= 20 ? fp.effortHours : methodA;
  const scopeKeys = ['flows', 'integrations', 'screens', 'reports', 'intents', 'scenarios', 'fp', 'function_points', 'control_points', 'sources', 'services'];
  const hasScope = workType === 'support' || scopeKeys.some((key) => (numericParam(task, key) ?? 0) > 0);
  const analogueType =
    workType === 'default' || !hasScope ? undefined : ANALOGUE_TYPE_BY_WORK_TYPE[workType];
  const publishedAnalogues = datasets.analogues.analogues.map((row) => ({
    id: row.id,
    project_type: row.project_type,
    title: row.title,
    year: row.year,
    currency: row.currency === 'USD' ? ('USD' as const) : ('RUB' as const),
    price_low: row.price_low,
    price_mid: row.price_mid,
    price_high: row.price_high,
    source: row.source,
    price_basis: row.price_basis,
  }));
  const analogues =
    workType === 'support'
      ? [...publishedAnalogues, ...supportAnaloguesFromContracts(datasets.contracts)]
      : publishedAnalogues;
  const analogueEstimateResult =
    analogueType === undefined ? undefined : analogueEstimate({ workType, analogues });
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

  return { effortGrid, workItems, combined, analogueEstimateResult };
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

export function hashInput(
  task: Task,
  seed: number,
  datasetVersion: string,
  options: EstimateTaskOptions,
): string {
  return createHash('sha256')
    .update(stableStringify({ task, seed, datasetVersion, options }), 'utf8')
    .digest('hex');
}

export function pickHiringRole(
  byRole: EffortByRole[],
): { roleId: string; grade: Grade } | undefined {
  if (byRole.length === 0) return undefined;
  const preferred =
    byRole.find((entry) => entry.roleId === '1c_developer') ??
    byRole.reduce((best, entry) => (entry.hours > best.hours ? entry : best));
  return { roleId: preferred.roleId, grade: preferred.grade };
}
