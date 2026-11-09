/**
 * In-memory estimate store with a 24-hour TTL (`docs/10_api_contract.md` §5).
 *
 * Each entry keeps a compact history row plus the full pipeline snapshot.
 * Snapshots are immutable: a recalculation creates a new id. No database, no
 * disk — one process, hackathon scale.
 */

import type { ExtractedParam, Verdict, Warning } from '@app/contract';
import type { EstimateTaskResult } from '@app/core';

export interface StoredResult extends EstimateTaskResult {
  params: ExtractedParam[];
  warnings: Warning[];
}

/** Full stored snapshot, including the caller-provided `state` blob. */
export interface StoredEstimate {
  id: string;
  createdAt: string;
  brief: string;
  state?: unknown;
  verdict: Verdict;
  p50Rub: number;
  weeks: number;
  confidence: number;
  datasetVersion: string;
  seed: number;
  result: StoredResult;
}

/** Flat response shape of `POST /api/estimates` and `GET /api/estimates/:id`. */
export interface EstimateResponse extends StoredResult {
  id: string;
  createdAt: string;
  brief: string;
  state?: unknown;
}

/** One row of `GET /api/estimates`. */
export interface EstimateSummary {
  id: string;
  createdAt: string;
  brief: string;
  verdict: Verdict['code'];
  p50Rub: number;
  weeks: number;
  confidence: number;
}

/** Snapshot lifetime: 24 hours. */
export const TTL_MS = 24 * 60 * 60 * 1000;
/** Maximum number of history rows returned by {@link listEstimates}. */
export const HISTORY_LIMIT = 20;

interface Entry {
  estimate: StoredEstimate;
  expiresAt: number;
}

const store = new Map<string, Entry>();

/** Stores a snapshot, expiring it after {@link TTL_MS}. */
export function saveEstimate(estimate: StoredEstimate, now: number = Date.now()): void {
  store.set(estimate.id, { estimate, expiresAt: now + TTL_MS });
}

/** Returns a live snapshot, dropping it lazily once expired. */
export function getEstimate(id: string, now: number = Date.now()): StoredEstimate | undefined {
  const entry = store.get(id);
  if (entry === undefined) return undefined;
  if (entry.expiresAt <= now) {
    store.delete(id);
    return undefined;
  }
  return entry.estimate;
}

function toSummary(estimate: StoredEstimate): EstimateSummary {
  return {
    id: estimate.id,
    createdAt: estimate.createdAt,
    brief: estimate.brief,
    verdict: estimate.verdict.code,
    p50Rub: estimate.p50Rub,
    weeks: estimate.weeks,
    confidence: estimate.confidence,
  };
}

/** Newest live snapshots first, capped at {@link HISTORY_LIMIT}. */
export function listEstimates(
  now: number = Date.now(),
  limit: number = HISTORY_LIMIT,
): EstimateSummary[] {
  const live: StoredEstimate[] = [];
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(id);
      continue;
    }
    live.push(entry.estimate);
  }
  return live
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(toSummary);
}

/** Flattens a stored snapshot into the documented API response. */
export function toEstimateResponse(estimate: StoredEstimate): EstimateResponse {
  return {
    id: estimate.id,
    createdAt: estimate.createdAt,
    brief: estimate.brief,
    ...(estimate.state === undefined ? {} : { state: estimate.state }),
    ...estimate.result,
  };
}

/** Drops every stored snapshot (used by tests). */
export function clearEstimates(): void {
  store.clear();
}
