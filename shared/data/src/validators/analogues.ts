/** Structural checks for `analogue_corpus.json`. */

import type { AnalogueRow, Datasets } from '../types.js';
import {
  ANALOGUE_CURRENCIES,
  asArray,
  isFiniteNumber,
  isNonEmptyString,
  issue,
  type ValidationIssue,
} from './issues.js';

export function validateAnalogues(data: Datasets, issues: ValidationIssue[]): void {
  const analogues = asArray<AnalogueRow>(data.analogues?.analogues);
  if (analogues.length < 49) {
    issue(issues, 'ANALOGUE_COUNT', 'analogues.analogues', `expected at least 49 analogues, got ${analogues.length}`);
  }
  const tmkRows = asArray<unknown>(data.analogues?.tmk_eis_rows);
  if (tmkRows.length !== 60) {
    issue(issues, 'ANALOGUE_TMK_COUNT', 'analogues.tmk_eis_rows', `expected 60 tmk_eis_rows, got ${tmkRows.length}`);
  }

  analogues.forEach((analogue, index) => {
    const analoguePath = `analogues.analogues[${index}]`;
    if (!isNonEmptyString(analogue.source)) {
      issue(issues, 'ANALOGUE_SOURCE_MISSING', `${analoguePath}.source`, 'source must be non-empty');
    }

    const { price_low: low, price_mid: mid, price_high: high } = analogue;
    if (low !== null && low !== undefined && mid !== null && mid !== undefined && high !== null && high !== undefined) {
      if (!(isFiniteNumber(low) && isFiniteNumber(mid) && isFiniteNumber(high) && low <= mid && mid <= high)) {
        issue(issues, 'ANALOGUE_PRICE_ORDER', `${analoguePath}.price_mid`, 'expected price_low <= price_mid <= price_high');
      }
    }
    if (!ANALOGUE_CURRENCIES.has(analogue.currency)) {
      issue(issues, 'ANALOGUE_CURRENCY_INVALID', `${analoguePath}.currency`, `unsupported currency "${String(analogue.currency)}"`);
    }
  });
}
