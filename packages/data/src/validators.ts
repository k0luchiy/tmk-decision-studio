import type {
  AnalogueRow,
  Archetype,
  ContractorBand,
  Datasets,
  GradeRow,
  RateCardsFile,
  RoleCard,
  TmkContract,
} from './types.js';

/** A single structural or data-quality finding produced by `validateDatasets`. */
export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

const CONFIDENCE_LEVELS = new Set(['High', 'Medium', 'Low', 'Proxy']);
const ANALOGUE_CURRENCIES = new Set(['RUB', 'USD']);
const REQUIRED_COEFFICIENT_SECTIONS = [
  'employer_burden_ru',
  'employer_burden_kz',
  'productive_hours',
  'workplace',
  'contingency_policy',
] as const;

function issue(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ValidationIssue['severity'] = 'error',
): void {
  issues.push({ code, severity, path, message });
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function yearOf(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})/.exec(value.trim());
  return match?.[1] === undefined ? null : Number(match[1]);
}

function roleIdsOf(rateCards: RateCardsFile): Set<string> {
  return new Set(
    asArray<RoleCard>(rateCards?.roles)
      .map((role) => role.role_id)
      .filter(isNonEmptyString),
  );
}

function validateRateCards(data: Datasets, issues: ValidationIssue[]): Set<string> {
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

function validateContractorRates(data: Datasets, issues: ValidationIssue[]): void {
  const bands = asArray<ContractorBand>(data.contractorRates?.bands);
  if (bands.length !== 224) {
    issue(issues, 'CONTRACTOR_BAND_COUNT', 'contractorRates.bands', `expected 224 bands, got ${bands.length}`);
  }

  bands.forEach((band, index) => {
    const bandPath = `contractorRates.bands[${index}]`;
    const ordered =
      isFiniteNumber(band.rate_low) &&
      isFiniteNumber(band.rate_mid) &&
      isFiniteNumber(band.rate_high) &&
      band.rate_low <= band.rate_mid &&
      band.rate_mid <= band.rate_high;
    if (!ordered) {
      issue(issues, 'RATE_BAND_ORDER', `${bandPath}.rate_mid`, 'expected rate_low <= rate_mid <= rate_high');
    }
    if (band.vat_included !== false) {
      issue(issues, 'VAT_FLAG', `${bandPath}.vat_included`, 'expected vat_included === false');
    }
    if (!isNonEmptyString(band.role_id)) {
      issue(issues, 'CONTRACTOR_ROLE_MISSING', `${bandPath}.role_id`, 'role_id must be non-empty');
    }
    if (!isNonEmptyString(band.grade)) {
      issue(issues, 'CONTRACTOR_GRADE_MISSING', `${bandPath}.grade`, 'grade must be non-empty');
    }
  });
}

function validateArchetypes(data: Datasets, issues: ValidationIssue[], roleIds: Set<string>): void {
  const archetypes = asArray<Archetype>(data.archetypes?.archetypes);
  if (archetypes.length !== 22) {
    issue(issues, 'ARCHETYPE_COUNT', 'archetypes.archetypes', `expected 22 archetypes, got ${archetypes.length}`);
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

function validateAnalogues(data: Datasets, issues: ValidationIssue[]): void {
  const analogues = asArray<AnalogueRow>(data.analogues?.analogues);
  if (analogues.length !== 49) {
    issue(issues, 'ANALOGUE_COUNT', 'analogues.analogues', `expected 49 analogues, got ${analogues.length}`);
  }
  const tmkRows = asArray<unknown>(data.analogues?.tmk_eis_rows);
  if (tmkRows.length !== 60) {
    issue(issues, 'ANALOGUE_TMK_COUNT', 'analogues.tmk_eis_rows', `expected 60 tmk_eis_rows, got ${tmkRows.length}`);
  }

  analogues.forEach((analogue, index) => {
    const analoguePath = `analogues.analogues[${index}]`;
    if (!isNonEmptyString(analogue.source)) {
      issue(issues, 'ANALOGUE_SOURCE_MISSING', `${analoguePath}.source`, 'source must be non-empty');
    }

    const { price_low: low, price_mid: mid, price_high: high } = analogue;
    if (low !== null && low !== undefined && mid !== null && mid !== undefined && high !== null && high !== undefined) {
      if (!(isFiniteNumber(low) && isFiniteNumber(mid) && isFiniteNumber(high) && low <= mid && mid <= high)) {
        issue(issues, 'ANALOGUE_PRICE_ORDER', `${analoguePath}.price_mid`, 'expected price_low <= price_mid <= price_high');
      }
    }
    if (!ANALOGUE_CURRENCIES.has(analogue.currency)) {
      issue(issues, 'ANALOGUE_CURRENCY_INVALID', `${analoguePath}.currency`, `unsupported currency "${String(analogue.currency)}"`);
    }
  });
}

function validateCoefficients(data: Datasets, issues: ValidationIssue[]): void {
  REQUIRED_COEFFICIENT_SECTIONS.forEach((section) => {
    if (!isRecord(data.coefficients?.[section])) {
      issue(issues, 'COEFFICIENT_SECTION_MISSING', `coefficients.${section}`, `missing coefficients section "${section}"`);
    }
  });
}

function validateContracts(data: Datasets, issues: ValidationIssue[]): void {
  const contracts = asArray<TmkContract>(data.contracts);
  if (contracts.length !== 60) {
    issue(issues, 'CONTRACT_COUNT', 'contracts', `expected 60 contracts, got ${contracts.length}`);
  }

  contracts.forEach((contract, index) => {
    const contractPath = `contracts[${index}]`;
    if (!(isFiniteNumber(contract.price_rub) && contract.price_rub > 0)) {
      issue(issues, 'CONTRACT_PRICE_INVALID', `${contractPath}.price_rub`, 'expected price_rub > 0');
    }
    if (!isNonEmptyString(contract.source_url)) {
      issue(issues, 'CONTRACT_SOURCE_URL_MISSING', `${contractPath}.source_url`, 'source_url must be non-empty');
    }
  });
}

function checkConfidence(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value === 'string' && !CONFIDENCE_LEVELS.has(value)) {
    issue(issues, 'CONFIDENCE_UNKNOWN', path, `confidence "${value}" is not one of High, Medium, Low, Proxy`, 'warning');
  }
}

function checkName(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isNonEmptyString(value)) {
    issue(issues, 'EMPTY_NAME', path, 'expected a non-empty name/title', 'warning');
  }
}

function checkStaleDate(value: unknown, path: string, issues: ValidationIssue[]): void {
  const year = yearOf(value);
  if (year !== null && year < 2020) {
    issue(issues, 'STALE_DATE', path, `date year ${year} is older than 2020`, 'warning');
  }
}

function validateWarnings(data: Datasets, issues: ValidationIssue[]): void {
  asArray<RoleCard>(data.rateCards?.roles).forEach((role, index) => {
    const path = `rateCards.roles[${index}]`;
    checkName(role.role_ru, `${path}.role_ru`, issues);
    checkName(role.role_en, `${path}.role_en`, issues);
    checkConfidence(role.confidence, `${path}.confidence`, issues);
    asArray<GradeRow>(role.grades).forEach((grade, gradeIndex) => {
      checkConfidence(grade.confidence, `${path}.grades[${gradeIndex}].confidence`, issues);
    });
  });

  asArray<ContractorBand>(data.contractorRates?.bands).forEach((band, index) => {
    checkConfidence(band.confidence, `contractorRates.bands[${index}].confidence`, issues);
  });

  asArray<Archetype>(data.archetypes?.archetypes).forEach((archetype, index) => {
    const path = `archetypes.archetypes[${index}]`;
    checkName(archetype.name_ru, `${path}.name_ru`, issues);
    checkName(archetype.name_en, `${path}.name_en`, issues);
    checkConfidence(archetype.confidence, `${path}.confidence`, issues);
  });

  asArray<AnalogueRow>(data.analogues?.analogues).forEach((analogue, index) => {
    const path = `analogues.analogues[${index}]`;
    checkName(analogue.title, `${path}.title`, issues);
    checkStaleDate(analogue.year, `${path}.year`, issues);
    checkConfidence(analogue.confidence, `${path}.confidence`, issues);
  });

  asArray<Record<string, unknown>>(data.analogues?.tmk_eis_rows).forEach((row, index) => {
    const path = `analogues.tmk_eis_rows[${index}]`;
    checkStaleDate(row.date_published, `${path}.date_published`, issues);
    checkConfidence(row.confidence, `${path}.confidence`, issues);
  });

  asArray<TmkContract>(data.contracts).forEach((contract, index) => {
    const path = `contracts[${index}]`;
    checkName(contract.subject_short, `${path}.subject_short`, issues);
    checkStaleDate(contract.start_date, `${path}.start_date`, issues);
    checkConfidence(contract.confidence, `${path}.confidence`, issues);
  });
}

/**
 * Validates every loaded dataset and returns all findings. The function never
 * throws for data problems: callers receive an (possibly empty) issue list and
 * decide how to surface it.
 */
export function validateDatasets(data: Datasets): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const roleIds = validateRateCards(data, issues);
  validateContractorRates(data, issues);
  validateArchetypes(data, issues, roleIds);
  validateAnalogues(data, issues);
  validateCoefficients(data, issues);
  validateContracts(data, issues);
  validateWarnings(data, issues);
  return issues;
}
