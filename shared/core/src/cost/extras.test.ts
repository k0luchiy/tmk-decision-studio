import { describe, expect, it } from 'vitest';
import { costExtras } from './extras.js';

describe('costExtras', () => {
  it('prices an extra as qty × price and marks it as an assumption without a source', () => {
    const [line] = costExtras([
      { id: 'licenses', label: 'Лицензии, 10 шт', qty: 10, unitPriceRub: 8000 },
    ]);

    expect(line?.id).toBe('extra:licenses');
    expect(line?.group).toBe('extra');
    expect(line?.valueRub).toBe(80_000);
    expect(line?.status).toBe('assumption');
    expect(line?.sourceId).toBeUndefined();
    expect(line?.formula).toBe('10 × 8000 ₽ × 1 мес');
  });

  it('multiplies by months and marks a sourced extra as an offer', () => {
    const [line] = costExtras([
      {
        id: 'cloud',
        label: 'Облачный стенд',
        qty: 1,
        unitPriceRub: 50_000,
        months: 6,
        sourceId: 'offer:cloud-q4',
      },
    ]);

    expect(line?.valueRub).toBe(300_000);
    expect(line?.status).toBe('offer');
    expect(line?.sourceId).toBe('offer:cloud-q4');
    expect(line?.inputRefs).toEqual(['offer:cloud-q4']);
  });

  it('returns one line per extra, preserving order', () => {
    const lines = costExtras([
      { id: 'a', label: 'A', qty: 1, unitPriceRub: 100 },
      { id: 'b', label: 'B', qty: 2, unitPriceRub: 200, months: 2 },
    ]);

    expect(lines.map((line) => line.id)).toEqual(['extra:a', 'extra:b']);
    expect(lines.map((line) => line.valueRub)).toEqual([100, 800]);
  });

  it('rejects negative qty, price or months with RangeError', () => {
    expect(() => costExtras([{ id: 'x', label: 'X', qty: -1, unitPriceRub: 100 }])).toThrow(
      RangeError,
    );
    expect(() => costExtras([{ id: 'x', label: 'X', qty: 1, unitPriceRub: -100 }])).toThrow(
      RangeError,
    );
    expect(() =>
      costExtras([{ id: 'x', label: 'X', qty: 1, unitPriceRub: 100, months: -1 }]),
    ).toThrow(RangeError);
  });
});
