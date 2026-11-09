/**
 * Share of an archetype's total effort that lands in each implementation stage.
 * Stage 7 (support) is a separate TCO line and is not part of this template.
 *
 * The shares sum to 1 so `Σ(O/M/P × share × units)` over stages 1–6 preserves
 * the archetype's three-point effort exactly.
 */
export const STAGE_SHARES = {
  1: 0.1,
  2: 0.12,
  3: 0.45,
  4: 0.15,
  5: 0.1,
  6: 0.08,
} as const;

/** Stage numbers covered by {@link STAGE_SHARES}. */
export type StageShareKey = keyof typeof STAGE_SHARES;

/** Sum of all stage shares; guarded to be exactly `1` despite float rounding. */
export function stageSharesSum(): number {
  const sum = Object.values(STAGE_SHARES).reduce((total, share) => total + share, 0);
  return Number(sum.toFixed(12));
}
