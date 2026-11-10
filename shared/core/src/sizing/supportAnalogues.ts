/**
 * Support / maintenance analogues from the TMK procurement registry.
 *
 * The published analogue corpus has no `support` rows, so D3 (support) is
 * backed by real TMK/EIS contracts whose subject mentions support, maintenance
 * or technical support. Only rows with a positive price and a source URL are
 * kept; nothing is synthesised.
 */

import type { TmkContract } from '@app/data';
import type { RawAnalogue } from './analogues.js';

/** Subjects that describe a support / maintenance engagement. */
export const SUPPORT_SUBJECT_PATTERN = /поддержк|сопровожд|техподдержк/i;

const PROCEDURE_ID_PATTERN = /\/procedure\/(\d+)/;

/** Stable identifier: the ETP procedure number when present, else the index. */
function contractKey(contract: TmkContract, index: number): string {
  const match = PROCEDURE_ID_PATTERN.exec(contract.source_url);
  return match?.[1] ?? String(index);
}

/** Calendar year of `start_date`, or `undefined` when it cannot be parsed. */
export function contractYear(startDate: string): number | undefined {
  const parsed = Date.parse(startDate);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return new Date(parsed).getUTCFullYear();
}

/**
 * Maps support-related TMK contracts to {@link RawAnalogue} rows.
 *
 * Rows are excluded when the subject is unrelated, the price is not positive,
 * the source URL is empty, or the start date cannot be parsed.
 */
export function supportAnaloguesFromContracts(contracts: TmkContract[]): RawAnalogue[] {
  const analogues: RawAnalogue[] = [];

  contracts.forEach((contract, index) => {
    if (!SUPPORT_SUBJECT_PATTERN.test(contract.subject_short)) {
      return;
    }
    if (!Number.isFinite(contract.price_rub) || contract.price_rub <= 0) {
      return;
    }
    if (typeof contract.source_url !== 'string' || contract.source_url.trim() === '') {
      return;
    }
    const year = contractYear(contract.start_date);
    if (year === undefined) {
      return;
    }

    analogues.push({
      id: `tmk:${contractKey(contract, index)}`,
      project_type: 'support',
      title: contract.subject_short,
      year,
      currency: 'RUB',
      price_low: contract.price_rub,
      price_mid: contract.price_rub,
      price_high: contract.price_rub,
      source: contract.source_url,
      price_basis: 'contract_price',
    });
  });

  return analogues;
}
