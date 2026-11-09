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
  const keys = archetype ? UNIT_PARAM_KEYS[archetype.unit] : undefined;
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
  combined: CombineMethodsResult;
  analogueEstimateResult: AnalogueEstimateResult | undefined;
} {
  const { task, datasets, workType, baseItems, baseGrid } = input;
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

  return { effortGrid, combined, analogueEstimateResult };
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
