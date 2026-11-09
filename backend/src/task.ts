/**
 * Turns API request parameters into a contract `Task`.
 *
 * Mirrors `shared/cli/src/e2e.ts`: the task id is derived from a hash of the
 * brief, the title is capped at 80 characters and parameters are mapped to
 * contract `ExtractedParam`s. Input is deliberately lenient (the UI may only
 * send `key`/`value`/`status`); missing fields get documented defaults.
 */

import { createHash } from 'node:crypto';
import type { ExtractedParam, Task } from '@app/contract';

const STATUSES = ['auto', 'confirmed', 'edited', 'rejected'] as const;
type ParamStatus = ExtractedParam['status'];

/** Lenient parameter shape accepted from the request body. */
export interface TaskParamInput {
  key: string;
  value: string | number | boolean;
  unit?: string;
  confidence?: number;
  quote?: string;
  status?: string;
  defaultUsed?: boolean;
}

function normalizeStatus(value: string | undefined): ParamStatus {
  if (value !== undefined && (STATUSES as readonly string[]).includes(value)) {
    return value as ParamStatus;
  }
  return 'auto';
}

/** Maps one request parameter to a contract `ExtractedParam`. */
export function toTaskParam(param: TaskParamInput): ExtractedParam {
  return {
    key: param.key,
    value: param.value,
    unit: param.unit ?? '',
    confidence: param.confidence ?? 1,
    ...(param.quote === undefined ? {} : { quote: param.quote }),
    status: normalizeStatus(param.status),
    defaultUsed: param.defaultUsed ?? false,
  };
}

/** First 12 hex characters of the SHA-256 hash of `value`. */
export function sha256Short(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 12);
}

/** `YYYY-MM-DD` for the given date (today by default). */
export function isoDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Builds the `Task` the pipeline consumes from a brief and its parameters. */
export function buildTask(brief: string, params: readonly TaskParamInput[]): Task {
  const title = brief.length > 80 ? `${brief.slice(0, 79)}…` : brief;
  const platformParam = params.find((param) => param.key === 'platform');
  const platform =
    platformParam !== undefined && typeof platformParam.value === 'string'
      ? platformParam.value
      : undefined;

  return {
    id: `task_${sha256Short(brief)}`,
    title,
    descriptionRaw: brief,
    briefVersion: 'api-1.0',
    createdAt: isoDay(),
    ...(platform === undefined ? {} : { platform }),
    params: params.map(toTaskParam),
  };
}
