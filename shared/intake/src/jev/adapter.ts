/**
 * Jev (System One) adapter.
 *
 * Calls the OpenCode inference endpoint with a brief as `state` and the
 * versioned classification questions from `prompts/jev_questions.json`.
 * Jev never computes money or invents numbers: it only returns category
 * hints with probabilities (`docs/06_jev_strategy.md` §1, §3–§5).
 *
 * Failure policy:
 * - no API key                → `unavailable`, no network call;
 * - network error / 5xx       → one retry, then `unavailable`;
 * - 4xx                       → `unavailable` (no retry);
 * - timeout (10 s default)    → `timeout`;
 * - malformed / invalid body  → `invalid`.
 *
 * The function never throws on transport or validation failures.
 */

import type { JevAnswer } from '@app/contract';
import { createHash } from 'node:crypto';
import {
  JEV_PROMPT_VERSION,
  JEV_QUESTIONS,
  normalizeJevResponse,
  type JevQuestion,
  type JevQuestionType,
} from './contract.js';

/** OpenCode System One endpoint (non-OpenAI protocol). */
export const JEV_ENDPOINT = 'https://opencode.ai/inference/systemone/v1/systemone';
/** Paid model used by the application (D-14). */
export const JEV_MODEL = 'jev-1.13';
/** Free fallback model, used when the paid model is unavailable. */
export const JEV_FREE_MODEL = 'jev-1.13-free';
/** Statuses that trigger the free-model fallback when no model was chosen. */
const FALLBACK_STATUS: ReadonlySet<number> = new Set([402, 403, 404]);
/** Default request deadline. */
export const JEV_DEFAULT_TIMEOUT_MS = 10_000;

/** Options for {@link classifyWithJev}. */
export interface JevClassifyOptions {
  /** Overrides `OPENCODE_API_KEY` when supplied. */
  apiKey?: string;
  /** Request deadline in milliseconds (default 10 000). */
  timeoutMs?: number;
  /** Overrides the request model (contract answers stay pinned to jev-1.13). */
  model?: string;
}

/** Classifier result: answers plus a machine-readable failure reason. */
export interface JevClassifyResult {
  answers: JevAnswer[];
  error?: 'unavailable' | 'invalid' | 'timeout';
}

interface WireQuestion {
  type: JevQuestionType;
  instructions: string;
  criteria?: Record<string, string> | string[];
}

type Attempt =
  | { kind: 'ok'; data: unknown }
  | { kind: 'status'; status: number }
  | { kind: 'network' }
  | { kind: 'timeout' }
  | { kind: 'invalid' };

class JevTimeoutError extends Error {
  constructor() {
    super('jev request timed out');
    this.name = 'JevTimeoutError';
  }
}

function toWireQuestions(questions: readonly JevQuestion[]): Record<string, WireQuestion> {
  const wire: Record<string, WireQuestion> = {};
  for (const question of questions) {
    wire[question.id] = {
      type: question.type,
      instructions: question.instructions,
      ...(question.criteria === undefined ? {} : { criteria: question.criteria }),
    };
  }
  return wire;
}

const WIRE_QUESTIONS = toWireQuestions(JEV_QUESTIONS);

/** SHA-256 of the brief text, used to tie cached answers to an input. */
export function hashBrief(brief: string): string {
  return createHash('sha256').update(brief, 'utf8').digest('hex');
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (error as { name?: unknown }).name === 'AbortError';
}

async function requestOnce(
  apiKey: string,
  body: string,
  timeoutMs: number,
): Promise<Attempt> {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new JevTimeoutError());
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      fetch(JEV_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body,
        signal: controller.signal,
      }),
      timeoutPromise,
    ]);

    if (!response.ok) return { kind: 'status', status: response.status };

    try {
      const data: unknown = await response.json();
      return { kind: 'ok', data };
    } catch {
      return { kind: 'invalid' };
    }
  } catch (error) {
    if (
      timedOut ||
      error instanceof JevTimeoutError ||
      isAbortError(error) ||
      controller.signal.aborted
    ) {
      return { kind: 'timeout' };
    }
    return { kind: 'network' };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

function answerModel(model: string): JevAnswer['model'] {
  return model === JEV_FREE_MODEL ? JEV_FREE_MODEL : JEV_MODEL;
}

async function callModel(
  apiKey: string,
  brief: string,
  model: string,
  timeoutMs: number,
): Promise<Attempt> {
  const body = JSON.stringify({ model, state: brief, questions: WIRE_QUESTIONS });
  let last: Attempt = { kind: 'network' };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestOnce(apiKey, body, timeoutMs);
    last = result;
    if (result.kind === 'ok' || result.kind === 'timeout' || result.kind === 'invalid') {
      return result;
    }
    if (result.kind === 'status' && !isRetryableStatus(result.status)) return result;
  }
  return last;
}

/**
 * Classify a brief with Jev.
 *
 * Sends only the brief text and the question catalog; no other data is
 * transmitted. The call is best-effort: on any failure the caller gets an
 * empty answer list plus a reason and can fall back to deterministic rules.
 * When the model was not chosen explicitly, a 402/403/404 response retries
 * once with `jev-1.13-free` and stamps the actual model on every answer.
 */
export async function classifyWithJev(
  brief: string,
  opts: JevClassifyOptions = {},
): Promise<JevClassifyResult> {
  const apiKey = opts.apiKey ?? process.env.OPENCODE_API_KEY;
  if (apiKey === undefined || apiKey.trim() === '') {
    return { answers: [], error: 'unavailable' };
  }

  const timeoutMs = opts.timeoutMs ?? JEV_DEFAULT_TIMEOUT_MS;
  const envModel = process.env.JEV_MODEL;
  const explicitModel = opts.model !== undefined || envModel !== undefined;
  let model = opts.model ?? envModel ?? JEV_MODEL;
  const stateHash = hashBrief(brief);

  let result = await callModel(apiKey, brief, model, timeoutMs);
  if (result.kind === 'status' && FALLBACK_STATUS.has(result.status) && !explicitModel) {
    model = JEV_FREE_MODEL;
    result = await callModel(apiKey, brief, model, timeoutMs);
  }

  if (result.kind === 'ok') {
    const normalized = normalizeJevResponse(result.data, {
      model: answerModel(model),
      promptVersion: JEV_PROMPT_VERSION,
      stateHash,
      questions: JEV_QUESTIONS,
    });
    return normalized.ok ? { answers: normalized.answers } : { answers: [], error: 'invalid' };
  }

  if (result.kind === 'timeout') return { answers: [], error: 'timeout' };
  if (result.kind === 'invalid') return { answers: [], error: 'invalid' };
  return { answers: [], error: 'unavailable' };
}
