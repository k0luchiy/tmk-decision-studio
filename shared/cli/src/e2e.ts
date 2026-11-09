/**
 * End-to-end smoke for D1–D3 (`npm run e2e`).
 *
 * For each of the first three briefs in `data/eval/briefs.json` the harness:
 * 1. classifies the brief in cache mode (rules + committed Jev cache);
 * 2. builds a `Task` from the extracted parameters;
 * 3. runs `estimateTask` and picks the verdict winner;
 * 4. marks the parameters `confirmed` (demo shortcut) and renders
 *    JSON / XLSX / PDF into `.artifacts/<id>.{json,xlsx,pdf}`.
 *
 * It also writes `.artifacts/control.json` with the observed P50 and verdict, which
 * `scripts/test-report.mjs` compares against `data/seeds/control.json`.
 * The harness never touches the network and exits non-zero on any failure.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { stdout } from 'node:process';
import type { Estimate, ExtractedParam, Task } from '@app/contract';
import { estimateTask } from '@app/core';
import { loadDatasets } from '@app/data';
import type { ExportFormat } from '@app/export';
import { buildExportBundle } from '@app/export';
import type { EvalBrief, MergedParam } from '@app/intake';
import { EvalBriefsSchema, classifyBrief } from '@app/intake';

/** How many control briefs the smoke run covers (D1–D3). */
export const E2E_TASK_LIMIT = 3;

/** One row of `.artifacts/control.json` and the printed table. */
export interface E2EControlRow {
  id: string;
  verdict: Estimate['verdict']['code'];
  scenario: Estimate['scenario'];
  p50Rub: number;
  weeks: number;
  confidence: number;
}

/** Shape of `.artifacts/control.json`. */
export interface E2EControlFile {
  generatedAt: string;
  datasetVersion: string;
  tasks: E2EControlRow[];
}

const FORMATS: readonly ExportFormat[] = ['json', 'xlsx', 'pdf'];

function toTaskParam(param: MergedParam): ExtractedParam {
  return {
    key: param.key,
    value: param.value,
    unit: param.unit,
    confidence: param.confidence,
    ...(param.quote === undefined ? {} : { quote: param.quote }),
    status: param.status,
    defaultUsed: param.defaultUsed,
  };
}

function toTask(brief: EvalBrief, params: MergedParam[]): Task {
  const title = brief.text.length > 80 ? `${brief.text.slice(0, 79)}…` : brief.text;
  return {
    id: brief.id,
    title,
    descriptionRaw: brief.text,
    briefVersion: 'eval-1.0',
    createdAt: '2026-11-09',
    params: params.map(toTaskParam),
  };
}

/** Picks the estimate that matches the verdict; parity falls back to hybrid. */
function winnerEstimate(
  verdict: Estimate['verdict']['code'],
  estimates: { inhouse: Estimate; contractor: Estimate; hybrid: Estimate },
): Estimate {
  if (verdict === 'inhouse') return estimates.inhouse;
  if (verdict === 'contractor') return estimates.contractor;
  return estimates.hybrid;
}

function formatRub(value: number): string {
  return String(Math.round(value));
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

function readBriefs(baseDir: string): EvalBrief[] {
  const file = path.join(baseDir, 'data', 'eval', 'briefs.json');
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'));
  return EvalBriefsSchema.parse(raw).slice(0, E2E_TASK_LIMIT);
}

/**
 * Runs the D1–D3 smoke and writes the export artefacts under `baseDir`.
 *
 * @returns the control rows that were written to `.artifacts/control.json`.
 */
export async function runE2E(baseDir: string = process.cwd()): Promise<E2EControlFile> {
  const datasets = await loadDatasets(baseDir);
  const datasetVersion = datasets.manifest?.datasetVersion;
  if (datasetVersion === undefined) {
    throw new Error('data/manifest.json is missing; run `npm run data:manifest` first');
  }

  const cacheFile = path.join(baseDir, 'data', 'cache', 'jev-responses.json');
  const outDir = path.join(baseDir, '.artifacts');
  mkdirSync(outDir, { recursive: true });

  const briefs = readBriefs(baseDir);
  const rows: E2EControlRow[] = [];

  for (const [index, brief] of briefs.entries()) {
    const intake = await classifyBrief(brief.text, { mode: 'cache', cacheFile });
    const task = toTask(brief, intake.params);
    const seed = 100 + index;

    const result = estimateTask({
      task,
      datasets,
      seed,
      datasetVersion,
      options: { hiring: true, utilization: 0.7, model: 'fixed_price', vat: false },
    });

    const estimate = winnerEstimate(result.verdict.code, result.estimates);
    // Demo shortcut: the review table is auto-confirmed so the export gate
    // opens. A real UI blocks export until a human confirms every parameter.
    const exportParams = intake.params.map(() => ({ status: 'confirmed' }));
    const comparison = {
      estimates: result.estimates,
      verdict: result.verdict,
      confidence: result.confidence,
    };

    for (const format of FORMATS) {
      const bundle = await buildExportBundle({
        estimate,
        params: exportParams,
        datasetVersion,
        seed,
        format,
        comparison,
      });
      writeFileSync(path.join(outDir, `${brief.id}.${format}`), bundle.data);
    }

    rows.push({
      id: brief.id,
      verdict: result.verdict.code,
      scenario: estimate.scenario,
      p50Rub: estimate.cost.p50Rub,
      weeks: estimate.duration.p50Weeks,
      confidence: estimate.confidence.score,
    });
  }

  const control: E2EControlFile = {
    generatedAt: new Date().toISOString(),
    datasetVersion,
    tasks: rows,
  };
  writeFileSync(
    path.join(outDir, 'control.json'),
    `${JSON.stringify(control, null, 2)}\n`,
    'utf8',
  );

  const table = formatTable(
    ['id', 'verdict', 'p50', 'weeks'],
    rows.map((row) => [row.id, row.verdict, formatRub(row.p50Rub), String(row.weeks)]),
  );
  stdout.write(`${table}\n`);
  stdout.write(`\n.artifacts/control.json written, ${rows.length * FORMATS.length} export files\n`);

  return control;
}
