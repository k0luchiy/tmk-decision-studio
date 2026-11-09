import { describe, expect, it } from 'vitest';
import { loadDatasets } from './loaders.js';
import { buildQualityReport } from './quality.js';
import { HEADERS, loadRealDatasets, makeRow, parse, repositoryRoot } from './test-helpers.js';
import { validateDatasets } from './validators.js';

describe('HelpDesk import edge cases', () => {
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
