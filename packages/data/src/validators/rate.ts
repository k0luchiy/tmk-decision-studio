/** Structural checks for `rate_cards.json`. */

import type { Datasets, GradeRow, RoleCard } from '../types.js';
import {
  asArray,
  isFiniteNumber,
  issue,
  type ValidationIssue,
  roleIdsOf,
} from './issues.js';

export function validateRateCards(data: Datasets, issues: ValidationIssue[]): Set<string> {
  const roles = asArray<RoleCard>(data.rateCards?.roles);
  if (roles.length !== 14) {
    issue(issues, 'RATE_ROLE_COUNT', 'rateCards.roles', `expected 14 roles, got ${roles.length}`);
  }
  const roleIds = roleIdsOf(data.rateCards);

  roles.forEach((role, index) => {
    const rolePath = `rateCards.roles[${index}]`;
    const grades = asArray<GradeRow>(role.grades);
    if (grades.length !== 4) {
      issue(issues, 'RATE_GRADE_COUNT', `${rolePath}.grades`, `expected 4 grades, got ${grades.length}`);
    }

    const seenGrades = new Set<string>();
    grades.forEach((grade, gradeIndex) => {
      const gradePath = `${rolePath}.grades[${gradeIndex}]`;
      const gradeKey = String(grade.grade ?? '');
      if (seenGrades.has(gradeKey)) {
        issue(issues, 'RATE_GRADE_DUPLICATE', `${gradePath}.grade`, `duplicate grade "${gradeKey}"`);
      }
      seenGrades.add(gradeKey);

      const { net_month, gross_month, employer_payroll_month, fully_loaded_month } = grade;
      const ordered =
        isFiniteNumber(net_month) &&
        net_month > 0 &&
        isFiniteNumber(gross_month) &&
        net_month < gross_month &&
        isFiniteNumber(employer_payroll_month) &&
        gross_month < employer_payroll_month &&
        isFiniteNumber(fully_loaded_month) &&
        employer_payroll_month < fully_loaded_month;
      if (!ordered) {
        issue(
          issues,
          'RATE_CHAIN_ORDER',
          `${gradePath}.net_month`,
          'expected net_month > 0 and net_month < gross_month < employer_payroll_month < fully_loaded_month',
        );
      }
      if (!(isFiniteNumber(grade.fully_loaded_hour) && grade.fully_loaded_hour > 0)) {
        issue(issues, 'RATE_HOUR_NONPOSITIVE', `${gradePath}.fully_loaded_hour`, 'expected fully_loaded_hour > 0');
      }
    });
  });

  return roleIds;
}
