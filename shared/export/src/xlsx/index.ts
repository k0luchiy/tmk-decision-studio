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
import {
  analogueRows,
  assumptionRows,
  lineItemRows,
  riskRows,
  scenarioRows,
  sensitivityRows,
  sourceRows,
  type SheetRow,
} from './rows.js';

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
