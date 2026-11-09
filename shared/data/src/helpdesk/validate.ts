/** Per-row data-quality checks for HelpDesk exports. */

import { KNOWN_ACTIVITIES, str } from './parse.js';

export interface RowSignals {
  rowNumber: number;
  createdRaw: unknown;
  created: string | undefined;
  kind: string;
  activity: string;
  planHours: number;
  actualHours: number;
  quotedHours: number;
}

/** Warning suffixes for one row, in the order the original importer emitted. */
export function rowWarnings(signals: RowSignals): string[] {
  const { rowNumber, createdRaw, created, kind, activity, planHours, actualHours, quotedHours } =
    signals;
  const warnings: string[] = [];

  if (created === undefined && str(createdRaw) !== '') {
    warnings.push(`row ${rowNumber}: bad_date`);
  }
  if (kind === '') {
    warnings.push(`row ${rowNumber}: empty_kind`);
  }
  if (!KNOWN_ACTIVITIES.has(activity)) {
    warnings.push(`row ${rowNumber}: unknown_activity`);
  }
  if (planHours === 0 && actualHours > 0) {
    warnings.push(`row ${rowNumber}: plan_zero`);
  }
  if (planHours === actualHours && actualHours === quotedHours) {
    warnings.push(`row ${rowNumber}: copied_effort`);
  }
  if (!Number.isInteger(quotedHours)) {
    warnings.push(`row ${rowNumber}: fractional_quota`);
  }

  return warnings;
}
