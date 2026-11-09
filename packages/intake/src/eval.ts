/**
 * Intake evaluation harness (`docs/06_jev_strategy.md` §7).
 *
 * Compares merged intake parameters against a manually labelled brief set
 * and reports:
 * - `workTypeAccuracy` — share of briefs with the expected work type;
 * - `flagsAccuracy` — per-flag accuracy across security/КИИ and mobile;
 * - `numberRecall` — share of labelled numbers the rules recovered.
 *
 * A brief without (complete) labels is reported as `missing_labels` and
 * excluded from every denominator, so nothing is ever divided by zero.
 */

import { z } from 'zod';
import type { MergedParam } from './merge.js';

/** Manual labels for one brief. Every field is optional so partial or
 * missing annotation is detectable at runtime. */
export const BriefLabelsSchema = z.object({
  workType: z.string().optional(),
  securityKii: z.boolean().optional(),
  mobile: z.boolean().optional(),
  flows: z.number().optional(),
  durationMonths: z.number().optional(),
});
export type BriefLabels = z.infer<typeof BriefLabelsSchema>;

/** One labelled brief in `data/eval/briefs.json`. */
export const EvalBriefSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  labels: BriefLabelsSchema.optional(),
});
export type EvalBrief = z.infer<typeof EvalBriefSchema>;

/** Parsed brief set. */
export const EvalBriefsSchema = z.array(EvalBriefSchema);

/** A classifier may return just params or a pipeline-like `{ params }`. */
export type EvalClassifierOutput = readonly MergedParam[] | { readonly params: readonly MergedParam[] };
export type EvalClassifier = (
  brief: string,
) => EvalClassifierOutput | Promise<EvalClassifierOutput>;

export interface EvalWorkTypeResult {
  expected: string;
  actual: string;
  match: boolean;
}

export interface EvalFlagResult {
  label: 'securityKii' | 'mobile';
  expected: boolean;
  actual: boolean | undefined;
  match: boolean;
}

export interface EvalNumberResult {
  label: 'flows' | 'durationMonths';
  expected: number;
  actual: number | undefined;
  match: boolean;
}

export interface EvalCaseResult {
  id: string;
  status: 'ok' | 'missing_labels';
  missingLabels: string[];
  workType?: EvalWorkTypeResult;
  flags: EvalFlagResult[];
  numbers: EvalNumberResult[];
}

export interface EvalReport {
  workTypeAccuracy: number;
  flagsAccuracy: number;
  numberRecall: number;
  total: number;
  perCase: EvalCaseResult[];
  /** Ids of briefs excluded because labels were absent/incomplete. */
  missing_labels: string[];
}

const WORK_TYPE_KEYS = ['work_type', 'workType'];
const FLAG_SPECS: { label: 'securityKii' | 'mobile'; keys: string[] }[] = [
  { label: 'securityKii', keys: ['security_kii', 'securityKii'] },
  { label: 'mobile', keys: ['mobile'] },
];
const NUMBER_SPECS: { label: 'flows' | 'durationMonths'; keys: string[] }[] = [
  { label: 'flows', keys: ['flows'] },
  { label: 'durationMonths', keys: ['duration'] },
];

function isParamsOutput(
  output: EvalClassifierOutput,
): output is { readonly params: readonly MergedParam[] } {
  return !Array.isArray(output) && typeof output === 'object' && output !== null && 'params' in output;
}

function toParams(output: EvalClassifierOutput): readonly MergedParam[] {
  return isParamsOutput(output) ? output.params : output;
}

function findParam(
  params: readonly MergedParam[],
  keys: readonly string[],
): MergedParam | undefined {
  const confirmed = params.find(
    (param) => keys.includes(param.key) && param.status === 'confirmed',
  );
  return confirmed ?? params.find((param) => keys.includes(param.key));
}

function missingLabelKeys(labels: BriefLabels | undefined): string[] {
  if (labels === undefined) return ['labels'];
  const missing: string[] = [];
  if (labels.workType === undefined) missing.push('workType');
  if (labels.securityKii === undefined) missing.push('securityKii');
  if (labels.mobile === undefined) missing.push('mobile');
  return missing;
}

function readNumber(
  params: readonly MergedParam[],
  label: 'flows' | 'durationMonths',
): number | undefined {
  const spec = NUMBER_SPECS.find((candidate) => candidate.label === label);
  if (spec === undefined) return undefined;
  const param = findParam(params, spec.keys);
  if (param === undefined || typeof param.value !== 'number') return undefined;
  if (label === 'durationMonths' && param.unit === 'год') return param.value * 12;
  return param.value;
}

function ratio(hits: number, total: number): number {
  return total === 0 ? 0 : hits / total;
}

/**
 * Evaluate a classifier over labelled briefs. The classifier is awaited,
 * so both the rules-only and the async pipeline classifier work.
 */
export async function evaluateIntake(
  briefs: readonly EvalBrief[],
  classifyFn: EvalClassifier,
): Promise<EvalReport> {
  const perCase: EvalCaseResult[] = [];
  const missingIds: string[] = [];

  let workTypeTotal = 0;
  let workTypeHits = 0;
  let flagTotal = 0;
  let flagHits = 0;
  let numberTotal = 0;
  let numberHits = 0;

  for (const brief of briefs) {
    const params = toParams(await classifyFn(brief.text));
    const missing = missingLabelKeys(brief.labels);

    if (missing.length > 0) {
      perCase.push({
        id: brief.id,
        status: 'missing_labels',
        missingLabels: missing,
        flags: [],
        numbers: [],
      });
      missingIds.push(brief.id);
      continue;
    }

    const labels = brief.labels;
    if (labels === undefined) continue;

    const caseResult: EvalCaseResult = {
      id: brief.id,
      status: 'ok',
      missingLabels: [],
      flags: [],
      numbers: [],
    };

    if (labels.workType !== undefined) {
      const actual = findParam(params, WORK_TYPE_KEYS);
      const actualValue =
        actual !== undefined && typeof actual.value === 'string' ? actual.value : 'unknown';
      workTypeTotal += 1;
      if (actualValue === labels.workType) workTypeHits += 1;
      caseResult.workType = {
        expected: labels.workType,
        actual: actualValue,
        match: actualValue === labels.workType,
      };
    }

    for (const spec of FLAG_SPECS) {
      const expected = labels[spec.label];
      if (expected === undefined) continue;
      const param = findParam(params, spec.keys);
      const actual = param !== undefined ? Boolean(param.value) : undefined;
      const match = actual === expected;
      flagTotal += 1;
      if (match) flagHits += 1;
      caseResult.flags.push({ label: spec.label, expected, actual, match });
    }

    for (const spec of NUMBER_SPECS) {
      const expected = labels[spec.label];
      if (expected === undefined) continue;
      const actual = readNumber(params, spec.label);
      const match = actual === expected;
      numberTotal += 1;
      if (match) numberHits += 1;
      caseResult.numbers.push({ label: spec.label, expected, actual, match });
    }

    perCase.push(caseResult);
  }

  return {
    workTypeAccuracy: ratio(workTypeHits, workTypeTotal),
    flagsAccuracy: ratio(flagHits, flagTotal),
    numberRecall: ratio(numberHits, numberTotal),
    total: briefs.length,
    perCase,
    missing_labels: missingIds,
  };
}
