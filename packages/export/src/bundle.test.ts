import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { ExportError, buildExportBundle } from './bundle.js';
import type { BuildExportBundleInput, ExportFormat } from './bundle.js';

function firstEstimate(): Estimate {
  return EstimateSchema.parse(d1ScenariosJson[0]);
}

function input(format: ExportFormat): BuildExportBundleInput {
  const estimate = firstEstimate();
  return {
    estimate,
    params: [
      { status: 'confirmed' },
      { status: 'confirmed' },
    ],
    datasetVersion: estimate.datasetVersion,
    seed: estimate.seed,
    format,
  };
}

describe('buildExportBundle', () => {
  it('renders all three formats once every parameter is confirmed', async () => {
    const json = await buildExportBundle(input('json'));
    expect(json.mime).toBe('application/json');
    expect(json.filename).toMatch(/-snapshot-[0-9a-f]{16}\.json$/);
    expect(json.filename).toContain(firstEstimate().id);
    expect(json.data.byteLength).toBeGreaterThan(0);

    const xlsx = await buildExportBundle(input('xlsx'));
    expect(xlsx.mime).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(xlsx.filename).toBe(`${firstEstimate().id}.xlsx`);
    const workbook = XLSX.read(xlsx.data, { type: 'buffer' });
    expect(workbook.SheetNames).toHaveLength(7);

    const pdf = await buildExportBundle(input('pdf'));
    expect(pdf.mime).toBe('application/pdf');
    expect(pdf.filename).toBe(`${firstEstimate().id}.pdf`);
    expect(pdf.data.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('blocks export when a parameter is still auto-derived', async () => {
    const blocked: BuildExportBundleInput = {
      ...input('json'),
      params: [{ status: 'confirmed' }, { status: 'auto' }],
    };

    await expect(buildExportBundle(blocked)).rejects.toBeInstanceOf(ExportError);
    await expect(buildExportBundle(blocked)).rejects.toMatchObject({ code: 'needs_review' });
  });

  it('blocks export when there is nothing to review', async () => {
    const incomplete: BuildExportBundleInput = { ...input('pdf'), params: [] };
    await expect(buildExportBundle(incomplete)).rejects.toMatchObject({ code: 'incomplete' });
  });
});
