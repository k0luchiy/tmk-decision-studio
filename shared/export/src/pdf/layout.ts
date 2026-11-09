/** PDF layout primitives: fonts, colours, formatting and text helpers. */

import { existsSync } from 'node:fs';

/** Candidate TrueType fonts with Cyrillic coverage; first existing wins. */
const FONT_CANDIDATES: { regular: string; bold: string }[] = [
  {
    regular: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  },
  {
    regular: '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    bold: '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  },
  {
    regular: '/System/Library/Fonts/Supplemental/Arial.ttf',
    bold: '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  },
];

export interface Fonts {
  regular: string;
  bold: string;
}

export const INK = '#111111';
export const MUTED = '#6B6B6B';
export const BRAND = '#EC6608';

const moneyFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function money(value: number): string {
  return `${moneyFormat.format(value)} ₽`;
}

export function num(value: number): string {
  return moneyFormat.format(value);
}

export function resolveFonts(): Fonts {
  for (const candidate of FONT_CANDIDATES) {
    if (existsSync(candidate.regular)) {
      return {
        regular: candidate.regular,
        bold: existsSync(candidate.bold) ? candidate.bold : candidate.regular,
      };
    }
  }
  return { regular: 'Helvetica', bold: 'Helvetica-Bold' };
}

export function heading(doc: PDFKit.PDFDocument, fonts: Fonts, text: string): void {
  doc.moveDown(0.7);
  doc.font(fonts.bold).fontSize(13).fillColor(INK).text(text);
  doc.moveDown(0.25);
}

export function body(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  text: string,
  size = 10,
  color = INK,
): void {
  doc.font(fonts.regular).fontSize(size).fillColor(color).text(text);
}
