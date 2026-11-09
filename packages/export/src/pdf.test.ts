import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { toPdf } from './pdf.js';

function firstEstimate(): Estimate {
  return EstimateSchema.parse(d1ScenariosJson[0]);
}

describe('toPdf', () => {
  it('starts with the %PDF signature', async () => {
    const buffer = await toPdf(firstEstimate());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('renders at least two pages', async () => {
    const buffer = await toPdf(firstEstimate());
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(2);
  });
});
