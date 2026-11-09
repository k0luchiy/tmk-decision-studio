import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import {
  ExportError,
  SHEET_NAMES,
  buildExportBundle,
  fromSnapshot,
  snapshotHash,
  toPdf,
  toSnapshot,
  toXlsx,
} from './index.js';

type Cell = string | number | boolean;

const NOW = '2026-11-09T12:00:00.000Z';

function d1Estimate(): Estimate {
  return EstimateSchema.parse(d1ScenariosJson[0]);
}

function sheetRows(workbook: XLSX.WorkBook, name: string): Record<string, Cell>[] {
  const sheet = workbook.Sheets[name];
  if (sheet === undefined) {
    throw new Error(`Missing sheet ${name}`);
  }
  return XLSX.utils.sheet_to_json<Record<string, Cell>>(sheet);
}

describe('export pipeline (D1 scenario)', () => {
  it('snapshot: JSON round-trip preserves the estimate and hash is reproducible', () => {
    const estimate = d1Estimate();
    const snapshot = toSnapshot({
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
      taskRef: estimate.taskId,
      now: NOW,
    });

    const restored = fromSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(restored).toEqual(snapshot);
    expect(restored.estimate.id).toBe(estimate.id);

    const repeated = toSnapshot({
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
      taskRef: estimate.taskId,
      now: NOW,
    });
    expect(snapshotHash(restored)).toBe(snapshotHash(repeated));
  });

  it('xlsx: 7 sheets with numeric line-item sums matching the estimate', () => {
    const estimate = d1Estimate();
    const workbook = XLSX.read(toXlsx(estimate), { type: 'buffer' });

    expect(workbook.SheetNames).toEqual([...SHEET_NAMES]);

    const lines = sheetRows(workbook, 'LineItems');
    const lineSum = lines.reduce((sum, row) => {
      const value = row.valueRub;
      expect(typeof value).toBe('number');
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    expect(Math.abs(lineSum - estimate.cost.p50Rub)).toBeLessThanOrEqual(1);

    const scenarios = sheetRows(workbook, 'Scenarios');
    const first = scenarios[0];
    expect(first).toBeDefined();
    expect(first?.scenario).toBe(estimate.scenario);
    expect(first?.costP50Rub).toBe(estimate.cost.p50Rub);

    const assumptions = sheetRows(workbook, 'Assumptions');
    expect(assumptions).toHaveLength(estimate.assumptions.length);
  });

  it('pdf: valid document with at least two pages', async () => {
    const buffer = await toPdf(d1Estimate());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it('bundle: all formats when confirmed, blocked when a parameter is not', async () => {
    const estimate = d1Estimate();
    const base = {
      estimate,
      params: [{ status: 'confirmed' }, { status: 'confirmed' }],
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
    };

    const json = await buildExportBundle({ ...base, format: 'json' });
    const xlsx = await buildExportBundle({ ...base, format: 'xlsx' });
    const pdf = await buildExportBundle({ ...base, format: 'pdf' });

    expect(json.mime).toBe('application/json');
    expect(json.filename).toContain(snapshotHash(fromSnapshot(JSON.parse(json.data.toString('utf8')))).slice(0, 16));
    expect(xlsx.mime).toContain('spreadsheetml');
    expect(pdf.mime).toBe('application/pdf');

    await expect(
      buildExportBundle({ ...base, params: [{ status: 'auto' }], format: 'pdf' }),
    ).rejects.toBeInstanceOf(ExportError);
    await expect(
      buildExportBundle({ ...base, params: [{ status: 'edited' }], format: 'json' }),
    ).rejects.toMatchObject({ code: 'needs_review' });
  });
});
