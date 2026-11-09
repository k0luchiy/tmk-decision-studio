/** Reusable vector components for the PDF report (no external UI library). */

import type { Estimate } from '@app/contract';
import { COLORS, PAGE, SPACE, TYPE, dateRu, money } from './theme.js';
import type { Fonts } from './fonts.js';

export function contentBottom(doc: PDFKit.PDFDocument): number {
  return doc.page.height - PAGE.contentTop;
}

/** Adds a page when `needed` points would fall into the footer zone. */
export function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed <= contentBottom(doc)) {
    return y;
  }
  doc.addPage();
  return doc.page.margins.top;
}

/** Product mark: a square with an orange arc — brand accent, not a TMK logo. */
export function logoMark(doc: PDFKit.PDFDocument, x: number, y: number, size: number): void {
  doc.save();
  doc.lineWidth(1.4).strokeColor(COLORS.ink).rect(x, y, size, size).stroke();
  const arcDoc = doc as PDFKit.PDFDocument & {
    arc: (cx: number, cy: number, radius: number, start: number, end: number) => PDFKit.PDFDocument;
  };
  arcDoc
    .lineWidth(2)
    .strokeColor(COLORS.brand)
    .arc(x + size / 2, y + size / 2, size * 0.31, 205, 335)
    .stroke();
  doc.restore();
}

export interface PageMeta {
  id: string;
  createdAt: string;
  datasetVersion: string;
  seed: number;
}

/** Cover band: mark, product name, subtitle and reproducibility metadata. */
export function coverHeader(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  meta: PageMeta,
): number {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  let y = doc.page.margins.top;

  logoMark(doc, x, y, 28);
  doc
    .font(fonts.condensed)
    .fontSize(17)
    .fillColor(COLORS.ink)
    .text('TMK DECISION STUDIO', x + 40, y + 1, { lineBreak: false });
  doc
    .font(fonts.body)
    .fontSize(TYPE.bodyS)
    .fillColor(COLORS.muted)
    .text('Оценка ИТ-задачи · сделать или заказать', x + 40, y + 21, { lineBreak: false });

  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted);
  doc.text(`ID оценки: ${meta.id}`, x + width - 190, y, { width: 190, align: 'right' });
  doc.text(
    `Дата: ${dateRu(meta.createdAt)} · seed: ${meta.seed}`,
    x + width - 190,
    y + 10,
    { width: 190, align: 'right' },
  );
  doc.text(`Данные: ${meta.datasetVersion}`, x + width - 190, y + 20, {
    width: 190,
    align: 'right',
  });

  y += 44;
  divider(doc, x, y, width);
  return y + SPACE.lg;
}

export function divider(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  color = COLORS.border,
  thickness = 1,
): void {
  doc.save().lineWidth(thickness).strokeColor(color).moveTo(x, y).lineTo(x + width, y).stroke().restore();
}

/** Condensed uppercase section heading with the 2px orange rule. */
export function sectionTitle(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  index: number,
  title: string,
  y: number,
): number {
  const x = doc.page.margins.left;
  const width = doc.page.width - x - doc.page.margins.right;
  const top = ensureSpace(doc, y, 46);
  const label = `${String(index).padStart(2, '0')}  ${title.toUpperCase()}`;
  doc.font(fonts.condensed).fontSize(TYPE.h2).fillColor(COLORS.ink).text(label, x, top, {
    lineBreak: false,
  });
  doc.save().lineWidth(2).strokeColor(COLORS.brand).moveTo(x, top + 17).lineTo(x + Math.min(96, width), top + 17).stroke().restore();
  divider(doc, x, top + 18, width, COLORS.border, 0.6);
  return top + 28;
}

export interface KpiSpec {
  label: string;
  value: string;
  range: string;
  note?: string;
  accent?: boolean;
}

/** Flat KPI tile: label, condensed metric, micro range, optional orange top rule. */
export function kpiCard(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  height: number,
  spec: KpiSpec,
): void {
  doc.save().fillColor(COLORS.surface).rect(x, y, width, height).fill();
  if (spec.accent === true) {
    doc.fillColor(COLORS.brand).rect(x, y, width, 3).fill();
  }
  doc.restore();
  doc.font(fonts.body).fontSize(TYPE.label).fillColor(COLORS.muted).text(spec.label.toUpperCase(), x + 10, y + 10, { width: width - 20, lineBreak: false });
  doc.font(fonts.condensed).fontSize(TYPE.metric).fillColor(COLORS.ink).text(spec.value, x + 10, y + 22, { width: width - 20, lineBreak: false });
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(spec.range, x + 10, y + 50, { width: width - 20 });
  if (spec.note !== undefined) {
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(spec.note, x + 10, y + 62, { width: width - 20 });
  }
}


export function badge(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  text: string,
  color: string,
): number {
  doc.font(fonts.bold).fontSize(TYPE.label);
  const width = doc.widthOfString(text.toUpperCase()) + 12;
  doc.save().fillColor(color).rect(x, y, width, 15).fill().restore();
  doc.fillColor(COLORS.white).fontSize(TYPE.label).text(text.toUpperCase(), x + 6, y + 4, {
    lineBreak: false,
  });
  return width;
}

/** Muted explanatory paragraph with a comfortable reading width. */
export function note(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  text: string,
  y: number,
  width?: number,
): number {
  const x = doc.page.margins.left;
  const w = width ?? doc.page.width - x - doc.page.margins.right;
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(text, x, y, { width: w });
  return y + doc.heightOfString(text, { width: w }) + SPACE.sm;
}

/** Footer on every buffered page: brand left, page number right, meta below. */
export function drawFooters(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  meta: PageMeta,
  totalPages: number,
): void {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    // Footer text sits below the normal text frame; allow it there without
    // PDFKit auto-adding a page for every footer line.
    doc.page.margins.bottom = 0;
    const x = doc.page.margins.left;
    const width = doc.page.width - x - doc.page.margins.right;
    const lineY = doc.page.height - PAGE.footerLine;
    divider(doc, x, lineY, width, COLORS.border, 0.6);
    doc.font(fonts.condensed).fontSize(TYPE.label).fillColor(COLORS.ink).text('TMK DECISION STUDIO', x, lineY + 6, { lineBreak: false });
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
      `стр. ${index + 1} из ${totalPages}`,
      x + width - 120,
      lineY + 6,
      { width: 120, align: 'right', lineBreak: false },
    );
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
      `${dateRu(meta.createdAt)} · ${meta.id} · данные ${meta.datasetVersion} · seed ${meta.seed}`,
      x,
      lineY + 17,
      { width, lineBreak: false },
    );
  }
}

/** Budget label used in the verdict and TCO sections. */
export function p50Label(estimate: Estimate): string {
  return money(estimate.cost.p50Rub);
}
