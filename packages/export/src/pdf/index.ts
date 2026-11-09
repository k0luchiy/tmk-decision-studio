/** PDF export entry point. */

import PDFDocument from 'pdfkit';
import type { Estimate } from '@app/contract';
import { resolveFonts } from './layout.js';
import { writeReport } from './sections.js';

/**
 * Renders a PDF report for a single estimate.
 *
 * The output always contains at least two pages (decision + appendices). A
 * Cyrillic-capable system font is embedded when available; otherwise PDFKit's
 * built-in Helvetica is used so generation never fails.
 */
export function toPdf(estimate: Estimate): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const fonts = resolveFonts();
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Оценка ${estimate.id}`,
        Author: 'Decision Cockpit',
        Subject: 'Reproducible estimation report',
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

    if (fonts.regular !== 'Helvetica') {
      doc.registerFont('Body', fonts.regular);
      doc.registerFont('Body-Bold', fonts.bold);
      fonts.regular = 'Body';
      fonts.bold = 'Body-Bold';
    }

    try {
      writeReport(doc, fonts, estimate);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
