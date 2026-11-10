import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JEV_ENDPOINT,
  JEV_MODEL,
  classifyWithJev,
} from './adapter.js';
import { JEV_PROMPT_VERSION, JEV_QUESTIONS } from './contract.js';

const BRIEF = 'Интеграция 1С:ERP с WMS, 6 интеграционных потоков, срок 3 месяца';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  delete process.env.OPENCODE_API_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.OPENCODE_API_KEY;
});

describe('classifyWithJev', () => {
  it('happy path: normalizes answers and stamps the contract fields', async () => {
    let sentBody: string | undefined;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      sentBody = typeof init?.body === 'string' ? init.body : undefined;
      return jsonResponse({
        answers: {
          work_type: { value: 'integration', probability: 0.9 },
          security_kii: { value: false, probability: 0.7 },
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key' });

    expect(result.error).toBeUndefined();
    expect(result.answers).toHaveLength(2);

    const workType = result.answers.find((answer) => answer.questionId === 'work_type');
    expect(workType).toMatchObject({
      questionId: 'work_type',
      type: 'choice',
      value: 'integration',
      probability: 0.9,
      model: JEV_MODEL,
      promptVersion: JEV_PROMPT_VERSION,
    });
    expect(workType?.stateHash).toMatch(/^[0-9a-f]{64}$/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      JEV_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );

    const payload = JSON.parse(sentBody ?? '{}') as {
      model?: string;
      state?: string;
      questions?: Record<string, unknown>;
    };
    expect(payload.model).toBe(JEV_MODEL);
    expect(payload.state).toBe(BRIEF);
    expect(Object.keys(payload.questions ?? {})).toHaveLength(JEV_QUESTIONS.length);
  });

  it('401 → unavailable without throwing', async () => {
    const fetchMock = vi.fn(async () => new Response('unauthorized', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'bad-key' });

    expect(result).toEqual({ answers: [], error: 'unavailable' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries once after a network failure and succeeds on the second call', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(
        jsonResponse({ answers: { work_type: { value: 'integration', probability: 0.8 } } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key' });

    expect(result.error).toBeUndefined();
    expect(result.answers).toHaveLength(1);
    expect(result.answers[0]?.value).toBe('integration');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('timeout → error timeout', async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key', timeoutMs: 10 });

    expect(result).toEqual({ answers: [], error: 'timeout' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('invalid JSON → error invalid', async () => {
    const fetchMock = vi.fn(async () => new Response('not-json', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key' });

    expect(result).toEqual({ answers: [], error: 'invalid' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('missing API key → unavailable and fetch is not called', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF);

    expect(result).toEqual({ answers: [], error: 'unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes the live Jev shape (choice / noul / score)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        model: 'jev-1.13',
        answers: {
          work_type: { type: 'choice', choice: 'integration', confidence: 1, probabilities: { integration: 1 } },
          security_kii: { type: 'noul', noul: 0.28 },
          complexity: { type: 'score', score: 2.27, confidence: 0.71, probabilities: { '2': 0.71 } },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key' });
    const byId = new Map(result.answers.map((answer) => [answer.questionId, answer]));

    expect(byId.get('work_type')).toMatchObject({ value: 'integration', probability: 1 });
    expect(byId.get('security_kii')).toMatchObject({ value: false, probability: 0.72 });
    expect(byId.get('complexity')).toMatchObject({ value: 2, probability: 0.71 });
  });

  it('402 without an explicit model retries with jev-1.13-free', async () => {
    const models: string[] = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { model?: string };
      models.push(body.model ?? '');
      if (models.length === 1) return new Response('payment required', { status: 402 });
      return jsonResponse({ answers: { work_type: { value: 'integration', probability: 0.9 } } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key' });

    expect(result.error).toBeUndefined();
    expect(result.answers[0]?.model).toBe('jev-1.13-free');
    expect(models).toEqual(['jev-1.13', 'jev-1.13-free']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not fall back when the model was set explicitly', async () => {
    const fetchMock = vi.fn(async () => new Response('forbidden', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyWithJev(BRIEF, { apiKey: 'test-key', model: 'jev-1.13' });

    expect(result).toEqual({ answers: [], error: 'unavailable' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
