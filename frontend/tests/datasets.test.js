import test from 'node:test';
import assert from 'node:assert/strict';
import { mapManifest } from '../src/core/datasets.js';

const manifest = {
  datasetVersion: '47a8fb6b9e9ed54c08019d8ca66d79e587fb08b7d5f3e4d80a56068c389c39c7',
  generatedAt: '2026-11-09T15:22:08.295Z',
  files: [
    {
      path: 'data/datasets/rate_cards.json',
      sha256: '3498dfd34fedabebaf6cb63e5452e2956f467916b48d80dbf8ab00cc38100317',
      rows: 2,
      generatedAt: '2026-11-09T15:22:08.295Z',
      source: 'research/data/product/rate_cards.json',
    },
    {
      path: 'data/datasets/tmk_it_contracts.json',
      sha256: '19ef510e82cc7a50c2382e3b91512eda303d0b84329d33c1271c7f9458f1faf1',
      rows: 60,
      generatedAt: '2026-11-09T15:22:08.295Z',
      source: 'research/data/tmk_it_contracts.json',
    },
  ],
};

test('mapManifest builds rows, hashes and aggregates', () => {
  const result = mapManifest(manifest);

  assert.equal(result.datasetCount, 2);
  assert.equal(result.totalRows, 62);
  assert.equal(result.datasetVersion, manifest.datasetVersion);
  assert.equal(result.versionShort, '47a8fb6b…');
  assert.equal(result.generatedAt, manifest.generatedAt);

  assert.deepEqual(result.files.map((file) => file.name), [
    'rate_cards.json',
    'tmk_it_contracts.json',
  ]);
  assert.equal(result.files[0].rows, 2);
  assert.equal(result.files[0].sha256, '3498dfd3');
  assert.equal(result.files[0].status, 'Валидирован');
  assert.equal(result.files[0].ok, true);
  assert.equal(result.files[1].rows, 60);
});

test('mapManifest tolerates missing or malformed input', () => {
  const empty = mapManifest();
  assert.equal(empty.datasetCount, 0);
  assert.equal(empty.totalRows, 0);
  assert.deepEqual(empty.files, []);
  assert.equal(empty.versionShort, '—');

  const partial = mapManifest({ files: [{ path: 'x.json', rows: '3' }], datasetVersion: 'abc' });
  assert.equal(partial.totalRows, 3);
  assert.equal(partial.versionShort, 'abc…');
  assert.equal(partial.files[0].sha256, '');
  assert.equal(partial.files[0].date, '—');
});
