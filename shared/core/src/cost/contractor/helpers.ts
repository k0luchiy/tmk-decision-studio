/** Band resolution, validation and bucket folding for the contractor model. */

import type { Grade } from '@app/contract';
import type { ContractorBand } from '@app/data';
import { MissingBandError, type ContractorInput } from './types.js';

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

export function assertPercentage(name: string, value: number, max?: number): void {
  if (!Number.isFinite(value) || value < 0 || (max !== undefined && value > max)) {
    const bound = max === undefined ? '>= 0' : `in [0, ${max}]`;
    throw new RangeError(`${name} must be a finite percentage ${bound}, got ${value}`);
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return String(Number(value.toFixed(6)));
}

export function bandRef(bandId: string): string {
  return `contractor_rate_cards:${bandId}`;
}

interface ResolvedBand {
  band: ContractorBand;
  rate: number;
}

export function resolveBand(
  bands: ContractorBand[],
  geo: string,
  roleId: string,
  grade: Grade,
): ResolvedBand {
  const band = bands.find(
    (candidate) =>
      candidate.geo === geo && candidate.role_id === roleId && candidate.grade === grade,
  );
  if (!band) {
    throw new MissingBandError(roleId, grade, geo);
  }
  assertFinitePositive(`contractor_rate_cards.${band.id}.rate_mid`, band.rate_mid);
  return { band, rate: band.rate_mid };
}

/** A unique effort bucket with its resolved band, in input order. */
export interface EffortBucket {
  roleId: string;
  grade: Grade;
  hours: number;
  band: ContractorBand;
  rate: number;
}

export function collectBuckets(input: ContractorInput, geo: string): EffortBucket[] {
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
    const { band, rate } = resolveBand(input.bands, geo, entry.roleId, entry.grade);
    seen.set(key, {
      roleId: entry.roleId,
      grade: entry.grade,
      hours: entry.hours,
      band,
      rate,
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
