/**
 * Stage grid and stage-level cost allocation (`docs/03_estimation_model.md`
 * §4, §5).
 *
 * `toStageGrid` folds a WBS into the `EffortGrid` the contract expects: P50 is
 * the sum of expected hours, sigma is the root-sum-square of the item sigmas,
 * and the P10/P80/P90 bounds use the normal quantiles `1.2816` / `0.8416`.
 * `allocateCostByStage` spreads a set of cost lines across stages in proportion
 * to stage hours and keeps the total intact (±1 ₽).
 */

import type { CostLine, EffortGrid, Grade, WorkItem } from '@app/contract';

/** Upper normal quantile `z` for P10 / P90 (`1.2816`). */
export const P10_Z = 1.2816;
/** Upper normal quantile `z` for P80 (`0.8416`). */
export const P80_Z = 0.8416;

interface RoleHours {
  roleId: string;
  grade: Grade;
  hours: number;
}

interface StageAccumulator {
  stage: number;
  hours: number;
  byRole: Map<string, RoleHours>;
}

function roleKey(roleId: string, grade: Grade): string {
  return `${roleId}:${grade}`;
}

function addRoleHours(target: Map<string, RoleHours>, role: WorkItem['roleMix'][number], hours: number): void {
  const key = roleKey(role.roleId, role.grade);
  const existing = target.get(key);
  if (existing) {
    existing.hours += hours;
    return;
  }
  target.set(key, { roleId: role.roleId, grade: role.grade, hours });
}

function toRoleArray(target: Map<string, RoleHours>): RoleHours[] {
  return [...target.values()].map((entry) => ({ ...entry }));
}

/**
 * Builds the effort grid from WBS work items.
 *
 * - `p50Hours = Σ expectedHours`
 * - `sigma = √Σ sigmaHours²`
 * - `p10 = max(0, p50 − 1.2816σ)`, `p80 = p50 + 0.8416σ`, `p90 = p50 + 1.2816σ`
 * - `byStage` groups expected hours per stage and splits each item by role mix.
 * - `byRole` aggregates role hours across all stages.
 * - `totalHours = p50Hours`
 */
export function toStageGrid(workItems: WorkItem[]): EffortGrid {
  let p50Hours = 0;
  let variance = 0;
  const stages = new Map<number, StageAccumulator>();
  const roles = new Map<string, RoleHours>();

  for (const item of workItems) {
    p50Hours += item.expectedHours;
    variance += item.sigmaHours * item.sigmaHours;

    let stage = stages.get(item.stage);
    if (!stage) {
      stage = { stage: item.stage, hours: 0, byRole: new Map() };
      stages.set(item.stage, stage);
    }
    stage.hours += item.expectedHours;

    for (const role of item.roleMix) {
      const hours = (item.expectedHours * role.share) / 100;
      addRoleHours(stage.byRole, role, hours);
      addRoleHours(roles, role, hours);
    }
  }

  const sigma = Math.sqrt(variance);
  const p10Hours = Math.max(0, p50Hours - P10_Z * sigma);
  const p80Hours = p50Hours + P80_Z * sigma;
  const p90Hours = p50Hours + P10_Z * sigma;

  const byStage = [...stages.values()]
    .sort((a, b) => a.stage - b.stage)
    .map((entry) => ({
      stage: entry.stage,
      hours: entry.hours,
      byRole: toRoleArray(entry.byRole),
    }));

  return {
    p10Hours,
    p50Hours,
    p80Hours,
    p90Hours,
    byStage,
    byRole: toRoleArray(roles),
    totalHours: p50Hours,
  };
}

/** One stage slice of the total cost. */
export interface StageCost {
  stage: number;
  hours: number;
  costRub: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Allocates the sum of `costLines` across stages in proportion to stage hours.
 *
 * The stage hours come from `Σ expectedHours` per stage. The returned
 * `costRub` values sum to `Σ valueRub` to the rouble (±1 ₽); when all stage
 * hours are zero the whole amount lands on the first stage so no cost is lost.
 */
export function allocateCostByStage(
  workItems: WorkItem[],
  costLines: CostLine[],
): StageCost[] {
  const stageHours = new Map<number, number>();
  for (const item of workItems) {
    stageHours.set(item.stage, (stageHours.get(item.stage) ?? 0) + item.expectedHours);
  }

  const stages = [...stageHours.entries()]
    .map(([stage, hours]) => ({ stage, hours }))
    .sort((a, b) => a.stage - b.stage);

  if (stages.length === 0) {
    return [];
  }

  const totalCost = costLines.reduce((sum, line) => sum + line.valueRub, 0);
  const totalHours = stages.reduce((sum, entry) => sum + entry.hours, 0);

  if (totalHours <= 0) {
    return stages.map((entry, index) => ({
      stage: entry.stage,
      hours: entry.hours,
      costRub: index === 0 ? totalCost : 0,
    }));
  }

  const rounded = stages.map((entry) => round2((totalCost * entry.hours) / totalHours));
  const allocated = rounded.reduce((sum, value) => sum + value, 0);
  const last = rounded.length - 1;
  rounded[last] = round2((rounded[last] ?? 0) + (totalCost - allocated));

  return stages.map((entry, index) => ({
    stage: entry.stage,
    hours: entry.hours,
    costRub: rounded[index] ?? 0,
  }));
}
