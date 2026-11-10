/** Appendix sections 11–12: methodology/formula tree and sources/boundaries. */

import type { Estimate, FormulaNode } from '@app/contract';
import { ensureSpace, note, sectionTitle } from './components.js';
import type { Fonts } from './fonts.js';
import { COLORS, SPACE, TYPE, cumulativeTco, dateRu, money, moneyShort } from './theme.js';

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function uniqueSources(estimate: Estimate): string[] {
  const ids = new Set<string>();
  for (const line of estimate.cost.lines) {
    if (line.sourceId !== undefined) {
      ids.add(line.sourceId);
    }
  }
  for (const item of estimate.assumptions) {
    ids.add(item.sourceId);
  }
  for (const risk of estimate.risks) {
    ids.add(risk.sourceId);
  }
  for (const analogue of estimate.analogues) {
    ids.add(analogue.sourceId);
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}


function writeFormulaNode(doc: PDFKit.PDFDocument, fonts: Fonts, node: FormulaNode, depth: number, y: number): number {
  const x = doc.page.margins.left + depth * 10;
  y = ensureSpace(doc, y, 24);
  doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink).text(`• ${node.label}`, x, y, {
    width: contentWidth(doc) - depth * 10 - 90,
    lineBreak: false,
    ellipsis: true,
  });
  if (node.valueRub !== undefined) {
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.muted).text(money(node.valueRub), doc.page.width - doc.page.margins.right - 90, y, { width: 90, align: 'right', lineBreak: false });
  }
  y += 12;
  if (node.formula !== undefined) {
    doc.font(fonts.mono).fontSize(TYPE.micro).fillColor(COLORS.muted);
    const formulaWidth = contentWidth(doc) - depth * 10 - 8;
    doc.text(`= ${node.formula}`, x + 8, y, { width: formulaWidth, lineGap: 1 });
    y += doc.heightOfString(`= ${node.formula}`, { width: formulaWidth }) + 2;
  }
  for (const child of node.children ?? []) {
    y = writeFormulaNode(doc, fonts, child, depth + 1, y);
  }
  return y;
}

const METHOD_LINES = [
  'Стоимость = сумма сметных строк; P50 — медиана Монте-Карло, P80 — резерв бюджета.',
  'TCO = реализация (год 0) + сопровождение по годам; break-even — пересечение накопленных затрат.',
  'Аналоги приводятся коэффициентами объёма, сложности, региона, возраста и НДС.',
  'Уверенность = взвешенная сумма качества брифа, согласия методов, аналогов и данных.',
  'Риски: вероятность × диапазон ущерба; ожидаемое влияние не подменяет резерв P80.',
  'MAPE/PRED(25) не считаются: в HelpDesk меньше 10 пар план/факт.',
  'Все числа воспроизводимы по datasetVersion и seed; ручные правки меняют inputHash.',
];

function methodologySection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): number {
  doc.addPage();
  let cursor = sectionTitle(doc, fonts, 11, 'Методика и формулы', doc.page.margins.top);
  cursor = writeFormulaNode(doc, fonts, estimate.formulaTree, 0, cursor) + SPACE.md;
  cursor = ensureSpace(doc, cursor, 100);
  doc.font(fonts.condensed).fontSize(TYPE.h3).fillColor(COLORS.ink).text('Ключевые правила', doc.page.margins.left, cursor, { lineBreak: false });
  cursor += 16;
  for (const line of METHOD_LINES) {
    cursor = ensureSpace(doc, cursor, 14);
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink);
    doc.text(`— ${line}`, doc.page.margins.left, cursor, { width: contentWidth(doc), lineGap: 2 });
    cursor += doc.heightOfString(`— ${line}`, { width: contentWidth(doc) }) + 5;
  }
  return cursor;
}

function sourcesSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate, y: number): number {
  y = ensureSpace(doc, y + SPACE.lg, 150);
  y = sectionTitle(doc, fonts, 12, 'Источники и границы', y);
  const sources = uniqueSources(estimate);
  const x = doc.page.margins.left;
  const width = contentWidth(doc);

  if (sources.length === 0) {
    y = note(doc, fonts, 'Источники не переданы — провенанс чисел неполный, результат нельзя считать проверенным.', y);
  } else {
    doc.font(fonts.condensed).fontSize(TYPE.h3).fillColor(COLORS.ink).text('Источники данных', x, y, { lineBreak: false });
    y += 15;
    const half = Math.ceil(sources.length / 2);
    const columnWidth = (width - SPACE.lg) / 2;
    const left = sources.slice(0, half).map((source) => `• ${source}`).join('\n');
    const right = sources.slice(half).map((source) => `• ${source}`).join('\n');
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(left, x, y, {
      width: columnWidth,
      lineGap: 2,
    });
    const leftHeight = doc.heightOfString(left, { width: columnWidth });
    if (right.length > 0) {
      doc.text(right, x + columnWidth + SPACE.lg, y, { width: columnWidth, lineGap: 2 });
    }
    const rightHeight = right.length > 0 ? doc.heightOfString(right, { width: columnWidth }) : 0;
    y += Math.max(leftHeight, rightHeight) + SPACE.md;
    doc.save().lineWidth(0.6).strokeColor(COLORS.border).moveTo(x, y).lineTo(x + width, y).stroke().restore();
    y += SPACE.md;
  }

  doc.font(fonts.condensed).fontSize(TYPE.h3).fillColor(COLORS.ink).text('Границы применимости', x, y, { lineBreak: false });
  y += 15;
  const boundaries = [
    `Версия датасетов: ${estimate.datasetVersion} · seed: ${estimate.seed} · дата: ${dateRu(estimate.createdAt)}.`,
    `TCO 1/3/5 лет: ${moneyShort(cumulativeTco(estimate, 1) ?? 0)} / ${moneyShort(cumulativeTco(estimate, 3) ?? 0)} / ${moneyShort(cumulativeTco(estimate, 5) ?? 0)}.`,
    'MAPE и PRED(25) не считаются: в HelpDesk недостаточно пар план/факт (нужно ≥ 10).',
    'Оценка — порядок, а не смета. Числа не заменяют коммерческое предложение и защиту бюджета.',
    'Шрифты DejaVu (Bitstream Vera / DejaVu, свободная лицензия), PDFKit (MIT), продукт — MIT.',
  ];
  for (const line of boundaries) {
    y = ensureSpace(doc, y, 16);
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink);
    doc.text(`— ${line}`, x, y, { width, lineGap: 2 });
    y += doc.heightOfString(`— ${line}`, { width }) + 4;
  }
  return y;
}

/** Sections 11–12; starts a new page for the methodology. */
export function writeMethodologyAndSources(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  estimate: Estimate,
): void {
  const cursor = methodologySection(doc, fonts, estimate);
  sourcesSection(doc, fonts, estimate, cursor);
}
