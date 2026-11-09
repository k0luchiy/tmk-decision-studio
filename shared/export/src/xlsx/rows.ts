/** Per-sheet row builders for the XLSX workbook. */

import type { Estimate } from '@app/contract';

/** A single spreadsheet row; values stay typed so numbers become numeric cells. */
type SheetValue = string | number | boolean;
export type SheetRow = Record<string, SheetValue>;

function lastCumulative(estimate: Estimate): number {
  const last = estimate.tco[estimate.tco.length - 1];
  return last === undefined ? 0 : last.cumulativeRub;
}

export function scenarioRows(estimate: Estimate): SheetRow[] {
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

export function lineItemRows(estimate: Estimate): SheetRow[] {
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

export function assumptionRows(estimate: Estimate): SheetRow[] {
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

export function riskRows(estimate: Estimate): SheetRow[] {
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

export function sensitivityRows(estimate: Estimate): SheetRow[] {
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

export function analogueRows(estimate: Estimate): SheetRow[] {
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

export function sourceRows(estimate: Estimate): SheetRow[] {
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
