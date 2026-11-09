/** Vector charts drawn with PDFKit primitives — no charting dependency. */

import type { Estimate } from '@app/contract';
import { COLORS, SPACE, TYPE, hours, moneyShort, num, weeks } from './theme.js';
import type { Fonts } from './fonts.js';

function riskExposure(estimate: Estimate): number {
  return estimate.risks.reduce(
    (sum, risk) => sum + (risk.expectedRub ?? risk.probability * risk.impactRub.mid),
    0,
  );
}

interface RangeRow {
  label: string;
  p10: number;
  p50: number;
  p90: number;
  format: (value: number) => string;
}

/** Three P10–P90 bands with a P50 dot: cost, effort and duration on one scale each. */
export function costRangeChart(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  estimate: Estimate,
): number {
  const rows: RangeRow[] = [
    { label: 'Стоимость', p10: estimate.cost.p10Rub, p50: estimate.cost.p50Rub, p90: estimate.cost.p90Rub, format: moneyShort },
    { label: 'Трудоёмкость', p10: estimate.effort.p10Hours, p50: estimate.effort.p50Hours, p90: estimate.effort.p90Hours, format: hours },
    { label: 'Срок', p10: estimate.duration.p10Weeks, p50: estimate.duration.p50Weeks, p90: estimate.duration.p90Weeks, format: weeks },
  ];
  const labelWidth = 92;
  const valueWidth = 92;
  const trackX = x + labelWidth;
  const trackWidth = Math.max(40, width - labelWidth - valueWidth);
  let cursor = y;

  for (const row of rows) {
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink).text(row.label, x, cursor + 3, { width: labelWidth - 6, lineBreak: false });
    const max = Math.max(row.p90, 1);
    const left = trackX + (row.p10 / max) * trackWidth;
    const right = trackX + (row.p90 / max) * trackWidth;
    const mid = trackX + (row.p50 / max) * trackWidth;
    doc.save().fillColor(COLORS.surfaceSunken).rect(trackX, cursor + 4, trackWidth, 8).fill();
    doc.fillColor(COLORS.info).rect(left, cursor + 4, Math.max(2, right - left), 8).fill();
    doc.fillColor(COLORS.brand).circle(mid, cursor + 8, 3.2).fill().restore();
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
      `${row.format(row.p10)} — ${row.format(row.p90)} · P50 ${row.format(row.p50)}`,
      trackX + trackWidth + 6,
      cursor + 3,
      { width: valueWidth - 6, align: 'right', lineBreak: false },
    );
    cursor += 26;
  }
  return cursor + SPACE.xs;
}

function yAxis(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  top: number,
  width: number,
  height: number,
  max: number,
): void {
  doc.save().lineWidth(0.6).strokeColor(COLORS.border);
  for (const share of [0, 0.5, 1]) {
    const lineY = top + height - height * share;
    doc.moveTo(x, lineY).lineTo(x + width, lineY).stroke();
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
      moneyShort(max * share),
      x + width + 4,
      lineY - 4,
      { width: 62, align: 'right', lineBreak: false },
    );
  }
  doc.restore();
}

function polyline(
  doc: PDFKit.PDFDocument,
  points: readonly { x: number; y: number }[],
  color: string,
  dashed = false,
): void {
  if (points.length === 0) {
    return;
  }
  doc.save().lineWidth(1.6).strokeColor(color);
  if (dashed) {
    doc.dash(3, { space: 2 });
  }
  const first = points[0];
  if (first !== undefined) {
    doc.moveTo(first.x, first.y);
    for (const point of points.slice(1)) {
      doc.lineTo(point.x, point.y);
    }
    doc.stroke();
  }
  doc.undash();
  doc.restore();
}

/** Three TCO lines for years 0–5: cumulative, annual and risk-adjusted. */
export function tcoChart(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  estimate: Estimate,
): number {
  const top = y;
  const height = 132;
  const years = [0, 1, 2, 3, 4, 5];
  const annualRun = estimate.tco.find((row) => row.year >= 1)?.costRub ?? 0;
  const risks = riskExposure(estimate);
  const cumulative = years.map((year) => {
    const row = estimate.tco.find((item) => item.year === year);
    if (row !== undefined) {
      return row.cumulativeRub;
    }
    const last = estimate.tco[estimate.tco.length - 1];
    return (last?.cumulativeRub ?? 0) + annualRun * (year - (last?.year ?? 0));
  });
  const implementation = estimate.tco.find((row) => row.year === 0)?.costRub ?? estimate.cost.p50Rub;
  const support = cumulative.map((value) => Math.max(0, value - implementation));
  const withRisk = cumulative.map((value) => value + risks);
  const max = Math.max(...withRisk, ...cumulative, 1) * 1.08;
  const plotWidth = width - 70;
  const step = plotWidth / (years.length - 1);
  const toPoints = (values: readonly number[]): { x: number; y: number }[] =>
    values.map((value, index) => ({ x: x + index * step, y: top + height - (value / max) * height }));

  yAxis(doc, fonts, x, top, plotWidth, height, max);
  polyline(doc, toPoints(withRisk), COLORS.seriesContractor, true);
  polyline(doc, toPoints(cumulative), COLORS.seriesInhouse);
  polyline(doc, toPoints(support), COLORS.seriesHybrid);
  for (const year of years) {
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(`Г${year}`, x + years.indexOf(year) * step - 8, top + height + 4, { width: 24, align: 'center', lineBreak: false });
  }
  const labels = [
    { text: 'накопительно', color: COLORS.seriesInhouse },
    { text: 'только сопровождение', color: COLORS.seriesHybrid },
    { text: 'с рисками', color: COLORS.seriesContractor },
  ];
  const legendY = top + height + 16;
  labels.forEach((item, index) => {
    const itemX = x + index * 112;
    doc.save().fillColor(item.color).rect(itemX, legendY + 2, 8, 3).fill().restore();
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(item.text, itemX + 12, legendY - 1, { width: 96, lineBreak: false });
  });
  return top + height + 30;
}

/** Cumulative cost by month 0–24 with the break-even marker. */
export function breakEvenChart(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  estimate: Estimate,
  alternatives: readonly Estimate[] = [],
): number {
  const top = y;
  const height = 124;
  const months = 24;
  const curve = (item: Estimate): number[] => {
    const implementation = item.tco.find((row) => row.year === 0)?.costRub ?? item.cost.p50Rub;
    const annual = item.tco.find((row) => row.year >= 1)?.costRub ?? 0;
    return Array.from({ length: months + 1 }, (_, month) => implementation + (annual / 12) * month);
  };
  const current = curve(estimate);
  const comparison = alternatives[0] !== undefined ? curve(alternatives[0]) : current.map((value) => value + riskExposure(estimate));
  const max = Math.max(...current, ...comparison, 1) * 1.08;
  const plotWidth = width - 70;
  const step = plotWidth / months;
  const toPoints = (values: readonly number[]): { x: number; y: number }[] =>
    values.map((value, index) => ({ x: x + index * step, y: top + height - (value / max) * height }));

  yAxis(doc, fonts, x, top, plotWidth, height, max);
  polyline(doc, toPoints(comparison), COLORS.seriesContractor);
  polyline(doc, toPoints(current), COLORS.seriesInhouse);
  for (const month of [0, 6, 12, 18, 24]) {
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(`М${month}`, x + month * step - 9, top + height + 4, { width: 26, align: 'center', lineBreak: false });
  }
  const breakEven = estimate.breakevenMonth;
  if (breakEven !== null && breakEven <= months) {
    const bx = x + breakEven * step;
    doc.save().lineWidth(1).strokeColor(COLORS.brand).dash(2, { space: 2 }).moveTo(bx, top).lineTo(bx, top + height).stroke().undash().restore();
    doc.font(fonts.bold).fontSize(TYPE.micro).fillColor(COLORS.brandText).text(`М${breakEven}`, bx + 3, top + 2, { lineBreak: false });
  }
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.seriesInhouse).text('выбранный сценарий', x, top + height + 17, { lineBreak: false });
  doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.seriesContractor).text(
    alternatives[0] !== undefined ? 'альтернатива' : 'с риск-надбавкой',
    x + 100,
    top + height + 17,
    { lineBreak: false },
  );
  return top + height + 32;
}

/** Four confidence components as horizontal bars, RAG colour plus a text label. */
export function confidenceBars(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  x: number,
  y: number,
  width: number,
  estimate: Estimate,
): number {
  const components = estimate.confidence.components;
  let cursor = y;
  if (components.length === 0) {
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.muted).text('Компоненты уверенности не переданы.', x, cursor);
    return cursor + 18;
  }
  const labelWidth = 104;
  const trackX = x + labelWidth;
  const trackWidth = Math.max(60, width - labelWidth - 96);
  for (const component of components) {
    const color = component.value >= 0.7 ? COLORS.good : component.value >= 0.5 ? COLORS.warn : COLORS.bad;
    doc.font(fonts.body).fontSize(TYPE.bodyS).fillColor(COLORS.ink).text(component.key, x, cursor + 3, { width: labelWidth - 6, lineBreak: false });
    doc.save().fillColor(COLORS.surfaceSunken).rect(trackX, cursor + 3, trackWidth, 8).fill();
    doc.fillColor(color).rect(trackX, cursor + 3, trackWidth * Math.max(0.02, component.value), 8).fill().restore();
    doc.font(fonts.body).fontSize(TYPE.micro).fillColor(COLORS.muted).text(
      `${num(component.value * 100)} / вес ${num(component.weight * 100)} %`,
      trackX + trackWidth + 6,
      cursor + 3,
      { width: 88, align: 'right', lineBreak: false },
    );
    cursor += 20;
  }
  return cursor + SPACE.sm;
}
