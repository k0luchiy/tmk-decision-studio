import { describe, expect, it } from 'vitest';
import { evaluateIntake, type EvalBrief } from './eval.js';
import { classifyBrief } from './pipeline.js';

const BRIEFS: EvalBrief[] = [
  {
    id: 'd1',
    text: 'Интеграция 1С:ERP с WMS, 6 интеграционных потоков, срок 3 месяца',
    labels: {
      workType: 'integration',
      securityKii: false,
      mobile: false,
      flows: 6,
      durationMonths: 3,
    },
  },
  {
    id: 'd2',
    text: 'Разработка мобильного приложения: создание нового backend и frontend, Android, 12 экранов, срок 4 месяца',
    labels: {
      workType: 'development',
      securityKii: false,
      mobile: true,
      durationMonths: 4,
    },
  },
  {
    id: 'd3',
    text: 'Сопровождение и поддержка учётной системы, 24/7, SLA 99,9%, срок 12 месяцев',
    labels: {
      workType: 'support',
      securityKii: false,
      mobile: false,
      durationMonths: 12,
    },
  },
];

const rulesOnly = async (brief: string) => (await classifyBrief(brief, { mode: 'off' })).params;

describe('evaluateIntake', () => {
  it('computes metrics over three labelled briefs', async () => {
    const report = await evaluateIntake(BRIEFS, rulesOnly);

    expect(report.total).toBe(3);
    expect(report.perCase).toHaveLength(3);
    expect(report.workTypeAccuracy).toBe(1);
    expect(report.flagsAccuracy).toBe(1);
    expect(report.numberRecall).toBe(1);
    expect(report.missing_labels).toEqual([]);
  });

  it('reports missing_labels instead of dividing by zero', async () => {
    const unlabelled: EvalBrief[] = [{ id: 'no-labels', text: 'Сделайте что-нибудь' }];
    const report = await evaluateIntake(unlabelled, rulesOnly);

    expect(report.total).toBe(1);
    expect(report.missing_labels).toEqual(['no-labels']);
    expect(report.perCase[0]?.status).toBe('missing_labels');
    expect(report.perCase[0]?.missingLabels).toContain('labels');
    expect(Number.isFinite(report.workTypeAccuracy)).toBe(true);
    expect(Number.isFinite(report.flagsAccuracy)).toBe(true);
    expect(Number.isFinite(report.numberRecall)).toBe(true);
    expect(report.workTypeAccuracy).toBe(0);
  });

  it('flags partially missing labels without counting them', async () => {
    const partial: EvalBrief[] = [
      { id: 'partial', text: 'Интеграция 1С, 2 потока', labels: { workType: 'integration' } },
    ];
    const report = await evaluateIntake(partial, rulesOnly);

    expect(report.missing_labels).toEqual(['partial']);
    expect(report.perCase[0]?.missingLabels).toEqual(['securityKii', 'mobile']);
    expect(report.workTypeAccuracy).toBe(0);
  });
});
