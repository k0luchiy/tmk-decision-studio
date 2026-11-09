/** `POST /api/estimates/:id/export` — PDF/XLSX/JSON export (`docs/10_api_contract.md` §3.4). */

import type { FastifyInstance } from 'fastify';
import type { Estimate, Verdict } from '@app/contract';
import type { EstimateTaskResult } from '@app/core';
import { buildExportBundle } from '@app/export';
import { z } from 'zod';
import { ApiError } from '../errors.js';
import { getEstimate } from '../store.js';

const ExportBodySchema = z.object({
  format: z.enum(['json', 'xlsx', 'pdf']),
});

/** Picks the estimate matching the verdict; `parity` falls back to hybrid. */
function winnerEstimate(
  code: Verdict['code'],
  estimates: EstimateTaskResult['estimates'],
): Estimate {
  if (code === 'inhouse') {
    return estimates.inhouse;
  }
  if (code === 'contractor') {
    return estimates.contractor;
  }
  return estimates.hybrid;
}

export async function exportRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: string } }>('/api/estimates/:id/export', async (request, reply) => {
    const body = ExportBodySchema.parse(request.body);
    const stored = getEstimate(request.params.id);
    if (stored === undefined) {
      throw new ApiError(404, 'not_found', `Estimate not found: ${request.params.id}`);
    }

    const estimate = winnerEstimate(stored.verdict.code, stored.result.estimates);
    const comparison = {
      estimates: stored.result.estimates,
      verdict: stored.result.verdict,
      confidence: stored.result.confidence,
      ...(stored.state === undefined ? {} : { state: stored.state }),
    };
    const bundle = await buildExportBundle({
      estimate,
      params: stored.result.params.map((param) => ({ status: param.status })),
      datasetVersion: stored.datasetVersion,
      seed: stored.seed,
      format: body.format,
      comparison,
    });

    reply.header('Content-Type', bundle.mime);
    reply.header('Content-Disposition', `attachment; filename="${bundle.filename}"`);
    return reply.send(bundle.data);
  });
}
