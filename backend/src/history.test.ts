import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { confirmedParams, loadD1Text, type ParamDto } from './app.test-helpers.js';
import { clearEstimates } from './store.js';

interface CostLineDto {
  group: string;
  label: string;
  valueRub: number;
}

interface ScenarioDto {
  cost: { p50Rub: number; lines: CostLineDto[] };
  tco: { year: number; costRub: number }[];
}

interface EstimateResponseDto {
  id: string;
  createdAt: string;
  brief: string;
  state?: unknown;
  methodDivergence: number;
  verdict: { code: string };
  confidence: { score: number };
  effortGrid: { totalHours: number };
  estimates: Record<'inhouse' | 'contractor' | 'hybrid', ScenarioDto>;
}

interface HistoryDto {
  items: {
    id: string;
    createdAt: string;
    brief: string;
    verdict: string;
    p50Rub: number;
    weeks: number;
    confidence: number;
  }[];
}

let app: FastifyInstance;
let d1Text: string;
let params: ParamDto[];

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  d1Text = loadD1Text();
  params = await confirmedParams(app, d1Text);
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  clearEstimates();
});

async function postEstimate(options?: Record<string, unknown>, state?: unknown) {
  return app.inject({
    method: 'POST',
    url: '/api/estimates',
    payload: { brief: d1Text, params, seed: 42, ...(options ? { options } : {}), ...(state === undefined ? {} : { state }) },
  });
}

describe('estimate history', () => {
  it('GET /api/estimates is empty before any POST', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/estimates' });
    expect(response.statusCode).toBe(200);
    expect((response.json() as HistoryDto).items).toEqual([]);
  });

  it('POST then GET list returns a summary row', async () => {
    const created = (await postEstimate()).json() as EstimateResponseDto;
    const response = await app.inject({ method: 'GET', url: '/api/estimates' });
    const body = response.json() as HistoryDto;

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: created.id,
      brief: d1Text,
      verdict: created.verdict.code,
      confidence: created.confidence.score,
    });
    expect(body.items[0]?.p50Rub).toBeGreaterThan(0);
    expect(body.items[0]?.weeks).toBeGreaterThan(0);
  });

  it('GET /api/estimates/:id returns the full snapshot plus state', async () => {
    const created = (await postEstimate(undefined, { ui: { tab: 'costs' } })).json() as EstimateResponseDto;
    const response = await app.inject({ method: 'GET', url: `/api/estimates/${created.id}` });
    const body = response.json() as EstimateResponseDto;

    expect(response.statusCode).toBe(200);
    expect(body.id).toBe(created.id);
    expect(body.state).toEqual({ ui: { tab: 'costs' } });
    expect(body.estimates.inhouse.cost.p50Rub).toBe(created.estimates.inhouse.cost.p50Rub);
    expect(typeof body.methodDivergence).toBe('number');
  });

  it('GET /api/estimates/:id returns 404 for an unknown id', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/estimates/est_missing' });
    expect(response.statusCode).toBe(404);
    expect((response.json() as { error: { code: string } }).error.code).toBe('not_found');
  });
});

describe('deadline and extras', () => {
  it('targetWeeks compresses the schedule and raises all prices', async () => {
    const base = (await postEstimate()).json() as EstimateResponseDto;
    const compressed = (await postEstimate({ targetWeeks: 5 })).json() as EstimateResponseDto;

    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(compressed.estimates[key].cost.p50Rub).toBeGreaterThan(
        base.estimates[key].cost.p50Rub,
      );
      expect(
        compressed.estimates[key].cost.lines.some(
          (line) => line.group === 'risk' && line.label.includes('Putnam'),
        ),
      ).toBe(true);
    }
  });

  it('extras add sticky lines to all scenarios and do not change support', async () => {
    const base = (await postEstimate()).json() as EstimateResponseDto;
    const withExtra = (
      await postEstimate({ extras: [{ label: 'Лицензии', amountRub: 100_000 }] })
    ).json() as EstimateResponseDto;

    for (const key of ['inhouse', 'contractor', 'hybrid'] as const) {
      expect(withExtra.estimates[key].cost.p50Rub).toBeCloseTo(
        base.estimates[key].cost.p50Rub + 100_000,
        6,
      );
      expect(
        withExtra.estimates[key].cost.lines.some(
          (line) => line.group === 'extra' && line.label === 'Лицензии',
        ),
      ).toBe(true);
      const baseSupport = base.estimates[key].tco.find((row) => row.year === 1)?.costRub;
      const extraSupport = withExtra.estimates[key].tco.find((row) => row.year === 1)?.costRub;
      expect(extraSupport).toBe(baseSupport);
    }
  });

  it('extras can target a single scenario', async () => {
    const base = (await postEstimate()).json() as EstimateResponseDto;
    const targeted = (
      await postEstimate({ extras: [{ label: 'Подряд', amountRub: 50_000, appliesTo: 'contractor' }] })
    ).json() as EstimateResponseDto;

    expect(targeted.estimates.contractor.cost.p50Rub).toBeCloseTo(
      base.estimates.contractor.cost.p50Rub + 50_000,
      6,
    );
    expect(targeted.estimates.inhouse.cost.p50Rub).toBe(base.estimates.inhouse.cost.p50Rub);
  });

  it('rejects targetWeeks above 104 and oversized state', async () => {
    const tooLong = await postEstimate({ targetWeeks: 105 });
    expect(tooLong.statusCode).toBe(422);

    const big = await postEstimate(undefined, { blob: 'x'.repeat(70 * 1024) });
    expect(big.statusCode).toBe(422);
  });
});
