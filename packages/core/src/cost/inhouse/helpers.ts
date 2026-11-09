/** Rate resolution, validation and bucket folding for the in-house model. */

import type { Grade } from '@app/contract';
import type { GradeRow, RoleCard } from '@app/data';
import { MissingRateError, type EffortByRole, type InhouseInput } from './types.js';

export function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, got ${value}`);
  }
}

export function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0, got ${value}`);
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const rounded = Number(value.toFixed(6));
  return String(rounded);
}

export function rateRef(roleId: string, grade: Grade): string {
  return `rate_cards:${roleId}:${grade}`;
}

interface ResolvedRate {
  role: RoleCard;
  gradeRow: GradeRow;
}

export function resolveRate(rateCards: RoleCard[], roleId: string, grade: Grade): ResolvedRate {
  const role = rateCards.find((card) => card.role_id === roleId);
  const gradeRow = role?.grades.find((row) => row.grade === grade);
  if (!role || !gradeRow) {
    throw new MissingRateError(roleId, grade);
  }
  assertFinitePositive(`rate_cards.${roleId}.${grade}.fully_loaded_hour`, gradeRow.fully_loaded_hour);
  assertFinitePositive(
    `rate_cards.${roleId}.${grade}.fully_loaded_month`,
    gradeRow.fully_loaded_month,
  );
  return { role, gradeRow };
}

/** A unique effort bucket with its resolved rate, in input order. */
export interface EffortBucket {
  roleId: string;
  grade: Grade;
  hours: number;
  role: RoleCard;
  gradeRow: GradeRow;
}

export function collectBuckets(input: InhouseInput): EffortBucket[] {
  const seen = new Map<string, EffortBucket>();
  const order: string[] = [];

  for (const entry of input.effortByRole) {
    assertFiniteNonNegative(`effortByRole.${entry.roleId}.${entry.grade}.hours`, entry.hours);
    const key = `${entry.roleId}:${entry.grade}`;
    const bucket = seen.get(key);
    if (bucket) {
      bucket.hours += entry.hours;
      continue;
    }
    const { role, gradeRow } = resolveRate(input.rateCards, entry.roleId, entry.grade);
    seen.set(key, {
      roleId: entry.roleId,
      grade: entry.grade,
      hours: entry.hours,
      role,
      gradeRow,
    });
    order.push(key);
  }

  return order.map((key) => {
    const bucket = seen.get(key);
    if (!bucket) {
      // Unreachable: `order` only contains keys inserted into `seen`.
      throw new Error(`Internal error: missing bucket ${key}`);
    }
    return bucket;
  });
}

export type { EffortByRole };
