import { describe, expect, it } from 'vitest';
import { normaliseRow, parseRows } from './parse.js';

const CSV = `id,project_type,title,year,currency,price_low,price_mid,price_high,price_basis,source,source_date,confidence
hub_test,mes,Диспетчеризация завода,2026,RUB,1000000,1500000,2000000,contract_price,https://example.com/case,2026-10-01,Medium`;

describe('data hub row parsing', () => {
  it('reads a CSV row into the analogue shape', () => {
    const rows = parseRows(Buffer.from(CSV, 'utf8'), 'sample.csv');
    expect(rows).toHaveLength(1);

    const result = normaliseRow(rows[0] ?? {}, 'manual', 0);
    expect(result.error).toBeUndefined();
    expect(result.row).toMatchObject({
      id: 'hub_test',
      project_type: 'mes',
      title: 'Диспетчеризация завода',
      year: 2026,
      price_mid: 1500000,
      currency: 'RUB',
      corpus_source: 'data_hub',
      provenance_file: 'data/sources.json#manual',
    });
  });

  it('rejects a row without a source or price', () => {
    expect(normaliseRow({ project_type: 'mes', title: 'Без источника' }, 'manual', 0).error)
      .toBe('missing source');
    expect(normaliseRow({ project_type: 'mes', title: 'Без цены', source: 'https://x' }, 'manual', 0).error)
      .toBe('missing positive price');
  });
});
