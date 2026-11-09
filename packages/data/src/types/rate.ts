/** Raw shapes of `rate_cards.json`. */

import type { DatasetMeta } from './misc.js';

export interface AlternativeSource {
  value: number;
  role: string;
  source: string;
  source_date: string;
  [key: string]: unknown;
}

/** One grade row inside `rate_cards.json[].grades`. */
export interface GradeRow {
  grade: string;
  grade_label: string;
  grade_ratio: number;
  grade_scale_vs_anchor: number;
  net_month: number;
  ndfl_month: number;
  gross_month: number;
  employer_contrib_month: number;
  employer_contrib_effective_pct: number;
  employer_payroll_month: number;
  employer_payroll_multiplier_vs_gross: number;
  overhead_multiplier: number;
  overhead_month: number;
  office_month: number;
  hardware_month: number;
  software_month: number;
  workplace_month: number;
  fully_loaded_month: number;
  fully_loaded_multiplier_vs_net: number;
  productive_hours_month: number;
  fully_loaded_hour: number;
  confidence: string;
  source: string;
  source_date: string;
  provenance_file: string;
  derivation: string;
  [key: string]: unknown;
}

/** One role card in `rate_cards.json.roles`. */
export interface RoleCard {
  role_id: string;
  role_ru: string;
  role_en: string;
  anchor_grade: string;
  base_net_month: number;
  source: string;
  source_date: string;
  source_basis: string;
  confidence: string;
  note: string;
  alternative_sources: AlternativeSource[];
  grades: GradeRow[];
  [key: string]: unknown;
}

export interface RateCardsFile {
  meta: DatasetMeta;
  roles: RoleCard[];
  [key: string]: unknown;
}
