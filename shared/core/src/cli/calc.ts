/**
 * Calculation CLI for the D1 demo (`npm run calc`).
 *
 * Loads the datasets, builds the D1 WBS, folds it into the stage grid and prices
 * it with both cost bases: in-house (including hiring) and contractor (T&M and
 * fixed price). Prints a `stage | hours | cost inhouse | cost contractor` table
 * and writes `.artifacts/calc-d1.json`.
 *
 * `computeCalcD1` is pure with respect to the filesystem (it only reads the
 * provided datasets), so tests can call it without launching a process or
 * writing files.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stdout } from 'node:process';
import type { CostLine, EffortGrid } from '@app/contract';
import { loadDatasets } from '@app/data';
import type { LoadedDatasets } from '@app/data';
import { D1_FLOWS, d1Task } from '../fixtures/d1.js';
import { buildWbs } from '../sizing/wbs.js';
import { costContractor } from '../cost/contractor.js';
import { PRODUCTIVE_HOURS_PER_MONTH, costInhouse } from '../cost/inhouse.js';
import { allocateCostByStage, toStageGrid } from '../cost/stageGrid.js';
import type { StageCost } from '../cost/stageGrid.js';

/** Labour effort aggregated by role/grade, derived from the stage grid. */
export interface CalcEffort {
  roleId: string;
  grade: EffortGrid['byRole'][number]['grade'];
  hours: number;
}

/** One row of the CLI stage table. */
export interface CalcStageRow {
  stage: number;
  hours: number;
  costInhouseRub: number;
  costContractorRub: number;
}

/** One priced scenario with its cost lines and total. */
export interface CalcScenario {
  lines: CostLine[];
  totalRub: number;
}

/** Everything `computeCalcD1` returns and `runCalc` writes to JSON. */
export interface CalcResult {
  task: { id: string; title: string; platform: string | null };
  flows: number;
  grid: EffortGrid;
  inhouse: CalcScenario;
  contractor: {
    tAndM: CalcScenario;
    fixedPrice: CalcScenario;
  };
  stages: CalcStageRow[];
}

function total(lines: CostLine[]): number {
  return lines.reduce((sum, line) => sum + line.valueRub, 0);
}

function scenario(lines: CostLine[]): CalcScenario {
  return { lines, totalRub: total(lines) };
}

function joinStageCosts(
  stages: EffortGrid['byStage'],
  inhouseCosts: StageCost[],
  contractorCosts: StageCost[],
): CalcStageRow[] {
  const inhouseByStage = new Map(inhouseCosts.map((entry) => [entry.stage, entry.costRub]));
  const contractorByStage = new Map(contractorCosts.map((entry) => [entry.stage, entry.costRub]));
  return stages.map((entry) => ({
    stage: entry.stage,
    hours: entry.hours,
    costInhouseRub: inhouseByStage.get(entry.stage) ?? 0,
    costContractorRub: contractorByStage.get(entry.stage) ?? 0,
  }));
}

/**
 * Computes the D1 estimate from already-loaded datasets.
 *
 * Builds `buildWbs(d1Task, archetypes, { unitsCount: 6 })`, then:
 * - `toStageGrid` for hours and role mix;
 * - `costInhouse` with a hiring line for `1c_developer/middle`;
 * - `costContractor` for T&M and fixed price on the same effort;
 * - `allocateCostByStage` to spread each scenario over the six stages.
 *
 * No files are read or written; the caller owns persistence.
 */
export function computeCalcD1(datasets: LoadedDatasets): CalcResult {
  const workItems = buildWbs(d1Task, datasets.archetypes.archetypes, {
    unitsCount: D1_FLOWS,
  });
  const grid = toStageGrid(workItems);

  const effortByRole: CalcEffort[] = grid.byRole.map((entry) => ({
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

  const bands = datasets.contractorRates.bands;
  const tAndMLines = costContractor({
    effortByRole,
    bands,
    opts: { geo: 'RU', model: 't_and_m' },
  });
  const fixedPriceLines = costContractor({
    effortByRole,
    bands,
    opts: { geo: 'RU', model: 'fixed_price' },
  });

  const stages = joinStageCosts(
    grid.byStage,
    allocateCostByStage(workItems, inhouseLines),
    allocateCostByStage(workItems, fixedPriceLines),
  );

  return {
    task: { id: d1Task.id, title: d1Task.title, platform: d1Task.platform ?? null },
    flows: D1_FLOWS,
    grid,
    inhouse: scenario(inhouseLines),
    contractor: {
      tAndM: scenario(tAndMLines),
      fixedPrice: scenario(fixedPriceLines),
    },
    stages,
  };
}

function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? '').length)),
  );
  const formatRow = (cells: string[]): string =>
    cells.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(' | ');
  const separator = widths.map((width) => '-'.repeat(width)).join('-+-');
  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}

function formatRub(value: number): string {
  return String(Math.round(value));
}

/** Returns the shell-friendly table for the CLI. */
export function formatCalcTable(result: CalcResult): string {
  const headers = ['stage', 'hours', 'cost inhouse', 'cost contractor'];
  const rows = result.stages.map((row) => [
    String(row.stage),
    String(Number(row.hours.toFixed(2))),
    formatRub(row.costInhouseRub),
    formatRub(row.costContractorRub),
  ]);
  return formatTable(headers, rows);
}

/**
 * Loads datasets, computes the D1 result, prints the table and writes
 * `.artifacts/calc-d1.json` under `baseDir`.
 */
export async function runCalc(baseDir: string = process.cwd()): Promise<CalcResult> {
  const datasets = await loadDatasets(baseDir);
  const result = computeCalcD1(datasets);

  stdout.write(`${formatCalcTable(result)}\n`);
  stdout.write(
    `\ninhouse total: ${formatRub(result.inhouse.totalRub)} ₽\n` +
      `contractor T&M total: ${formatRub(result.contractor.tAndM.totalRub)} ₽\n` +
      `contractor fixed price total: ${formatRub(result.contractor.fixedPrice.totalRub)} ₽\n`,
  );

  const outDir = path.join(baseDir, '.artifacts');
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'calc-d1.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  stdout.write('\n.artifacts/calc-d1.json written\n');

  return result;
}
