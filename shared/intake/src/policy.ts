/**
 * Deterministic policy for intake parameters.
 *
 * Jev returns probabilities, but not every field may be applied silently:
 * - classification fields can be accepted automatically when confidence is high;
 * - stage ownership is only a suggestion and needs a human confirmation;
 * - numbers and commercial settings stay rules-only / manual.
 */

import type { MergedParam } from './merge.js';

export type IntakeParamPolicy = 'auto' | 'suggest' | 'manual';

/** Minimum probability/confidence for an `auto` field to be applied. */
export const AUTO_ACCEPT_THRESHOLD = 0.75;

/** Categorical fields that may be applied without a separate confirmation. */
const AUTO_KEYS: ReadonlySet<string> = new Set([
  'work_type',
  'platform',
  'security_kii',
  'mobile',
  'has_integrations',
  'integrations_scale',
  'complexity',
  'greenfield',
  'has_scope_numbers',
]);

/** Hybrid ownership is a proposal, never an automatic decision. */
const SUGGEST_PREFIX = 'stage_owner_';

/** Policy for one parameter key. */
export function policyForParam(key: string): IntakeParamPolicy {
  if (key.startsWith(SUGGEST_PREFIX)) return 'suggest';
  if (AUTO_KEYS.has(key)) return 'auto';
  return 'manual';
}

/** A merged parameter plus the policy decision attached to it. */
export interface PolicyParam extends MergedParam {
  policy: IntakeParamPolicy;
  /** True when the value may be applied without a separate confirmation. */
  autoAccept: boolean;
  /** True for a Jev proposal that should be shown as a suggestion. */
  suggested: boolean;
}

/**
 * Attaches policy metadata to merged intake parameters.
 *
 * A value is auto-accepted only when it comes from rules/Jev, has no conflict,
 * and reaches the confidence threshold. Numbers and stage ownership never
 * qualify.
 */
export function applyIntakePolicy(
  params: readonly MergedParam[],
  threshold: number = AUTO_ACCEPT_THRESHOLD,
): PolicyParam[] {
  return params.map((param) => {
    const policy = policyForParam(param.key);
    const confidence = param.probability ?? param.confidence;
    const autoAccept =
      policy === 'auto' &&
      param.status === 'auto' &&
      param.conflictGroup === undefined &&
      (param.source === 'rules' || param.source === 'jev') &&
      confidence >= threshold;

    return {
      ...param,
      policy,
      autoAccept,
      suggested: policy === 'suggest',
    };
  });
}
