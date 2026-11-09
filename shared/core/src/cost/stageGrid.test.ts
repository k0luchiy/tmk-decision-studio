import type { CostLine, WorkItem } from '@app/contract';
import { loadDatasets } from '@app/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { D1_FLOWS, d1Task } from '../fixtures/d1.js';
import { buildWbs } from '../sizing/wbs.js';
import { costExtras } from './extras.js';
import { P10_Z, P80_Z, allocateCostByStage, toStageGrid } from './stageGrid.js';

let workItems: WorkItem[];

beforeAll(async () => {
  const datasets = await loadDatasets();
  workItems = buildWbs(d1Task, datasets.archetypes.archetypes, {
    unitsCount: D1_FLOWS,
  });
});

describe('toStageGrid', () => {
  it('keeps p10 <= p50 <= p80 <= p90 and sets totalHours to p50', () => {
    const grid = toStageGrid(workItems);

    expect(grid.p10Hours).toBeLessThanOrEqual(grid.p50Hours);
    expect(grid.p50Hours).toBeLessThanOrEqual(grid.p80Hours);
    expect(grid.p80Hours).toBeLessThanOrEqual(grid.p90Hours);
    expect(grid.totalHours).toBe(grid.p50Hours);
  });

  it('derives p50 and sigma from the WBS work items', () => {
    const grid = toStageGrid(workItems);
    const expected = workItems.reduce((sum, item) => sum + item.expectedHours, 0);
    const sigma = Math.sqrt(workItems.reduce((sum, item) => sum + item.sigmaHours ** 2, 0));

    expect(grid.p50Hours).toBeCloseTo(expected, 9);
    expect(grid.p10Hours).toBeCloseTo(Math.max(0, expected - P10_Z * sigma), 9);
    expect(grid.p80Hours).toBeCloseTo(expected + P80_Z * sigma, 9);
    expect(grid.p90Hours).toBeCloseTo(expected + P10_Z * sigma, 9);
  });

  it('builds six stages and aggregates role hours that reconcile with p50', () => {
    const grid = toStageGrid(workItems);

    expect(grid.byStage.map((entry) => entry.stage)).toEqual([1, 2, 3, 4, 5, 6]);

    const stageHours = grid.byStage.reduce((sum, entry) => sum + entry.hours, 0);
    expect(stageHours).toBeCloseTo(grid.p50Hours, 9);

    const roleHours = grid.byRole.reduce((sum, entry) => sum + entry.hours, 0);
    expect(roleHours).toBeCloseTo(grid.p50Hours, 9);

    for (const stage of grid.byStage) {
      const stageRoleHours = stage.byRole.reduce((sum, entry) => sum + entry.hours, 0);
      expect(stageRoleHours).toBeCloseTo(stage.hours, 9);
      expect(stage.hours).toBeGreaterThan(0);
    }
  });

  it('splits each work item by its role mix', () => {
    const grid = toStageGrid(workItems);
    const item = workItems[0];
    if (!item) {
      throw new Error('expected at least one work item');
    }
    const totalRoleHours = item.roleMix.reduce((sum, role) => sum + role.share, 0);
    expect(totalRoleHours).toBe(100);

    const firstStage = grid.byStage.find((entry) => entry.stage === item.stage);
    expect(firstStage?.hours).toBeCloseTo(item.expectedHours, 9);
  });
});

describe('allocateCostByStage', () => {
  it('spreads the total cost proportionally to stage hours', () => {
    const lines = costExtras([
      { id: 'licenses', label: 'Лицензии', qty: 10, unitPriceRub: 8000 },
      { id: 'cloud', label: 'Облако', qty: 1, unitPriceRub: 120_000, months: 2 },
    ]);
    const total = lines.reduce((sum, line) => sum + line.valueRub, 0);

    const allocation = allocateCostByStage(workItems, lines);

    expect(allocation).toHaveLength(6);
    const allocated = allocation.reduce((sum, entry) => sum + entry.costRub, 0);
    expect(Math.abs(allocated - total)).toBeLessThanOrEqual(1);

    const grid = toStageGrid(workItems);
    for (const entry of allocation) {
      const stage = grid.byStage.find((candidate) => candidate.stage === entry.stage);
      expect(entry.hours).toBeCloseTo(stage?.hours ?? 0, 9);
      expect(entry.costRub).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps the total when a cost line list is empty', () => {
    const allocation = allocateCostByStage(workItems, []);
    expect(allocation.reduce((sum, entry) => sum + entry.costRub, 0)).toBe(0);
  });

  it('returns no stages for an empty WBS', () => {
    const lines: CostLine[] = [];
    expect(allocateCostByStage([], lines)).toEqual([]);
  });
});
