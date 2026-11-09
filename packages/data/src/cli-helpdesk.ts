import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stdout } from 'node:process';
import { findHelpdeskFile, parseHelpdeskFile } from './helpdesk.js';

async function main(): Promise<void> {
  const baseDir = process.env.DATA_ROOT ?? process.cwd();

  const filePath = await findHelpdeskFile(baseDir);
  const result = await parseHelpdeskFile(filePath);
  const { report } = result;

  stdout.write(`file: ${path.relative(baseDir, filePath) || filePath}\n`);
  stdout.write(`rowsTotal: ${report.rowsTotal}\n`);
  stdout.write(`rowsOk: ${report.rowsOk}\n`);
  stdout.write(`tasks: ${result.tasks.length}\n`);
  stdout.write(`workItems: ${result.workItems.length}\n`);
  stdout.write(`warnings: ${report.warnings.length}\n`);
  for (const warning of report.warnings) {
    stdout.write(`  - ${warning}\n`);
  }
  for (const dropped of report.rowsDropped) {
    stdout.write(`  dropped row ${dropped.row}: ${dropped.reason}\n`);
  }

  const outDir = path.join(baseDir, '.artifacts');
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, 'helpdesk.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );
  stdout.write(
    `\n.artifacts/helpdesk.json written: ${result.tasks.length} tasks, ${result.workItems.length} work items\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
