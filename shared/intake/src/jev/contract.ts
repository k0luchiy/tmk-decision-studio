/**
 * Contract for the Jev (System One) classification endpoint.
 *
 * Jev answers typed questions with a value and a probability. The wire
 * response may carry the answers under either `answers` or `results`;
 * both shapes are normalized into the shared {@link JevAnswer} contract
 * from `@app/contract` (see `docs/06_jev_strategy.md` §5.1).
 */

import type { JevAnswer } from '@app/contract';
import { z } from 'zod';
import questionsJson from '../../prompts/jev_questions.json';

/** Supported Jev question kinds. */
export const JevQuestionTypeSchema = z.enum(['noul', 'choice', 'score']);
export type JevQuestionType = z.infer<typeof JevQuestionTypeSchema>;

/** A single question definition as stored in `prompts/jev_questions.json`. */
export const JevQuestionSchema = z.object({
  id: z.string().min(1),
  type: JevQuestionTypeSchema,
  instructions: z.string().min(1),
  criteria: z
    .union([z.record(z.string(), z.string().min(1)), z.array(z.string().min(1))])
    .optional(),
});
export type JevQuestion = z.infer<typeof JevQuestionSchema>;

/** Versioned prompt catalog. Order is fixed and part of the contract. */
export const JevPromptFileSchema = z.object({
  meta: z.object({ version: z.string().min(1) }),
  questions: z.array(JevQuestionSchema).min(1),
});
export type JevPromptFile = z.infer<typeof JevPromptFileSchema>;

/** Parsed prompt catalog bundled with the package. */
export const JEV_PROMPT: JevPromptFile = JevPromptFileSchema.parse(questionsJson);
export const JEV_QUESTIONS: readonly JevQuestion[] = JEV_PROMPT.questions;
export const JEV_PROMPT_VERSION: string = JEV_PROMPT.meta.version;

/** Raw answer entry: legacy `{value, probability}` or the live Jev shape. */
export const JevAnswerEntrySchema = z.union([
  z.object({
    value: z.union([z.boolean(), z.string(), z.number()]),
    probability: z.number().min(0).max(1).optional(),
  }),
  z.object({
    type: z.literal('choice'),
    choice: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
    probabilities: z.record(z.string(), z.number()).optional(),
  }),
  z.object({
    type: z.literal('noul'),
    noul: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('score'),
    score: z.number(),
    confidence: z.number().min(0).max(1).optional(),
    probabilities: z.record(z.string(), z.number()).optional(),
    legend: z.record(z.string(), z.string()).optional(),
  }),
]);
export type JevAnswerEntry = z.infer<typeof JevAnswerEntrySchema>;

/**
 * Accepted wire responses. Jev may return the map under `answers` or
 * under `results`; the adapter does not care which one is used.
 */
export const JevResponseSchema = z.union([
  z.object({ answers: z.record(z.string(), JevAnswerEntrySchema) }),
  z.object({ results: z.record(z.string(), JevAnswerEntrySchema) }),
]);
export type JevResponse = z.infer<typeof JevResponseSchema>;

/** Context needed to stamp normalized answers. */
export interface JevNormalizeContext {
  model: JevAnswer['model'];
  promptVersion: string;
  stateHash: string;
  questions: readonly JevQuestion[];
}

/** Normalization outcome: either a non-empty answer list or a rejection. */
export type JevNormalizeResult = { ok: true; answers: JevAnswer[] } | { ok: false };

function scaleKeys(question: JevQuestion): readonly string[] {
  if (question.criteria === undefined) return [];
  return Array.isArray(question.criteria) ? question.criteria : Object.keys(question.criteria);
}

/**
 * Validate a raw value against the question kind. Returns `undefined`
 * when the value does not fit the question (e.g. a score outside the
 * declared scale or a choice outside its criteria).
 */
function normalizeValue(
  question: JevQuestion,
  value: boolean | string | number,
): JevAnswer['value'] | undefined {
  if (question.type === 'noul') {
    return typeof value === 'boolean' ? value : undefined;
  }

  if (question.type === 'choice') {
    if (typeof value !== 'string' || value.length === 0) return undefined;
    const allowed = scaleKeys(question);
    return allowed.length === 0 || allowed.includes(value) ? value : undefined;
  }

  // score: either a criterion string or a zero-based index into the scale.
  const scale = scaleKeys(question);
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 && value < scale.length ? value : undefined;
  }
  if (typeof value === 'string') {
    return scale.includes(value) ? value : undefined;
  }
  return undefined;
}

function clampProbability(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Normalizes either wire entry into `{value, probability}` for one question.
 * The live Jev shape carries `choice` / `noul` / `score` instead of `value`.
 */
function normalizeEntry(
  question: JevQuestion,
  entry: JevAnswerEntry,
): { value: JevAnswer['value']; probability: number } | undefined {
  if ('value' in entry) {
    const value = normalizeValue(question, entry.value);
    return value === undefined ? undefined : { value, probability: clampProbability(entry.probability) };
  }

  if ('choice' in entry && question.type === 'choice') {
    const value = normalizeValue(question, entry.choice);
    if (value === undefined) return undefined;
    const probability = entry.probabilities?.[entry.choice] ?? entry.confidence;
    return { value, probability: clampProbability(probability) };
  }

  if ('noul' in entry && question.type === 'noul') {
    const value = entry.noul >= 0.5;
    return { value, probability: value ? entry.noul : 1 - entry.noul };
  }

  if ('score' in entry && question.type === 'score') {
    const index = Math.round(entry.score);
    const value = normalizeValue(question, index);
    if (value === undefined) return undefined;
    const probability = entry.probabilities?.[String(index)] ?? entry.confidence;
    return { value, probability: clampProbability(probability) };
  }

  return undefined;
}

/**
 * Validate a raw Jev response and normalize it into contract answers.
 * Unknown question IDs are ignored; any known question with an invalid
 * value rejects the whole response (`ok: false`).
 */
export function normalizeJevResponse(
  raw: unknown,
  context: JevNormalizeContext,
): JevNormalizeResult {
  const parsed = JevResponseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };

  const entries = 'answers' in parsed.data ? parsed.data.answers : parsed.data.results;
  const byId = new Map(context.questions.map((question) => [question.id, question]));
  const answers: JevAnswer[] = [];

  for (const [questionId, entry] of Object.entries(entries)) {
    const question = byId.get(questionId);
    if (question === undefined) continue;

    const normalized = normalizeEntry(question, entry);
    if (normalized === undefined) return { ok: false };

    answers.push({
      questionId,
      type: question.type,
      value: normalized.value,
      probability: normalized.probability,
      model: context.model,
      promptVersion: context.promptVersion,
      stateHash: context.stateHash,
    });
  }

  if (answers.length === 0) return { ok: false };
  return { ok: true, answers };
}
