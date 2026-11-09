/** Provenance, coefficients, contracts and the aggregate dataset shapes. */

import type { AnalogueCorpusFile } from './analogue.js';
import type { WorkArchetypesFile } from './archetype.js';
import type { ContractorRateCardsFile } from './contractor.js';
import type { RateCardsFile } from './rate.js';

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
