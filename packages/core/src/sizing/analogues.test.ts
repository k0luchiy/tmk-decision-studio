import type { AnalogueRow } from '@app/data';
import { loadDatasets } from '@app/data';
import { describe, expect, it } from 'vitest';
import {
  ANALOGUE_AGE_INDEX,
  ANALOGUE_TYPE_BY_WORK_TYPE,
  analogueEstimate,
  type RawAnalogue,
} from './analogues.js';

const datasets = await loadDatasets();

function toRaw(row: AnalogueRow): RawAnalogue {
  return {
    id: row.id,
    project_type: row.project_type,
    title: row.title,
    year: row.year,
    currency: row.currency === 'USD' ? 'USD' : 'RUB',
    price_low: row.price_low,
    price_mid: row.price_mid,
    price_high: row.price_high,
    source: row.source,
    price_basis: row.price_basis,
  };
}

const raw = datasets.analogues.analogues.map(toRaw);

function findUsed(result: ReturnType<typeof analogueEstimate>, id: string): number | undefined {
  return result.used.find((row) => row.id === id)?.normalizedRub;
}

describe('analogueEstimate', () => {
  it('maps work types to corpus project types', () => {
    expect(ANALOGUE_TYPE_BY_WORK_TYPE.integration).toBe('erp_1c');
    expect(ANALOGUE_TYPE_BY_WORK_TYPE.erp).toBe('erp_1c');
    expect(ANALOGUE_TYPE_BY_WORK_TYPE.data).toBe('dwh_bi');
    expect(ANALOGUE_TYPE_BY_WORK_TYPE.cv).toBe('cv_qc');
    expect(ANALOGUE_TYPE_BY_WORK_TYPE.unknown).toBeUndefined();
  });

  it('uses at least three real ERP analogues and returns a positive median', () => {
    const result = analogueEstimate({ workType: 'erp', analogues: raw });

    expect(result.used.length).toBeGreaterThanOrEqual(3);
    expect(result.medianRub).not.toBeNull();
    expect(result.medianRub ?? 0).toBeGreaterThan(0);
    expect(result.p10Rub ?? 0).toBeGreaterThan(0);
    expect(result.p90Rub ?? 0).toBeGreaterThan(0);
    expect(result.p90Rub ?? 0).toBeGreaterThanOrEqual(result.p10Rub ?? 0);
    expect(result.sufficient).toBe(true);
  });

  it('excludes USD rows without FX and rows without a source', () => {
    const noSource: RawAnalogue = {
      id: 'test_no_source',
      project_type: 'dwh_bi',
      title: 'Synthetic row without provenance',
      year: 2024,
      currency: 'RUB',
      price_mid: 5_000_000,
    };

    const dwhRows = raw.filter((row) => row.project_type === 'dwh_bi');
    const result = analogueEstimate({
      workType: 'data',
      analogues: [...dwhRows, noSource],
    });

    expect(result.excluded).toContainEqual({ id: 'an_dwh_vtb24', reason: 'usd_no_fx' });
    expect(result.excluded).toContainEqual({ id: 'test_no_source', reason: 'no_source' });
    expect(result.used.some((row) => row.id === 'an_dwh_vtb24')).toBe(false);
    expect(result.used.some((row) => row.id === 'test_no_source')).toBe(false);
  });

  it('excludes rows without a usable price', () => {
    const result = analogueEstimate({ workType: 'mes', analogues: raw });

    expect(result.excluded).toContainEqual({
      id: 'an_mes_1c_full_scope',
      reason: 'no_price',
    });
  });

  it('stays positive but insufficient with a single analogue', () => {
    const single = raw.find((row) => row.id === 'an_1c_erp_small');
    expect(single).toBeDefined();

    const result = analogueEstimate({
      workType: 'erp',
      analogues: single === undefined ? [] : [single],
    });

    expect(result.sufficient).toBe(false);
    expect(result.used).toHaveLength(1);
    expect(result.medianRub ?? 0).toBeGreaterThan(0);
  });

  it('normalises an older analogue upward to the target year', () => {
    const base: RawAnalogue = {
      id: 'age_old',
      project_type: 'erp_1c',
      title: 'Older analogue',
      year: 2020,
      currency: 'RUB',
      price_mid: 1_000_000,
      source: 'https://example.test/old',
    };
    const fresh: RawAnalogue = { ...base, id: 'age_new', year: 2026 };

    const result = analogueEstimate({
      workType: 'erp',
      targetYear: 2026,
      analogues: [base, fresh],
    });

    const oldValue = findUsed(result, 'age_old');
    const newValue = findUsed(result, 'age_new');

    expect(oldValue).toBeDefined();
    expect(newValue).toBe(1_000_000);
    expect(oldValue ?? 0).toBeCloseTo(1_000_000 * Math.pow(ANALOGUE_AGE_INDEX, 6), 6);
    expect(oldValue ?? 0).toBeGreaterThan(newValue ?? 0);
  });

  it('returns null fields when nothing is usable', () => {
    const result = analogueEstimate({ workType: 'erp', analogues: [] });

    expect(result.used).toHaveLength(0);
    expect(result.medianRub).toBeNull();
    expect(result.p10Rub).toBeNull();
    expect(result.p90Rub).toBeNull();
    expect(result.sufficient).toBe(false);
  });
});
