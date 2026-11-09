/**
 * Deterministic number extraction from a brief.
 *
 * Rules are regex + a small Russian numeral dictionary. Every extracted
 * quantity carries the surrounding text (`quote`) so a human can verify
 * where the number came from — no generative model is involved.
 */

/** A quantity found in a brief with its source fragment. */
export interface Quantity {
  /** Stable parameter key, e.g. `flows`, `duration`, `data_volume`. */
  key: string;
  /** Parsed numeric value. */
  value: number;
  /** Canonical unit, e.g. `поток`, `мес`, `ГБ`. */
  unit: string;
  /** Fragment of the brief around the match (±30 characters). */
  quote: string;
}

/** Internal hit that also remembers whether the number was a digit. */
export interface QuantityHit extends Quantity {
  /** True when the value came from digits, false when from a word. */
  numeric: boolean;
}

/** Russian numerals for zero-free small counts used in briefs. */
export const NUMBER_WORDS: Record<string, number> = {
  один: 1,
  одна: 1,
  одно: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
  одиннадцать: 11,
  двенадцать: 12,
  тринадцать: 13,
  четырнадцать: 14,
  пятнадцать: 15,
  шестнадцать: 16,
  семнадцать: 17,
  восемнадцать: 18,
  девятнадцать: 19,
  двадцать: 20,
  тридцать: 30,
  сорок: 40,
  пятьдесят: 50,
  сто: 100,
};

const LETTER = '[A-Za-zА-Яа-яЁё]';
const WORD = `${LETTER}+`;
// Adjective suffixes (`интеграционных`, `новых`) let "6 интеграционных
// потоков" resolve to flows=6 instead of integrations=6.
const ADJECTIVE = `${LETTER}+(?:ых|их|ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ому|ему|ыми|ими|ую|юю)`;
const UNIT =
  'поток[а-яё]*|интеграц[а-яё]*|экран[а-яё]*|отчёт[а-яё]*|отчет[а-яё]*|пользовател[а-яё]*|арм[а-яё]*|роль[а-яё]*|микросервис[а-яё]*|форм[а-яё]*|мес[а-яё]*|недел[а-яё]*|год[а-яё]*|дн[а-яё]*|гб|тб|запис[а-яё]*';
const QUANTITY_PATTERN = `(${WORD}|\\d+)\\s+(?:${ADJECTIVE}\\s+)?(${UNIT})`;

const UNIT_MAP: { prefix: string; key: string; unit: string }[] = [
  { prefix: 'поток', key: 'flows', unit: 'поток' },
  { prefix: 'интеграц', key: 'integrations', unit: 'интеграция' },
  { prefix: 'экран', key: 'screens', unit: 'экран' },
  { prefix: 'отчёт', key: 'reports', unit: 'отчёт' },
  { prefix: 'отчет', key: 'reports', unit: 'отчёт' },
  { prefix: 'пользовател', key: 'users', unit: 'пользователь' },
  { prefix: 'арм', key: 'workstations', unit: 'АРМ' },
  { prefix: 'роль', key: 'roles', unit: 'роль' },
  { prefix: 'микросервис', key: 'microservices', unit: 'микросервис' },
  { prefix: 'форм', key: 'forms', unit: 'форма' },
  { prefix: 'мес', key: 'duration', unit: 'мес' },
  { prefix: 'недел', key: 'duration', unit: 'недель' },
  { prefix: 'год', key: 'duration', unit: 'год' },
  { prefix: 'дн', key: 'duration', unit: 'дней' },
  { prefix: 'гб', key: 'data_volume', unit: 'ГБ' },
  { prefix: 'тб', key: 'data_volume', unit: 'ТБ' },
  { prefix: 'запис', key: 'data_volume', unit: 'записей' },
];

function mapUnit(raw: string): { key: string; unit: string } | undefined {
  const lower = raw.toLowerCase();
  const entry = UNIT_MAP.find((candidate) => lower.startsWith(candidate.prefix));
  return entry ? { key: entry.key, unit: entry.unit } : undefined;
}

/** Extract a fragment of `radius` characters around a match. */
function quoteAround(text: string, index: number, length: number, radius = 30): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);
  return text.slice(start, end).trim();
}

/**
 * Scan a brief and return every quantity with its provenance quote.
 * Word numerals are resolved through `NUMBER_WORDS`; unknown words are
 * skipped. Data volumes only accept digits (`500 ГБ`), never words.
 */
export function scanQuantities(brief: string): QuantityHit[] {
  const hits: QuantityHit[] = [];
  const pattern = new RegExp(QUANTITY_PATTERN, 'giu');

  for (const match of brief.matchAll(pattern)) {
    const index = match.index ?? 0;
    const numberToken = match[1] ?? '';
    const unitToken = match[2] ?? '';
    const numeric = /^\d+$/.test(numberToken);
    const value = numeric ? Number(numberToken) : NUMBER_WORDS[numberToken.toLowerCase()];

    if (value === undefined) continue;

    const mapped = mapUnit(unitToken);
    if (!mapped) continue;
    if (mapped.key === 'data_volume' && !numeric) continue;

    hits.push({
      ...mapped,
      value,
      quote: quoteAround(brief, index, match[0].length),
      numeric,
    });
  }

  return hits;
}

/** Extract quantities as a flat list of `{ key, value, unit, quote }`. */
export function extractQuantities(brief: string): Quantity[] {
  return scanQuantities(brief).map(({ key, value, unit, quote }) => ({ key, value, unit, quote }));
}
