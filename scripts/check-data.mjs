// Bundles shared/data/src/cli-check.ts and runs it on plain Node.
// The quality logic lives in TypeScript; esbuild turns it into an ES module so
// `npm run data:check` needs no TS loader at runtime (same approach as
// scripts/build-manifest.mjs).

import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const entryPoint = path.join(root, 'shared', 'data', 'src', 'cli-check.ts');

const bundle = await build({
  entryPoints: [entryPoint],
  absWorkingDir: root,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent',
});

const output = bundle.outputFiles?.[0];
if (!output) {
  throw new Error('esbuild produced no output for shared/data/src/cli-check.ts');
}

const moduleUrl = `data:text/javascript;base64,${Buffer.from(output.text).toString('base64')}`;
await import(moduleUrl);
