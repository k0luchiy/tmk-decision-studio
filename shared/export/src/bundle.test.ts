import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { ExportError, buildExportBundle } from './bundle.js';
import type { BuildExportBundleInput, ExportFormat } from './bundle.js';

function firstEstimate(): Estimate {
  return EstimateSchema.parse(d1ScenariosJson[0]);
}

function scenario(name: Estimate['scenario']): Estimate {
  const raw = d1ScenariosJson.find((item) => item.scenario === name);
  if (raw === undefined) {
    throw new Error(`Missing D1 scenario ${name}`);
  }
  return EstimateSchema.parse(raw);
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

  it('renders the three-scenario comparison into the PDF bundle', async () => {
    const inhouse = scenario('inhouse');
    const contractor = scenario('contractor');
    const hybrid = scenario('hybrid');
    const pdf = await buildExportBundle({
      ...input('pdf'),
      comparison: {
        estimates: { inhouse, contractor, hybrid },
        verdict: hybrid.verdict,
        confidence: hybrid.confidence,
        state: { source: 'bundle-test' },
      },
    });

    expect(pdf.data.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.data.byteLength).toBeGreaterThan(20_000);
    const document = await PDFDocument.load(pdf.data);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
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
