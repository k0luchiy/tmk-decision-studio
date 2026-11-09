/**
 * In-memory estimate store with a 24-hour TTL (`docs/10_api_contract.md` §5).
 *
 * Snapshots are immutable: a recalculation would create a new id, never mutate
 * an existing one. No database, no disk — one process, hackathon scale.
 */

import type {
  ConfidenceScore,
  EffortGrid,
  Estimate,
  ExtractedParam,
  FormulaNode,
  Verdict,
  Warning,
} from '@app/contract';

/** A frozen estimate snapshot as returned by `POST /api/estimates`. */
export interface StoredEstimate {
  id: string;
  datasetVersion: string;
  seed: number;
  createdAt: string;
  estimates: {
    inhouse: Estimate;
    contractor: Estimate;
    hybrid: Estimate;
  };
  verdict: Verdict;
  confidence: ConfidenceScore;
  effortGrid: EffortGrid;
  formulaTree: FormulaNode;
  params: ExtractedParam[];
  warnings: Warning[];
}

/** Snapshot lifetime: 24 hours. */
export const TTL_MS = 24 * 60 * 60 * 1000;

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
  if (entry === undefined) {
    return undefined;
  }
  if (entry.expiresAt <= now) {
    store.delete(id);
    return undefined;
  }
  return entry.estimate;
}

/** Drops every stored snapshot (used by tests). */
export function clearEstimates(): void {
  store.clear();
}
