import { describe, expect, it } from 'vitest';
import { EstimateSchema } from './index.js';
import type { Estimate } from './index.js';
import d1EstimateJson from '../mock/d1.estimate.json';
import d1ScenariosJson from '../mock/d1.scenarios.json';

function parseEstimate(raw: unknown): Estimate {
  const result = EstimateSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.issues, null, 2));
  }
  return result.data;
}

function countFormulaNodes(node: Estimate['formulaTree']): number {
  const children = node.children ?? [];
  return 1 + children.reduce((sum, child) => sum + countFormulaNodes(child), 0);
}

function expectEstimateInvariants(estimate: Estimate): void {
  // cost.lines must add up to the P50 total (tolerance ±1 ₽ for rounding).
  const linesSum = estimate.cost.lines.reduce((sum, line) => sum + line.valueRub, 0);
  expect(Math.abs(linesSum - estimate.cost.p50Rub)).toBeLessThanOrEqual(1);

  // TCO must be strictly cumulative.
  estimate.tco.forEach((row, index) => {
    const previous = index === 0 ? 0 : estimate.tco[index - 1]?.cumulativeRub;
    expect(previous).toBeDefined();
    expect(row.cumulativeRub).toBeCloseTo((previous ?? 0) + row.costRub, 6);
  });

  // Confidence weights must sum to 1.
  const weightSum = estimate.confidence.components.reduce(
    (sum, component) => sum + component.weight,
    0,
  );
  expect(weightSum).toBeCloseTo(1, 9);

  // Break-even is either null or an integer month within the 1..36 horizon.
  if (estimate.breakevenMonth !== null) {
    expect(Number.isInteger(estimate.breakevenMonth)).toBe(true);
    expect(estimate.breakevenMonth).toBeGreaterThanOrEqual(1);
    expect(estimate.breakevenMonth).toBeLessThanOrEqual(36);
  }
}

describe('D1 mock: single estimate (hybrid)', () => {
  it('parses against EstimateSchema', () => {
    expect(EstimateSchema.safeParse(d1EstimateJson).success).toBe(true);
  });

  it('satisfies sums, TCO cumulativity, confidence weights and break-even', () => {
    expectEstimateInvariants(parseEstimate(d1EstimateJson));
  });

  it('is the hybrid scenario for task d1', () => {
    const estimate = parseEstimate(d1EstimateJson);
    expect(estimate.taskId).toBe('d1');
    expect(estimate.scenario).toBe('hybrid');
    expect(estimate.verdict.code).toBe('hybrid');
  });
});

describe('D1 mock: three scenarios', () => {
  it('parses every scenario against EstimateSchema', () => {
    expect(Array.isArray(d1ScenariosJson)).toBe(true);
    for (const raw of d1ScenariosJson) {
      expect(EstimateSchema.safeParse(raw).success).toBe(true);
    }
  });

  it('contains exactly inhouse, contractor and hybrid for task d1', () => {
    const scenarios = d1ScenariosJson.map((raw) => parseEstimate(raw));
    expect(scenarios).toHaveLength(3);
    expect(scenarios.map((estimate) => estimate.scenario).sort()).toEqual([
      'contractor',
      'hybrid',
      'inhouse',
    ]);
    for (const estimate of scenarios) {
      expect(estimate.taskId).toBe('d1');
    }
  });

  it('uses distinct ids but a shared dataset version, input hash and seed', () => {
    const scenarios = d1ScenariosJson.map((raw) => parseEstimate(raw));
    const ids = scenarios.map((estimate) => estimate.id);
    expect(new Set(ids).size).toBe(3);
    const datasetVersions = new Set(scenarios.map((estimate) => estimate.datasetVersion));
    const inputHashes = new Set(scenarios.map((estimate) => estimate.inputHash));
    const seeds = new Set(scenarios.map((estimate) => estimate.seed));
    expect(datasetVersions.size).toBe(1);
    expect(inputHashes.size).toBe(1);
    expect(seeds.size).toBe(1);
  });

  it('satisfies sums, TCO cumulativity, confidence weights and break-even per scenario', () => {
    for (const raw of d1ScenariosJson) {
      expectEstimateInvariants(parseEstimate(raw));
    }
  });
});

describe('D1 mock: effort grid, TCO year 0, formula tree', () => {
  it('parses formulaTree and contains at least 3 nodes', () => {
    expect(EstimateSchema.safeParse(d1EstimateJson).success).toBe(true);
    const estimate = parseEstimate(d1EstimateJson);
    expect(countFormulaNodes(estimate.formulaTree)).toBeGreaterThanOrEqual(3);
  });

  it('effort.grid.byStage hours sum to effort.grid.totalHours', () => {
    const scenarios = [d1EstimateJson, ...d1ScenariosJson].map((raw) => parseEstimate(raw));
    for (const estimate of scenarios) {
      const stageSum = estimate.effort.grid.byStage.reduce((sum, stage) => sum + stage.hours, 0);
      expect(stageSum).toBeCloseTo(estimate.effort.grid.totalHours, 6);
    }
  });

  it('tco starts at year 0 (implementation)', () => {
    expect(parseEstimate(d1EstimateJson).tco[0]?.year).toBe(0);
    for (const raw of d1ScenariosJson) {
      expect(parseEstimate(raw).tco[0]?.year).toBe(0);
    }
  });
});
