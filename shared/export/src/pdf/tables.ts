/** Dense tables, data bars and single-line text fitting for the PDF report. */

import { COLORS, SPACE, TYPE } from './theme.js';
import { contentBottom, divider } from './components.js';
import type { Fonts } from './fonts.js';

export interface Column {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

export interface TableSpec {
  columns: readonly Column[];
  rows: readonly (readonly string[])[];
  y: number;
  emptyText?: string;
}

const CELL_PAD = 5;

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  columns: readonly Column[],
  x: number,
  y: number,
): number {
  const width = columns.reduce((sum, column) => sum + column.width, 0);
  const height = 20;
  doc.save().fillColor(COLORS.surface).rect(x, y, width, height).fill().restore();
  let cx = x;
  for (const column of columns) {
    doc
      .font(fonts.bold)
      .fontSize(TYPE.label)
      .fillColor(COLORS.ink)
      .text(column.header.toUpperCase(), cx + CELL_PAD, y + 6, {
        width: column.width - CELL_PAD * 2,
        align: column.align ?? 'left',
        lineBreak: false,
      });
    cx += column.width;
  }
  return y + height;
}

/** Dense, borderless-zebra table with a repeated header across pages. */
export function table(doc: PDFKit.PDFDocument, fonts: Fonts, spec: TableSpec): number {
  const x = doc.page.margins.left;
  const width = spec.columns.reduce((sum, column) => sum + column.width, 0);
  const rowHeight = 19;
  let y = drawTableHeader(doc, fonts, spec.columns, x, spec.y);

  for (const row of spec.rows) {
    if (y + rowHeight > contentBottom(doc)) {
      doc.addPage();
      y = drawTableHeader(doc, fonts, spec.columns, x, doc.page.margins.top);
    }
    let cx = x;
    spec.columns.forEach((column, index) => {
      doc
        .font(fonts.body)
        .fontSize(TYPE.bodyS)
        .fillColor(COLORS.ink)
        .text(row[index] ?? '—', cx + CELL_PAD, y + 5, {
          width: column.width - CELL_PAD * 2,
          height: rowHeight - 4,
          align: column.align ?? 'left',
          ellipsis: true,
        });
      cx += column.width;
    });
    divider(doc, x, y + rowHeight, width, COLORS.border, 0.6);
    y += rowHeight;
  }

  if (spec.rows.length === 0) {
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.muted).text(
      spec.emptyText ?? 'Нет данных для этого раздела — раздел не применяется к выбранному сценарию.',
      x + CELL_PAD,
      y + 6,
      { width: width - CELL_PAD * 2 },
    );
    y += 26;
  }
  return y + SPACE.sm;
}

export function barRow(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  label: string,
  value: number,
  max: number,
  valueText: string,
): number {
  const labelWidth = 200;
  const valueWidth = 72;
  const trackX = x + labelWidth;
  const trackWidth = Math.max(20, width - labelWidth - valueWidth);
  doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink).text(
    fitText(doc, fonts.body, TYPE.bodyS, label, labelWidth - 8),
    x,
    y + 2,
    { lineBreak: false },
  );
  doc.save().fillColor(COLORS.surfaceSunken).rect(trackX, y + 2, trackWidth, 9).fill();
  const ratio = max > 0 ? Math.max(0.01, Math.min(1, value / max)) : 0;
  doc.fillColor(COLORS.info).rect(trackX, y + 2, trackWidth * ratio, 9).fill().restore();
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(valueText, trackX + trackWidth + 6, y + 2, {
    width: valueWidth - 6,
    align: 'right',
    lineBreak: false,
  });
  return y + 18;
}

/** Small flat badge; `color` is used as fill, text stays white for contrast. */
/** Truncates a single line with an ellipsis so it never wraps a dense row. */
export function fitText(
  doc: PDFKit.PDFDocument,
  font: string,
  size: number,
  text: string,
  width: number,
): string {
  doc.font(font).fontSize(size);
  if (doc.widthOfString(text) <= width) {
    return text;
  }
  let clipped = text;
  while (clipped.length > 1 && doc.widthOfString(`${clipped}…`) > width) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}…`;
}
