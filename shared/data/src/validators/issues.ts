/** Shared validation types, guards and the cross-dataset checks. */

import type {
  Datasets,
  RateCardsFile,
  RoleCard,
  TmkContract,
} from '../types.js';

/** A single structural or data-quality finding produced by `validateDatasets`. */
export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

export const CONFIDENCE_LEVELS = new Set(['High', 'Medium', 'Low', 'Proxy']);
export const ANALOGUE_CURRENCIES = new Set(['RUB', 'USD']);
export const REQUIRED_COEFFICIENT_SECTIONS = [
  'employer_burden_ru',
  'employer_burden_kz',
  'productive_hours',
  'workplace',
  'contingency_policy',
] as const;

export function issue(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ValidationIssue['severity'] = 'error',
): void {
  issues.push({ code, severity, path, message });
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function yearOf(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})/.exec(value.trim());
  return match?.[1] === undefined ? null : Number(match[1]);
}

export function roleIdsOf(rateCards: RateCardsFile): Set<string> {
  return new Set(
    asArray<RoleCard>(rateCards?.roles)
      .map((role) => role.role_id)
      .filter(isNonEmptyString),
  );
}

export function validateCoefficients(data: Datasets, issues: ValidationIssue[]): void {
  REQUIRED_COEFFICIENT_SECTIONS.forEach((section) => {
    if (!isRecord(data.coefficients?.[section])) {
      issue(issues, 'COEFFICIENT_SECTION_MISSING', `coefficients.${section}`, `missing coefficients section "${section}"`);
    }
  });
}

export function validateContracts(data: Datasets, issues: ValidationIssue[]): void {
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

export function checkConfidence(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value === 'string' && !CONFIDENCE_LEVELS.has(value)) {
    issue(issues, 'CONFIDENCE_UNKNOWN', path, `confidence "${value}" is not one of High, Medium, Low, Proxy`, 'warning');
  }
}

export function checkName(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isNonEmptyString(value)) {
    issue(issues, 'EMPTY_NAME', path, 'expected a non-empty name/title', 'warning');
  }
}

export function checkStaleDate(value: unknown, path: string, issues: ValidationIssue[]): void {
  const year = yearOf(value);
  if (year !== null && year < 2020) {
    issue(issues, 'STALE_DATE', path, `date year ${year} is older than 2020`, 'warning');
  }
}
