import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDatasets } from './loaders.js';
import { buildQualityReport } from './quality.js';
import type { Datasets } from './types.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function requireFirst<T>(items: readonly T[]): T {
  const [first] = items;
  if (first === undefined) {
    throw new Error('expected at least one item');
  }
  return first;
}

async function loadRealDatasets(): Promise<Datasets> {
  return loadDatasets(repositoryRoot);
}

describe('buildQualityReport', () => {
  it('reports all six datasets with no errors for the real data', async () => {
    const report = buildQualityReport(await loadRealDatasets());

    expect(report.aggregate.errors).toBe(0);
    expect(report.datasets).toHaveLength(6);
    expect(report.datasetVersion).toMatch(/^[0-9a-f]{64}$/);
    expect(report.aggregate.rowsOk).toBe(report.aggregate.rowsTotal);
  });

  it('drops one row when an archetype p50 no longer equals its most_likely', async () => {
    const data = structuredClone(await loadRealDatasets());
    const archetype = requireFirst(data.archetypes.archetypes);
    archetype.p50_hours_per_unit = archetype.three_point.most_likely + 1;

    const report = buildQualityReport(data);

    expect(report.aggregate.errors).toBe(1);
    const archetypes = report.datasets.find((dataset) => dataset.dataset === 'archetypes');
    expect(archetypes?.rowsDropped).toHaveLength(1);
  });
});
