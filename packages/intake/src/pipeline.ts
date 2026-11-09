/**
 * Intake pipeline: rules → optional Jev (live/cache) → merged parameters.
 *
 * Modes (`docs/06_jev_strategy.md` §5.3):
 * - `off`   — deterministic rules only;
 * - `cache` — replay cached Jev answers by brief hash, rules on a miss;
 * - `live`  — call Jev, fall back to rules on any error.
 *
 * The function never throws because of Jev: a missing key, network error
 * or malformed response always degrades to the `rules` status.
 */

import type { JevAnswer } from '@app/contract';
import { getCached, sha256 } from './cache.js';
import { classifyWithJev } from './jev/adapter.js';
import { mergeIntake, type MergedParam, type RuleParamInput } from './merge.js';
import { classify, extract } from './rules/index.js';

/** Default cache file, relative to the process working directory. */
export const DEFAULT_CACHE_FILE = 'data/cache/jev-responses.json';

/** Default mode used when neither options nor `INTAKE_MODE` set one. */
export const DEFAULT_INTAKE_MODE = 'cache';

/** Intake modes as described in the strategy doc. */
export type IntakeMode = 'off' | 'cache' | 'live';

/** Where the final parameter set came from. */
export type IntakeStatus = 'rules' | 'jev-cache' | 'jev-live';

/** Options for {@link classifyBrief}. */
export interface ClassifyBriefOptions {
  /** Overrides `INTAKE_MODE` (default: `cache`). */
  mode?: IntakeMode;
  /** Cache file path (default: {@link DEFAULT_CACHE_FILE}). */
  cacheFile?: string;
  /** Jev API key for `live` (falls back to `OPENCODE_API_KEY`). */
  apiKey?: string;
  /** Request deadline for `live`, milliseconds. */
  timeoutMs?: number;
}

/** Result of {@link classifyBrief}. */
export interface ClassifyBriefResult {
  params: MergedParam[];
  status: IntakeStatus;
}

function isIntakeMode(value: string | undefined): value is IntakeMode {
  return value === 'off' || value === 'cache' || value === 'live';
}

/** Options win over `INTAKE_MODE`; unknown values fall back to `cache`. */
export function resolveIntakeMode(mode?: IntakeMode): IntakeMode {
  if (mode !== undefined) return mode;
  const env = process.env.INTAKE_MODE;
  return isIntakeMode(env) ? env : DEFAULT_INTAKE_MODE;
}

function rulesParams(brief: string): {
  params: RuleParamInput[];
  classification: { workType: string; platform: string };
} {
  const classification = classify(brief);
  const params: RuleParamInput[] = [
    ...extract(brief),
    { key: 'security_kii', value: classification.flags.securityKii, unit: '', confidence: 1 },
    { key: 'mobile', value: classification.flags.mobile, unit: '', confidence: 1 },
  ];

  return {
    params,
    classification: {
      workType: classification.workType,
      platform: classification.platform,
    },
  };
}

function mergeWith(brief: string, answers: readonly JevAnswer[]): MergedParam[] {
  const base = rulesParams(brief);
  return mergeIntake({
    rules: { params: base.params, classification: base.classification },
    jev: answers,
  });
}

/**
 * Classify a brief and return merged parameters plus the effective mode
 * (`rules`, `jev-cache` or `jev-live`).
 */
export async function classifyBrief(
  brief: string,
  opts: ClassifyBriefOptions = {},
): Promise<ClassifyBriefResult> {
  const mode = resolveIntakeMode(opts.mode);

  if (mode === 'off') {
    return { params: mergeWith(brief, []), status: 'rules' };
  }

  if (mode === 'cache') {
    const cacheFile = opts.cacheFile ?? DEFAULT_CACHE_FILE;
    const cached = getCached(cacheFile, sha256(brief));
    if (cached !== undefined) {
      return { params: mergeWith(brief, cached.answers), status: 'jev-cache' };
    }
    return { params: mergeWith(brief, []), status: 'rules' };
  }

  const result = await classifyWithJev(brief, {
    ...(opts.apiKey === undefined ? {} : { apiKey: opts.apiKey }),
    ...(opts.timeoutMs === undefined ? {} : { timeoutMs: opts.timeoutMs }),
  });

  if (result.error === undefined && result.answers.length > 0) {
    return { params: mergeWith(brief, result.answers), status: 'jev-live' };
  }
  return { params: mergeWith(brief, []), status: 'rules' };
}
