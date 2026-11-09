/** Raw shapes of `analogue_corpus.json`. */

import type { DatasetMeta } from './misc.js';

export interface ScopeVector {
  [key: string]: number | boolean | string | null;
}

export interface AnalogueNormalization {
  fx_conversion_applied: boolean;
  inflation_adjustment_required: boolean;
  scope_normalized: boolean;
  note: string;
  [key: string]: unknown;
}

/** One published analogue in `analogue_corpus.json.analogues`. */
export interface AnalogueRow {
  id: string;
  project_type: string;
  title: string;
  year: number;
  price_low: number;
  price_mid: number;
  price_high: number;
  price_basis: string;
  source: string;
  source_date: string;
  confidence: string;
  scope_vector: ScopeVector;
  note: string;
  currency: string;
  vat_included: boolean | null;
  vat_note: string;
  effort_hours: number | null;
  normalized_rub_per_hour_low: number | null;
  normalized_rub_per_hour_high: number | null;
  related_amounts: Record<string, unknown>;
  open_ended: boolean;
  normalization: AnalogueNormalization;
  corpus_source: string;
  provenance_file: string;
  [key: string]: unknown;
}

/** One TMK/EIS registry row in `analogue_corpus.json.tmk_eis_rows`. */
export interface TmkEisRow {
  id: string;
  corpus_source: string;
  registry_number: string;
  customer: string;
  supplier: string | null;
  subject: string;
  primary_type: string;
  subtype: string | null;
  okpd2_derived: string;
  price_rub: number;
  price_type: string;
  currency: string;
  vat_included: boolean | null;
  vat_note: string;
  date_published: string;
  duration_months_stated: number | null;
  source_url: string;
  provenance_file: string;
  scrape_date: string;
  scope_notes: string;
  confidence: string;
  [key: string]: unknown;
}

export interface AnalogueCorpusFile {
  meta: DatasetMeta;
  analogues: AnalogueRow[];
  tmk_eis_schema_stub: Record<string, unknown>;
  tmk_eis_rows: TmkEisRow[];
  merge_status: Record<string, unknown>;
  analogue_count: number;
  [key: string]: unknown;
}
