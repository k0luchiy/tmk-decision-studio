import { describe, expect, it } from 'vitest';
import { CostLineSchema, EstimateSchema } from './index.js';

const validCostLine = {
  id: 'cl-labor-1',
  group: 'labor' as const,
  label: 'Разработка, поток 1',
  formula: 'hours * rate',
  inputRefs: ['rate-ru-middle'],
  valueRub: 120000,
  sourceId: 'src-rate-cards',
  status: 'fact' as const,
};

const validGrid = {
  p10Hours: 700,
  p50Hours: 900,
  p80Hours: 1100,
  p90Hours: 1300,
  byStage: [
    {
      stage: 3,
      hours: 900,
      byRole: [{ roleId: 'backend', grade: 'middle' as const, hours: 900 }],
    },
  ],
  byRole: [{ roleId: 'backend', grade: 'middle' as const, hours: 900 }],
  totalHours: 900,
};

const validEstimate = {
  id: 'est-d1-001',
  taskId: 'task-d1',
  scenario: 'hybrid' as const,
  currency: 'RUB' as const,
  datasetVersion: 'sha256:abc123',
  inputHash: 'sha256:def456',
  seed: 42,
  methodWeights: { a: 0.5, b: 0.2, c: 0.3 },
  effort: {
    p10Hours: 700,
    p50Hours: 900,
    p80Hours: 1100,
    p90Hours: 1300,
    grid: validGrid,
  },
  duration: {
    p10Weeks: 10,
    p50Weeks: 13,
    p80Weeks: 16,
    p90Weeks: 18,
    criticalPath: ['stage-3', 'stage-4'],
  },
  cost: {
    p10Rub: 4000000,
    p50Rub: 5000000,
    p80Rub: 6000000,
    p90Rub: 7000000,
    reserveRub: 1000000,
    lines: [validCostLine],
  },
  tco: [{ year: 1, costRub: 5000000, cumulativeRub: 5000000 }],
  breakevenMonth: 14,
  verdict: {
    code: 'hybrid' as const,
    templateId: 'verdict-hybrid-v1',
    text: 'Гибрид: подрядчик на критическом пути, поддержка внутри.',
    numbersRefs: ['cost.p50Rub', 'breakevenMonth'],
  },
  confidence: {
    score: 72,
    level: 'high' as const,
    components: [
      { key: 'brief_completeness', weight: 0.3, value: 0.8 },
      { key: 'method_agreement', weight: 0.3, value: 0.7 },
      { key: 'analogues', weight: 0.2, value: 0.65 },
      { key: 'data', weight: 0.2, value: 0.75 },
    ],
  },
  assumptions: [],
  risks: [],
  analogues: [],
  warnings: [],
  formulaTree: {
    id: 'cost_p50',
    label: 'Стоимость реализации (P50)',
    kind: 'total' as const,
    valueRub: 5000000,
    formula: 'sum(lines)',
    inputs: [],
    children: [
      {
        id: 'cl-labor-1',
        label: 'Трудозатраты',
        kind: 'line' as const,
        valueRub: 120000,
        inputs: ['rate-ru-middle'],
      },
    ],
  },
  createdAt: '2026-11-09T12:00:00Z',
};

describe('Estimate contract', () => {
  it('parses a minimal valid Estimate', () => {
    const result = EstimateSchema.safeParse(validEstimate);
    expect(result.success).toBe(true);
  });

  it('rejects an Estimate without seed', () => {
    const withoutSeed: Record<string, unknown> = { ...validEstimate };
    delete withoutSeed.seed;
    const result = EstimateSchema.safeParse(withoutSeed);
    expect(result.success).toBe(false);
  });

  it('rejects a CostLine with negative valueRub', () => {
    const result = CostLineSchema.safeParse({ ...validCostLine, valueRub: -1 });
    expect(result.success).toBe(false);
  });
});
