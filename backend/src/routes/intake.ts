/**
 * Intake routes (`docs/10_api_contract.md` §3.1–3.2):
 * - `POST /api/intake` parses a brief into parameters plus clarification;
 * - `POST /api/intake/confirm` marks the reviewed parameters confirmed.
 */

import type { FastifyInstance } from 'fastify';
import { classifyBrief, needsClarification } from '@app/intake';
import { z } from 'zod';
import { jevCacheFile } from '../datasets.js';

const ParamSchema = z
  .object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    unit: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    quote: z.string().optional(),
    status: z.enum(['auto', 'confirmed', 'edited', 'rejected']).optional(),
    defaultUsed: z.boolean().optional(),
  })
  .passthrough();

const IntakeBodySchema = z.object({
  brief: z.string().min(1),
  mode: z.enum(['off', 'cache', 'live']).optional(),
});

const ConfirmBodySchema = z.object({
  params: z.array(ParamSchema).min(1),
});

export async function intakeRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/intake', async (request) => {
    const body = IntakeBodySchema.parse(request.body);
    const result = await classifyBrief(body.brief, {
      ...(body.mode === undefined ? {} : { mode: body.mode }),
      cacheFile: jevCacheFile,
    });
    return {
      status: result.status,
      params: result.params,
      clarification: needsClarification(body.brief),
    };
  });

  app.post('/api/intake/confirm', async (request) => {
    const body = ConfirmBodySchema.parse(request.body);
    const params = body.params.map((param) => ({ ...param, status: 'confirmed' as const }));
    const complete = params.length > 0 && params.every((param) => param.status === 'confirmed');
    return { params, complete };
  });
}
