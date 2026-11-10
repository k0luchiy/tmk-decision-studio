/** Appendix pages of the TMK Decision Studio report (sections 7–12). */

import type { Estimate, Risk } from '@app/contract';
import { ensureSpace, note, sectionTitle } from './components.js';
import { table } from './tables.js';
import { writeMethodologyAndSources } from './appendix-extra.js';
import type { Fonts } from './fonts.js';
import {
  COLORS,
  SPACE,
  STAGE_NAMES,
  TYPE,
  moneyShort,
  num,
  pct,
  riskLevel,
} from './theme.js';

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function valueText(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'да' : 'нет';
  }
  if (typeof value === 'number') {
    return num(value);
  }
  return value;
}

function assumptionsSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate, y: number): number {
  y = sectionTitle(doc, fonts, 7, 'Допущения', y);
  const rows = estimate.assumptions.map((item) => [
    item.label,
    valueText(item.value),
    `${num(item.range.low)} — ${num(item.range.high)}`,
    item.sourceId,
    item.sensitivity === undefined ? '—' : pct(item.sensitivity),
  ]);
  return table(doc, fonts, {
    y,
    columns: [
      { header: 'Допущение', width: 150 },
      { header: 'Значение', width: 68 },
      { header: 'Диапазон', width: 82 },
      { header: 'Источник', width: 115 },
      { header: 'Чувств.', width: 70, align: 'right' },
    ],
    rows,
    emptyText: 'Допущения не переданы — расчёт опирается только на нормативные ставки и аналоги.',
  });
}

function riskHeader(doc: PDFKit.PDFDocument, fonts: Fonts, y: number): number {
  const x = doc.page.margins.left;
  doc.save().fillColor(COLORS.surface).rect(x, y, contentWidth(doc), 20).fill().restore();
  const headers: [string, number][] = [
    ['Риск', 180],
    ['Вероятн.', 55],
    ['Влияние', 85],
    ['Ожидаемо', 65],
    ['Уровень', 110],
  ];
  let cx = x;
  for (const [text, width] of headers) {
    doc.font(fonts.bold).fontSize(TYPE.label).fillColor(COLORS.ink).text(text.toUpperCase(), cx + 5, y + 6, { width: width - 10, lineBreak: false });
    cx += width;
  }
  return y + 20;
}

function riskRow(doc: PDFKit.PDFDocument, fonts: Fonts, risk: Risk, budget: number, y: number): number {
  const x = doc.page.margins.left;
  const level = riskLevel(risk, budget);
  const cells: [string, number, 'left' | 'right'][] = [
    [risk.label, 180, 'left'],
    [pct(risk.probability), 55, 'right'],
    [moneyShort(risk.impactRub.mid), 85, 'right'],
    [risk.expectedRub === undefined ? '—' : moneyShort(risk.expectedRub), 65, 'right'],
    [level.label, 110, 'left'],
  ];
  let cx = x;
  for (const [text, width, align] of cells) {
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink).text(text, cx + 5, y + 4, {
      width: width - 10,
      height: 12,
      align,
      ellipsis: true,
    });
    cx += width;
  }
  doc.save().fillColor(level.color).rect(cx - 15, y + 6, 6, 6).fill().restore();
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(risk.mitigation, x + 5, y + 15, {
    width: contentWidth(doc) - 10,
    height: 10,
    ellipsis: true,
  });
  doc.save().lineWidth(0.6).strokeColor(COLORS.border).moveTo(x, y + 28).lineTo(x + contentWidth(doc), y + 28).stroke().restore();
  return y + 29;
}

function risksSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate, y: number): number {
  y = sectionTitle(doc, fonts, 8, 'Риски', y);
  if (estimate.risks.length === 0) {
    return note(doc, fonts, 'Реестр рисков пуст — это не значит, что рисков нет: раздел требует ручного заполнения перед закупкой.', y);
  }
  y = riskHeader(doc, fonts, y);
  for (const risk of estimate.risks) {
    y = ensureSpace(doc, y, 30);
    y = riskRow(doc, fonts, risk, estimate.cost.p50Rub, y);
  }
  return note(doc, fonts, 'Риски: уровень — RAG-оценка ожидаемого ущерба относительно P50 (низкий / средний / высокий). Цвет всегда дублируется словом.', y + SPACE.xs);
}

function coefficient(analogue: Estimate['analogues'][number]): number {
  const n = analogue.normalization;
  return n.kScope * n.kComplexity * n.kRegion * n.kAge * n.kVat;
}

function analoguesSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate, y: number): number {
  y = sectionTitle(doc, fonts, 9, 'Аналоги', y);
  const rows = estimate.analogues.map((analogue) => [
    `${analogue.title}${analogue.included ? '' : ' · исключён'}`,
    String(analogue.year),
    `${moneyShort(analogue.price.mid)}${analogue.vatFlag ? ' с НДС' : ''}`,
    coefficient(analogue).toFixed(2),
    analogue.normalizedPriceRub === undefined ? '—' : moneyShort(analogue.normalizedPriceRub),
    analogue.sourceId,
  ]);
  return table(doc, fonts, {
    y,
    columns: [
      { header: 'Проект', width: 165 },
      { header: 'Год', width: 36, align: 'right' },
      { header: 'Цена', width: 75, align: 'right' },
      { header: 'Коэф.', width: 40, align: 'right' },
      { header: 'Приведено', width: 80, align: 'right' },
      { header: 'Источник', width: 99 },
    ],
    rows,
    emptyText: 'Аналоги не переданы — раздел не применяется к этому расчёту; приведение цен не выполнялось.',
  });
}

function stagesSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate, y: number): number {
  y = sectionTitle(doc, fonts, 10, 'Этапы', y);
  const totalHours = estimate.effort.grid.totalHours || estimate.effort.p50Hours;
  const stages = [...estimate.effort.grid.byStage].sort((a, b) => a.stage - b.stage);
  const rows = stages.map((stage) => {
    const share = totalHours > 0 ? stage.hours / totalHours : 0;
    return [
      `${stage.stage}. ${STAGE_NAMES[stage.stage] ?? 'Этап'}`,
      num(stage.hours),
      moneyShort(estimate.cost.p50Rub * share),
      (stage.hours / 8).toFixed(1),
    ];
  });
  const tableEnd = table(doc, fonts, {
    y,
    columns: [
      { header: 'Этап', width: 240 },
      { header: 'Часы', width: 70, align: 'right' },
      { header: 'Стоимость', width: 110, align: 'right' },
      { header: 'Дни', width: 75, align: 'right' },
    ],
    rows,
    emptyText: 'Разбивка по этапам не передана — доступна только суммарная трудоёмкость.',
  });
  return note(doc, fonts, 'Стоимость этапа распределена пропорционально часам от P50; дни — по 8 часов. Это ориентир, не календарный план.', tableEnd);
}


export function writeAppendixPages(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): void {
  doc.addPage();
  let y = assumptionsSection(doc, fonts, estimate, doc.page.margins.top);
  y = risksSection(doc, fonts, estimate, y);
  y = analoguesSection(doc, fonts, estimate, y);
  stagesSection(doc, fonts, estimate, y);
  writeMethodologyAndSources(doc, fonts, estimate);
}
