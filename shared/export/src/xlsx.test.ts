import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { SHEET_NAMES, toXlsx } from './xlsx.js';

function firstEstimate(): Estimate {
  return EstimateSchema.parse(d1ScenariosJson[0]);
}

type Cell = string | number | boolean;

describe('toXlsx', () => {
  it('produces the 7 required sheets in order', () => {
    const buffer = toXlsx(firstEstimate());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    expect(workbook.SheetNames).toEqual([...SHEET_NAMES]);
    expect(workbook.SheetNames).toHaveLength(7);
  });

  it('writes LineItems values as numbers that sum to the P50 total', () => {
    const estimate = firstEstimate();
    const buffer = toXlsx(estimate);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheet = workbook.Sheets.LineItems;
    expect(sheet).toBeDefined();
    if (sheet === undefined) {
      throw new Error('LineItems sheet is missing');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, Cell>>(sheet);
    expect(rows).toHaveLength(estimate.cost.lines.length);

    let sum = 0;
    for (const row of rows) {
      const value = row.valueRub;
      expect(typeof value).toBe('number');
      if (typeof value !== 'number') {
        throw new Error(`LineItems.valueRub must be numeric, got ${String(value)}`);
      }
      sum += value;
    }

    expect(Math.abs(sum - estimate.cost.p50Rub)).toBeLessThanOrEqual(1);
  });

  it('lists sources gathered from every entity that carries a sourceId', () => {
    const estimate = firstEstimate();
    const workbook = XLSX.read(toXlsx(estimate), { type: 'buffer' });
    const sheet = workbook.Sheets.Sources;
    expect(sheet).toBeDefined();
    if (sheet === undefined) {
      throw new Error('Sources sheet is missing');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, Cell>>(sheet);
    const ids = new Set(rows.map((row) => String(row.sourceId)));
    expect(ids.size).toBeGreaterThan(0);

    for (const line of estimate.cost.lines) {
      if (line.sourceId !== undefined) {
        expect(ids.has(line.sourceId)).toBe(true);
      }
    }
    for (const analogue of estimate.analogues) {
      expect(ids.has(analogue.sourceId)).toBe(true);
    }
  });
});
