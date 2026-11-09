/**
 * Font registration for the PDF report.
 *
 * Every glyph in the report is Cyrillic-capable. DejaVu files are shipped in
 * `shared/export/assets/fonts` and resolved from `import.meta.url`, never from
 * the current working directory, so tests, the API server and the esbuild E2E
 * bundle all find the same assets.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Registered font names used by the layout helpers. */
export interface Fonts {
  body: string;
  bold: string;
  condensed: string;
  mono: string;
}

const FILES = {
  body: 'DejaVuSans.ttf',
  bold: 'DejaVuSans-Bold.ttf',
  condensed: 'DejaVuSansCondensed-Bold.ttf',
  mono: 'DejaVuSansMono.ttf',
} as const;

const FALLBACK: Fonts = {
  body: 'Helvetica',
  bold: 'Helvetica-Bold',
  condensed: 'Helvetica-Bold',
  mono: 'Courier',
};

function moduleDir(): string {
  try {
    return fileURLToPath(new URL('.', import.meta.url));
  } catch {
    return process.cwd();
  }
}

/**
 * Candidate font directories. The first entry is the source-tree location; the
 * walk-up entries cover the esbuild E2E bundle, which lives in `.artifacts/`.
 */
export function fontDirectories(): string[] {
  const found: string[] = [];
  const add = (dir: string): void => {
    if (!found.includes(dir)) {
      found.push(dir);
    }
  };

  try {
    add(fileURLToPath(new URL('../../assets/fonts/', import.meta.url)));
  } catch {
    // import.meta.url can be unavailable in exotic runtimes; fall through.
  }

  let dir = moduleDir();
  for (let depth = 0; depth < 8; depth += 1) {
    add(join(dir, 'assets', 'fonts'));
    add(join(dir, 'shared', 'export', 'assets', 'fonts'));
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return found;
}

/** Returns the first directory that contains the core DejaVu files. */
export function resolveFontDir(): string | undefined {
  return fontDirectories().find(
    (dir) => existsSync(join(dir, FILES.body)) && existsSync(join(dir, FILES.bold)),
  );
}

function pick(dir: string, file: string, fallback: string): string {
  const candidate = join(dir, file);
  return existsSync(candidate) ? candidate : join(dir, fallback);
}

/**
 * Registers body, bold, condensed and mono faces on the document.
 *
 * If DejaVu is unavailable, PDFKit's built-in fonts are returned so report
 * generation never fails (Cyrillic text may then be missing in the output).
 */
export function registerFonts(doc: PDFKit.PDFDocument): Fonts {
  const dir = resolveFontDir();
  if (dir === undefined) {
    return { ...FALLBACK };
  }

  const body = join(dir, FILES.body);
  const bold = pick(dir, FILES.bold, FILES.body);
  const condensed = pick(dir, FILES.condensed, FILES.bold);
  const mono = pick(dir, FILES.mono, FILES.body);

  doc.registerFont('Body', body);
  doc.registerFont('Body-Bold', bold);
  doc.registerFont('Condensed', condensed);
  doc.registerFont('Mono', mono);

  return {
    body: 'Body',
    bold: 'Body-Bold',
    condensed: 'Condensed',
    mono: 'Mono',
  };
}

/** True when the resolver found a real DejaVu face (not a built-in fallback). */
export function hasEmbeddedFonts(): boolean {
  return resolveFontDir() !== undefined;
}
