import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DataLoadError } from './errors.js';
import { DATASET_FILES, rowsOf } from './files.js';
import type { DatasetManifest, ManifestFileEntry } from './types.js';

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Stable dataset version: sha256 over the sorted `path:sha256` lines. It does
 * not depend on `generatedAt`, so recomputing unchanged files yields the same
 * version.
 */
export function datasetVersion(manifest: Pick<DatasetManifest, 'files'>): string {
  const lines = manifest.files.map((file) => `${file.path}:${file.sha256}`).sort();
  return sha256Hex(lines.join('\n'));
}

/**
 * Hashes every source dataset and records its row count. Reads raw bytes for
 * hashing and parses the same payload only to count rows.
 */
export async function computeManifest(baseDir: string): Promise<DatasetManifest> {
  const generatedAt = new Date().toISOString();
  const files: ManifestFileEntry[] = [];

  for (const spec of DATASET_FILES) {
    const filePath = path.join(baseDir, spec.path);
    let bytes: Buffer;
    try {
      bytes = await readFile(filePath);
    } catch (error) {
      throw new DataLoadError(filePath, error);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(bytes.toString('utf8'));
    } catch (error) {
      throw new DataLoadError(filePath, error);
    }

    files.push({
      path: spec.path,
      sha256: sha256Hex(bytes),
      rows: rowsOf(parsed),
      generatedAt,
      source: spec.source,
    });
  }

  const manifest: DatasetManifest = { files, datasetVersion: '', generatedAt };
  manifest.datasetVersion = datasetVersion(manifest);
  return manifest;
}
