/**
 * Shared setup and DTOs for the Fastify route tests.
 *
 * Kept out of `app.test.ts` so that file stays under the 250-line budget.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { repoRoot } from './datasets.js';

interface Brief {
  id: string;
  text: string;
}

export interface ParamDto {
  key: string;
  value: string | number | boolean;
  status: string;
  [extra: string]: unknown;
}

export interface IntakeDto {
  status: string;
  params: ParamDto[];
  clarification: string[];
}

export interface EstimateDto {
  id: string;
  estimates: Record<
    'inhouse' | 'contractor' | 'hybrid',
    { scenario: string; cost: { p50Rub: number } }
  >;
  effortGrid: { totalHours: number };
  sensitivity: { name: string; low: number; high: number; lowValue: number; highValue: number }[];
  distribution: { value: number; label: string; count: number }[];
}

export function loadD1Text(): string {
  const raw = readFileSync(path.join(repoRoot, 'data', 'eval', 'briefs.json'), 'utf8');
  const briefs = JSON.parse(raw) as Brief[];
  const first = briefs[0];
  if (first === undefined) {
    throw new Error('data/eval/briefs.json is empty');
  }
  return first.text;
}

export async function confirmedParams(
  app: FastifyInstance,
  d1Text: string,
): Promise<ParamDto[]> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/intake',
    payload: { brief: d1Text, mode: 'cache' },
  });
  const body = response.json() as IntakeDto;
  return body.params.map((param) => ({ ...param, status: 'confirmed' }));
}

export async function createEstimate(
  app: FastifyInstance,
  d1Text: string,
): Promise<EstimateDto> {
  const params = await confirmedParams(app, d1Text);
  const response = await app.inject({
    method: 'POST',
    url: '/api/estimates',
    payload: { brief: d1Text, params, seed: 42 },
  });
  if (response.statusCode !== 201) {
    throw new Error(`expected 201, got ${response.statusCode}`);
  }
  return response.json() as EstimateDto;
}
