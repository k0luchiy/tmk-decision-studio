/** Workbook reading and low-level cell/date parsing for HelpDesk exports. */

import type { DataQualityReport, Task, WorkItem } from '@app/contract';
import * as XLSX from 'xlsx';

/** Result of importing a HelpDesk workbook into the domain model. */
export interface HelpdeskResult {
  tasks: Task[];
  workItems: WorkItem[];
  report: DataQualityReport;
}

/* -------------------------------------------------------------------------- */
/* Column dictionary (exact Russian headers from the export)                  */
/* -------------------------------------------------------------------------- */

export const COL = {
  number: 'Номер',
  change: 'Изменение.Номер',
  kind: 'Вид',
  title: 'Заголовок',
  specialist: 'Специалист',
  team: 'Рабочая группа',
  state: 'Состояние',
  activity: 'Тип активности ЗНИ',
  createdAt: 'Дата создания',
  description: 'Описание',
  deadline: 'Плановая дата завершения',
  finished: 'Фактическое завершение',
  updated: 'Дата изменения',
  actual: 'Фактическая трудоемкость (часов)',
  plan: 'Плановая трудоемкость (часов)',
  quoted: 'Заквотированное время, часы',
} as const;

export type ColumnKey = keyof typeof COL;
export type Row = readonly unknown[];

export const STAGE_BY_ACTIVITY: Record<string, number> = {
  'Оценка трудоёмкости': 1,
  'Разработка ФС': 2,
  'Реализация изменения': 3,
  Встречи: 6,
};

export const KNOWN_ACTIVITIES = new Set(Object.keys(STAGE_BY_ACTIVITY));

/* -------------------------------------------------------------------------- */
/* Small value helpers                                                        */
/* -------------------------------------------------------------------------- */

export function str(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

export function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(str(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function serialToIso(serial: number): string {
  const parts = XLSX.SSF.parse_date_code(serial);
  if (!parts) {
    return '';
  }
  return (
    `${parts.y}-${pad(parts.m)}-${pad(parts.d)}` +
    `T${pad(parts.H)}:${pad(parts.M)}:${pad(parts.S)}`
  );
}

/** Parses Excel serials, Date objects and `dd.mm.yyyy hh:mm[:ss]` strings. */
export function parseDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return (
      `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
      `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
    );
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return serialToIso(value) || undefined;
  }
  const text = str(value);
  if (text === '') {
    return undefined;
  }
  const match = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (match) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
    return `${year}-${month}-${day}T${pad(Number(hour))}:${pad(Number(minute))}:${pad(Number(second))}`;
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

export function earliest(dates: readonly string[]): string {
  let best: string | undefined;
  for (const date of dates) {
    if (best === undefined || Date.parse(date) < Date.parse(best)) {
      best = date;
    }
  }
  return best ?? '1970-01-01T00:00:00.000Z';
}

export function isBlankRow(row: Row): boolean {
  return row.every((cell) => str(cell) === '');
}

/** One parsed sheet: raw rows plus a header-indexed cell accessor. */
export interface Sheet {
  rows: Row[];
  cell: (row: Row, key: ColumnKey) => unknown;
}

export function readSheet(wb: XLSX.WorkBook): Sheet {
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName === undefined ? undefined : wb.Sheets[sheetName];
  const rows: Row[] = sheet
    ? XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true, defval: '' })
    : [];

  const header = rows[0] ?? [];
  const index = new Map<ColumnKey, number>();
  (Object.keys(COL) as ColumnKey[]).forEach((key) => {
    const position = header.findIndex((cell) => str(cell) === COL[key]);
    if (position >= 0) {
      index.set(key, position);
    }
  });

  const cell = (row: Row, key: ColumnKey): unknown => {
    const position = index.get(key);
    return position === undefined ? undefined : row[position];
  };

  return { rows, cell };
}
