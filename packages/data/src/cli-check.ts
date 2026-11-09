import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stdout } from 'node:process';
import { loadDatasets } from './loaders.js';
import { buildQualityReport } from './quality.js';

const baseDir = process.env.DATA_ROOT ?? process.cwd();

function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? '').length)),
  );
  const formatRow = (cells: string[]): string =>
    cells.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(' | ');
  const separator = widths.map((width) => '-'.repeat(width)).join('-+-');
  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}

const datasets = await loadDatasets(baseDir);
const report = buildQualityReport(datasets);

const headers = ['dataset', 'rowsTotal', 'rowsOk', 'errors', 'warnings'];
const rows = report.datasets.map((dataset) => [
  dataset.dataset,
  String(dataset.rowsTotal),
  String(dataset.rowsOk),
  String(dataset.rowsDropped.length),
  String(dataset.warnings.length),
]);

stdout.write(`${formatTable(headers, rows)}\n`);

const outDir = path.join(baseDir, 'out');
await mkdir(outDir, { recursive: true });
await writeFile(
  path.join(outDir, 'data-quality.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

stdout.write(
  `\nout/data-quality.json written: datasetVersion ${report.datasetVersion}, ` +
    `errors=${report.aggregate.errors}, warnings=${report.aggregate.warnings}\n`,
);

if (report.aggregate.errors > 0) {
  process.exitCode = 1;
}
