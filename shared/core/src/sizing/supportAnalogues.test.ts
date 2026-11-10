import type { Task } from '@app/contract';
import { loadDatasets } from '@app/data';
import type { LoadedDatasets } from '@app/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { d1Task } from '../fixtures/d1.js';
import { estimateTask } from '../pipeline.js';
import { analogueEstimate } from './analogues.js';
import { contractYear, supportAnaloguesFromContracts } from './supportAnalogues.js';

const d3Task: Task = {
  id: 'd3',
  title: 'Сопровождение и поддержка учётной системы, 24/7, SLA 99,9%, 12 месяцев',
  descriptionRaw:
    'Демо D3: сопровождение и техническая поддержка учётной системы предприятия, режим 24/7, SLA 99,9%, срок 12 месяцев.',
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
  ],
};

let datasets: LoadedDatasets;

beforeAll(async () => {
  datasets = await loadDatasets();
});

describe('supportAnaloguesFromContracts', () => {
  it('keeps only real support contracts with a positive price and a source', () => {
    const rows = supportAnaloguesFromContracts(datasets.contracts);

    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(row.project_type).toBe('support');
      expect(row.currency).toBe('RUB');
      expect(row.price_mid ?? 0).toBeGreaterThan(0);
      expect(row.source ?? '').not.toBe('');
      expect(row.price_basis).toBe('contract_price');
      expect(row.id.startsWith('tmk:')).toBe(true);
      expect(Number.isInteger(row.year)).toBe(true);
    }
  });

  it('parses the start_date year', () => {
    expect(contractYear('2026-06-08')).toBe(2026);
    expect(contractYear('not-a-date')).toBeUndefined();
  });

  it('produces a sufficient analogue estimate for D3', () => {
    const rows = supportAnaloguesFromContracts(datasets.contracts);
    const result = analogueEstimate({ workType: 'support', analogues: rows });

    expect(result.used.length).toBeGreaterThanOrEqual(3);
    expect(result.sufficient).toBe(true);
    expect(result.medianRub ?? 0).toBeGreaterThan(0);
  });
});

describe('estimateTask analogue wiring', () => {
  it('gives D3 at least three support analogues in every scenario', () => {
    const result = estimateTask({
      task: d3Task,
      datasets,
      seed: 42,
      datasetVersion: 'test-version',
    });

    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      const analogues = result.estimates[key].analogues;
      expect(analogues.length).toBeGreaterThanOrEqual(3);
      expect(analogues.every((row) => row.type === 'support')).toBe(true);
      expect(analogues.every((row) => row.corpus === 'tmk_eis')).toBe(true);
      expect(analogues.every((row) => (row.normalizedPriceRub ?? 0) > 0)).toBe(true);
      expect(analogues.every((row) => row.sourceId.startsWith('tmk_contracts:'))).toBe(true);
    }
  });

  it('leaves D1 on the published analogue corpus', () => {
    const result = estimateTask({
      task: d1Task,
      datasets,
      seed: 42,
      datasetVersion: 'test-version',
    });

    const analogues = result.estimates.hybrid.analogues;
    expect(analogues).toHaveLength(3);
    expect(analogues.every((row) => row.corpus === 'published')).toBe(true);
    expect(analogues.some((row) => row.id.startsWith('tmk:'))).toBe(false);
  });
});
