/**
 * Merge deterministic rules with Jev classification hints.
 *
 * Per `docs/06_jev_strategy.md` §5.2/§6:
 * - numbers (flows, duration, users, screens, …) come only from rules;
 * - Jev fills `work_type` / `platform` / flags when rules say `unknown`;
 * - a disagreement between two known values produces two rows with the
 *   same `conflictGroup` and `status: 'auto'` — the human picks one;
 * - nothing reaches the calculation until `confirmParam` marks it.
 */

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

const CONFIDENCE_BY_LEVEL: Record<Exclude<InputConfidence, number>, number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

function toConfidence(value: InputConfidence | undefined): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0.5;
    return Math.min(1, Math.max(0, value));
  }
  if (value === undefined) return 0.5;
  return CONFIDENCE_BY_LEVEL[value];
}

function isUnknown(value: ContractExtractedParam['value']): boolean {
  return typeof value === 'string' && (value.trim() === '' || value === 'unknown');
}

function fromRules(param: RuleParamInput): MergedParam {
  return {
    key: param.key,
    value: param.value,
    unit: param.unit ?? '',
    confidence: toConfidence(param.confidence),
    ...(param.quote === undefined ? {} : { quote: param.quote }),
    status: param.status ?? 'auto',
    defaultUsed: param.defaultUsed ?? false,
    source: 'rules',
  };
}

function categoryRows(
  key: string,
  rulesValue: string,
  jevValue: string | undefined,
  probability: number | undefined,
): MergedParam[] {
  const rulesKnown = !isUnknown(rulesValue);
  const jevKnown = jevValue !== undefined && !isUnknown(jevValue);

  if (rulesKnown && jevKnown && rulesValue !== jevValue) {
    return [
      {
        key,
        value: rulesValue,
        unit: '',
        confidence: 0.85,
        status: 'auto',
        defaultUsed: false,
        source: 'rules',
        conflictGroup: key,
      },
      {
        key,
        value: jevValue,
        unit: '',
        confidence: probability ?? 0.5,
        status: 'auto',
        defaultUsed: false,
        source: 'jev',
        probability: probability ?? 0,
        conflictGroup: key,
      },
    ];
  }

  if (rulesKnown) {
    return [
      {
        key,
        value: rulesValue,
        unit: '',
        confidence: 0.85,
        ...(probability === undefined ? {} : { probability }),
        status: 'auto',
        defaultUsed: false,
        source: 'rules',
      },
    ];
  }

  if (jevKnown && jevValue !== undefined) {
    return [
      {
        key,
        value: jevValue,
        unit: '',
        confidence: probability ?? 0.5,
        status: 'auto',
        defaultUsed: false,
        source: 'jev',
        probability: probability ?? 0,
      },
    ];
  }

  return [];
}

function jevString(answer: JevAnswer | undefined): string | undefined {
  if (answer === undefined) return undefined;
  return typeof answer.value === 'string' ? answer.value : undefined;
}

/**
 * Merge rules and Jev into a single, reviewable parameter list.
 *
 * Rules are always the base. Jev only adds or fills missing categories and
 * flags; a numeric rules parameter is never overwritten by Jev.
 */
export function mergeIntake(input: MergeInput): MergedParam[] {
  const result: MergedParam[] = [];
  const indexesByKey = new Map<string, number[]>();

  const push = (param: MergedParam): void => {
    const index = result.length;
    result.push(param);
    const indexes = indexesByKey.get(param.key);
    if (indexes === undefined) {
      indexesByKey.set(param.key, [index]);
    } else {
      indexes.push(index);
    }
  };

  for (const param of input.rules.params) {
    push(fromRules(param));
  }

  const jevByQuestion = new Map<string, JevAnswer>();
  for (const answer of input.jev) {
    jevByQuestion.set(answer.questionId, answer);
  }

  const categories: { key: string; questionId: string; rulesValue: string }[] = [
    { key: 'work_type', questionId: 'work_type', rulesValue: input.rules.classification.workType },
    { key: 'platform', questionId: 'platform', rulesValue: input.rules.classification.platform },
  ];

  for (const category of categories) {
    if (indexesByKey.has(category.key)) continue;
    const answer = jevByQuestion.get(category.questionId);
    for (const row of categoryRows(
      category.key,
      category.rulesValue,
      jevString(answer),
      answer?.probability,
    )) {
      push(row);
    }
  }

  for (const answer of input.jev) {
    if (answer.questionId === 'work_type' || answer.questionId === 'platform') continue;

    const key = answer.questionId;
    const indexes = indexesByKey.get(key);

    if (indexes === undefined || indexes.length === 0) {
      push({
        key,
        value: answer.value,
        unit: '',
        confidence: answer.probability,
        status: 'auto',
        defaultUsed: false,
        source: 'jev',
        probability: answer.probability,
      });
      continue;
    }

    const firstIndex = indexes[0];
    if (firstIndex === undefined) continue;
    const existing = result[firstIndex];
    if (existing === undefined) continue;

    if (existing.value === answer.value) continue;
    // Numbers are rules-only: Jev never overrides a numeric extraction.
    if (typeof existing.value === 'number' && typeof answer.value === 'number') continue;

    if (isUnknown(existing.value)) {
      result[firstIndex] = {
        key,
        value: answer.value,
        unit: existing.unit,
        confidence: answer.probability,
        status: 'auto',
        defaultUsed: false,
        source: 'jev',
        probability: answer.probability,
      };
      continue;
    }

    result[firstIndex] = { ...existing, conflictGroup: key };
    push({
      key,
      value: answer.value,
      unit: '',
      confidence: answer.probability,
      status: 'auto',
      defaultUsed: false,
      source: 'jev',
      probability: answer.probability,
      conflictGroup: key,
    });
  }

  return result;
}

/**
 * Confirm a parameter by key (and optionally by value when two conflict
 * rows share the key). Confirming one side of a conflict rejects the other
 * side and clears the conflict group.
 */
export function confirmParam(
  params: readonly MergedParam[],
  key: string,
  value?: ContractExtractedParam['value'],
): MergedParam[] {
  const matches = new Set<MergedParam>();
  for (const param of params) {
    if (param.key !== key) continue;
    if (value !== undefined && param.value !== value) continue;
    matches.add(param);
  }

  if (matches.size === 0) {
    return params.map((param) => ({ ...param }));
  }

  const clearedGroups = new Set<string>();
  for (const param of matches) {
    if (param.conflictGroup !== undefined) clearedGroups.add(param.conflictGroup);
  }

  return params.map((param) => {
    if (matches.has(param)) {
      return {
        ...param,
        value: value ?? param.value,
        status: 'confirmed',
        conflictGroup: undefined,
      };
    }
    if (param.conflictGroup !== undefined && clearedGroups.has(param.conflictGroup)) {
      return { ...param, status: 'rejected', conflictGroup: undefined };
    }
    return { ...param };
  });
}

/** True when every parameter has been confirmed by a human. */
export function allConfirmed(params: readonly MergedParam[]): boolean {
  return params.every((param) => param.status === 'confirmed');
}
