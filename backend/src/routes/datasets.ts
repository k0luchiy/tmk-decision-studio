/**
 * `GET /api/datasets` and `GET /api/datasets/:name` — read-only dataset view
 * for the "Data" screen (`docs/10_api_contract.md` §3).
 */

import type { FastifyInstance } from 'fastify';
import type { Datasets } from '@app/data';
import { loadDatasets } from '../datasets.js';
import { ApiError } from '../errors.js';

type DatasetName =
  | 'rate_cards'
  | 'contractor_rate_cards'
  | 'work_archetypes'
  | 'analogue_corpus'
  | 'coefficients'
  | 'tmk_it_contracts';

const DATASET_NAMES: readonly DatasetName[] = [
  'rate_cards',
  'contractor_rate_cards',
  'work_archetypes',
  'analogue_corpus',
  'coefficients',
  'tmk_it_contracts',
];

function isDatasetName(value: string): value is DatasetName {
  return (DATASET_NAMES as readonly string[]).includes(value);
}

function pickDataset(datasets: Datasets, name: DatasetName): unknown {
  switch (name) {
    case 'rate_cards':
      return datasets.rateCards;
    case 'contractor_rate_cards':
      return datasets.contractorRates;
    case 'work_archetypes':
      return datasets.archetypes;
    case 'analogue_corpus':
      return datasets.analogues;
    case 'coefficients':
      return datasets.coefficients;
    case 'tmk_it_contracts':
      return datasets.contracts;
  }
}

export async function datasetsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/datasets', async () => {
    const datasets = await loadDatasets();
    return {
      datasetVersion: datasets.manifest?.datasetVersion ?? '',
      generatedAt: datasets.manifest?.generatedAt ?? null,
      files: datasets.manifest?.files ?? [],
    };
  });

  app.get<{ Params: { name: string } }>('/api/datasets/:name', async (request) => {
    const { name } = request.params;
    if (!isDatasetName(name)) {
      throw new ApiError(404, 'not_found', `Unknown dataset: ${name}`);
    }
    const datasets = await loadDatasets();
    return { name, rows: pickDataset(datasets, name) };
  });
}
