import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDatasets } from './loaders.js';
import type { Datasets } from './types.js';
import { validateDatasets, type ValidationIssue } from './validators.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function cloneDatasets(data: Datasets): Datasets {
  return structuredClone(data);
}

function requireFirst<T>(items: readonly T[]): T {
  const [first] = items;
  if (first === undefined) {
    throw new Error('expected at least one item');
  }
  return first;
}

function findIssue(issues: ValidationIssue[], code: string, path: string): ValidationIssue | undefined {
  return issues.find((issue) => issue.code === code && issue.path === path);
}

async function loadRealDatasets(): Promise<Datasets> {
  return loadDatasets(repositoryRoot);
}

describe('validateDatasets', () => {
  it('reports no errors for the real datasets', async () => {
    const issues = validateDatasets(await loadRealDatasets());

    expect(issues.filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('flags p50_hours_per_unit that differs from three_point.most_likely', async () => {
    const data = cloneDatasets(await loadRealDatasets());
    const archetype = requireFirst(data.archetypes.archetypes);
    archetype.p50_hours_per_unit = archetype.three_point.most_likely + 1;

    const issues = validateDatasets(data);

    expect(
      findIssue(issues, 'ARCHETYPE_P50_MISMATCH', 'archetypes.archetypes[0].p50_hours_per_unit'),
    ).toMatchObject({
      code: 'ARCHETYPE_P50_MISMATCH',
      severity: 'error',
      path: 'archetypes.archetypes[0].p50_hours_per_unit',
    });
  });

  it('flags a contractor band where rate_mid is greater than rate_high', async () => {
    const data = cloneDatasets(await loadRealDatasets());
    const band = requireFirst(data.contractorRates.bands);
    band.rate_mid = band.rate_high + 1;

    const issues = validateDatasets(data);

    expect(findIssue(issues, 'RATE_BAND_ORDER', 'contractorRates.bands[0].rate_mid')).toMatchObject({
      code: 'RATE_BAND_ORDER',
      severity: 'error',
      path: 'contractorRates.bands[0].rate_mid',
    });
  });

  it('flags a role mix whose shares sum to 90', async () => {
    const data = cloneDatasets(await loadRealDatasets());
    const mix = requireFirst(data.archetypes.archetypes).default_role_mix_pct;
    const roleId = Object.keys(mix)[0];
    if (roleId === undefined) {
      throw new Error('expected a role in the first archetype mix');
    }
    mix[roleId] = (mix[roleId] ?? 0) - 10;

    const issues = validateDatasets(data);

    expect(findIssue(issues, 'ROLE_MIX_SUM', 'archetypes.archetypes[0].default_role_mix_pct')).toMatchObject({
      code: 'ROLE_MIX_SUM',
      severity: 'error',
      path: 'archetypes.archetypes[0].default_role_mix_pct',
    });
  });

  it('flags a contractor band with vat_included set to true', async () => {
    const data = cloneDatasets(await loadRealDatasets());
    requireFirst(data.contractorRates.bands).vat_included = true;

    const issues = validateDatasets(data);

    expect(findIssue(issues, 'VAT_FLAG', 'contractorRates.bands[0].vat_included')).toMatchObject({
      code: 'VAT_FLAG',
      severity: 'error',
      path: 'contractorRates.bands[0].vat_included',
    });
  });

  it('allows Data Hub to grow the analogue corpus beyond 49 rows', async () => {
    const data = cloneDatasets(await loadRealDatasets());
    const first = requireFirst(data.analogues.analogues);
    data.analogues.analogues.push({ ...first, id: 'published-test' });

    const issues = validateDatasets(data);

    expect(issues.filter((issue) => issue.code === 'ANALOGUE_COUNT')).toEqual([]);
  });

  it('flags an analogue with an empty source', async () => {
    const data = cloneDatasets(await loadRealDatasets());
    requireFirst(data.analogues.analogues).source = '';

    const issues = validateDatasets(data);

    expect(findIssue(issues, 'ANALOGUE_SOURCE_MISSING', 'analogues.analogues[0].source')).toMatchObject({
      code: 'ANALOGUE_SOURCE_MISSING',
      severity: 'error',
      path: 'analogues.analogues[0].source',
    });
  });
});
