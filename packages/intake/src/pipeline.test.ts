import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CACHE_FILE, classifyBrief } from './pipeline.js';
import type { MergedParam } from './merge.js';

const D1 = 'Интеграция 1С:ERP с WMS, 6 интеграционных потоков, срок 3 месяца';
const UNCACHED = 'Нужно сделать что-то полезное для команды';

function byKey(params: readonly MergedParam[], key: string): MergedParam | undefined {
  return params.find((param) => param.key === key);
}

beforeEach(() => {
  delete process.env.INTAKE_MODE;
  delete process.env.OPENCODE_API_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.INTAKE_MODE;
  delete process.env.OPENCODE_API_KEY;
});

describe('classifyBrief modes', () => {
  it('off → rules only, even when a cache entry exists', async () => {
    const result = await classifyBrief(D1, { mode: 'off', cacheFile: DEFAULT_CACHE_FILE });

    expect(result.status).toBe('rules');
    expect(byKey(result.params, 'work_type')?.value).toBe('integration');
    expect(byKey(result.params, 'flows')?.value).toBe(6);
  });

  it('cache hit → jev-cache using the committed D1 entry', async () => {
    const result = await classifyBrief(D1, { mode: 'cache', cacheFile: DEFAULT_CACHE_FILE });

    expect(result.status).toBe('jev-cache');
    expect(byKey(result.params, 'work_type')?.value).toBe('integration');
    expect(byKey(result.params, 'platform')?.value).toBe('1c');
    // A Jev-only flag is present because the cache answered it.
    expect(byKey(result.params, 'has_integrations')?.value).toBe(true);
    // Numbers still come from rules.
    expect(byKey(result.params, 'flows')).toMatchObject({ value: 6, source: 'rules' });
  });

  it('cache miss → rules', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('network must not be used')));
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyBrief(UNCACHED, {
      mode: 'cache',
      cacheFile: DEFAULT_CACHE_FILE,
    });

    expect(result.status).toBe('rules');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('live without a key → rules without a network call', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('network must not be used')));
    vi.stubGlobal('fetch', fetchMock);

    const result = await classifyBrief(D1, { mode: 'live' });

    expect(result.status).toBe('rules');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('INTAKE_MODE is honoured when options omit the mode', async () => {
    process.env.INTAKE_MODE = 'off';
    const result = await classifyBrief(D1, { cacheFile: DEFAULT_CACHE_FILE });
    expect(result.status).toBe('rules');
  });
});
