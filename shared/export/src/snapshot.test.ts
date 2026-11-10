import { describe, expect, it } from 'vitest';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { canonicalJson, fromSnapshot, snapshotHash, toSnapshot } from './snapshot.js';

function firstEstimate(): Estimate {
  const raw: unknown = d1ScenariosJson[0];
  return EstimateSchema.parse(raw);
}

const NOW = '2026-11-09T12:00:00.000Z';

describe('toSnapshot / fromSnapshot', () => {
  it('round-trips through JSON without losing data', () => {
    const estimate = firstEstimate();
    const snapshot = toSnapshot({
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
      taskRef: estimate.taskId,
      now: NOW,
    });

    const restored = fromSnapshot(JSON.parse(JSON.stringify(snapshot)));

    expect(restored).toEqual(snapshot);
    expect(restored.schemaVersion).toBe('1.0.0');
    expect(restored.estimateId).toBe(estimate.id);
    expect(restored.estimate.id).toBe(estimate.id);
    expect(restored.taskRef).toBe(estimate.taskId);
  });

  it('rejects an unsupported schemaVersion', () => {
    const snapshot = toSnapshot({
      estimate: firstEstimate(),
      datasetVersion: 'ds',
      seed: 1,
      now: NOW,
    });
    const tampered: unknown = { ...snapshot, schemaVersion: '2.0.0' };
    expect(() => fromSnapshot(tampered)).toThrow(/schemaVersion/i);
  });

  it('rejects a payload without an estimate', () => {
    expect(() => fromSnapshot({ schemaVersion: '1.0.0' })).toThrow();
  });

  it('defaults createdAt to the estimate createdAt', () => {
    const estimate = firstEstimate();
    const snapshot = toSnapshot({
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
    });
    expect(snapshot.createdAt).toBe(estimate.createdAt);
  });

  it('accepts a payload with a 64-hex hash', () => {
    const estimate = firstEstimate();
    const snapshot = toSnapshot({
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
      now: NOW,
    });
    const hash = snapshotHash(snapshot);
    const restored = fromSnapshot({ ...snapshot, hash });

    expect(restored.hash).toBe(hash);
    expect(snapshotHash(restored)).toBe(hash);
  });

  it('rejects a malformed hash', () => {
    const estimate = firstEstimate();
    const snapshot = toSnapshot({
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
      now: NOW,
    });
    expect(() => fromSnapshot({ ...snapshot, hash: 'not-a-hash' })).toThrow(/hash/i);
  });
});

describe('snapshotHash', () => {
  it('is stable for identical input with a fixed clock', () => {
    const estimate = firstEstimate();
    const input = {
      estimate,
      datasetVersion: estimate.datasetVersion,
      seed: estimate.seed,
      now: NOW,
    };

    const a = snapshotHash(toSnapshot(input));
    const b = snapshotHash(toSnapshot(input));

    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when the seed changes', () => {
    const estimate = firstEstimate();
    const base = { estimate, datasetVersion: estimate.datasetVersion, now: NOW };

    expect(snapshotHash(toSnapshot({ ...base, seed: 42 }))).not.toBe(
      snapshotHash(toSnapshot({ ...base, seed: 43 })),
    );
  });

  it('canonicalises object key order', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });
});
