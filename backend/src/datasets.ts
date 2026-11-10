/**
 * Singleton dataset loader for the API.
 *
 * The repository root is derived from this module's URL (never `cwd`) so the
 * server works no matter where it is launched from. Datasets are read once and
 * cached in memory for the process lifetime.
 */

import { fileURLToPath } from 'node:url';
import { loadDatasets as loadFromDisk, type Datasets } from '@app/data';

/** Absolute path to the repository root (`backend/src` → `../..`). */
export const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

/** Absolute path to the committed Jev response cache. */
export const jevCacheFile = fileURLToPath(new URL('../../data/cache/jev-responses.json', import.meta.url));

let cached: Promise<Datasets> | undefined;

/** Loads the six datasets once and reuses the same promise afterwards. */
export function loadDatasets(): Promise<Datasets> {
  cached ??= loadFromDisk(repoRoot);
  return cached;
}

export function reloadDatasets(): void {
  cached = undefined;
}
