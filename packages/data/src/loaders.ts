import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataLoadError } from './errors.js';
import { DATASET_FILES } from './files.js';
import type {
  AnalogueCorpusFile,
  CoefficientsFile,
  ContractorRateCardsFile,
  DatasetManifest,
  LoadedDatasets,
  RateCardsFile,
  TmkContract,
  WorkArchetypesFile,
} from './types.js';

export { DataLoadError } from './errors.js';

/** Absolute path to the repository root, derived from this module's URL (not `cwd`). */
export function repositoryRoot(): string {
  return fileURLToPath(new URL('../../../', import.meta.url));
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new DataLoadError(filePath, error);
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new DataLoadError(filePath, error);
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

/**
 * Reads the six source datasets. Returns fresh objects parsed from disk; it
 * never mutates the caller-provided base directory or cached data.
 */
export async function loadDatasets(baseDir: string = repositoryRoot()): Promise<LoadedDatasets> {
  const [rateCardFile, contractorFile, archetypeFile, analogueFile, coefficientFile, contractFile] =
    DATASET_FILES;

  const [rateCards, contractorRates, archetypes, analogues, coefficients, contracts, manifest] =
    await Promise.all([
      readJsonFile<RateCardsFile>(path.join(baseDir, rateCardFile.path)),
      readJsonFile<ContractorRateCardsFile>(path.join(baseDir, contractorFile.path)),
      readJsonFile<WorkArchetypesFile>(path.join(baseDir, archetypeFile.path)),
      readJsonFile<AnalogueCorpusFile>(path.join(baseDir, analogueFile.path)),
      readJsonFile<CoefficientsFile>(path.join(baseDir, coefficientFile.path)),
      readJsonFile<TmkContract[]>(path.join(baseDir, contractFile.path)),
      loadManifest(baseDir),
    ]);

  return { rateCards, contractorRates, archetypes, analogues, coefficients, contracts, manifest };
}

/**
 * Reads `data/manifest.json`. Returns `null` when it has not been generated yet;
 * any other read/parse failure becomes a `DataLoadError`.
 */
export async function loadManifest(
  baseDir: string = repositoryRoot(),
): Promise<DatasetManifest | null> {
  const filePath = path.join(baseDir, 'data', 'manifest.json');
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw new DataLoadError(filePath, error);
  }
  try {
    return JSON.parse(text) as DatasetManifest;
  } catch (error) {
    throw new DataLoadError(filePath, error);
  }
}
