import type { CostLine, EffortGrid } from '@app/contract';
import type { LoadedDatasets } from '@app/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { costContractor } from './cost/contractor.js';
import { costInhouse, type EffortByRole } from './cost/inhouse.js';
import { buildFormulaTree, leaves } from './decision/formulaTree.js';
import { d1Task } from './fixtures/d1.js';
import {
  RUB_TOLERANCE,
  buildShared,
  doubleRateCards,
  expectNoNonFinite,
  sumExpectedHours,
  sumLabor,
  sumValues,
} from './invariants-helpers.js';
import { simulate } from './risk/monteCarlo.js';
import { buildScenarios } from './scenarios/scenarios.js';
import { buildWbs } from './sizing/wbs.js';

let datasets: LoadedDatasets;
let grid: EffortGrid;
let effortByRole: EffortByRole[];
let inhouseLines: CostLine[];
let contractorLines: CostLine[];

beforeAll(async () => {
  ({ datasets, grid, effortByRole, inhouseLines, contractorLines } = await buildShared());
});

describe('invariant 1: volume monotonicity', () => {
  it('one flow never costs more effort than six flows', () => {
    const one = buildWbs(d1Task, datasets.archetypes.archetypes, { unitsCount: 1 });
    const six = buildWbs(d1Task, datasets.archetypes.archetypes, { unitsCount: 6 });

    expect(sumExpectedHours(one)).toBeLessThanOrEqual(sumExpectedHours(six));
    expect(sumExpectedHours(six)).toBeGreaterThan(0);
  });
});

describe('invariant 2: rate monotonicity', () => {
  it('doubling fully-loaded rates never lowers labour cost and yields no NaN', () => {
    const baseline = costInhouse({ effortByRole, rateCards: datasets.rateCards.roles });
    const doubled = costInhouse({
      effortByRole,
      rateCards: doubleRateCards(datasets.rateCards.roles),
    });

    expect(sumLabor(doubled)).toBeGreaterThanOrEqual(sumLabor(baseline));
    for (const line of doubled) {
      expect(Number.isFinite(line.valueRub)).toBe(true);
    }
  });
});

describe('invariant 5: cost lines equal the scenario total', () => {
  it('in-house and contractor implementation equals the sum of their lines (±1 ₽)', () => {
    const scenarios = buildScenarios({
      inhouseLines,
      contractorLines,
      byStage: grid.byStage.map((entry) => ({ stage: entry.stage, hours: entry.hours })),
    });

    const inhouseSum = sumValues(inhouseLines);
    const contractorSum = sumValues(contractorLines);

    expect(Math.abs(scenarios.inhouse.implementationRub - inhouseSum)).toBeLessThanOrEqual(
      RUB_TOLERANCE,
    );
    expect(Math.abs(scenarios.contractor.implementationRub - contractorSum)).toBeLessThanOrEqual(
      RUB_TOLERANCE,
    );
  });
});

describe('invariant 6: extreme inputs stay finite', () => {
  it('zero units, zero hours and collapsed quantiles never yield NaN/Infinity', () => {
    const zeroUnits = buildWbs(d1Task, datasets.archetypes.archetypes, { unitsCount: 0 });
    expectNoNonFinite(zeroUnits);
    expect(zeroUnits.every((item) => item.expectedHours === 0)).toBe(true);

    const zeroHourInhouse = costInhouse({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 0 }],
      rateCards: datasets.rateCards.roles,
      opts: { utilization: 0.7, turnoverRate: 0.13 },
    });
    expectNoNonFinite(zeroHourInhouse);

    const zeroHourContractor = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 0 }],
      bands: datasets.contractorRates.bands,
      opts: { geo: 'RU', model: 'fixed_price', vat: true },
    });
    expectNoNonFinite(zeroHourContractor);

    const degenerate = simulate({
      effortHours: { p10: 1, p50: 1, p90: 1 },
      costPerHour: { p10: 1, p50: 1, p90: 1 },
      durationWeeks: { p10: 1, p50: 1, p90: 1 },
      seed: 1,
      n: 100,
    });
    expectNoNonFinite(degenerate);
    expect(degenerate.effortHours.p50).toBe(1);
  });
});

describe('invariant 9: formula tree conserves cost', () => {
  it('the cost-line leaves sum to the cost_p50 root (±1 ₽)', () => {
    const tree = buildFormulaTree({
      estimateId: 'd1',
      costLines: inhouseLines,
      effortHours: { p50: grid.p50Hours, p80: grid.p80Hours },
    });

    const lineLeaves = leaves(tree).filter((node) => node.kind === 'line');
    const leafSum = lineLeaves.reduce((sum, node) => sum + (node.valueRub ?? 0), 0);
    const root = tree.valueRub ?? 0;

    expect(lineLeaves).toHaveLength(inhouseLines.length);
    expect(Math.abs(leafSum - root)).toBeLessThanOrEqual(RUB_TOLERANCE);
  });
});
