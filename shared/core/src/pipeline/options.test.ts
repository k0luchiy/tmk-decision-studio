import { beforeAll, describe, expect, it } from 'vitest';
import { loadDatasets } from '@app/data';
import type { LoadedDatasets } from '@app/data';
import { d1Task } from '../fixtures/d1.js';
import { estimateTask } from '../pipeline.js';
import type { EstimateTaskOptions } from './types.js';

const datasetVersion = 'test-version';

let datasets: LoadedDatasets;

beforeAll(async () => {
  datasets = await loadDatasets();
});

function run(options?: EstimateTaskOptions) {
  return estimateTask({ task: d1Task, datasets, seed: 42, datasetVersion, options });
}

function ratio(next: number, base: number): number {
  return next / base;
}

describe('estimateTask UI parity options', () => {
  it('raises in-house p50 with teamRate and leaves contractor untouched', () => {
    const base = run();
    const raised = run({ teamRate: 9000 });

    expect(raised.estimates.inhouse.cost.p50Rub).toBeGreaterThan(
      base.estimates.inhouse.cost.p50Rub,
    );
    expect(raised.estimates.contractor.cost.p50Rub).toBe(base.estimates.contractor.cost.p50Rub);
  });

  it('scales all three p50 by 1 + reservePct', () => {
    const base = run();
    const reserved = run({ reservePct: 0.2 });

    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(ratio(reserved.estimates[key].cost.p50Rub, base.estimates[key].cost.p50Rub)).toBeCloseTo(
        1.2,
        6,
      );
    }
  });

  it('adds oversight to contractor/hybrid but not to in-house', () => {
    const base = run();
    const oversight = run({ oversightPct: 0.25 });

    expect(oversight.estimates.inhouse.cost.p50Rub).toBe(base.estimates.inhouse.cost.p50Rub);
    expect(oversight.estimates.contractor.cost.p50Rub).toBeGreaterThan(
      base.estimates.contractor.cost.p50Rub,
    );
    expect(oversight.estimates.hybrid.cost.p50Rub).toBeGreaterThan(
      base.estimates.hybrid.cost.p50Rub,
    );
  });

  it('overrides stage hours and keeps totals/quantiles consistent', () => {
    const base = run();
    const stage3 = base.effortGrid.byStage.find((entry) => entry.stage === 3);
    expect(stage3).toBeDefined();
    const target = (stage3?.hours ?? 0) * 2;

    const changed = run({ stageHours: { 3: target } });
    const changedStage3 = changed.effortGrid.byStage.find((entry) => entry.stage === 3);
    expect(changedStage3?.hours).toBeCloseTo(target, 6);
    expect(changed.effortGrid.totalHours).not.toBeCloseTo(base.effortGrid.totalHours, 6);

    const stageSum = changed.effortGrid.byStage.reduce((sum, entry) => sum + entry.hours, 0);
    expect(stageSum).toBeCloseTo(changed.effortGrid.totalHours, 6);
    expect(changed.effortGrid.p10Hours).toBeLessThanOrEqual(changed.effortGrid.p50Hours);
    expect(changed.effortGrid.p50Hours).toBeLessThanOrEqual(changed.effortGrid.p80Hours);
    expect(changed.effortGrid.p80Hours).toBeLessThanOrEqual(changed.effortGrid.p90Hours);
  });

  it('changes hybrid p50 when contractorStages shifts the split', () => {
    const base = run();
    const shifted = run({ contractorStages: [3, 4] });

    expect(shifted.estimates.hybrid.cost.p50Rub).not.toBeCloseTo(
      base.estimates.hybrid.cost.p50Rub,
      6,
    );
  });

  it('treats an empty contractorStages as a 100 % in-house hybrid', () => {
    const base = run();
    const empty = run({ contractorStages: [] });

    expect(empty.estimates.hybrid.cost.p50Rub).toBe(base.estimates.inhouse.cost.p50Rub);
  });

  it('rejects a non-positive stage target with RangeError', () => {
    expect(() => run({ stageHours: { 3: 0 } })).toThrow(RangeError);
  });

  it('compresses the deadline and adds a Putnam risk line to every scenario', () => {
    const base = run();
    const compressed = run({ targetWeeks: 10 });

    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(compressed.estimates[key].cost.p50Rub).toBeGreaterThan(
        base.estimates[key].cost.p50Rub,
      );
      expect(
        compressed.estimates[key].cost.lines.some(
          (line) => line.group === 'risk' && line.label.includes('Putnam'),
        ),
      ).toBe(true);
    }
  });

  it('adds extras to implementation only and keeps annual support unchanged', () => {
    const base = run();
    const extra = run({ extras: [{ label: 'Лицензии', amountRub: 100_000 }] });

    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(extra.estimates[key].cost.p50Rub).toBeCloseTo(
        base.estimates[key].cost.p50Rub + 100_000,
        6,
      );
      const baseSupport = base.estimates[key].tco.find((row) => row.year === 1)?.costRub;
      const extraSupport = extra.estimates[key].tco.find((row) => row.year === 1)?.costRub;
      expect(extraSupport).toBe(baseSupport);
    }
  });

  it('is deterministic with the same seed when extras and deadline are set', () => {
    const options: EstimateTaskOptions = {
      targetWeeks: 12,
      extras: [{ label: 'Облако', amountRub: 250_000, appliesTo: 'hybrid' }],
    };
    expect(run(options)).toEqual(run(options));
  });
});
