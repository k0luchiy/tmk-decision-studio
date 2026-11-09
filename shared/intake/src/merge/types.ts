/** Public shapes of the rules + Jev merge. */

import type { ExtractedParam as ContractExtractedParam, JevAnswer } from '@app/contract';

/** Where a merged parameter came from. */
export type ParamSource = 'rules' | 'jev';

/**
 * A parameter ready for the review table. It is a contract
 * `ExtractedParam` plus provenance (`source`), an optional review
 * conflict group and the Jev probability that produced the row.
 */
export interface MergedParam extends ContractExtractedParam {
  source: ParamSource;
  conflictGroup?: string;
  probability?: number;
}

/** Confidence accepted on the rules side: numeric 0..1 or a level name. */
export type InputConfidence = number | 'high' | 'medium' | 'low';

/**
 * Rules parameter as consumed by the merge. It is structurally compatible
 * with both `@app/contract`'s `ExtractedParam` (numeric confidence) and
 * `./rules`'s `ExtractedParam` (level-name confidence).
 */
export interface RuleParamInput {
  key: string;
  value: ContractExtractedParam['value'];
  unit?: string;
  confidence?: InputConfidence;
  quote?: string;
  status?: ContractExtractedParam['status'];
  defaultUsed?: boolean;
  source?: ParamSource;
}

/** Rules input: extracted params plus the keyword classification. */
export interface RulesMergeInput {
  params: readonly RuleParamInput[];
  classification: {
    workType: string;
    platform: string;
  };
}

/** Full input for {@link mergeIntake}. */
export interface MergeInput {
  rules: RulesMergeInput;
  jev: readonly JevAnswer[];
}

export const CONFIDENCE_BY_LEVEL: Record<Exclude<InputConfidence, number>, number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};
