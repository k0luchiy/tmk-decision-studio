/**
 * Route tests for the Fastify API (`docs/10_api_contract.md`).
 *
 * Uses `app.inject` (no real socket) and the committed D1 brief, so the whole
 * suite runs offline and deterministically.
 */

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import {
  confirmedParams,
  createEstimate,
  loadD1Text,
  type EstimateDto,
  type IntakeDto,
  type ParamDto,
} from './app.test-helpers.js';

let app: FastifyInstance;
let d1Text: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  d1Text = loadD1Text();
});

afterAll(async () => {
  await app.close();
});

function confirmed(): Promise<ParamDto[]> {
  return confirmedParams(app, d1Text);
}

function estimate(): Promise<EstimateDto> {
  return createEstimate(app, d1Text);
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
    const body = response.json() as { datasetVersion: string; methodVersion: string; brand: string; jevModel: string };
    expect(body.datasetVersion.length).toBeGreaterThan(0);
    expect(body.methodVersion).toBe('1.0.0');
    expect(body.brand).toBe('TMK Decision Studio');
    expect(body.jevModel.length).toBeGreaterThan(0);
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
    const params = await confirmed();
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
    const body = await estimate();
    expect(body.id).toMatch(/^est_/);
    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(body.estimates[key].scenario).toBe(key);
    }
    expect(body.effortGrid.totalHours).toBeGreaterThan(0);
  });

  it('GET /api/estimates/:id returns the stored snapshot', async () => {
    const created = await estimate();
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

  it('POST /api/estimates applies UI options and changes the numbers', async () => {
    const params = await confirmed();
    const send = (options?: Record<string, unknown>) =>
      app.inject({
        method: 'POST',
        url: '/api/estimates',
        payload: { brief: d1Text, params, seed: 42, options },
      });
    const base = (await send()).json() as EstimateDto;
    const option = (
      await send({
        teamRate: 9000,
        reservePct: 0.1,
        oversightPct: 0.2,
        contractorStages: [3, 4],
        stageHours: { '3': 400 },
      })
    ).json() as EstimateDto;

    expect(option.estimates.inhouse.cost.p50Rub).not.toBe(base.estimates.inhouse.cost.p50Rub);
    expect(option.estimates.contractor.cost.p50Rub).not.toBe(base.estimates.contractor.cost.p50Rub);
    expect(option.effortGrid.totalHours).not.toBe(base.effortGrid.totalHours);
  });

  it('POST /api/estimates rejects an invalid reservePct with 422', async () => {
    const params = await confirmed();
    const response = await app.inject({
      method: 'POST',
      url: '/api/estimates',
      payload: { brief: d1Text, params, seed: 42, options: { reservePct: 0.8 } },
    });
    expect(response.statusCode).toBe(422);
    expect((response.json() as { error: { code: string } }).error.code).toBe('validation_error');
  });

  it('POST /api/estimates rejects unknown option fields with 422', async () => {
    const params = await confirmed();
    const response = await app.inject({
      method: 'POST',
      url: '/api/estimates',
      payload: { brief: d1Text, params, seed: 42, options: { unknownOption: true } },
    });
    expect(response.statusCode).toBe(422);
    expect((response.json() as { error: { code: string } }).error.code).toBe('validation_error');
  });
});
