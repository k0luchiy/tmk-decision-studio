/**
 * Boolean flags extracted from a brief.
 *
 * Flags are independent of work type: a migration task can also mention
 * 24/7 support, and an integration task can mention КИИ. Each flag is a
 * plain regex over the raw brief, so the result is deterministic and
 * reproducible offline.
 */

/** Flags derived from a brief. */
export interface BriefFlags {
  /** Requirements of ИБ / КИИ / 187-ФЗ / ФСТЭК. */
  securityKii: boolean;
  /** Mobile platform (iOS / Android / «мобильное приложение»). */
  mobile: boolean;
  /** Migration of an existing system. */
  migration: boolean;
  /** Round-the-clock support (24/7). */
  support24x7: boolean;
  /** Import substitution (импортозамещение). */
  importSubstitution: boolean;
}

// `\p{L}`/`\p{N}` boundaries keep short tokens (`иб`, `ios`, `api`)
// from matching inside unrelated words (`библиотека`, `rapid`).
const SECURITY_KII_RE =
  /(?<![\p{L}\p{N}])(?:иб|кии|фстэк|187-?фз|информационн\p{L}*\s+безопасн\p{L}*|кибербезопасн\p{L}*|security)(?![\p{L}\p{N}])/iu;
const MOBILE_RE =
  /(?<![\p{L}\p{N}])(?:ios|android|мобильн\p{L}*|flutter|kotlin|swift|react native)(?![\p{L}\p{N}])/iu;
const MIGRATION_RE =
  /(?<![\p{L}\p{N}])(?:миграц\p{L}*|перенос\p{L}*|переход\p{L}*\s+на|апгрейд\p{L}*)(?![\p{L}\p{N}])/iu;
const SUPPORT_24X7_RE = /(?:24\s*\/\s*7|круглосуточ\p{L}*)(?![\p{L}\p{N}])/iu;
const IMPORT_SUBSTITUTION_RE =
  /(?<![\p{L}\p{N}])(?:импортозамещ\p{L}*|отечественн\p{L}*\s+по)(?![\p{L}\p{N}])/iu;

/** Detect boolean flags from a brief. Never throws on empty input. */
export function detectFlags(brief: string): BriefFlags {
  return {
    securityKii: SECURITY_KII_RE.test(brief),
    mobile: MOBILE_RE.test(brief),
    migration: MIGRATION_RE.test(brief),
    support24x7: SUPPORT_24X7_RE.test(brief),
    importSubstitution: IMPORT_SUBSTITUTION_RE.test(brief),
  };
}
