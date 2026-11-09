/**
 * Shared fixtures and assertions for the core invariant tests
 * (`docs/05_architecture_data.md` §10).
 *
 * Every value here is deterministic: datasets are loaded from disk, all
 * Monte-Carlo runs use fixed seeds, and the pseudo-random generator used for
 * the method-combination sweep is a local LCG (never `Math.random()`).
 */

import type { CostLine, EffortGrid, WorkItem } from '@app/contract';
import type { LoadedDatasets, RoleCard } from '@app/data';
import { loadDatasets } from '@app/data';
import { expect } from 'vitest';
import { costContractor } from './cost/contractor.js';
import { PRODUCTIVE_HOURS_PER_MONTH, costInhouse, type EffortByRole } from './cost/inhouse.js';
import { toStageGrid } from './cost/stageGrid.js';
import { D1_FLOWS, d1Task } from './fixtures/d1.js';
import { buildWbs } from './sizing/wbs.js';

/** Relative tolerance for "in [min, max]" checks on derived weighted means. */
export const EPSILON = 1e-9;
/** Rounding tolerance for money conservation ("±1 ₽"). */
export const RUB_TOLERANCE = 1;

export function sumExpectedHours(items: WorkItem[]): number {
  return items.reduce((sum, item) => sum + item.expectedHours, 0);
}

export function sumValues(lines: CostLine[]): number {
  return lines.reduce((sum, line) => sum + line.valueRub, 0);
}

export function sumLabor(lines: CostLine[]): number {
  return lines.reduce((sum, line) => (line.group === 'labor' ? sum + line.valueRub : sum), 0);
}

/** Asserts that every number nested anywhere in `value` is finite (no NaN/Infinity). */
export function expectNoNonFinite(value: unknown, path = 'root'): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value), `${path} is not finite: ${value}`).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => expectNoNonFinite(entry, `${path}[${index}]`));
    return;
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(record)) {
      expectNoNonFinite(entry, `${path}.${key}`);
    }
  }
}

/** Doubles every fully-loaded hourly and monthly rate in a cloned card set. */
export function doubleRateCards(roles: RoleCard[]): RoleCard[] {
  return structuredClone(roles).map((role) => ({
    ...role,
    grades: role.grades.map((grade) => ({
      ...grade,
      fully_loaded_hour: grade.fully_loaded_hour * 2,
      fully_loaded_month: grade.fully_loaded_month * 2,
    })),
  }));
}

/**
 * Local deterministic linear congruential generator. Kept inside the test so the
 * invariant does not depend on the production PRNG.
 */
export function makeLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

export interface SharedInvariantState {
  datasets: LoadedDatasets;
  workItems: WorkItem[];
  grid: EffortGrid;
  effortByRole: EffortByRole[];
  months: number;
  inhouseLines: CostLine[];
  contractorLines: CostLine[];
}

export async function buildShared(): Promise<SharedInvariantState> {
  const datasets = await loadDatasets();
  const workItems = buildWbs(d1Task, datasets.archetypes.archetypes, { unitsCount: D1_FLOWS });
  const grid = toStageGrid(workItems);
  const effortByRole: EffortByRole[] = grid.byRole.map((entry) => ({
    roleId: entry.roleId,
    grade: entry.grade,
    hours: entry.hours,
  }));
  const months = Math.max(1, Math.ceil(grid.totalHours / PRODUCTIVE_HOURS_PER_MONTH));

  const inhouseLines = costInhouse({
    effortByRole,
    rateCards: datasets.rateCards.roles,
    opts: {
      hiring: { roleId: '1c_developer', grade: 'middle' },
      utilization: 0.7,
      turnoverRate: 0.13,
      months,
    },
  });
  const contractorLines = costContractor({
    effortByRole,
    bands: datasets.contractorRates.bands,
    opts: { geo: 'RU', model: 'fixed_price', vat: true },
  });

  return { datasets, workItems, grid, effortByRole, months, inhouseLines, contractorLines };
}
