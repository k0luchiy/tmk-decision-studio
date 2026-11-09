/** PDF export entry point: branded TMK Decision Studio report. */

import PDFDocument from 'pdfkit';
import type { Estimate } from '@app/contract';
import { writeAppendixPages } from './appendix.js';
import { drawFooters } from './components.js';
import type { PageMeta } from './components.js';
import type { PdfContext } from './context.js';
import { registerFonts } from './fonts.js';
import { PAGE } from './theme.js';
import { writeDecisionPages } from './sections.js';

export type { PdfContext } from './context.js';

/**
 * Renders a branded PDF report for an estimate.
 *
 * Without `context` the report keeps the legacy single-scenario layout. When
 * the API passes `context`, the verdict/confidence blocks use the aggregate
 * values and section 3 renders the full in-house / contractor / hybrid matrix.
 * The caller always gets a `Buffer`; DejaVu (Cyrillic) fonts come from the
 * package assets and the renderer degrades gracefully for empty collections.
 */
export function toPdf(estimate: Estimate, context?: PdfContext): Promise<Buffer> {
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
      writeDecisionPages(doc, fonts, {
        estimate,
        meta,
        ...(context === undefined ? {} : { comparison: context }),
      });
      writeAppendixPages(doc, fonts, estimate);
      drawFooters(doc, fonts, meta, doc.bufferedPageRange().count);
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
