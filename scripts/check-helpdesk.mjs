// Bundles packages/data/src/cli-helpdesk.ts to a CommonJS file and runs it on
// plain Node. esbuild produces an intermediate so `npm run helpdesk:check`
// needs no TS loader at runtime; CJS is used because SheetJS relies on
// `require`, which an ES-module data URL cannot provide.

import { mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const entryPoint = path.join(root, 'packages', 'data', 'src', 'cli-helpdesk.ts');
const outDir = path.join(root, '.artifacts');
const outFile = path.join(outDir, '.helpdesk-check.cjs');

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [entryPoint],
  absWorkingDir: root,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: outFile,
  logLevel: 'silent',
});

try {
  createRequire(import.meta.url)(outFile);
} finally {
  await rm(outFile, { force: true });
}
