/**
 * Deterministic rules-based intake: classification, number extraction and
 * clarification questions. Works fully offline and never calls a model.
 *
 * These rules are the always-available fallback described in
 * `docs/06_jev_strategy.md` §2/§5: Jev may add hints later, but the base
 * parameters (with quotes) come from here.
 */

import type { ExtractedParam as ContractExtractedParam } from '@app/contract';
import { detectFlags } from './flags.js';
import { PLATFORM_KEYWORDS, WORK_TYPE_KEYWORDS } from './keywords.js';
import { scanQuantities } from './numbers.js';

export * from './keywords.js';
export * from './numbers.js';
export * from './flags.js';

/** Confidence of a single extracted parameter. */
export type ExtractionConfidence = 'high' | 'medium';

/**
 * Rules-extracted parameter: the contract `ExtractedParam` plus the
 * `source: 'rules'` provenance tag. `confidence` is the human-readable
 * level required by FR-1.3 (`high` for digits, `medium` for numerals).
 */
export interface ExtractedParam extends Omit<ContractExtractedParam, 'confidence'> {
  confidence: ExtractionConfidence;
  source: 'rules';
}

/** Overall classification confidence. */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Result of `classify`. */
export interface Classification {
  workType: string;
  platform: string;
  flags: ReturnType<typeof detectFlags>;
  matchedKeywords: string[];
  confidence: ConfidenceLevel;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Count word-start occurrences of each keyword. A left `\p{L}`/`\p{N}`
 * boundary prevents `иб` matching inside `библиотека` while still letting
 * stems match any suffix (`интеграц` → `интеграция`).
 */
function countMatches(text: string, keywords: string[]): { count: number; matched: string[] } {
  let count = 0;
  const matched: string[] = [];

  for (const keyword of keywords) {
    const needle = keyword.toLowerCase();
    if (needle.length === 0) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}`, 'gu');
    const occurrences = text.match(re)?.length ?? 0;
    if (occurrences > 0) {
      count += occurrences;
      matched.push(keyword);
    }
  }

  return { count, matched };
}

/** Pick the bucket with the most keyword occurrences (first wins ties). */
function bestMatch(
  text: string,
  dictionary: Record<string, string[]>,
): { key: string; count: number; matched: string[] } {
  let key = 'unknown';
  let count = 0;
  let matched: string[] = [];

  for (const [bucket, keywords] of Object.entries(dictionary)) {
    const result = countMatches(text, keywords);
    if (result.count > count) {
      key = bucket;
      count = result.count;
      matched = result.matched;
    }
  }

  return { key, count, matched };
}

/**
 * Classify a brief by work type and platform using keyword matches.
 * Zero work-type matches yield `workType: 'unknown'` and `low` confidence.
 */
export function classify(brief: string): Classification {
  const text = brief.toLowerCase();
  const work = bestMatch(text, WORK_TYPE_KEYWORDS);
  const platform = bestMatch(text, PLATFORM_KEYWORDS);

  const matchedKeywords = [...new Set([...work.matched, ...platform.matched])];

  let confidence: ConfidenceLevel;
  if (work.key === 'unknown') {
    confidence = 'low';
  } else if (work.count >= 2) {
    confidence = 'high';
  } else {
    confidence = 'medium';
  }

  return {
    workType: work.key,
    platform: platform.key,
    flags: detectFlags(brief),
    matchedKeywords,
    confidence,
  };
}

/**
 * Extract numeric parameters from a brief. Each parameter carries the
 * quote it came from and a confidence derived from its form: digits are
 * `high`, written numerals are `medium`.
 */
export function extract(brief: string): ExtractedParam[] {
  return scanQuantities(brief).map((hit) => ({
    key: hit.key,
    value: hit.value,
    unit: hit.unit,
    confidence: hit.numeric ? 'high' : 'medium',
    quote: hit.quote,
    source: 'rules',
    status: 'auto',
    defaultUsed: false,
  }));
}

/**
 * Concrete clarifying questions for an incomplete brief: missing work
 * type, missing volume numbers, or missing deadline.
 */
export function needsClarification(brief: string): string[] {
  const { workType } = classify(brief);
  const quantities = scanQuantities(brief);
  const hasVolume = quantities.some((quantity) => quantity.key !== 'duration');
  const hasDeadline = quantities.some((quantity) => quantity.key === 'duration');

  const questions: string[] = [];

  if (workType === 'unknown') {
    questions.push(
      'Какой тип ИТ-работы описан: интеграция, разработка, миграция, BI/аналитика, MES, ИБ, поддержка, RPA или другое?',
    );
  }
  if (!hasVolume) {
    questions.push(
      'Каков объём работ: сколько интеграционных потоков, экранов, отчётов или пользователей нужно реализовать?',
    );
  }
  if (!hasDeadline) {
    questions.push('Какой срок или дедлайн проекта? Укажите в месяцах, неделях или днях.');
  }

  return questions;
}
