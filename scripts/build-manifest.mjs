// Generates data/manifest.json from the source datasets.
// The hashing logic lives in packages/data/src/manifest.ts; this script bundles
// that module with esbuild so it can run on plain Node without a TS loader.

import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stdout } from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const entryPoint = path.join(root, 'packages', 'data', 'src', 'manifest.ts');

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
  throw new Error('esbuild produced no output for packages/data/src/manifest.ts');
}

const moduleUrl = `data:text/javascript;base64,${Buffer.from(output.text).toString('base64')}`;
const { computeManifest } = await import(moduleUrl);

const manifest = await computeManifest(root);
const targetDir = path.join(root, 'data');
await mkdir(targetDir, { recursive: true });
await writeFile(
  path.join(targetDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

stdout.write(
  `data/manifest.json: ${manifest.files.length} files, datasetVersion ${manifest.datasetVersion}\n`,
);
