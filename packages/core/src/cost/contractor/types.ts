/** Public types, errors and constants for the contractor cost model. */

import type { Grade } from '@app/contract';
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
