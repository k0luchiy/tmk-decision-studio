/** Decision pages of the TMK Decision Studio report (sections 1–6). */

import type { ConfidenceScore, Estimate } from '@app/contract';
import { breakEvenChart, confidenceBars, costRangeChart, tcoChart } from './charts.js';
import {
  badge,
  coverHeader,
  divider,
  ensureSpace,
  kpiCard,
  note,
  sectionTitle,
} from './components.js';
import type { PageMeta } from './components.js';
import { comparisonSection, verdictCodeLabel } from './comparison.js';
import type { PdfContext } from './context.js';
import { barRow } from './tables.js';
import type { Fonts } from './fonts.js';
import {
  COLORS,
  SPACE,
  TYPE,
  confidenceColor,
  confidenceLabel,
  dateRu,
  hours,
  money,
  moneyShort,
  pct,
  weeks,
} from './theme.js';

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function caption(doc: PDFKit.PDFDocument, fonts: Fonts, text: string, y: number): number {
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(text, doc.page.margins.left, y, { width: contentWidth(doc) });
  return y + 14;
}

function verdictSection(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  estimate: Estimate,
  context: PdfContext | undefined,
  y: number,
): number {
  y = sectionTitle(doc, fonts, 2, 'Вердикт', y);
  const x = doc.page.margins.left;
  const width = contentWidth(doc);
  const boxHeight = 74;
  const code = context?.verdict?.code ?? estimate.verdict.code;
  const text = context?.verdict?.text ?? estimate.verdict.text;
  const confidence = context?.confidence ?? estimate.confidence;

  doc.save().fillColor(COLORS.surface).rect(x, y, width, boxHeight).fill();
  doc.fillColor(COLORS.brand).rect(x, y, 4, boxHeight).fill().restore();
  doc.font(fonts.body).fontSize(TYPE.label).fillColor(COLORS.muted).text(
    `РЕКОМЕНДАЦИЯ · ${verdictCodeLabel(code).toUpperCase()}`,
    x + 14,
    y + 10,
    { lineBreak: false },
  );
  doc.font(fonts.body).fontSize(TYPE.body).fillColor(COLORS.ink).text(text, x + 14, y + 24, {
    width: width - 28,
  });
  y += boxHeight + SPACE.md;

  const gap = SPACE.md;
  const cardWidth = (width - gap * 2) / 3;
  const cardHeight = 84;
  kpiCard(doc, fonts, x, y, cardWidth, cardHeight, {
    label: 'Стоимость P50',
    value: moneyShort(estimate.cost.p50Rub),
    range: `P10–P90: ${moneyShort(estimate.cost.p10Rub)} — ${moneyShort(estimate.cost.p90Rub)}`,
    note: `Резерв P80−P50: ${money(estimate.cost.reserveRub)}`,
    accent: true,
  });
  kpiCard(doc, fonts, x + cardWidth + gap, y, cardWidth, cardHeight, {
    label: 'Трудоёмкость P50',
    value: hours(estimate.effort.p50Hours),
    range: `P10–P90: ${hours(estimate.effort.p10Hours)} — ${hours(estimate.effort.p90Hours)}`,
    note: `P80 — резерв: ${hours(estimate.effort.p80Hours)}`,
  });
  kpiCard(doc, fonts, x + (cardWidth + gap) * 2, y, cardWidth, cardHeight, {
    label: 'Срок P50',
    value: weeks(estimate.duration.p50Weeks),
    range: `P10–P90: ${weeks(estimate.duration.p10Weeks)} — ${weeks(estimate.duration.p90Weeks)}`,
    note: `Критический путь: ${estimate.duration.criticalPath.length} этапов`,
  });
  y += cardHeight + SPACE.sm;

  const level = confidence.level;
  const badgeWidth = badge(doc, fonts, x, y, `Уверенность ${confidence.score}/100 · ${confidenceLabel(level)}`, confidenceColor(level));
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
    'Вердикт — оценка порядка, не смета: все числа — вероятностные диапазоны и требуют подтверждения перед закупкой.',
    x + badgeWidth + SPACE.sm,
    y + 3,
    { width: width - badgeWidth - SPACE.sm },
  );
  y += 20;

  y = costRangeChart(doc, fonts, x, y + SPACE.sm, width, estimate);
  return caption(doc, fonts, 'P10–P90 — вероятностный коридор; точка P50 — медианная оценка. Цвет — акцент на P50.', y);
}

function costStructureSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate, y: number): number {
  y = sectionTitle(doc, fonts, 4, 'Структура стоимости', y);
  const lines = [...estimate.cost.lines].sort((a, b) => b.valueRub - a.valueRub).slice(0, 6);
  const total = estimate.cost.p50Rub;
  if (lines.length === 0) {
    return note(doc, fonts, 'Сметные строки не переданы — структура стоимости недоступна для этого сценария.', y);
  }
  const x = doc.page.margins.left;
  const max = lines[0]?.valueRub ?? total;
  for (const line of lines) {
    y = ensureSpace(doc, y, 20);
    const share = total > 0 ? line.valueRub / total : 0;
    y = barRow(doc, fonts, x, y, contentWidth(doc), `${line.label}${line.status === 'assumption' ? ' · допущение' : ''}`, line.valueRub, max, `${pct(share)} · ${moneyShort(line.valueRub)}`);
  }
  return note(doc, fonts, `Топ-${lines.length} строк сметы. Доля считается от P50; строки со статусом «допущение» помечены в подписи.`, y);
}

function tcoSection(doc: PDFKit.PDFDocument, fonts: Fonts, estimate: Estimate): number {
  doc.addPage();
  let y = sectionTitle(doc, fonts, 5, 'TCO и break-even', doc.page.margins.top);
  y = tcoChart(doc, fonts, doc.page.margins.left, y, contentWidth(doc), estimate);
  y = caption(doc, fonts, 'TCO: накопительные и годовые затраты, плюс контур с ожидаемыми рисками. Г0 — реализация.', y + SPACE.xs);
  y += SPACE.sm;
  y = breakEvenChart(doc, fonts, doc.page.margins.left, y, contentWidth(doc), estimate);
  const breakEven = estimate.breakevenMonth;
  return caption(
    doc,
    fonts,
    breakEven === null
      ? 'Break-even в горизонте 24 месяцев не достигается — сравнивайте полный TCO за 3–5 лет.'
      : `Break-even — месяц ${breakEven} эксплуатации. До этой точки накопленные затраты растут; после — сравнение с альтернативой решает TCO.`,
    y + SPACE.xs,
  );
}

function confidenceSection(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  confidence: ConfidenceScore,
  y: number,
): number {
  y = sectionTitle(doc, fonts, 6, 'Уверенность', y);
  const x = doc.page.margins.left;
  const level = confidence.level;
  doc.font(fonts.condensed).fontSize(TYPE.metricLg).fillColor(COLORS.ink).text(`${confidence.score} / 100`, x, y, { lineBreak: false });
  const badgeWidth = badge(doc, fonts, x + 168, y + 9, confidenceLabel(level), confidenceColor(level));
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text('класс уверенности', x + 168 + badgeWidth + 8, y + 13, { lineBreak: false });
  y += 36;
  y = confidenceBars(doc, fonts, x, y, contentWidth(doc), confidence);
  return note(
    doc,
    fonts,
    'Уверенность — мера проверяемости расчёта, а не вероятность ошибки. Она падает, когда бриф неполный, методы расходятся, аналогов мало или данные устарели. RAG-цвет всегда сопровождается текстовым уровнем.',
    y,
  );
}

export interface ReportContext {
  estimate: Estimate;
  meta: PageMeta;
  comparison?: PdfContext;
}

export function writeDecisionPages(doc: PDFKit.PDFDocument, fonts: Fonts, context: ReportContext): void {
  const { estimate, meta, comparison } = context;
  let y = coverHeader(doc, fonts, meta);
  y = verdictSection(doc, fonts, estimate, comparison, y);
  y = comparisonSection(doc, fonts, estimate, comparison, y);
  costStructureSection(doc, fonts, estimate, y);
  const confidenceY = tcoSection(doc, fonts, estimate);
  confidenceSection(doc, fonts, comparison?.confidence ?? estimate.confidence, confidenceY);
  divider(doc, doc.page.margins.left, doc.page.height - 90, contentWidth(doc), COLORS.border, 0.6);
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
    `Отчёт TMK Decision Studio · ${dateRu(meta.createdAt)} · оценка порядка, не смета`,
    doc.page.margins.left,
    doc.page.height - 82,
    { width: contentWidth(doc), lineBreak: false },
  );
}
