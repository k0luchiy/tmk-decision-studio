/** Raw shapes of `contractor_rate_cards.json`. */

import type { DatasetMeta } from './misc.js';

export interface MarketGradeBand {
  low: number;
  mid: number;
  high: number;
  open_ended: boolean;
  source: string;
  source_date: string;
  confidence: string;
  note: string;
  [key: string]: unknown;
}

/** One row in `contractor_rate_cards.json.bands`. */
export interface ContractorBand {
  id: string;
  geo: string;
  region_label: string;
  role_id: string;
  role_ru: string;
  grade: string;
  currency: string;
  unit: string;
  rate_low: number;
  rate_mid: number;
  rate_high: number;
  open_ended: boolean;
  market_grade_band: MarketGradeBand;
  role_specific_override: boolean;
  rate_source: string;
  rate_source_date: string;
  rate_basis_note: string;
  pricing_basis: string[];
  default_basis: string;
  fixed_price_risk_load_pct: number[];
  fixed_price_risk_load_source: string;
  vat_included: boolean;
  vat_rate_pct: number;
  vat_flag: string;
  vat_note: string;
  source: string;
  source_date: string;
  confidence: string;
  note: string;
  [key: string]: unknown;
}

export interface ContractorRoleRef {
  role_id: string;
  role_ru: string;
  [key: string]: unknown;
}

export interface DedicatedTeamRow {
  id: string;
  geo: string;
  team_size: number;
  grade: string;
  currency: string;
  unit: string;
  price_low: number;
  price_mid: number;
  price_high: number;
  basis: string;
  vat_included: boolean;
  vat_rate_pct: number;
  source: string;
  source_date: string;
  confidence: string;
  note: string;
  [key: string]: unknown;
}

export interface ContractorRateCardsFile {
  meta: DatasetMeta;
  roles: ContractorRoleRef[];
  grades: string[];
  regions: Record<string, unknown>;
  bands: ContractorBand[];
  dedicated_team_monthly: DedicatedTeamRow[];
  row_count: number;
  [key: string]: unknown;
}
