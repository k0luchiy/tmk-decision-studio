/**
 * Estimate routes (`docs/10_api_contract.md` §3.3):
 * - `POST /api/estimates` runs the full pipeline and stores a snapshot;
 * - `GET /api/estimates/:id` returns a stored snapshot.
 */

import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { estimateTask } from '@app/core';
import { classifyBrief } from '@app/intake';
import { z } from 'zod';
import { jevCacheFile, loadDatasets } from '../datasets.js';
import { ApiError } from '../errors.js';
import { saveEstimate, getEstimate, type StoredEstimate } from '../store.js';
import { buildTask, toTaskParam, type TaskParamInput } from '../task.js';

const ParamSchema = z
  .object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    unit: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    quote: z.string().optional(),
    status: z.enum(['auto', 'confirmed', 'edited', 'rejected']),
    defaultUsed: z.boolean().optional(),
  })
  .passthrough();

const OptionsSchema = z
  .object({
    hiring: z.boolean().optional(),
    utilization: z.number().gt(0).lte(1).optional(),
    model: z.enum(['t_and_m', 'fixed_price', 'dedicated_team']).optional(),
    vat: z.boolean().optional(),
    teamRate: z.number().min(100).max(100_000).optional(),
    reservePct: z.number().min(0).max(0.5).optional(),
    oversightPct: z.number().min(0).max(0.5).optional(),
    contractorStages: z.array(z.number().int().min(1).max(7)).optional(),
    stageHours: z.record(z.string().regex(/^\d+$/), z.number().gt(0)).optional(),
  })
  .strict();

const EstimateBodySchema = z.object({
  brief: z.string().min(1).optional(),
  params: z.array(ParamSchema).optional(),
  options: OptionsSchema.optional(),
  seed: z.number().int().optional(),
});

const FALLBACK_BRIEF = 'Оценка по подтверждённым параметрам';

function unconfirmedKeys(params: readonly TaskParamInput[]): string[] {
  return params.filter((param) => param.status !== 'confirmed').map((param) => param.key);
}

async function resolveParams(
  body: z.infer<typeof EstimateBodySchema>,
): Promise<{ brief: string; params: TaskParamInput[] }> {
  if (body.params !== undefined && body.params.length > 0) {
    return { brief: body.brief ?? FALLBACK_BRIEF, params: body.params };
  }
  if (body.brief !== undefined) {
    const intake = await classifyBrief(body.brief, { cacheFile: jevCacheFile });
    return { brief: body.brief, params: intake.params };
  }
  throw new ApiError(422, 'validation_error', 'Provide either brief or params');
}

export async function estimatesRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/estimates', async (request, reply) => {
    const body = EstimateBodySchema.parse(request.body);
    const { brief, params } = await resolveParams(body);

    const unconfirmed = unconfirmedKeys(params);
    if (unconfirmed.length > 0) {
      throw new ApiError(409, 'needs_review', 'Подтвердите параметры', { unconfirmed });
    }

    const datasets = await loadDatasets();
    const datasetVersion = datasets.manifest?.datasetVersion;
    if (datasetVersion === undefined) {
      throw new ApiError(500, 'internal_error', 'data/manifest.json is missing');
    }

    const task = buildTask(brief, params);
    const result = estimateTask({
      task,
      datasets,
      seed: body.seed ?? 42,
      datasetVersion,
      ...(body.options === undefined ? {} : { options: body.options }),
    });

    const stored: StoredEstimate = {
      id: `est_${randomUUID()}`,
      datasetVersion,
      seed: body.seed ?? 42,
      createdAt: new Date().toISOString(),
      estimates: result.estimates,
      verdict: result.verdict,
      confidence: result.confidence,
      effortGrid: result.effortGrid,
      formulaTree: result.formulaTree,
      params: params.map(toTaskParam),
      warnings: result.estimates.inhouse.warnings,
    };
    saveEstimate(stored);

    reply.status(201);
    return stored;
  });

  app.get<{ Params: { id: string } }>('/api/estimates/:id', async (request) => {
    const stored = getEstimate(request.params.id);
    if (stored === undefined) {
      throw new ApiError(404, 'not_found', `Estimate not found: ${request.params.id}`);
    }
    return stored;
  });
}
