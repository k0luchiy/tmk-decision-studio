/**
 * Raw shapes of the files in `research/data/`.
 *
 * These interfaces describe the dataset files as published. They intentionally
 * stay separate from the entity schemas in `@app/contract`: the contract models
 * the normalised domain, while these types mirror the on-disk rows so loaders
 * can expose them without rewriting or losing provenance fields.
 */

/** Free-form provenance block shared by the `<dataset>.json` files. */
export interface DatasetMeta {
  schema_version?: string;
  file?: string;
  generated?: string;
  title?: string;
  purpose?: string;
  currency_policy?: string;
  period?: string;
  [key: string]: unknown;
}

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

export interface ThreePoint {
  optimistic: number;
  most_likely: number;
  pessimistic: number;
  [key: string]: unknown;
}

export interface ProductivityBasis {
  method: string;
  derivation: string;
  sources: string[];
  confidence: string;
  [key: string]: unknown;
}

export interface ComplexityDriver {
  driver: string;
  rating: string;
  multiplier: number;
  effect: string;
  source: string;
  confidence: string;
  [key: string]: unknown;
}

export interface UnitCountRange {
  low: number;
  mid: number;
  high: number;
  [key: string]: unknown;
}

export interface PertSummary {
  expected_hours: number;
  sigma_hours: number;
  formula: string;
  source: string;
  [key: string]: unknown;
}

/** One archetype in `work_archetypes.json.archetypes`. */
export interface Archetype {
  id: string;
  name_ru: string;
  name_en: string;
  category: string;
  unit: string;
  unit_definition: string;
  p50_hours_per_unit: number;
  three_point: ThreePoint;
  productivity_basis: ProductivityBasis;
  default_role_mix_pct: Record<string, number>;
  complexity_drivers: ComplexityDriver[];
  risk_template_ids: string[];
  typical_unit_count: UnitCountRange;
  secondary_units: Record<string, unknown>[];
  notes: string;
  pert: PertSummary;
  risk_templates: Record<string, unknown>[];
  confidence: string;
  source: string;
  provenance_file: string;
  [key: string]: unknown;
}

export interface WorkArchetypesFile {
  meta: DatasetMeta;
  role_ids: string[];
  archetypes: Archetype[];
  risk_library: Record<string, unknown>;
  archetype_count: number;
  [key: string]: unknown;
}

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

/** `coefficients.json` is organised as named sections, one object per topic. */
export interface CoefficientsFile {
  meta: DatasetMeta;
  employer_burden_ru: Record<string, unknown>;
  employer_burden_kz: Record<string, unknown>;
  productive_hours: Record<string, unknown>;
  workplace: Record<string, unknown>;
  coordination_overhead: Record<string, unknown>;
  vendor_margin: Record<string, unknown>;
  contingency_policy: Record<string, unknown>;
  wacc: Record<string, unknown>;
  inflation: Record<string, unknown>;
  taxes: Record<string, unknown>;
  grade_ratios: Record<string, unknown>;
  productivity_norms: Record<string, unknown>;
  size_units: Record<string, unknown>;
  risk_and_overrun_priors: Record<string, unknown>;
  fx_policy: Record<string, unknown>;
  sensitivity_policy: Record<string, unknown>;
  [key: string]: unknown;
}

/** One row in `tmk_it_contracts.json` (a top-level array). */
export interface TmkContract {
  customer: string;
  okpd2: string;
  subject_short: string;
  price_rub: number;
  vat_incl: string;
  start_date: string;
  duration_months: number | null;
  supplier: string;
  source_url: string;
  scrape_date: string;
  scope_notes: string;
  confidence: string;
  [key: string]: unknown;
}

export interface ManifestFileEntry {
  path: string;
  sha256: string;
  rows: number;
  generatedAt: string;
  source: string;
}

export interface DatasetManifest {
  files: ManifestFileEntry[];
  datasetVersion: string;
  generatedAt: string;
}

/** Everything `loadDatasets` returns. `manifest` is `null` until it is built. */
export interface LoadedDatasets {
  rateCards: RateCardsFile;
  contractorRates: ContractorRateCardsFile;
  archetypes: WorkArchetypesFile;
  analogues: AnalogueCorpusFile;
  coefficients: CoefficientsFile;
  contracts: TmkContract[];
  manifest: DatasetManifest | null;
}

export type Datasets = LoadedDatasets;
