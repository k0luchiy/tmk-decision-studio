import { describe, expect, it } from 'vitest';
import { EstimateSchema, type Task } from '@app/contract';
import { loadDatasets } from '@app/data';
import { d1Task } from './fixtures/d1.js';
import { estimateTask } from './pipeline.js';
import { SIMULATION_ITERATIONS } from './pipeline/types.js';

async function datasets() {
  return loadDatasets();
}

const datasetVersion = 'test-version';

function supportTask(): Task {
  return {
    id: 'support-demo',
    title: 'Сопровождение учётной системы',
    descriptionRaw: 'Сопровождение и поддержка учётной системы, 24/7, SLA 99,9%',
    briefVersion: '1.0',
    createdAt: '2026-11-09',
    params: [
      {
        key: 'work_type',
        value: 'support',
        unit: '',
        confidence: 1,
        status: 'confirmed',
        defaultUsed: false,
      },
      {
        key: 'duration',
        value: 12,
        unit: 'мес',
        confidence: 1,
        status: 'confirmed',
        defaultUsed: false,
      },
    ],
  };
}

describe('estimateTask', () => {
  it('builds three schema-valid scenarios with ordered quantiles', async () => {
    const result = estimateTask({
      task: d1Task,
      datasets: await datasets(),
      seed: 42,
      datasetVersion,
      options: { hiring: true, model: 'fixed_price' },
    });

    for (const estimate of Object.values(result.estimates)) {
      expect(() => EstimateSchema.parse(estimate)).not.toThrow();
      expect(estimate.currency).toBe('RUB');
      expect(estimate.datasetVersion).toBe(datasetVersion);
      expect(estimate.seed).toBe(42);
      expect(estimate.methodWeights).toEqual({ a: 0.5, b: 0.2, c: 0.3 });
      expect(estimate.effort.p10Hours).toBeLessThanOrEqual(estimate.effort.p50Hours);
      expect(estimate.effort.p80Hours).toBeLessThanOrEqual(estimate.effort.p90Hours);
      expect(estimate.cost.p10Rub).toBeLessThanOrEqual(estimate.cost.p50Rub);
      expect(estimate.cost.p80Rub).toBeLessThanOrEqual(estimate.cost.p90Rub);
      expect(estimate.cost.reserveRub).toBeCloseTo(
        estimate.cost.p80Rub - estimate.cost.p50Rub,
        6,
      );
      expect(estimate.formulaTree.kind).toBe('total');
      expect(estimate.tco.length).toBeGreaterThan(1);
      expect(estimate.assumptions.length).toBeGreaterThan(0);
      expect(estimate.risks.length).toBeGreaterThan(0);
    }

    expect(result.estimates.hybrid.taskId).toBe(d1Task.id);
    expect(result.effortGrid.totalHours).toBeGreaterThan(0);
    expect(result.formulaTree.valueRub).toBeCloseTo(
      result.estimates.inhouse.cost.lines.reduce((sum, line) => sum + line.valueRub, 0),
      6,
    );
    expect(['inhouse', 'contractor', 'hybrid', 'parity']).toContain(result.verdict.code);
    expect(result.confidence.score).toBeGreaterThanOrEqual(0);
    expect(result.confidence.score).toBeLessThanOrEqual(100);
    expect(result.sensitivity.length).toBeGreaterThan(0);
    expect(result.distribution).toHaveLength(11);
    expect(result.distribution.reduce((sum, bin) => sum + bin.count, 0)).toBe(
      SIMULATION_ITERATIONS,
    );
    const winner = result.estimates[result.verdict.code === 'contractor' ? 'contractor' : result.verdict.code === 'inhouse' ? 'inhouse' : 'hybrid'];
    expect(result.distribution[5]?.value).toBeGreaterThan(0);
    expect(winner.cost.p50Rub).toBeGreaterThan(0);
  });

  it('is deterministic for the same input and seed', async () => {
    const data = await datasets();
    const first = estimateTask({
      task: d1Task,
      datasets: data,
      seed: 7,
      datasetVersion,
    });
    const second = estimateTask({
      task: d1Task,
      datasets: data,
      seed: 7,
      datasetVersion,
    });

    expect(second).toEqual(first);
  });

  it('produces a valid estimate for a stage-7 support task', async () => {
    const result = estimateTask({
      task: supportTask(),
      datasets: await datasets(),
      seed: 3,
      datasetVersion,
    });

    expect(result.effortGrid.byStage.map((stage) => stage.stage)).toEqual([7]);
    expect(result.estimates.inhouse.effort.p50Hours).toBeGreaterThan(0);
    expect(() => EstimateSchema.parse(result.estimates.hybrid)).not.toThrow();
  });
});
