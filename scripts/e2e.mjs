// Bundles shared/cli/src/e2e.ts and runs the D1–D3 smoke on plain Node.
// The pipeline logic lives in TypeScript; esbuild turns it into an ES module so
// `npm run e2e` needs no TS loader at runtime.
//
// `pdfkit` and `xlsx` stay external: they are CommonJS packages that resolve
// their own assets relative to `node_modules`, so they must load through Node's
// normal resolver instead of being inlined into the bundle. The bundle itself is
// written to `.artifacts/` (gitignored) so bare imports and `import.meta.url` resolve.

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cwd, env } from 'node:process';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const entryPoint = path.join(root, 'shared', 'cli', 'src', 'e2e.ts');
const outDir = path.join(root, '.artifacts');
const bundlePath = path.join(outDir, '.e2e-bundle.mjs');

const bundle = await build({
  entryPoints: [entryPoint],
  absWorkingDir: root,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  external: ['pdfkit', 'xlsx'],
  logLevel: 'silent',
});

const output = bundle.outputFiles?.[0];
if (!output) {
  throw new Error('esbuild produced no output for shared/cli/src/e2e.ts');
}

await mkdir(outDir, { recursive: true });
await writeFile(bundlePath, output.text, 'utf8');

try {
  const module = await import(pathToFileURL(bundlePath).href);
  await module.runE2E(env.E2E_ROOT ?? cwd());
} finally {
  await unlink(bundlePath).catch(() => undefined);
}
