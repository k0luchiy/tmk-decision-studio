/**
 * Property and invariant tests for the estimation core (`docs/05_architecture_data.md`
 * §10). These guard the structural guarantees every pipeline stage must keep:
 * monotonicity, quantile ordering, determinism, conservation of money, and the
 * absence of `NaN`/`Infinity` at the edges.
 *
 * Every test is offline and deterministic: datasets are loaded once from disk,
 * all Monte-Carlo runs use fixed seeds, and the one pseudo-random generator used
 * for the method-combination sweep is a local LCG (never `Math.random()`).
 */

import type { CostLine, EffortGrid, WorkItem } from '@app/contract';
import type { LoadedDatasets, RoleCard } from '@app/data';
import { loadDatasets } from '@app/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildFormulaTree, leaves } from './decision/formulaTree.js';
import { costContractor } from './cost/contractor.js';
import type { EffortByRole } from './cost/inhouse.js';
import { PRODUCTIVE_HOURS_PER_MONTH, costInhouse } from './cost/inhouse.js';
import { toStageGrid } from './cost/stageGrid.js';
import { D1_FLOWS, d1Task } from './fixtures/d1.js';
import { simulate } from './risk/monteCarlo.js';
import { buildScenarios } from './scenarios/scenarios.js';
import { schedule } from './schedule/schedule.js';
import { combineMethods } from './sizing/combine.js';
import { buildWbs } from './sizing/wbs.js';

/** Relative tolerance for "in [min, max]" checks on derived weighted means. */
const EPSILON = 1e-9;
/** Rounding tolerance for money conservation ("±1 ₽"). */
const RUB_TOLERANCE = 1;

function sumExpectedHours(items: WorkItem[]): number {
  return items.reduce((sum, item) => sum + item.expectedHours, 0);
}

function sumValues(lines: CostLine[]): number {
  return lines.reduce((sum, line) => sum + line.valueRub, 0);
}

function sumLabor(lines: CostLine[]): number {
  return lines.reduce((sum, line) => (line.group === 'labor' ? sum + line.valueRub : sum), 0);
}

/** Asserts that every number nested anywhere in `value` is finite (no NaN/Infinity). */
function expectNoNonFinite(value: unknown, path = 'root'): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value), `${path} is not finite: ${value}`).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => expectNoNonFinite(entry, `${path}[${index}]`));
    return;
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(record)) {
      expectNoNonFinite(entry, `${path}.${key}`);
    }
  }
}

/** Doubles every fully-loaded hourly and monthly rate in a cloned card set. */
function doubleRateCards(roles: RoleCard[]): RoleCard[] {
  return structuredClone(roles).map((role) => ({
    ...role,
    grades: role.grades.map((grade) => ({
      ...grade,
      fully_loaded_hour: grade.fully_loaded_hour * 2,
      fully_loaded_month: grade.fully_loaded_month * 2,
    })),
  }));
}

/**
 * Local deterministic linear congruential generator. Kept inside the test so the
 * invariant does not depend on the production PRNG.
 */
function makeLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

let datasets: LoadedDatasets;
let workItems: WorkItem[];
let grid: EffortGrid;
let effortByRole: EffortByRole[];
let months: number;
let inhouseLines: CostLine[];
let contractorLines: CostLine[];

beforeAll(async () => {
  datasets = await loadDatasets();
  workItems = buildWbs(d1Task, datasets.archetypes.archetypes, { unitsCount: D1_FLOWS });
  grid = toStageGrid(workItems);
  effortByRole = grid.byRole.map((entry) => ({
    roleId: entry.roleId,
    grade: entry.grade,
    hours: entry.hours,
  }));
  months = Math.max(1, Math.ceil(grid.totalHours / PRODUCTIVE_HOURS_PER_MONTH));

  inhouseLines = costInhouse({
    effortByRole,
    rateCards: datasets.rateCards.roles,
    opts: {
      hiring: { roleId: '1c_developer', grade: 'middle' },
      utilization: 0.7,
      turnoverRate: 0.13,
      months,
    },
  });
  contractorLines = costContractor({
    effortByRole,
    bands: datasets.contractorRates.bands,
    opts: { geo: 'RU', model: 'fixed_price', vat: true },
  });
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

describe('invariant 3: quantile ordering', () => {
  it('seed 7 keeps P10 <= P50 <= P80 <= P90 for effort, cost and duration', () => {
    const result = simulate({
      effortHours: { p10: 800, p50: 930, p90: 1080 },
      costPerHour: { p10: 3000, p50: 3830, p90: 4500 },
      durationWeeks: { p10: 12, p50: 14, p90: 17 },
      seed: 7,
      n: 5_000,
    });

    for (const quantiles of [result.effortHours, result.costRub, result.durationWeeks]) {
      expect(quantiles.p10).toBeLessThanOrEqual(quantiles.p50);
      expect(quantiles.p50).toBeLessThanOrEqual(quantiles.p80);
      expect(quantiles.p80).toBeLessThanOrEqual(quantiles.p90);
    }
  });
});

describe('invariant 4: determinism', () => {
  it('two simulations with seed 42 are deeply equal', () => {
    const input = {
      effortHours: { p10: 800, p50: 930, p90: 1080 },
      costPerHour: { p10: 3000, p50: 3830, p90: 4500 },
      durationWeeks: { p10: 12, p50: 14, p90: 17 },
      seed: 42,
      n: 3_000,
    };

    expect(simulate(input)).toEqual(simulate(input));
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

describe('invariant 7: schedule monotonicity', () => {
  it('doubling hours never reduces P50 weeks', () => {
    const team = [{ roleId: '1c_developer', grade: 'middle' as const, fte: 1 }];
    const base = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 560 }],
      byStage: [{ stage: 3, hours: 560 }],
      team,
      utilization: 0.7,
    });
    const doubled = schedule({
      byRole: [{ roleId: '1c_developer', grade: 'middle', hours: 1_120 }],
      byStage: [{ stage: 3, hours: 1_120 }],
      team,
      utilization: 0.7,
    });

    expect(doubled.duration.p50Weeks).toBeGreaterThanOrEqual(base.duration.p50Weeks);
  });
});

describe('invariant 8: method combination stays inside the inputs', () => {
  it('20 deterministic triples all combine into [min, max]', () => {
    const rng = makeLcg(2024);
    const draw = (): number => 1 + rng() * 4_999;

    for (let i = 0; i < 20; i += 1) {
      const a = draw();
      const b = draw();
      const c = draw();
      const result = combineMethods({ a, b, c });
      const min = Math.min(a, b, c);
      const max = Math.max(a, b, c);

      expect(result.effortHours).toBeGreaterThanOrEqual(min - EPSILON);
      expect(result.effortHours).toBeLessThanOrEqual(max + EPSILON);
    }
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
