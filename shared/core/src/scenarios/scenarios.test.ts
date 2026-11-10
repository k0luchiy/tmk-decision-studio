import type { CostLine } from '@app/contract';
import { loadDatasets } from '@app/data';
import type { LoadedDatasets } from '@app/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { D1_FLOWS, d1Task } from '../fixtures/d1.js';
import { buildWbs } from '../sizing/wbs.js';
import { costContractor } from '../cost/contractor.js';
import { PRODUCTIVE_HOURS_PER_MONTH, costInhouse } from '../cost/inhouse.js';
import { toStageGrid } from '../cost/stageGrid.js';
import type { ScenarioInput } from './scenarios.js';
import { breakevenMonth, buildScenarios } from './scenarios.js';

let datasets: LoadedDatasets;

beforeAll(async () => {
  datasets = await loadDatasets();
});

/** Builds the same D1 inputs the calculation CLI uses. */
function d1ScenarioInput(): ScenarioInput {
  const workItems = buildWbs(d1Task, datasets.archetypes.archetypes, {
    unitsCount: D1_FLOWS,
  });
  const grid = toStageGrid(workItems);
  const effortByRole = grid.byRole.map((entry) => ({
    roleId: entry.roleId,
    grade: entry.grade,
    hours: entry.hours,
  }));

  const months = Math.max(1, Math.ceil(grid.totalHours / PRODUCTIVE_HOURS_PER_MONTH));
  const inhouseLines = costInhouse({
    effortByRole,
    rateCards: datasets.rateCards.roles,
    opts: {
      hiring: { roleId: '1c_developer', grade: 'middle' },
      utilization: 0.7,
      turnoverRate: 0.13,
      months,
    },
  });
  const contractorLines = costContractor({
    effortByRole,
    bands: datasets.contractorRates.bands,
    opts: { geo: 'RU', model: 'fixed_price' },
  });

  return {
    inhouseLines,
    contractorLines,
    byStage: grid.byStage.map((entry) => ({ stage: entry.stage, hours: entry.hours })),
  };
}

function line(group: CostLine['group'], valueRub: number, id: string): CostLine {
  return {
    id,
    group,
    label: id,
    formula: String(valueRub),
    inputRefs: [],
    valueRub,
    status: 'assumption',
  };
}

describe('buildScenarios', () => {
  it('prices all three scenarios with a positive implementation cost', () => {
    const scenarios = buildScenarios(d1ScenarioInput());

    expect(scenarios.inhouse.code).toBe('inhouse');
    expect(scenarios.contractor.code).toBe('contractor');
    expect(scenarios.hybrid.code).toBe('hybrid');
    for (const scenario of [scenarios.inhouse, scenarios.contractor, scenarios.hybrid]) {
      expect(scenario.implementationRub).toBeGreaterThan(0);
      expect(scenario.p50Rub).toBe(scenario.implementationRub);
      expect(scenario.p80Rub).toBeCloseTo(scenario.implementationRub * 1.18, 6);
    }
  });

  it('applies fractional contractor stage shares to the hybrid', () => {
    const base = d1ScenarioInput();
    const full = buildScenarios(base).hybrid.p50Rub;
    const half = buildScenarios({ ...base, contractorStageShares: { '3': 0.5 } }).hybrid.p50Rub;

    expect(half).not.toBe(full);
    expect(half).toBeGreaterThan(0);
  });

  it('starts TCO at year 0 and keeps the cumulative non-decreasing', () => {
    const scenarios = buildScenarios(d1ScenarioInput());

    for (const scenario of [scenarios.inhouse, scenarios.contractor, scenarios.hybrid]) {
      expect(scenario.tco).toHaveLength(4);
      expect(scenario.tco[0]?.year).toBe(0);
      expect(scenario.tco[0]?.costRub).toBe(scenario.implementationRub);
      expect(scenario.tco[0]?.cumulativeRub).toBe(scenario.implementationRub);

      for (let index = 1; index < scenario.tco.length; index += 1) {
        const previous = scenario.tco[index - 1];
        const current = scenario.tco[index];
        expect(current?.year).toBe(index);
        expect(current?.cumulativeRub).toBeGreaterThan(previous?.cumulativeRub ?? -1);
        expect(current?.cumulativeRub).toBeCloseTo(
          (previous?.cumulativeRub ?? 0) + (current?.costRub ?? 0),
          6,
        );
      }
    }
  });

  it('D1: in-house TCO-3 is cheaper than contractor TCO-3 (12 % vs 18 % support)', () => {
    const scenarios = buildScenarios(d1ScenarioInput());

    const inhouseTco3 = scenarios.inhouse.tco[3]?.cumulativeRub;
    const contractorTco3 = scenarios.contractor.tco[3]?.cumulativeRub;

    expect(inhouseTco3).toBeDefined();
    expect(contractorTco3).toBeDefined();
    // In-house starts more expensive but its 12 % support beats the 18 % one.
    expect(scenarios.inhouse.implementationRub).toBeGreaterThan(
      scenarios.contractor.implementationRub,
    );
    expect(inhouseTco3).toBeLessThan(contractorTco3 ?? 0);
  });

  it('D1: contractor dominates from month 0, so its break-even is 0', () => {
    const scenarios = buildScenarios(d1ScenarioInput());

    expect(scenarios.contractor.breakevenMonth).toBe(0);
    expect(scenarios.inhouse.breakevenMonth).toBeNull();
  });

  it('D1: hybrid implementation sits between in-house and contractor', () => {
    const scenarios = buildScenarios(d1ScenarioInput());

    const { inhouse, contractor, hybrid } = scenarios;
    expect(hybrid.implementationRub).toBeGreaterThan(contractor.implementationRub);
    expect(hybrid.implementationRub).toBeLessThan(inhouse.implementationRub);
    expect(hybrid.tco).toHaveLength(4);
  });

  it('finds a break-even month within 1..36', () => {
    // Contractor is dearer upfront but supports 300k vs 1M of labour: 18 % of
    // 300k is cheaper than 12 % of 1M, so it overtakes after ~27 months.
    const scenarios = buildScenarios({
      inhouseLines: [line('labor', 1_000_000, 'inhouse-labor')],
      contractorLines: [
        line('labor', 300_000, 'contractor-labor'),
        line('coordination', 850_000, 'contractor-coordination'),
      ],
      byStage: [{ stage: 3, hours: 100 }],
    });

    const month = scenarios.contractor.breakevenMonth;
    expect(month).not.toBeNull();
    expect(Number.isInteger(month)).toBe(true);
    expect(month ?? 0).toBeGreaterThanOrEqual(1);
    expect(month ?? 0).toBeLessThanOrEqual(36);
    expect(month).toBe(28);
  });

  it('returns 0 when a scenario already dominates in month 0', () => {
    expect(
      breakevenMonth(
        { implementationRub: 100, annualSupportRub: 10 },
        { implementationRub: 200, annualSupportRub: 20 },
      ),
    ).toBe(0);
  });

  it('returns null when the comparator has zero support and a lower implementation', () => {
    expect(
      breakevenMonth(
        { implementationRub: 300, annualSupportRub: 50 },
        { implementationRub: 100, annualSupportRub: 0 },
      ),
    ).toBeNull();
  });
});
