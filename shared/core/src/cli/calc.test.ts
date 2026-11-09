import { loadDatasets } from '@app/data';
import type { LoadedDatasets } from '@app/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { computeCalcD1, formatCalcTable } from './calc.js';

let datasets: LoadedDatasets;

beforeAll(async () => {
  datasets = await loadDatasets();
});

describe('computeCalcD1', () => {
  it('returns a six-stage D1 estimate without writing files', () => {
    const result = computeCalcD1(datasets);

    expect(result.task.id).toBe('d1');
    expect(result.task.title).toBe('Интеграция 1С:ERP ↔ WMS, 6 потоков');
    expect(result.flows).toBe(6);
    expect(result.stages.map((row) => row.stage)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.grid.totalHours).toBeGreaterThan(0);
    expect(result.stages.every((row) => row.hours > 0)).toBe(true);
  });

  it('prices in-house and both contractor models above zero', () => {
    const result = computeCalcD1(datasets);

    expect(result.inhouse.totalRub).toBeGreaterThan(0);
    expect(result.contractor.tAndM.totalRub).toBeGreaterThan(0);
    expect(result.contractor.fixedPrice.totalRub).toBeGreaterThan(result.contractor.tAndM.totalRub);
    expect(result.inhouse.lines.some((line) => line.group === 'hiring')).toBe(true);
  });

  it('formats a table with the expected header', () => {
    const result = computeCalcD1(datasets);
    const table = formatCalcTable(result);

    expect(table.split('\n')[0]).toContain('stage');
    expect(table.split('\n')[0]).toContain('hours');
    expect(table.split('\n')[0]).toContain('cost inhouse');
    expect(table.split('\n')[0]).toContain('cost contractor');
    expect(table.split('\n')).toHaveLength(8);
  });
});
