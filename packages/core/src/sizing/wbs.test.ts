import type { Task } from '@app/contract';
import { loadDatasets } from '@app/data';
import { describe, expect, it } from 'vitest';
import { STAGE_SHARES, stageSharesSum } from './stageShares.js';
import { buildWbs, WORK_TYPE_TO_ARCHETYPE } from './wbs.js';

const datasets = await loadDatasets();
const archetypes = datasets.archetypes.archetypes;

function makeTask(workType: string): Task {
  return {
    id: `task-${workType}`,
    title: 'Демо-задача',
    descriptionRaw: '',
    briefVersion: '1.0',
    createdAt: '2026-11-09',
    params: [
      {
        key: 'work_type',
        value: workType,
        unit: '',
        confidence: 1,
        status: 'confirmed',
        defaultUsed: false,
      },
    ],
  };
}

describe('stage shares', () => {
  it('sum to exactly one', () => {
    expect(stageSharesSum()).toBe(1);
    expect(Object.values(STAGE_SHARES)).toHaveLength(6);
  });
});

describe('buildWbs', () => {
  it('builds six stages for a D1 integration with positive effort and full role mix', () => {
    const items = buildWbs(makeTask('integration'), archetypes, { unitsCount: 6 });

    expect(WORK_TYPE_TO_ARCHETYPE.integration).toBe('integration_1c_wms');
    expect(items).toHaveLength(6);
    expect(items.map((item) => item.stage)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(items.every((item) => item.expectedHours > 0)).toBe(true);
    for (const item of items) {
      const roleShareTotal = item.roleMix.reduce((total, role) => total + role.share, 0);
      expect(roleShareTotal).toBe(100);
      expect(item.assumption).toBe(false);
      expect(item.unitsCount).toBe(6);
      expect(item.sourceRefs).toEqual(['archetype:integration_1c_wms']);
      expect(item.id).toBe(`integration_1c_wms:s${item.stage}`);
    }
  });

  it('keeps O <= M <= P for every work item', () => {
    const items = buildWbs(makeTask('integration'), archetypes, { unitsCount: 6 });

    for (const item of items) {
      expect(item.optimisticHours).toBeLessThanOrEqual(item.mostLikelyHours);
      expect(item.mostLikelyHours).toBeLessThanOrEqual(item.pessimisticHours);
    }
  });

  it('maps support to a single stage-7 item', () => {
    const items = buildWbs(makeTask('support'), archetypes);

    expect(WORK_TYPE_TO_ARCHETYPE.support).toBe('l2_l3_support');
    expect(items).toHaveLength(1);
    expect(items[0]?.stage).toBe(7);
    expect(items[0]?.archetypeId).toBe('l2_l3_support');
    expect(items[0]?.expectedHours).toBeGreaterThan(0);
  });

  it('returns zero-hour assumption items for a zero unit count without throwing', () => {
    expect(() => buildWbs(makeTask('integration'), archetypes, { unitsCount: 0 })).not.toThrow();

    const items = buildWbs(makeTask('integration'), archetypes, { unitsCount: 0 });

    expect(items).toHaveLength(6);
    for (const item of items) {
      expect(item.assumption).toBe(true);
      expect(item.optimisticHours).toBe(0);
      expect(item.mostLikelyHours).toBe(0);
      expect(item.pessimisticHours).toBe(0);
      expect(item.expectedHours).toBe(0);
      expect(item.sigmaHours).toBe(0);
    }
  });
});
