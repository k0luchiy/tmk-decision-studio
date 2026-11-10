import { createHash } from 'node:crypto';
import type { AnalogueRow } from '@app/data';
import * as XLSX from 'xlsx';

type RawRow = Record<string, unknown>;

const PRICE_KEYS = ['price_mid', 'price', 'цена', 'стоимость'];
const LOW_KEYS = ['price_low', 'цена_от', 'price_min'];
const HIGH_KEYS = ['price_high', 'цена_до', 'price_max'];

function text(row: RawRow, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function numberValue(row: RawRow, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function boolValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (/^(true|да|1)$/i.test(value.trim())) return true;
    if (/^(false|нет|0)$/i.test(value.trim())) return false;
  }
  return null;
}

function scopeValue(value: unknown): Record<string, number | boolean | string | null> {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, number | boolean | string | null>;
      }
    } catch {
      return {};
    }
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, number | boolean | string | null>;
  }
  return {};
}

export function parseRows(buffer: Buffer, filename: string): RawRow[] {
  if (/\.json$/i.test(filename)) {
    const parsed: unknown = JSON.parse(buffer.toString('utf8'));
    if (Array.isArray(parsed)) return parsed.filter((row): row is RawRow => row !== null && typeof row === 'object');
    if (parsed !== null && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record.analogues)) return record.analogues.filter((row): row is RawRow => row !== null && typeof row === 'object');
      if (Array.isArray(record.rows)) return record.rows.filter((row): row is RawRow => row !== null && typeof row === 'object');
    }
    return [];
  }

  const isCsv = /\.csv$/i.test(filename);
  const workbook = XLSX.read(isCsv ? buffer.toString('utf8') : buffer, {
    type: isCsv ? 'string' : 'buffer',
  });
  const sheetName = workbook.SheetNames[0];
  if (sheetName === undefined) return [];
  const sheet = workbook.Sheets[sheetName];
  if (sheet === undefined) return [];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
}

export function normaliseRow(
  raw: RawRow,
  sourceId: string,
  index: number,
): { row?: AnalogueRow; error?: string } {
  const projectType = text(raw, ['project_type', 'тип', 'type']);
  const title = text(raw, ['title', 'название', 'name', 'subject']);
  const source = text(raw, ['source', 'источник', 'source_url', 'url']);
  if (projectType === undefined) return { error: 'missing project_type' };
  if (title === undefined) return { error: 'missing title' };
  if (source === undefined) return { error: 'missing source' };

  const low = numberValue(raw, LOW_KEYS);
  const mid = numberValue(raw, PRICE_KEYS);
  const high = numberValue(raw, HIGH_KEYS);
  const priceMid = mid ?? (low !== undefined && high !== undefined ? (low + high) / 2 : undefined);
  if (priceMid === undefined || priceMid <= 0) return { error: 'missing positive price' };

  const yearValue = numberValue(raw, ['year', 'год']);
  const year = yearValue !== undefined && yearValue >= 2000 && yearValue <= 2100
    ? Math.round(yearValue)
    : new Date().getUTCFullYear();
  const lowPrice = low ?? priceMid;
  const highPrice = high ?? priceMid;
  const id = text(raw, ['id']) ?? `hub_${createHash('sha256').update(`${title}|${source}|${index}`).digest('hex').slice(0, 12)}`;

  const row: AnalogueRow = {
    id,
    project_type: projectType,
    title,
    year,
    price_low: lowPrice,
    price_mid: priceMid,
    price_high: highPrice,
    price_basis: text(raw, ['price_basis', 'basis']) ?? 'contract_price',
    source,
    source_date: text(raw, ['source_date', 'date', 'дата']) ?? new Date().toISOString().slice(0, 10),
    confidence: text(raw, ['confidence', 'достоверность']) ?? 'Medium',
    scope_vector: scopeValue(raw.scope_vector),
    note: text(raw, ['note', 'примечание']) ?? 'Импортировано через Data Hub',
    currency: (text(raw, ['currency', 'валюта']) ?? 'RUB').toUpperCase(),
    vat_included: boolValue(raw.vat_included),
    vat_note: text(raw, ['vat_note']) ?? 'VAT treatment is not stated in the source',
    effort_hours: null,
    normalized_rub_per_hour_low: null,
    normalized_rub_per_hour_high: null,
    related_amounts: {},
    open_ended: false,
    normalization: {
      fx_conversion_applied: false,
      inflation_adjustment_required: true,
      scope_normalized: false,
      note: 'Imported via Data Hub; normalize before comparing.',
    },
    corpus_source: 'data_hub',
    provenance_file: `data/sources.json#${sourceId}`,
  };

  return { row };
}
