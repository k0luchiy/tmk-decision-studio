/** PDF report sections: decision page and appendices. */

import type { Estimate, FormulaNode } from '@app/contract';
import { BRAND, INK, MUTED, body, heading, money, num, type Fonts } from './layout.js';

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

export function writeReport(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  estimate: Estimate,
): void {
  writeFirstPage(doc, fonts, estimate);
  writeFormulasAppendix(doc, fonts, estimate);
  writeSourcesAppendix(doc, fonts, estimate);
  doc.end();
}
