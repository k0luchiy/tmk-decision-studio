/**
 * Estimate routes (`docs/10_api_contract.md` §3.3):
 * - `POST /api/estimates` runs the full pipeline and stores a snapshot;
 * - `GET /api/estimates` returns the latest 20 history rows;
 * - `GET /api/estimates/:id` returns a stored snapshot plus its `state`.
 */

import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { Estimate, Verdict } from '@app/contract';
import type { EstimateTaskResult } from '@app/core';
import { estimateTask } from '@app/core';
import { classifyBrief } from '@app/intake';
import { z } from 'zod';
import { jevCacheFile, loadDatasets } from '../datasets.js';
import { ApiError } from '../errors.js';
import {
  getEstimate,
  listEstimates,
  saveEstimate,
  toEstimateResponse,
  type StoredEstimate,
  type StoredResult,
} from '../store.js';
import { buildTask, toTaskParam, type TaskParamInput } from '../task.js';

/** Maximum size of the optional caller state blob (64 KB). */
export const STATE_LIMIT_BYTES = 64 * 1024;

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

const ExtraSchema = z
  .object({
    label: z.string().min(1),
    amountRub: z.number().min(0),
    appliesTo: z.enum(['all', 'inhouse', 'contractor', 'hybrid']).optional(),
  })
  .strict();

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
    contractorStageShares: z.record(z.string().regex(/^\d+$/), z.number().min(0).max(1)).optional(),
    stageHours: z.record(z.string().regex(/^\d+$/), z.number().gt(0)).optional(),
    targetWeeks: z.number().int().min(1).max(104).optional(),
    extras: z.array(ExtraSchema).max(20).optional(),
  })
  .strict();

const EstimateBodySchema = z.object({
  brief: z.string().min(1).optional(),
  params: z.array(ParamSchema).optional(),
  options: OptionsSchema.optional(),
  seed: z.number().int().optional(),
  state: z.unknown().optional(),
});

const FALLBACK_BRIEF = 'Оценка по подтверждённым параметрам';

function unconfirmedKeys(params: readonly TaskParamInput[]): string[] {
  return params.filter((param) => param.status !== 'confirmed').map((param) => param.key);
}

function assertStateSize(state: unknown): void {
  if (state === undefined) return;
  const bytes = Buffer.byteLength(JSON.stringify(state) ?? '', 'utf8');
  if (bytes > STATE_LIMIT_BYTES) {
    throw new ApiError(422, 'validation_error', `state exceeds ${STATE_LIMIT_BYTES} bytes`, {
      bytes,
    });
  }
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

function winnerEstimate(
  code: Verdict['code'],
  estimates: EstimateTaskResult['estimates'],
): Estimate {
  if (code === 'inhouse') return estimates.inhouse;
  if (code === 'contractor') return estimates.contractor;
  return estimates.hybrid;
}

export async function estimatesRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/estimates', async (request, reply) => {
    const body = EstimateBodySchema.parse(request.body);
    assertStateSize(body.state);
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

    const seed = body.seed ?? 42;
    const task = buildTask(brief, params);
    const result = estimateTask({
      task,
      datasets,
      seed,
      datasetVersion,
      ...(body.options === undefined ? {} : { options: body.options }),
    });
    const winner = winnerEstimate(result.verdict.code, result.estimates);
    const storedResult: StoredResult = {
      ...result,
      params: params.map(toTaskParam),
      warnings: result.estimates.inhouse.warnings,
    };
    const stored: StoredEstimate = {
      id: `est_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      brief,
      ...(body.state === undefined ? {} : { state: body.state }),
      verdict: result.verdict,
      p50Rub: winner.cost.p50Rub,
      weeks: winner.duration.p50Weeks,
      confidence: result.confidence.score,
      datasetVersion,
      seed,
      result: storedResult,
    };
    saveEstimate(stored);

    reply.status(201);
    return toEstimateResponse(stored);
  });

  app.get('/api/estimates', async () => ({ items: listEstimates() }));

  app.get<{ Params: { id: string } }>('/api/estimates/:id', async (request) => {
    const stored = getEstimate(request.params.id);
    if (stored === undefined) {
      throw new ApiError(404, 'not_found', `Estimate not found: ${request.params.id}`);
    }
    return toEstimateResponse(stored);
  });
}
