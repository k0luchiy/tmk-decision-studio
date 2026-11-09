/**
 * Contractor cost (`docs/03_estimation_model.md` §5.2).
 *
 * Labour is priced from `contractor_rate_cards.json` by `(geo, role_id, grade)`
 * using the band midpoint (`rate_mid`). No role multiplier and no FX conversion
 * are applied: only RU quotes are priced here, other geos raise
 * {@link UnsupportedGeoError} instead of being silently converted.
 *
 * The contract model drives the risk premium: `fixed_price` adds a scope-risk
 * load (20 % by default), while `t_and_m` and `dedicated_team` do not. Fixed
 * overheads are separate lines so the UI can show a formula tree. The function
 * is pure and deterministic; invalid input raises `RangeError`, a missing band
 * raises {@link MissingBandError}.
 */

import type { CostLine, Grade } from '@app/contract';
import type { ContractorBand } from '@app/data';

/** Raised when no band exists for a `(geo, role, grade)` triple. */
export class MissingBandError extends Error {
  readonly roleId: string;
  readonly grade: Grade;
  readonly geo: string;
  readonly code = 'MISSING_BAND' as const;

  constructor(roleId: string, grade: Grade, geo: string) {
    super(`No contractor band for role "${roleId}" grade "${grade}" geo "${geo}"`);
    this.name = 'MissingBandError';
    this.roleId = roleId;
    this.grade = grade;
    this.geo = geo;
  }
}

/** Raised when the caller asks for a geo the model does not price (no FX). */
export class UnsupportedGeoError extends Error {
  readonly geo: string;
  readonly code = 'UNSUPPORTED_GEO' as const;

  constructor(geo: string) {
    super(`Contractor geo "${geo}" is not supported; only RU is priced (no FX conversion)`);
    this.name = 'UnsupportedGeoError';
    this.geo = geo;
  }
}

/** Geos present in the dataset; only `RU` is priced here. */
export type ContractorGeo = 'RU' | 'KZ' | 'IN' | 'PL';

/** Contract model switch. Only `fixed_price` changes the default risk load. */
export type ContractModel = 't_and_m' | 'fixed_price' | 'dedicated_team';

/** One role/grade effort bucket, in person-hours. */
export interface ContractorEffort {
  roleId: string;
  grade: Grade;
  hours: number;
}

/** Optional contractor pricing switches. Defaults are documented below. */
export interface ContractorOptions {
  /** Pricing geo. Only `RU` is supported (`docs/03_estimation_model.md` §5.2). */
  geo?: ContractorGeo;
  /** Contract model. Default `t_and_m`. */
  model?: ContractModel;
  /** Coordination overhead as a share of labour. Default `0.15`. */
  coordinationPct?: number;
  /** Acceptance / knowledge-transfer overhead as a share of labour. Default `0.05`. */
  acceptancePct?: number;
  /** Risk premium as a share of labour. Default `0.2` for `fixed_price`, else `0`. */
  riskLoadPct?: number;
  /** Add a 20 % VAT line when `true`. Default `false`. */
  vat?: boolean;
}

export interface ContractorInput {
  effortByRole: ContractorEffort[];
  bands: ContractorBand[];
  opts?: ContractorOptions;
}

/** Default coordination overhead (10–25 % band, midpoint is a project assumption). */
export const DEFAULT_COORDINATION_PCT = 0.15;
/** Default acceptance / knowledge-transfer overhead. */
export const DEFAULT_ACCEPTANCE_PCT = 0.05;
/** Default fixed-price risk premium (15–30 % band, 20 % chosen). */
export const DEFAULT_FIXED_PRICE_RISK_PCT = 0.2;
/** RU VAT rate (`research/10` §2-L4). */
export const VAT_RATE = 0.2;

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, got ${value}`);
  }
}

function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0, got ${value}`);
  }
}

function assertPercentage(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite percentage >= 0, got ${value}`);
  }
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return String(Number(value.toFixed(6)));
}

function bandRef(bandId: string): string {
  return `contractor_rate_cards:${bandId}`;
}

interface ResolvedBand {
  band: ContractorBand;
  rate: number;
}

function resolveBand(
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
interface EffortBucket {
  roleId: string;
  grade: Grade;
  hours: number;
  band: ContractorBand;
  rate: number;
}

function collectBuckets(input: ContractorInput, geo: string): EffortBucket[] {
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

/**
 * Builds the contractor cost lines (`docs/03_estimation_model.md` §5.2).
 *
 * Lines, in order:
 *
 * - `labor:<role>:<grade>`: `hours × rate_mid`, `status: 'fact'`.
 * - `coordination`: `Σlabor × coordinationPct` (default 15 %), group `coordination`.
 * - `acceptance`: `Σlabor × acceptancePct` (default 5 %), group `coordination`.
 * - `risk`: `Σlabor × riskLoadPct` (default 20 % only for `fixed_price`;
 *   omitted when the share is 0), group `risk`.
 * - `vat`: `(labor + coordination + acceptance + risk) × 20 %` when `vat` is
 *   `true`, group `vat`.
 *
 * @throws {UnsupportedGeoError} when `opts.geo` is not `RU` (no FX conversion).
 * @throws {MissingBandError} when a role/grade/geo triple has no band.
 * @throws {RangeError} when hours or percentages are invalid.
 */
export function costContractor(input: ContractorInput): CostLine[] {
  const opts = input.opts ?? {};
  const geo = opts.geo ?? 'RU';
  if (geo !== 'RU') {
    throw new UnsupportedGeoError(geo);
  }

  const model = opts.model ?? 't_and_m';
  const coordinationPct = opts.coordinationPct ?? DEFAULT_COORDINATION_PCT;
  const acceptancePct = opts.acceptancePct ?? DEFAULT_ACCEPTANCE_PCT;
  const riskLoadPct =
    opts.riskLoadPct ?? (model === 'fixed_price' ? DEFAULT_FIXED_PRICE_RISK_PCT : 0);

  assertPercentage('opts.coordinationPct', coordinationPct);
  assertPercentage('opts.acceptancePct', acceptancePct);
  assertPercentage('opts.riskLoadPct', riskLoadPct);

  const buckets = collectBuckets(input, geo);
  const lines: CostLine[] = buckets.map((bucket) => {
    const { roleId, grade, hours, band, rate } = bucket;
    const sourceId = bandRef(band.id);
    return {
      id: `labor:${roleId}:${grade}`,
      group: 'labor',
      label: `Труд подрядчика: ${band.role_ru} (${grade})`,
      formula: `${formatNumber(hours)} h × ${formatNumber(rate)} ₽/ч`,
      inputRefs: [sourceId],
      valueRub: hours * rate,
      sourceId,
      status: 'fact',
    };
  });

  if (buckets.length === 0) {
    return lines;
  }

  const laborTotal = lines.reduce((sum, line) => sum + line.valueRub, 0);
  const laborRefs = buckets.map((bucket) => bandRef(bucket.band.id));

  const coordination = laborTotal * coordinationPct;
  lines.push({
    id: 'coordination',
    group: 'coordination',
    label: `Координация (${formatNumber(coordinationPct * 100)} %)`,
    formula: `${formatNumber(laborTotal)} ₽ × ${formatNumber(coordinationPct)}`,
    inputRefs: laborRefs,
    valueRub: coordination,
    sourceId: 'assumption:coordination',
    status: 'assumption',
  });

  const acceptance = laborTotal * acceptancePct;
  lines.push({
    id: 'acceptance',
    group: 'coordination',
    label: `Приёмка и передача (${formatNumber(acceptancePct * 100)} %)`,
    formula: `${formatNumber(laborTotal)} ₽ × ${formatNumber(acceptancePct)}`,
    inputRefs: laborRefs,
    valueRub: acceptance,
    sourceId: 'assumption:acceptance',
    status: 'assumption',
  });

  const risk = laborTotal * riskLoadPct;
  if (riskLoadPct > 0) {
    lines.push({
      id: 'risk',
      group: 'risk',
      label: `Риск-премия (${formatNumber(riskLoadPct * 100)} %, ${model})`,
      formula: `${formatNumber(laborTotal)} ₽ × ${formatNumber(riskLoadPct)}`,
      inputRefs: laborRefs,
      valueRub: risk,
      sourceId: 'assumption:risk',
      status: 'assumption',
    });
  }

  if (opts.vat) {
    const vatBase = laborTotal + coordination + acceptance + risk;
    lines.push({
      id: 'vat',
      group: 'vat',
      label: `НДС (${formatNumber(VAT_RATE * 100)} %)`,
      formula: `${formatNumber(vatBase)} ₽ × ${formatNumber(VAT_RATE)}`,
      inputRefs: laborRefs,
      valueRub: vatBase * VAT_RATE,
      sourceId: 'assumption:vat',
      status: 'assumption',
    });
  }

  return lines;
}
