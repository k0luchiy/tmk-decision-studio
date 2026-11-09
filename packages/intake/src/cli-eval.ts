/**
 * Intake evaluation CLI (`npm run intake:eval`).
 *
 * Reads `data/eval/briefs.json`, runs the cache-mode pipeline (never the
 * network), evaluates against the manual labels and writes
 * `out/intake-eval.json`.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { stderr, stdout } from 'node:process';
import { EvalBriefsSchema, evaluateIntake, type EvalReport } from './eval.js';
import { classifyBrief } from './pipeline.js';

function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? '').length)),
  );
  const formatRow = (cells: string[]): string =>
    cells.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(' | ');
  const separator = widths.map((width) => '-'.repeat(width)).join('-+-');
  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatReportTable(report: EvalReport): string {
  const headers = ['id', 'workType', 'flags', 'numbers', 'status'];
  const rows = report.perCase.map((entry) => {
    const workType =
      entry.workType === undefined
        ? entry.status === 'missing_labels'
          ? 'missing'
          : '—'
        : `${entry.workType.actual}/${entry.workType.expected} ${entry.workType.match ? 'ok' : 'FAIL'}`;
    const flags =
      entry.status === 'ok'
        ? `${entry.flags.filter((flag) => flag.match).length}/${entry.flags.length}`
        : '—';
    const numbers =
      entry.status === 'ok'
        ? `${entry.numbers.filter((number) => number.match).length}/${entry.numbers.length}`
        : '—';
    return [entry.id, workType, flags, numbers, entry.status];
  });

  return formatTable(headers, rows);
}

const baseDir = process.env.INTAKE_EVAL_ROOT ?? process.cwd();
const briefsPath = path.join(baseDir, 'data', 'eval', 'briefs.json');

try {
  const raw: unknown = JSON.parse(readFileSync(briefsPath, 'utf8'));
  const parsed = EvalBriefsSchema.safeParse(raw);

  if (!parsed.success) {
    stderr.write(`invalid brief set ${briefsPath}: ${parsed.error.message}\n`);
    process.exitCode = 1;
  } else {
    const report = await evaluateIntake(parsed.data, async (text) => {
      const result = await classifyBrief(text, {
        mode: 'cache',
        cacheFile: path.join(baseDir, 'data', 'cache', 'jev-responses.json'),
      });
      return result.params;
    });

    stdout.write(`${formatReportTable(report)}\n`);
    stdout.write(
      `\nworkTypeAccuracy: ${formatPercent(report.workTypeAccuracy)}\n` +
        `flagsAccuracy: ${formatPercent(report.flagsAccuracy)}\n` +
        `numberRecall: ${formatPercent(report.numberRecall)}\n` +
        `total: ${report.total}, missing_labels: ${report.missing_labels.length}\n`,
    );

    if (report.missing_labels.length > 0) {
      stdout.write(`missing labels: ${report.missing_labels.join(', ')}\n`);
    }

    const outDir = path.join(baseDir, 'out');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      path.join(outDir, 'intake-eval.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
    stdout.write('\nout/intake-eval.json written\n');
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  stderr.write(`intake eval failed: ${message}\n`);
  process.exitCode = 1;
}
