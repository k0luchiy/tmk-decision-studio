/** PDF export entry point: branded TMK Decision Studio report. */

import PDFDocument from 'pdfkit';
import type { Estimate } from '@app/contract';
import { writeAppendixPages } from './appendix.js';
import { drawFooters } from './components.js';
import type { PageMeta } from './components.js';
import { registerFonts } from './fonts.js';
import { PAGE } from './theme.js';
import { writeDecisionPages } from './sections.js';

/**
 * Renders a branded PDF report for a single estimate.
 *
 * The contract is unchanged: the caller gets a `Buffer`. The report always has
 * a decision page plus appendices, embeds DejaVu (Cyrillic) fonts from the
 * package assets, and degrades gracefully when optional collections are empty.
 */
export function toPdf(estimate: Estimate): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE.margin,
      bufferPages: true,
      info: {
        Title: `TMK Decision Studio — ${estimate.id}`,
        Author: 'TMK Decision Studio',
        Subject: 'Оценка ИТ-задачи: сделать или заказать',
        Keywords: `estimate, ${estimate.scenario}, ${estimate.datasetVersion}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', (error: Error) => {
      reject(error);
    });

    const meta: PageMeta = {
      id: estimate.id,
      createdAt: estimate.createdAt,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
    };

    try {
      const fonts = registerFonts(doc);
      writeDecisionPages(doc, fonts, { estimate, meta });
      writeAppendixPages(doc, fonts, estimate);
      drawFooters(doc, fonts, meta, doc.bufferedPageRange().count);
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
