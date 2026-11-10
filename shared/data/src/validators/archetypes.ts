/** Structural checks for `work_archetypes.json`. */

import type { Archetype, Datasets } from '../types.js';
import { asArray, isFiniteNumber, isRecord, issue, type ValidationIssue } from './issues.js';

export function validateArchetypes(
  data: Datasets,
  issues: ValidationIssue[],
  roleIds: Set<string>,
): void {
  const archetypes = asArray<Archetype>(data.archetypes?.archetypes);
  if (archetypes.length !== 23) {
    issue(issues, 'ARCHETYPE_COUNT', 'archetypes.archetypes', `expected 23 archetypes, got ${archetypes.length}`);
  }

  archetypes.forEach((archetype, index) => {
    const archetypePath = `archetypes.archetypes[${index}]`;
    const mix = isRecord(archetype.default_role_mix_pct) ? archetype.default_role_mix_pct : {};
    const mixSum = Object.values(mix).reduce<number>(
      (sum, share) => sum + (isFiniteNumber(share) ? share : 0),
      0,
    );
    if (Math.abs(mixSum - 100) >= 1e-9) {
      issue(
        issues,
        'ROLE_MIX_SUM',
        `${archetypePath}.default_role_mix_pct`,
        `expected role mix sum 100, got ${mixSum}`,
      );
    }

    const threePoint = archetype.three_point;
    const optimistic = threePoint?.optimistic;
    const mostLikely = threePoint?.most_likely;
    const pessimistic = threePoint?.pessimistic;
    if (
      !(
        isFiniteNumber(optimistic) &&
        isFiniteNumber(mostLikely) &&
        isFiniteNumber(pessimistic) &&
        optimistic <= mostLikely &&
        mostLikely <= pessimistic
      )
    ) {
      issue(
        issues,
        'ARCHETYPE_THREE_POINT_ORDER',
        `${archetypePath}.three_point`,
        'expected optimistic <= most_likely <= pessimistic',
      );
    }
    if (archetype.p50_hours_per_unit !== mostLikely) {
      issue(
        issues,
        'ARCHETYPE_P50_MISMATCH',
        `${archetypePath}.p50_hours_per_unit`,
        `expected p50_hours_per_unit to equal three_point.most_likely (${String(mostLikely)})`,
      );
    }

    Object.keys(mix).forEach((roleId) => {
      if (!roleIds.has(roleId)) {
        issue(
          issues,
          'ROLE_MIX_UNKNOWN_ROLE',
          `${archetypePath}.default_role_mix_pct.${roleId}`,
          `role "${roleId}" is not present in rateCards.roles`,
        );
      }
    });
  });
}
