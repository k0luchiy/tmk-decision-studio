/**
 * Reproducible JSON snapshot (`docs/04_ux_scenario.md` §8,
 * `docs/05_architecture_data.md` §9).
 *
 * A snapshot is the estimate together with the metadata needed to reproduce
 * the calculation: the dataset version, the PRNG seed and the schema version.
 * `snapshotHash` is a SHA-256 over the canonical JSON (recursively sorted
 * object keys), so the same input always yields the same digest regardless of
 * property insertion order.
 */

import { createHash } from 'node:crypto';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';

/** Current snapshot schema version. */
export const SNAPSHOT_SCHEMA_VERSION = '1.0.0' as const;

/** Serialisable, self-describing snapshot of a single estimate. */
export interface ExportSnapshot {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  createdAt: string;
  datasetVersion: string;
  seed: number;
  estimateId: string;
  estimate: Estimate;
  taskRef?: string;
  hash?: string;
}

/** Input of {@link toSnapshot}. */
export interface ToSnapshotInput {
  estimate: Estimate;
  datasetVersion: string;
  seed: number;
  taskRef?: string;
  /** Fixed timestamp; defaults to the estimate's own `createdAt`. */
  now?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid snapshot: "${field}" must be a non-empty string`);
  }
  return value;
}

function assertInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Invalid snapshot: "${field}" must be an integer`);
  }
  return value;
}

const HASH_PATTERN = /^[0-9a-f]{64}$/;

function assertHash(value: unknown, field: string): string {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    throw new Error(`Invalid snapshot: "${field}" must be a 64-character lowercase hex digest`);
  }
  return value;
}

function assertIsoDate(value: unknown, field: string): string {
  const text = assertString(value, field);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`Invalid snapshot: "${field}" must be an ISO-8601 date`);
  }
  return text;
}

/**
 * Builds a snapshot from an estimate and its provenance metadata.
 *
 * The estimate is copied by reference; callers that mutate it afterwards
 * should clone it first. Without `now` the timestamp is the estimate's own
 * `createdAt`, so repeated exports of one estimate stay byte-identical.
 */
export function toSnapshot(input: ToSnapshotInput): ExportSnapshot {
  const { estimate, datasetVersion, seed } = input;
  const snapshot: ExportSnapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    createdAt: input.now ?? estimate.createdAt,
    datasetVersion,
    seed,
    estimateId: estimate.id,
    estimate,
  };
  if (input.taskRef !== undefined) {
    snapshot.taskRef = input.taskRef;
  }
  return snapshot;
}

/**
 * Parses an unknown value into a snapshot.
 *
 * Enforces `schemaVersion === '1.0.0'` and validates the embedded estimate
 * against `EstimateSchema` before returning a typed value.
 */
export function fromSnapshot(json: unknown): ExportSnapshot {
  if (!isRecord(json)) {
    throw new Error('Invalid snapshot: expected a JSON object');
  }

  if (json.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported snapshot schemaVersion: ${String(json.schemaVersion)} (expected ${SNAPSHOT_SCHEMA_VERSION})`,
    );
  }

  const estimate = EstimateSchema.parse(json.estimate);
  const estimateId = assertString(json.estimateId, 'estimateId');
  if (estimateId !== estimate.id) {
    throw new Error(`Invalid snapshot: estimateId "${estimateId}" does not match estimate "${estimate.id}"`);
  }

  const snapshot: ExportSnapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    createdAt: assertIsoDate(json.createdAt, 'createdAt'),
    datasetVersion: assertString(json.datasetVersion, 'datasetVersion'),
    seed: assertInteger(json.seed, 'seed'),
    estimateId,
    estimate,
  };

  if (json.taskRef !== undefined) {
    snapshot.taskRef = assertString(json.taskRef, 'taskRef');
  }
  if (json.hash !== undefined) {
    snapshot.hash = assertHash(json.hash, 'hash');
  }

  return snapshot;
}

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalise(entry));
  }
  if (isRecord(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalise(value[key]);
    }
    return sorted;
  }
  return value;
}

/** Returns the canonical JSON string (recursively sorted object keys). */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalise(value));
}

/** SHA-256 of the canonical JSON without the `hash` field, as lowercase hex. */
export function snapshotHash(snapshot: ExportSnapshot): string {
  const unhashed: ExportSnapshot = { ...snapshot };
  delete unhashed.hash;
  return createHash('sha256').update(canonicalJson(unhashed)).digest('hex');
}
