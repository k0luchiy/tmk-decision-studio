/**
 * XLSX workbook export (`docs/04_ux_scenario.md` §8, `docs/05_architecture_data.md` §9).
 *
 * The workbook is a working document, not a flat dump: one sheet per view of
 * the estimate (scenarios, line items, assumptions, risks, sensitivity,
 * analogues, sources). Money, hours and shares are written as numeric cells so
 * spreadsheet formulas keep working.
 */

import * as XLSX from 'xlsx';
import type { Estimate } from '@app/contract';

/** A single spreadsheet row; values stay typed so numbers become numeric cells. */
type SheetValue = string | number | boolean;
type SheetRow = Record<string, SheetValue>;

/** Sheet names and order, matching the specification. */
export const SHEET_NAMES = [
  'Scenarios',
  'LineItems',
  'Assumptions',
  'Risks',
  'Sensitivity',
  'Analogues',
  'Sources',
] as const;
export type SheetName = (typeof SHEET_NAMES)[number];

function lastCumulative(estimate: Estimate): number {
  const last = estimate.tco[estimate.tco.length - 1];
  return last === undefined ? 0 : last.cumulativeRub;
}

function scenarioRows(estimate: Estimate): SheetRow[] {
  return [
    {
      scenario: estimate.scenario,
      effortP10Hours: estimate.effort.p10Hours,
      effortP50Hours: estimate.effort.p50Hours,
      effortP80Hours: estimate.effort.p80Hours,
      effortP90Hours: estimate.effort.p90Hours,
      durationP10Weeks: estimate.duration.p10Weeks,
      durationP50Weeks: estimate.duration.p50Weeks,
      durationP80Weeks: estimate.duration.p80Weeks,
      durationP90Weeks: estimate.duration.p90Weeks,
      costP10Rub: estimate.cost.p10Rub,
      costP50Rub: estimate.cost.p50Rub,
      costP80Rub: estimate.cost.p80Rub,
      costP90Rub: estimate.cost.p90Rub,
      reserveRub: estimate.cost.reserveRub,
      tco3yRub: lastCumulative(estimate),
      breakevenMonth: estimate.breakevenMonth ?? 'n/a',
      confidenceScore: estimate.confidence.score,
    },
  ];
}

function lineItemRows(estimate: Estimate): SheetRow[] {
  return estimate.cost.lines.map((line) => ({
    id: line.id,
    group: line.group,
    label: line.label,
    formula: line.formula,
    valueRub: line.valueRub,
    status: line.status,
    sourceId: line.sourceId ?? '',
  }));
}

function assumptionRows(estimate: Estimate): SheetRow[] {
  return estimate.assumptions.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    low: item.range.low,
    high: item.range.high,
    sourceId: item.sourceId,
    pinned: item.pinned,
    owner: item.owner,
  }));
}

function riskRows(estimate: Estimate): SheetRow[] {
  return estimate.risks.map((risk) => ({
    id: risk.id,
    label: risk.label,
    probability: risk.probability,
    impactLowRub: risk.impactRub.low,
    impactMidRub: risk.impactRub.mid,
    impactHighRub: risk.impactRub.high,
    expectedRub: risk.expectedRub ?? 0,
    mitigation: risk.mitigation,
    party: risk.party,
    sourceId: risk.sourceId,
  }));
}

function sensitivityRows(estimate: Estimate): SheetRow[] {
  return estimate.assumptions.map((item) => ({
    assumptionId: item.id,
    label: item.label,
    value: item.value,
    low: item.range.low,
    high: item.range.high,
    sensitivity: item.sensitivity ?? 0,
    pinned: item.pinned,
    owner: item.owner,
  }));
}

function analogueRows(estimate: Estimate): SheetRow[] {
  return estimate.analogues.map((analogue) => ({
    id: analogue.id,
    corpus: analogue.corpus,
    type: analogue.type,
    title: analogue.title,
    year: analogue.year,
    currency: analogue.currency,
    priceLow: analogue.price.low,
    priceMid: analogue.price.mid,
    priceHigh: analogue.price.high,
    priceBasis: analogue.price.basis,
    normalizedPriceRub: analogue.normalizedPriceRub ?? 0,
    included: analogue.included,
    sourceId: analogue.sourceId,
    url: analogue.url ?? '',
    date: analogue.date ?? '',
  }));
}

interface SourceUsage {
  sourceId: string;
  referencedBy: Set<string>;
}

function sourceRows(estimate: Estimate): SheetRow[] {
  const usage = new Map<string, SourceUsage>();

  const add = (sourceId: string | undefined, kind: string): void => {
    if (sourceId === undefined || sourceId.length === 0) {
      return;
    }
    const existing = usage.get(sourceId);
    if (existing === undefined) {
      usage.set(sourceId, { sourceId, referencedBy: new Set([kind]) });
    } else {
      existing.referencedBy.add(kind);
    }
  };

  for (const line of estimate.cost.lines) {
    add(line.sourceId, 'costLine');
  }
  for (const assumption of estimate.assumptions) {
    add(assumption.sourceId, 'assumption');
  }
  for (const risk of estimate.risks) {
    add(risk.sourceId, 'risk');
  }
  for (const analogue of estimate.analogues) {
    add(analogue.sourceId, 'analogue');
  }

  return [...usage.values()]
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId))
    .map((entry) => ({
      sourceId: entry.sourceId,
      referencedBy: [...entry.referencedBy].sort().join(', '),
      references: entry.referencedBy.size,
    }));
}

function appendSheet(
  workbook: XLSX.WorkBook,
  name: SheetName,
  rows: SheetRow[],
  header: string[],
): void {
  const sheet = XLSX.utils.json_to_sheet(rows, { header });
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

/**
 * Renders the estimate as a 7-sheet XLSX workbook.
 *
 * Sheet order: Scenarios, LineItems, Assumptions, Risks, Sensitivity,
 * Analogues, Sources. All numeric fields are emitted as numbers, never as
 * preformatted strings.
 */
export function toXlsx(estimate: Estimate): Buffer {
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, 'Scenarios', scenarioRows(estimate), [
    'scenario',
    'effortP10Hours',
    'effortP50Hours',
    'effortP80Hours',
    'effortP90Hours',
    'durationP10Weeks',
    'durationP50Weeks',
    'durationP80Weeks',
    'durationP90Weeks',
    'costP10Rub',
    'costP50Rub',
    'costP80Rub',
    'costP90Rub',
    'reserveRub',
    'tco3yRub',
    'breakevenMonth',
    'confidenceScore',
  ]);

  appendSheet(workbook, 'LineItems', lineItemRows(estimate), [
    'id',
    'group',
    'label',
    'formula',
    'valueRub',
    'status',
    'sourceId',
  ]);

  appendSheet(workbook, 'Assumptions', assumptionRows(estimate), [
    'id',
    'label',
    'value',
    'low',
    'high',
    'sourceId',
    'pinned',
    'owner',
  ]);

  appendSheet(workbook, 'Risks', riskRows(estimate), [
    'id',
    'label',
    'probability',
    'impactLowRub',
    'impactMidRub',
    'impactHighRub',
    'expectedRub',
    'mitigation',
    'party',
    'sourceId',
  ]);

  appendSheet(workbook, 'Sensitivity', sensitivityRows(estimate), [
    'assumptionId',
    'label',
    'value',
    'low',
    'high',
    'sensitivity',
    'pinned',
    'owner',
  ]);

  appendSheet(workbook, 'Analogues', analogueRows(estimate), [
    'id',
    'corpus',
    'type',
    'title',
    'year',
    'currency',
    'priceLow',
    'priceMid',
    'priceHigh',
    'priceBasis',
    'normalizedPriceRub',
    'included',
    'sourceId',
    'url',
    'date',
  ]);

  appendSheet(workbook, 'Sources', sourceRows(estimate), [
    'sourceId',
    'referencedBy',
    'references',
  ]);

  const output: Buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return output;
}
