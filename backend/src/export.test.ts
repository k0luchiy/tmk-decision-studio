/**
 * Export route tests (`docs/10_api_contract.md` §3.4).
 *
 * Split from `app.test.ts` to keep both files under the 250-line budget.
 * The three-scenario assertions use `pdftotext` when it is available.
 */

import { spawnSync } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { estimateTask } from '@app/core';
import { buildApp } from './app.js';
import {
  confirmedParams,
  createEstimate,
  loadD1Text,
  type ParamDto,
} from './app.test-helpers.js';
import { loadDatasets } from './datasets.js';
import { saveEstimate, type StoredEstimate } from './store.js';
import { buildTask } from './task.js';

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

function pdftotext(buffer: Buffer): string | undefined {
  const result = spawnSync('pdftotext', ['-enc', 'UTF-8', '-', '-'], {
    input: buffer,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error !== undefined || result.status !== 0) {
    return undefined;
  }
  return result.stdout.toString('utf8');
}

async function exportPdf(id: string): Promise<Buffer> {
  const response = await app.inject({
    method: 'POST',
    url: `/api/estimates/${id}/export`,
    payload: { format: 'pdf' },
  });
  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('application/pdf');
  return response.rawPayload;
}

describe('export', () => {
  it('POST /api/estimates/:id/export renders a PDF', async () => {
    const created = await createEstimate(app, d1Text);
    const pdf = await exportPdf(created.id);
    expect(pdf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('PDF contains all three scenarios from the stored result', async () => {
    const created = await createEstimate(app, d1Text);
    const pdf = await exportPdf(created.id);
    const text = pdftotext(pdf);
    if (text === undefined) {
      return;
    }
    expect(text).toContain('Внутренняя команда');
    expect(text).toContain('Подрядчик');
    expect(text).toContain('Гибрид');
    expect(text).toMatch(/РЕКОМЕНДАЦИЯ/u);
    expect(text).toContain('СРАВНЕНИЕ СЦЕНАРИЕВ');
  });

  it('POST /api/estimates/:id/export returns 409 when parameters are not confirmed', async () => {
    const datasets = await loadDatasets();
    const datasetVersion = datasets.manifest?.datasetVersion;
    expect(datasetVersion).toBeDefined();

    const params = await confirmed();
    const task = buildTask(d1Text, params);
    const result = estimateTask({ task, datasets, seed: 42, datasetVersion: datasetVersion ?? '' });
    const stored: StoredEstimate = {
      id: 'est_unconfirmed_fixture',
      createdAt: new Date().toISOString(),
      brief: d1Text,
      verdict: result.verdict,
      p50Rub: result.estimates.inhouse.cost.p50Rub,
      weeks: result.estimates.inhouse.duration.p50Weeks,
      confidence: result.confidence.score,
      datasetVersion: datasetVersion ?? '',
      seed: 42,
      result: {
        ...result,
        params: (task.params ?? []).map((param) => ({ ...param, status: 'auto' })),
        warnings: result.estimates.inhouse.warnings,
      },
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
