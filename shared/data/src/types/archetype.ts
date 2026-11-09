/** Raw shapes of `work_archetypes.json`. */

import type { DatasetMeta } from './misc.js';

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
