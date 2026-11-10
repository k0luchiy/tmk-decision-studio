import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDatasets, loadManifest } from './loaders.js';
import { computeManifest, datasetVersion } from './manifest.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

describe('loadDatasets', () => {
  it('loads all six source datasets with the expected row counts', async () => {
    const datasets = await loadDatasets();

    expect(datasets.rateCards.roles).toHaveLength(14);
    expect(datasets.contractorRates.bands).toHaveLength(224);
    expect(datasets.archetypes.archetypes).toHaveLength(23);
    expect(datasets.analogues.analogues).toHaveLength(49);
    expect(datasets.analogues.tmk_eis_rows).toHaveLength(60);
    expect(datasets.contracts).toHaveLength(60);
    expect(datasets.coefficients.meta.file).toBe('coefficients.json');
  });

  it('does not mutate the datasets between calls', async () => {
    const first = await loadDatasets();
    const second = await loadDatasets();

    expect(second.rateCards.roles.map((role) => role.role_id)).toEqual(
      first.rateCards.roles.map((role) => role.role_id),
    );
    expect(second.contracts).toEqual(first.contracts);
    expect(second).not.toBe(first);
  });
});

describe('manifest', () => {
  it('returns a deterministic 64-hex dataset version', async () => {
    const first = await computeManifest(repositoryRoot);
    const second = await computeManifest(repositoryRoot);

    expect(datasetVersion(first)).toMatch(/^[0-9a-f]{64}$/);
    expect(first.datasetVersion).toBe(datasetVersion(first));
    expect(second.datasetVersion).toBe(first.datasetVersion);
  });

  it('loads the generated data/manifest.json when present', async () => {
    const stored = await loadManifest();
    const computed = await computeManifest(repositoryRoot);

    expect(stored).not.toBeNull();
    expect(stored?.files).toHaveLength(6);
    expect(stored?.datasetVersion).toBe(computed.datasetVersion);
  });
});
