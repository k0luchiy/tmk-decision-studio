/**
 * Jev response cache.
 *
 * Answers are keyed by the SHA-256 of the brief text (`stateHash`) and
 * stored in a plain JSON file, so the offline demo can replay a real
 * classification without touching the network (`docs/06_jev_strategy.md`
 * §5.3). Every entry also records the model and prompt version, so a
 * mismatch is visible in the file even though lookup is by text hash.
 */

import { JevAnswerSchema } from '@app/contract';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/** One cached set of Jev answers for a single brief. */
export const JevCacheEntrySchema = z.object({
  stateHash: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  answers: z.array(JevAnswerSchema),
  savedAt: z.string().optional(),
});
export type JevCacheEntry = z.infer<typeof JevCacheEntrySchema>;

/** On-disk cache file shape. */
export const JevCacheFileSchema = z.object({
  version: z.number().int().positive(),
  entries: z.array(JevCacheEntrySchema),
});
export type JevCacheFile = z.infer<typeof JevCacheFileSchema>;

/** SHA-256 of a brief text, lowercase hex. */
export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Read cache entries. A missing, unreadable or malformed file yields an
 * empty list: a broken cache must never break the rules-only path.
 */
export function readCache(file: string): JevCacheEntry[] {
  try {
    const raw = readFileSync(file, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    const result = JevCacheFileSchema.safeParse(parsed);
    return result.success ? result.data.entries : [];
  } catch {
    return [];
  }
}

/** Serialize cache entries, creating parent directories as needed. */
export function writeCache(file: string, entries: readonly JevCacheEntry[]): void {
  const payload: JevCacheFile = { version: 1, entries: [...entries] };
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

/** Look up a single cached answer set by the brief hash. */
export function getCached(file: string, stateHash: string): JevCacheEntry | undefined {
  return readCache(file).find((entry) => entry.stateHash === stateHash);
}
