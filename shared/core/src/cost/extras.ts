/**
 * Attachable cost extras (`docs/03_estimation_model.md` §5.3, FR-2.7).
 *
 * Each extra becomes one `CostLine` in the `extra` group. An extra with a
 * `sourceId` is an offer (`status: 'offer'`); without one it is a planning
 * assumption (`status: 'assumption'`). The function is pure, deterministic and
 * rejects negative quantities, prices or durations with `RangeError`.
 */

import type { CostLine } from '@app/contract';

/** One attachable cost article, e.g. licences or cloud infrastructure. */
export interface CostExtra {
  id: string;
  label: string;
  /** Quantity in the article's own unit. */
  qty: number;
  /** Unit price in roubles. */
  unitPriceRub: number;
  /** Period in months; omitted means one period. */
  months?: number;
  /** Source or offer reference; presence marks the line as an offer. */
  sourceId?: string;
}

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, got ${value}`);
  }
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return String(Number(value.toFixed(6)));
}

/**
 * Converts attachable extras into cost lines.
 *
 * `valueRub = qty × unitPriceRub × (months ?? 1)`; `group` is always `extra`.
 * A missing `sourceId` makes the line an assumption, otherwise an offer.
 *
 * @throws {RangeError} when `qty`, `unitPriceRub` or `months` is negative or
 *   not finite.
 */
export function costExtras(extras: CostExtra[]): CostLine[] {
  return extras.map((extra) => {
    const months = extra.months ?? 1;
    assertFiniteNonNegative(`extra.${extra.id}.qty`, extra.qty);
    assertFiniteNonNegative(`extra.${extra.id}.unitPriceRub`, extra.unitPriceRub);
    assertFiniteNonNegative(`extra.${extra.id}.months`, months);

    const valueRub = extra.qty * extra.unitPriceRub * months;
    const line: CostLine = {
      id: `extra:${extra.id}`,
      group: 'extra',
      label: extra.label,
      formula: `${formatNumber(extra.qty)} × ${formatNumber(extra.unitPriceRub)} ₽ × ${formatNumber(months)} мес`,
      inputRefs: extra.sourceId === undefined ? [] : [extra.sourceId],
      valueRub,
      status: extra.sourceId === undefined ? 'assumption' : 'offer',
    };
    if (extra.sourceId !== undefined) {
      line.sourceId = extra.sourceId;
    }
    return line;
  });
}
