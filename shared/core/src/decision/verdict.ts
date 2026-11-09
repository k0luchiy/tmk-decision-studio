/**
 * Verdict rules (`docs/03_estimation_model.md` §6, `docs/01_vision.md` §4).
 *
 * The verdict is selected by explicit rules, in this order:
 *
 * a. **parity** — the TCO gap between in-house and contractor is no wider than
 *    the risk band (`max(p80 − p50)`), so the numbers cannot separate them and
 *    qualitative axes (knowledge transfer, schedule, security) decide;
 * b. **hybrid** — the hybrid TCO is within 5 % of the cheaper of in-house and
 *    contractor, and the contractor is faster than in-house;
 * c. **conditional in-house** — the contractor is cheaper up front but dearer
 *    over the horizon, so in-house wins with a break-even month;
 * d. **TCO winner** — otherwise the cheaper of in-house and contractor wins.
 *
 * The function only classifies numbers and picks a template; the text itself is
 * a fixed substitution in `templates.ts`. No LLM and no free-form generation.
 */

import type { Verdict } from '@app/contract';
import { conditional_v1, contractor_v1, hybrid_v1, inhouse_v1, parity_v1 } from './templates.js';

/** The numbers one scenario contributes to a verdict. */
export interface VerdictScenarioInput {
  p50Rub: number;
  p80Rub: number;
  tcoRub: number;
  weeks: number;
  breakevenMonth: number | null;
}

/** Numeric input of `buildVerdict` for all three scenarios. */
export interface VerdictInput {
  inhouse: VerdictScenarioInput;
  contractor: VerdictScenarioInput;
  hybrid: VerdictScenarioInput;
}

/** The hybrid TCO is compared with the cheaper scenario within this margin. */
export const HYBRID_TCO_TOLERANCE = 1.05;

/**
 * Builds the verdict for the three scenarios.
 *
 * Rules are applied in the documented order (parity → hybrid → conditional →
 * TCO winner). Numbers are never rounded here; formatting is the template's job.
 */
export function buildVerdict(input: VerdictInput): Verdict {
  const { inhouse, contractor, hybrid } = input;

  const diff = Math.abs(inhouse.tcoRub - contractor.tcoRub);
  const band = Math.max(inhouse.p80Rub - inhouse.p50Rub, contractor.p80Rub - contractor.p50Rub);

  // a. The gap is inside the risk band: parity.
  if (diff <= band) {
    return {
      code: 'parity',
      templateId: 'parity_v1',
      text: parity_v1(input),
      numbersRefs: ['inhouse.tco', 'contractor.tco'],
    };
  }

  // b. Hybrid is nearly the cheapest and shortens the critical path.
  const cheapestTco = Math.min(inhouse.tcoRub, contractor.tcoRub);
  if (hybrid.tcoRub <= cheapestTco * HYBRID_TCO_TOLERANCE && contractor.weeks < inhouse.weeks) {
    return {
      code: 'hybrid',
      templateId: 'hybrid_v1',
      text: hybrid_v1(input),
      numbersRefs: ['hybrid.tco', 'inhouse.tco', 'contractor.tco'],
    };
  }

  // c. Contractor is cheaper up front, dearer over the horizon: conditional.
  if (contractor.p50Rub < inhouse.p50Rub && contractor.tcoRub > inhouse.tcoRub) {
    return {
      code: 'inhouse',
      templateId: 'conditional_v1',
      text: conditional_v1(input),
      numbersRefs: ['contractor.p50', 'inhouse.p50', 'contractor.tco', 'inhouse.tco', 'breakeven'],
    };
  }

  // d. Otherwise the cheaper TCO wins.
  const winner: 'inhouse' | 'contractor' =
    inhouse.tcoRub <= contractor.tcoRub ? 'inhouse' : 'contractor';
  const loser: 'inhouse' | 'contractor' = winner === 'inhouse' ? 'contractor' : 'inhouse';

  return {
    code: winner,
    templateId: `${winner}_v1`,
    text: winner === 'inhouse' ? inhouse_v1(input) : contractor_v1(input),
    numbersRefs: [`${winner}.tco`, `${loser}.tco`],
  };
}
