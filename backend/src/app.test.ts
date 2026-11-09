/**
 * Route tests for the Fastify API (`docs/10_api_contract.md`).
 *
 * Uses `app.inject` (no real socket) and the committed D1 brief, so the whole
 * suite runs offline and deterministically.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { estimateTask } from '@app/core';
import { buildApp } from './app.js';
import { loadDatasets, repoRoot } from './datasets.js';
import { saveEstimate, type StoredEstimate } from './store.js';
import { buildTask } from './task.js';

interface Brief {
  id: string;
  text: string;
}

interface ParamDto {
  key: string;
  value: string | number | boolean;
  status: string;
  [extra: string]: unknown;
}

interface IntakeDto {
  status: string;
  params: ParamDto[];
  clarification: string[];
}

interface EstimateDto {
  id: string;
  estimates: Record<'inhouse' | 'contractor' | 'hybrid', { scenario: string }>;
  effortGrid: { totalHours: number };
}

let app: FastifyInstance;
let d1Text: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  const raw = readFileSync(path.join(repoRoot, 'data', 'eval', 'briefs.json'), 'utf8');
  const briefs = JSON.parse(raw) as Brief[];
  const first = briefs[0];
  if (first === undefined) {
    throw new Error('data/eval/briefs.json is empty');
  }
  d1Text = first.text;
});

afterAll(async () => {
  await app.close();
});

async function confirmedParams(): Promise<ParamDto[]> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/intake',
    payload: { brief: d1Text, mode: 'cache' },
  });
  const body = response.json() as IntakeDto;
  return body.params.map((param) => ({ ...param, status: 'confirmed' }));
}

async function createEstimate(): Promise<EstimateDto> {
  const params = await confirmedParams();
  const response = await app.inject({
    method: 'POST',
    url: '/api/estimates',
    payload: { brief: d1Text, params, seed: 42 },
  });
  expect(response.statusCode).toBe(201);
  return response.json() as EstimateDto;
}

describe('health / meta / datasets', () => {
  it('GET /api/health returns ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('GET /api/meta returns the dataset version', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/meta' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { datasetVersion: string; methodVersion: string };
    expect(body.datasetVersion.length).toBeGreaterThan(0);
    expect(body.methodVersion).toBe('1.0.0');
  });

  it('GET /api/datasets returns the six-file manifest', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/datasets' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { files: unknown[]; datasetVersion: string };
    expect(body.files).toHaveLength(6);
    expect(body.datasetVersion.length).toBeGreaterThan(0);
  });

  it('GET /api/datasets/:name returns rows for a known dataset', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/datasets/rate_cards' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { name: string; rows: unknown };
    expect(body.name).toBe('rate_cards');
    expect(body.rows).toBeDefined();
  });

  it('GET /api/datasets/:name returns 404 for an unknown dataset', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/datasets/does_not_exist' });
    expect(response.statusCode).toBe(404);
    expect((response.json() as { error: { code: string } }).error.code).toBe('not_found');
  });
});

describe('intake', () => {
  it('POST /api/intake extracts D1 parameters', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/intake',
      payload: { brief: d1Text, mode: 'cache' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as IntakeDto;
    expect(['rules', 'jev-cache', 'jev-live']).toContain(body.status);
    expect(body.params.length).toBeGreaterThan(0);
    expect(body.params.some((param) => param.key === 'flows')).toBe(true);
    expect(Array.isArray(body.clarification)).toBe(true);
  });

  it('POST /api/intake/confirm marks every parameter confirmed', async () => {
    const params = await confirmedParams();
    const response = await app.inject({
      method: 'POST',
      url: '/api/intake/confirm',
      payload: { params },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { params: ParamDto[]; complete: boolean };
    expect(body.complete).toBe(true);
    expect(body.params.every((param) => param.status === 'confirmed')).toBe(true);
  });
});

describe('estimates', () => {
  it('POST /api/estimates returns 201 with three scenarios', async () => {
    const body = await createEstimate();
    expect(body.id).toMatch(/^est_/);
    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(body.estimates[key].scenario).toBe(key);
    }
    expect(body.effortGrid.totalHours).toBeGreaterThan(0);
  });

  it('GET /api/estimates/:id returns the stored snapshot', async () => {
    const created = await createEstimate();
    const response = await app.inject({ method: 'GET', url: `/api/estimates/${created.id}` });
    expect(response.statusCode).toBe(200);
    expect((response.json() as EstimateDto).id).toBe(created.id);
  });

  it('POST /api/estimates rejects unconfirmed parameters with 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/estimates',
      payload: {
        brief: d1Text,
        params: [{ key: 'flows', value: 6, unit: 'поток', status: 'auto', defaultUsed: false }],
      },
    });
    expect(response.statusCode).toBe(409);
    const body = response.json() as { error: { code: string } };
    expect(body.error.code).toBe('needs_review');
  });
});

describe('export', () => {
  it('POST /api/estimates/:id/export renders a PDF', async () => {
    const created = await createEstimate();
    const response = await app.inject({
      method: 'POST',
      url: `/api/estimates/${created.id}/export`,
      payload: { format: 'pdf' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.rawPayload.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('POST /api/estimates/:id/export returns 409 when parameters are not confirmed', async () => {
    const datasets = await loadDatasets();
    const datasetVersion = datasets.manifest?.datasetVersion;
    expect(datasetVersion).toBeDefined();

    const params = await confirmedParams();
    const task = buildTask(d1Text, params);
    const result = estimateTask({ task, datasets, seed: 42, datasetVersion: datasetVersion ?? '' });
    const stored: StoredEstimate = {
      id: 'est_unconfirmed_fixture',
      datasetVersion: datasetVersion ?? '',
      seed: 42,
      createdAt: new Date().toISOString(),
      estimates: result.estimates,
      verdict: result.verdict,
      confidence: result.confidence,
      effortGrid: result.effortGrid,
      formulaTree: result.formulaTree,
      params: (task.params ?? []).map((param) => ({ ...param, status: 'auto' })),
      warnings: result.estimates.inhouse.warnings,
    };
    saveEstimate(stored);

    const response = await app.inject({
      method: 'POST',
      url: `/api/estimates/${stored.id}/export`,
      payload: { format: 'pdf' },
    });
    expect(response.statusCode).toBe(409);
    expect((response.json() as { error: { code: string } }).error.code).toBe('needs_review');
  });

  it('export returns 404 for an unknown estimate', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/estimates/est_missing/export',
      payload: { format: 'pdf' },
    });
    expect(response.statusCode).toBe(404);
  });
});
