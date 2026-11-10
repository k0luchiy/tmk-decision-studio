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
    path: 'data/datasets/rate_cards.json',
    source: 'research/data/product/rate_cards.json',
  },
  {
    path: 'data/datasets/contractor_rate_cards.json',
    source: 'research/data/product/contractor_rate_cards.json',
  },
  {
    path: 'data/datasets/work_archetypes.json',
    source: 'research/data/product/work_archetypes.json',
  },
  {
    path: 'data/datasets/analogue_corpus.json',
    source: 'research/data/product/analogue_corpus.json',
  },
  {
    path: 'data/datasets/coefficients.json',
    source: 'research/data/product/coefficients.json',
  },
  {
    path: 'data/datasets/tmk_it_contracts.json',
    source: 'research/data/tmk_it_contracts.json',
  },
] as const satisfies readonly DatasetFileSpec[];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function sectionCount(value: unknown): number {
  const record = asRecord(value);
  return record === undefined ? 0 : Object.keys(record).filter((key) => key !== 'meta').length;
}

const ROWS_BY_FILE: Record<string, (value: unknown) => number> = {
  'rate_cards.json': (value) => countArray(asRecord(value)?.roles),
  'contractor_rate_cards.json': (value) => countArray(asRecord(value)?.bands),
  'work_archetypes.json': (value) => countArray(asRecord(value)?.archetypes),
  'analogue_corpus.json': (value) =>
    countArray(asRecord(value)?.analogues) + countArray(asRecord(value)?.tmk_eis_rows),
  'coefficients.json': sectionCount,
  'tmk_it_contracts.json': countArray,
};

/**
 * Row count for a parsed JSON payload: real entity rows for known datasets,
 * array length for arrays, own key count for objects, and `0` for scalars.
 */
export function rowsOf(value: unknown, path?: string): number {
  if (path !== undefined) {
    const reader = ROWS_BY_FILE[path.split('/').pop() ?? ''];
    if (reader !== undefined) return reader(value);
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length;
  }
  return 0;
}
