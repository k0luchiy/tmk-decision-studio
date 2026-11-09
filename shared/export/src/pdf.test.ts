import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { toPdf } from './pdf.js';

const scenarios: Estimate[] = d1ScenariosJson.map((raw) => EstimateSchema.parse(raw));

function firstEstimate(): Estimate {
  return scenarios[0] as Estimate;
}

function pdftotext(buffer: Buffer): string | undefined {
  const result = spawnSync('pdftotext', ['-enc', 'UTF-8', '-', '-'], {
    input: buffer,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error !== undefined || result.status !== 0) {
    return undefined;
  }
  return result.stdout.toString('utf8');
}

function emptyCollections(estimate: Estimate): Estimate {
  return EstimateSchema.parse({
    ...estimate,
    assumptions: [],
    risks: [],
    analogues: [],
    cost: { ...estimate.cost, lines: [] },
    tco: [],
    breakevenMonth: null,
    formulaTree: { ...estimate.formulaTree, children: [] },
  });
}

describe('toPdf (TMK Decision Studio)', () => {
  it('starts with the %PDF signature, has ≥3 pages and weighs >20 KB', async () => {
    const buffer = await toPdf(firstEstimate());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.byteLength).toBeGreaterThan(20_000);
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
  });

  it('renders every D1 scenario', async () => {
    expect(scenarios).toHaveLength(3);
    for (const estimate of scenarios) {
      const buffer = await toPdf(estimate);
      const document = await PDFDocument.load(buffer);
      expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
      expect(buffer.byteLength).toBeGreaterThan(20_000);
    }
  });

  it('extracts Cyrillic brand and report sections with pdftotext', async () => {
    const text = pdftotext(await toPdf(firstEstimate()));
    if (text === undefined) {
      // pdftotext is optional in CI; the PDF itself is still validated above.
      return;
    }
    expect(text).toContain('TMK Decision Studio');
    expect(text).toContain('Вердикт');
    expect(text).toContain('P50');
    expect(text).toContain('Риски');
    expect(text).toMatch(/[А-Яа-яЁё]{4,}/u);
  });

  it('does not fail when risks, analogues, assumptions and cost lines are empty', async () => {
    const buffer = await toPdf(emptyCollections(firstEstimate()));
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
  });
});
