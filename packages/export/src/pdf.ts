/**
 * PDF report export (`docs/04_ux_scenario.md` §8, `docs/05_architecture_data.md` §9).
 *
 * Page 1 is the decision: verdict, ranges, scenarios, break-even, key
 * assumptions, confidence and the disclaimer. The appendices carry the formula
 * tree, analogues with their sources, risks, the source list and the
 * reproducibility metadata (dataset version, seed, date).
 */

import { existsSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import type { Estimate, FormulaNode } from '@app/contract';

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

interface Fonts {
  regular: string;
  bold: string;
}

const INK = '#111111';
const MUTED = '#6B6B6B';
const BRAND = '#EC6608';

const moneyFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

function money(value: number): string {
  return `${moneyFormat.format(value)} ₽`;
}

function num(value: number): string {
  return moneyFormat.format(value);
}

function resolveFonts(): Fonts {
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

function uniqueSources(estimate: Estimate): string[] {
  const ids = new Set<string>();
  for (const line of estimate.cost.lines) {
    if (line.sourceId !== undefined) {
      ids.add(line.sourceId);
    }
  }
  for (const assumption of estimate.assumptions) {
    ids.add(assumption.sourceId);
  }
  for (const risk of estimate.risks) {
    ids.add(risk.sourceId);
  }
  for (const analogue of estimate.analogues) {
    ids.add(analogue.sourceId);
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function heading(doc: PDFKit.PDFDocument, fonts: Fonts, text: string): void {
  doc.moveDown(0.7);
  doc.font(fonts.bold).fontSize(13).fillColor(INK).text(text);
  doc.moveDown(0.25);
}

function body(doc: PDFKit.PDFDocument, fonts: Fonts, text: string, size = 10, color = INK): void {
  doc.font(fonts.regular).fontSize(size).fillColor(color).text(text);
}

function key(estimate: Estimate): string {
  return `${estimate.taskId} · ${estimate.scenario} · ${estimate.id}`;
}

function writeFirstPage(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): void {
  doc.font(fonts.bold).fontSize(20).fillColor(BRAND).text('Decision Cockpit');
  body(doc, fonts, `Отчёт об оценке · ${key(estimate)}`, 9, MUTED);
  body(
    doc,
    fonts,
    `Версия датасетов: ${estimate.datasetVersion} · seed: ${estimate.seed} · дата: ${estimate.createdAt}`,
    8,
    MUTED,
  );

  heading(doc, fonts, 'Вердикт');
  body(doc, fonts, estimate.verdict.text, 11);

  heading(doc, fonts, 'Диапазоны');
  body(
    doc,
    fonts,
    `Трудоёмкость, ч: P10 ${num(estimate.effort.p10Hours)} · P50 ${num(estimate.effort.p50Hours)} · P80 ${num(estimate.effort.p80Hours)} · P90 ${num(estimate.effort.p90Hours)}`,
  );
  body(
    doc,
    fonts,
    `Срок, недель: P10 ${num(estimate.duration.p10Weeks)} · P50 ${num(estimate.duration.p50Weeks)} · P80 ${num(estimate.duration.p80Weeks)} · P90 ${num(estimate.duration.p90Weeks)}`,
  );
  body(
    doc,
    fonts,
    `Стоимость: P10 ${money(estimate.cost.p10Rub)} · P50 ${money(estimate.cost.p50Rub)} · P80 ${money(estimate.cost.p80Rub)} · P90 ${money(estimate.cost.p90Rub)}`,
  );
  body(doc, fonts, `Резерв бюджета (P80 − P50): ${money(estimate.cost.reserveRub)}`, 10, MUTED);

  heading(doc, fonts, 'Сценарии');
  const implementation = estimate.tco.find((row) => row.year === 0);
  const support = estimate.tco.find((row) => row.year === 1);
  if (implementation !== undefined) {
    body(doc, fonts, `Реализация (год 0, ${estimate.scenario}): ${money(implementation.costRub)}`);
  }
  if (support !== undefined) {
    body(doc, fonts, `Сопровождение (год 1): ${money(support.costRub)}`);
  }

  heading(doc, fonts, 'Точка безубыточности');
  body(
    doc,
    fonts,
    estimate.breakevenMonth === null
      ? 'В горизонте 36 месяцев не достигается.'
      : `Месяц ${estimate.breakevenMonth} эксплуатации.`,
  );

  heading(doc, fonts, 'Ключевые допущения');
  const keyAssumptions = [...estimate.assumptions]
    .sort((a, b) => (b.sensitivity ?? 0) - (a.sensitivity ?? 0))
    .slice(0, 4);
  for (const assumption of keyAssumptions) {
    const sensitivity = assumption.sensitivity === undefined ? '' : ` · чувствительность ${assumption.sensitivity}`;
    body(
      doc,
      fonts,
      `• ${assumption.label}: ${String(assumption.value)} (${assumption.range.low}…${assumption.range.high})${sensitivity}`,
      9,
    );
  }

  heading(doc, fonts, 'Уверенность');
  body(doc, fonts, `${estimate.confidence.score} / 100 · уровень: ${estimate.confidence.level}`);
  for (const component of estimate.confidence.components) {
    body(
      doc,
      fonts,
      `• ${component.key}: вес ${component.weight}, значение ${component.value}`,
      9,
      MUTED,
    );
  }

  doc.moveDown(0.8);
  body(doc, fonts, 'Оценка порядка, а не смета. Все числа — вероятностные диапазоны.', 9, MUTED);
}

function writeFormulaNode(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  node: FormulaNode,
  depth: number,
): void {
  const indent = '   '.repeat(depth);
  const value = node.valueRub === undefined ? '' : ` — ${money(node.valueRub)}`;
  body(doc, fonts, `${indent}${node.label}${value}`, 9);
  if (node.formula !== undefined) {
    body(doc, fonts, `${indent}   = ${node.formula}`, 8, MUTED);
  }
  for (const child of node.children ?? []) {
    writeFormulaNode(doc, fonts, child, depth + 1);
  }
}

function writeFormulasAppendix(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): void {
  doc.addPage();
  doc.font(fonts.bold).fontSize(15).fillColor(INK).text('Приложение A. Формулы');
  doc.moveDown(0.4);
  writeFormulaNode(doc, fonts, estimate.formulaTree, 0);
}

function writeSourcesAppendix(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): void {
  doc.addPage();
  doc.font(fonts.bold).fontSize(15).fillColor(INK).text('Приложение B. Аналоги, риски и источники');
  doc.moveDown(0.4);

  doc.font(fonts.bold).fontSize(11).fillColor(INK).text('Аналоги');
  doc.moveDown(0.2);
  for (const analogue of estimate.analogues) {
    const price = analogue.normalizedPriceRub === undefined ? '' : ` · приведённая ${money(analogue.normalizedPriceRub)}`;
    body(
      doc,
      fonts,
      `• ${analogue.title} (${analogue.year})${price} · источник ${analogue.sourceId}${analogue.url === undefined ? '' : ` · ${analogue.url}`}`,
      9,
    );
  }

  doc.moveDown(0.5);
  doc.font(fonts.bold).fontSize(11).fillColor(INK).text('Риски');
  doc.moveDown(0.2);
  for (const risk of estimate.risks) {
    body(
      doc,
      fonts,
      `• ${risk.label}: вероятность ${risk.probability}, ущерб ${money(risk.impactRub.mid)}, источник ${risk.sourceId}`,
      9,
    );
    body(doc, fonts, `   Меры: ${risk.mitigation}`, 8, MUTED);
  }

  doc.moveDown(0.5);
  doc.font(fonts.bold).fontSize(11).fillColor(INK).text('Источники');
  doc.moveDown(0.2);
  for (const sourceId of uniqueSources(estimate)) {
    body(doc, fonts, `• ${sourceId}`, 9);
  }

  doc.moveDown(0.6);
  body(
    doc,
    fonts,
    `Версия датасетов: ${estimate.datasetVersion} · seed: ${estimate.seed} · дата: ${estimate.createdAt}`,
    8,
    MUTED,
  );
}

function writeReport(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): void {
  writeFirstPage(doc, fonts, estimate);
  writeFormulasAppendix(doc, fonts, estimate);
  writeSourcesAppendix(doc, fonts, estimate);
  doc.end();
}

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
