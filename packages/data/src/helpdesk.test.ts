import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { findHelpdeskFile, parseHelpdeskFile, parseHelpdeskWorkbook } from './helpdesk.js';
import { repositoryRoot } from './loaders.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));

const HEADERS = [
  'Номер',
  'Изменение.Номер',
  'Вид',
  'Заголовок',
  'Специалист',
  'Рабочая группа',
  'Состояние',
  'Тип активности ЗНИ',
  'Дата создания',
  'Описание',
  'Плановая дата завершения',
  'Фактическое завершение',
  'Дата изменения',
  'Фактическая трудоемкость (часов)',
  'Плановая трудоемкость (часов)',
  'Заквотированное время, часы',
];

function makeRow(overrides: Partial<Record<number, string | number>> = {}): Array<string | number> {
  const base: Array<string | number> = [
    'IM00000001',
    'CR00000001',
    '',
    'Задача',
    'Специалист 1',
    'Л3. ДИАЙПИ. 1С Производство',
    'Завершена',
    'Реализация изменения',
    '01.01.2026 10:00',
    '',
    '10.01.2026 10:00',
    '05.01.2026 10:00',
    '05.01.2026 10:00',
    1,
    2,
    1,
  ];
  for (const [index, value] of Object.entries(overrides)) {
    base[Number(index)] = value as string | number;
  }
  return base;
}

/** Mirrors the synthetic-data path: sheet -> CSV -> workbook (as the task requests). */
function workbookFromRows(rows: Array<Array<string | number>>): XLSX.WorkBook {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return XLSX.read(csv, { type: 'string' });
}

describe('helpdesk import', () => {
  it('imports the real workbook: 4 rows -> 4 tasks -> 4 work items', async () => {
    const filePath = await findHelpdeskFile(root);
    const result = await parseHelpdeskFile(filePath);

    expect(result.report.dataset).toBe('helpdesk');
    expect(result.report.rowsTotal).toBe(4);
    expect(result.report.rowsOk).toBe(4);
    expect(result.tasks).toHaveLength(4);
    expect(result.workItems).toHaveLength(4);
    expect(result.report.rowsDropped).toEqual([]);
  });

  it('imports a synthetic 120-row CSV as 120 work items across fewer tasks', () => {
    const rows: Array<Array<string | number>> = [HEADERS];
    for (let i = 0; i < 120; i += 1) {
      const group = Math.floor(i / 2);
      rows.push(
        makeRow({
          0: `IM${String(i).padStart(8, '0')}`,
          1: `CR${String(group).padStart(8, '0')}`,
          3: `Задача ${i}`,
          4: `Исполнитель ${i % 7}`,
          5: i % 2 === 0 ? 'Л3. ДИАЙПИ. 1С Производство' : 'Л3. Разработка BPMSoft',
          7: i % 3 === 0 ? 'Разработка ФС' : i % 3 === 1 ? 'Реализация изменения' : 'Оценка трудоёмкости',
          8: '01.01.2026 10:00',
          13: 1 + (i % 5),
          14: 2 + (i % 5),
          15: 1 + (i % 5),
        }),
      );
    }

    const result = parseHelpdeskWorkbook(workbookFromRows(rows));

    expect(result.report.rowsTotal).toBe(120);
    expect(result.report.rowsOk).toBe(120);
    expect(result.workItems).toHaveLength(120);
    expect(result.tasks.length).toBeLessThan(120);
  });

  it('drops a duplicate (Номер, тип, специалист, дата) with reason duplicate', () => {
    const row = makeRow({ 0: 'IM00000099', 1: 'CR00000099' });
    const result = parseHelpdeskWorkbook(workbookFromRows([HEADERS, row, [...row]]));

    expect(result.report.rowsTotal).toBe(2);
    expect(result.report.rowsOk).toBe(1);
    expect(result.report.rowsDropped).toHaveLength(1);
    expect(result.report.rowsDropped[0]?.reason).toBe('duplicate');
  });

  it('drops a row with an empty Номер with reason missing_id', () => {
    const result = parseHelpdeskWorkbook(workbookFromRows([HEADERS, makeRow({ 0: '' })]));

    expect(result.report.rowsTotal).toBe(1);
    expect(result.report.rowsOk).toBe(0);
    expect(result.report.rowsDropped).toHaveLength(1);
    expect(result.report.rowsDropped[0]?.reason).toBe('missing_id');
  });

  it('preserves plan/actual/quoted hours (6/6/6 and 2/1.33/0) from the real file', async () => {
    const result = await parseHelpdeskFile(await findHelpdeskFile(root));

    const six = result.workItems.find((item) => item.id.includes('CR00029124'));
    expect(six?.effort).toEqual({ planHours: 6, actualHours: 6, quotedHours: 6 });

    const mixed = result.workItems.find((item) => item.id.includes('CR00016969'));
    expect(mixed?.effort).toEqual({ planHours: 2, actualHours: 1.33, quotedHours: 0 });
  });

  it('replaces ФИО with Специалист N in work item ids', () => {
    const row = makeRow({ 0: 'IM00000077', 1: 'CR00000077', 4: 'Иванов Иван Иванович' });
    const result = parseHelpdeskWorkbook(workbookFromRows([HEADERS, row]));

    expect(result.workItems).toHaveLength(1);
    const id = result.workItems[0]?.id ?? '';
    expect(id).toContain('Специалист 1');
    expect(id).not.toContain('Иванов');
  });

  it('uses the repository root by default via findHelpdeskFile()', async () => {
    const filePath = await findHelpdeskFile();
    expect(filePath.toLowerCase().endsWith('.xlsx')).toBe(true);
    expect(filePath).toContain('data');
  });

  it('keeps repositoryRoot in sync with the test root', () => {
    expect(repositoryRoot()).toBe(root);
  });
});
