/** Optional cross-scenario context attached to a branded PDF report. */

import type { ConfidenceScore, Estimate, Verdict } from '@app/contract';

/**
 * Extra data the API already has but a single `Estimate` does not carry:
 * the full three-scenario matrix, the engine verdict and the aggregate
 * confidence. Every field is optional so a direct `toPdf(estimate)` call keeps
 * the legacy single-scenario behaviour.
 */
export interface PdfContext {
  estimates?: { inhouse: Estimate; contractor: Estimate; hybrid: Estimate };
  verdict?: Verdict;
  confidence?: ConfidenceScore;
  state?: unknown;
}
