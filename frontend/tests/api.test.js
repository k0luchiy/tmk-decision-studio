import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchEstimates, fetchEstimate } from '../src/core/api.js';

const stubFetch = (t, payload) => {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => payload };
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  return calls;
};

test('fetchEstimates GETs /api/estimates and returns the list', async (t) => {
  const calls = stubFetch(t, { items: [{ id: 'est_1' }] });

  const data = await fetchEstimates();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/estimates');
  assert.equal(calls[0].options, undefined);
  assert.deepEqual(data.items, [{ id: 'est_1' }]);
});

test('fetchEstimate GETs /api/estimates/:id', async (t) => {
  const calls = stubFetch(t, { id: 'est_1', brief: 'Интеграция' });

  const data = await fetchEstimate('est_1');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/estimates/est_1');
  assert.equal(data.id, 'est_1');
});

test('fetchEstimate encodes the estimate id', async (t) => {
  const calls = stubFetch(t, { id: 'a b' });

  await fetchEstimate('a b');

  assert.equal(calls[0].url, '/api/estimates/a%20b');
});
