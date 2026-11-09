/**
 * Canonical list of source datasets. Paths are relative to the repository root
 * so the loaders stay independent of the process working directory.
 */
export interface DatasetFileSpec {
  readonly path: string;
  readonly source: string;
}

export const DATASET_FILES = [
  {
    path: 'research/data/product/rate_cards.json',
    source: 'research/data/product/rate_cards.json',
  },
  {
    path: 'research/data/product/contractor_rate_cards.json',
    source: 'research/data/product/contractor_rate_cards.json',
  },
  {
    path: 'research/data/product/work_archetypes.json',
    source: 'research/data/product/work_archetypes.json',
  },
  {
    path: 'research/data/product/analogue_corpus.json',
    source: 'research/data/product/analogue_corpus.json',
  },
  {
    path: 'research/data/product/coefficients.json',
    source: 'research/data/product/coefficients.json',
  },
  {
    path: 'research/data/tmk_it_contracts.json',
    source: 'research/data/tmk_it_contracts.json',
  },
] as const satisfies readonly DatasetFileSpec[];

/**
 * Row count for a parsed JSON payload: array length for arrays, own key count
 * for objects, and `0` for scalars.
 */
export function rowsOf(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length;
  }
  return 0;
}
