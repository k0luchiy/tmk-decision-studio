import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseHelpdeskWorkbook } from './helpdesk.js';
import { loadDatasets } from './loaders.js';
import { buildQualityReport } from './quality.js';
import type { Datasets } from './types.js';
import { validateDatasets } from './validators.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

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

/** Builds one HelpDesk row; `overrides` keys are column indexes from `HEADERS`. */
function makeRow(overrides: Partial<Record<number, string | number>> = {}): Array<string | number> {
  const base: Array<string | number> = [
    'IM00000001',
    'CR00000001',
    'Изменение',
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

/**
 * Mirrors the real import path without touching disk: array-of-arrays sheet ->
 * CSV string -> workbook, exactly as the task requires.
 */
function workbookFromRows(rows: Array<Array<string | number>>): XLSX.WorkBook {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return XLSX.read(csv, { type: 'string' });
}

function parse(rows: Array<Array<string | number>>) {
  return parseHelpdeskWorkbook(workbookFromRows(rows));
}

function hasWarning(warnings: readonly string[], suffix: string): boolean {
  return warnings.some((warning) => warning.endsWith(suffix));
}

function countWarnings(warnings: readonly string[], suffix: string): number {
  return warnings.filter((warning) => warning.endsWith(suffix)).length;
}

async function loadRealDatasets(): Promise<Datasets> {
  return loadDatasets(repositoryRoot);
}

describe('HelpDesk import edge cases', () => {
  it('1. header-only sheet yields zero rows and no tasks without throwing', () => {
    expect(() => parse([HEADERS])).not.toThrow();

    const result = parse([HEADERS]);
    expect(result.report.rowsTotal).toBe(0);
    expect(result.report.rowsOk).toBe(0);
    expect(result.tasks).toEqual([]);
    expect(result.workItems).toEqual([]);
    expect(result.report.rowsDropped).toEqual([]);
  });

  it('2. unparseable date keeps the row and emits bad_date', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000002', 8: 'не-дата' })]);

    expect(result.report.rowsTotal).toBe(1);
    expect(result.report.rowsOk).toBe(1);
    expect(result.report.rowsDropped).toEqual([]);
    expect(hasWarning(result.report.warnings, 'bad_date')).toBe(true);
    expect(result.tasks).toHaveLength(1);
  });

  it('3. plan=0 with actual>0 emits plan_zero but accepts the row', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000003', 13: 5, 14: 0, 15: 3 })]);

    expect(result.report.rowsOk).toBe(1);
    expect(hasWarning(result.report.warnings, 'plan_zero')).toBe(true);
    expect(result.workItems).toHaveLength(1);
  });

  it('4. plan=actual=quoted emits copied_effort on all three matching rows', () => {
    const activities = ['Разработка ФС', 'Реализация изменения', 'Оценка трудоёмкости'];
    const rows: Array<Array<string | number>> = [HEADERS];
    activities.forEach((activity, index) => {
      rows.push(
        makeRow({
          0: `IM0000001${index}`,
          1: `CR0000001${index}`,
          7: activity,
          13: 4,
          14: 4,
          15: 4,
        }),
      );
    });

    const result = parse(rows);

    expect(result.report.rowsOk).toBe(3);
    expect(countWarnings(result.report.warnings, 'copied_effort')).toBe(3);
  });

  it('5. fractional quota 1.5 emits fractional_quota', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000005', 13: 1, 14: 2, 15: 1.5 })]);

    expect(result.workItems[0]?.effort?.quotedHours).toBe(1.5);
    expect(hasWarning(result.report.warnings, 'fractional_quota')).toBe(true);
  });

  it('6. empty Вид emits empty_kind but keeps the row', () => {
    const result = parse([HEADERS, makeRow({ 0: 'IM00000006', 2: '' })]);

    expect(result.report.rowsOk).toBe(1);
    expect(hasWarning(result.report.warnings, 'empty_kind')).toBe(true);
  });

  it('7. duplicate (number, type, specialist, date) is recorded once', () => {
    const row = makeRow({ 0: 'IM00000007', 1: 'CR00000007' });
    const result = parse([HEADERS, row, [...row]]);

    expect(result.report.rowsTotal).toBe(2);
    expect(result.report.rowsOk).toBe(1);
    expect(result.report.rowsDropped).toHaveLength(1);
    expect(result.report.rowsDropped[0]?.reason).toBe('duplicate');
  });

  it('8. empty Номер is recorded as missing_id', () => {
    const result = parse([HEADERS, makeRow({ 0: '' })]);

    expect(result.report.rowsTotal).toBe(1);
    expect(result.report.rowsOk).toBe(0);
    expect(result.report.rowsDropped).toHaveLength(1);
    expect(result.report.rowsDropped[0]?.reason).toBe('missing_id');
  });

  it('9. unknown activity emits unknown_activity and maps to stage 3', () => {
    const result = parse([
      HEADERS,
      makeRow({ 0: 'IM00000009', 7: 'Неизвестная активность ЗНИ' }),
    ]);

    expect(hasWarning(result.report.warnings, 'unknown_activity')).toBe(true);
    expect(result.workItems[0]?.stage).toBe(3);
  });

  it('10. two activities in one CR form one task with two work items and the earliest date', () => {
    const rows: Array<Array<string | number>> = [
      HEADERS,
      makeRow({
        0: 'IM00000010',
        1: 'CR00000100',
        7: 'Разработка ФС',
        8: '21.02.2026 10:00',
      }),
      makeRow({
        0: 'IM00000011',
        1: 'CR00000100',
        7: 'Реализация изменения',
        8: '20.02.2026 09:00',
      }),
    ];

    const result = parse(rows);

    expect(result.tasks).toHaveLength(1);
    expect(result.workItems).toHaveLength(2);
    expect(result.tasks[0]?.createdAt).toBe('2026-02-20T09:00:00');
  });

  it('11. two distinct ФИО become Специалист 1/2 and stay stable across rows', () => {
    const rows: Array<Array<string | number>> = [
      HEADERS,
      makeRow({
        0: 'IM00000020',
        1: 'CR00000200',
        4: 'Иванов Иван Иванович',
        7: 'Разработка ФС',
        8: '01.01.2026 10:00',
      }),
      makeRow({
        0: 'IM00000021',
        1: 'CR00000200',
        4: 'Петров Пётр Петрович',
        7: 'Реализация изменения',
        8: '02.01.2026 10:00',
      }),
      makeRow({
        0: 'IM00000022',
        1: 'CR00000200',
        4: 'Иванов Иван Иванович',
        7: 'Оценка трудоёмкости',
        8: '03.01.2026 10:00',
      }),
    ];

    const result = parse(rows);
    const ids = result.workItems.map((item) => item.id);

    expect(ids).toHaveLength(3);
    expect(ids[0]).toContain('Специалист 1');
    expect(ids[1]).toContain('Специалист 2');
    expect(ids[2]).toContain('Специалист 1');
    ids.forEach((id) => {
      expect(id).not.toContain('Иванов');
      expect(id).not.toContain('Петров');
    });
  });

  it('12. synthetic 120 rows (5 CR x 24 activities) yield 120 work items and 5 tasks', () => {
    const activities = ['Оценка трудоёмкости', 'Разработка ФС', 'Реализация изменения', 'Встречи'];
    const rows: Array<Array<string | number>> = [HEADERS];
    for (let i = 0; i < 120; i += 1) {
      const change = Math.floor(i / 24);
      rows.push(
        makeRow({
          0: `IM${String(i).padStart(8, '0')}`,
          1: `CR${String(change).padStart(8, '0')}`,
          7: activities[i % activities.length],
          13: 1,
          14: 2,
          15: 1,
        }),
      );
    }

    const result = parse(rows);

    expect(result.report.rowsTotal).toBe(120);
    expect(result.report.rowsOk).toBe(120);
    expect(result.workItems).toHaveLength(120);
    expect(result.tasks).toHaveLength(5);
  });
});

describe('quality aggregation edge cases', () => {
  it('13. two dropped rows surface as errors in buildQualityReport and two helpdesk drops', async () => {
    const data = structuredClone(await loadRealDatasets());
    const first = data.archetypes.archetypes[0];
    const second = data.archetypes.archetypes[1];
    if (first === undefined || second === undefined) {
      throw new Error('expected at least two archetypes');
    }
    first.p50_hours_per_unit = first.three_point.most_likely + 1;
    second.p50_hours_per_unit = second.three_point.most_likely + 1;

    const report = buildQualityReport(data);
    expect(report.aggregate.errors).toBe(2);
    const archetypes = report.datasets.find((dataset) => dataset.dataset === 'archetypes');
    expect(archetypes?.rowsDropped).toHaveLength(2);

    const helpdesk = parse([
      HEADERS,
      makeRow({ 0: '' }),
      makeRow({ 1: 'CR00000300', 0: '' }),
    ]);
    expect(helpdesk.report.rowsDropped).toHaveLength(2);
    helpdesk.report.rowsDropped.forEach((dropped) => {
      expect(dropped.reason).toBe('missing_id');
    });
  });

  it('14. validateDatasets flags an analogue with an empty source', async () => {
    const data = structuredClone(await loadRealDatasets());
    const analogue = data.analogues.analogues[0];
    if (analogue === undefined) {
      throw new Error('expected at least one analogue');
    }
    analogue.source = '';

    const issues = validateDatasets(data);

    expect(
      issues.find(
        (issue) => issue.code === 'ANALOGUE_SOURCE_MISSING' && issue.severity === 'error',
      ),
    ).toMatchObject({
      code: 'ANALOGUE_SOURCE_MISSING',
      severity: 'error',
      path: 'analogues.analogues[0].source',
    });
  });

  it('15. datasetVersion is stable between two loadDatasets calls', async () => {
    const first = await loadDatasets(repositoryRoot);
    const second = await loadDatasets(repositoryRoot);

    expect(first.manifest).not.toBeNull();
    expect(second.manifest).not.toBeNull();
    expect(first.manifest?.datasetVersion).toMatch(/^[0-9a-f]{64}$/);
    expect(second.manifest?.datasetVersion).toBe(first.manifest?.datasetVersion);
  });
});
