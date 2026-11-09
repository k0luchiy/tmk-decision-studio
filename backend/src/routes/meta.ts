/** `GET /api/meta` — dataset/method version badges (`docs/10_api_contract.md` §3). */

import type { FastifyInstance } from 'fastify';
import { resolveIntakeMode } from '@app/intake';
import { loadDatasets } from '../datasets.js';

/** Method version exposed to the UI; bump when the pipeline semantics change. */
export const METHOD_VERSION = '1.0.0';

export async function metaRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/meta', async () => {
    const datasets = await loadDatasets();
    return {
      datasetVersion: datasets.manifest?.datasetVersion ?? '',
      methodVersion: METHOD_VERSION,
      intakeMode: resolveIntakeMode(),
      jevModel: process.env.JEV_MODEL ?? 'jev-1.13',
      brand: 'TMK Decision Studio',
      serverTime: new Date().toISOString(),
    };
  });
}
