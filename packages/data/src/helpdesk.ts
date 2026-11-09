import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { DataQualityReport, Task, WorkItem } from '@app/contract';
import * as XLSX from 'xlsx';
import { repositoryRoot } from './loaders.js';

/** Result of importing a HelpDesk workbook into the domain model. */
export interface HelpdeskResult {
  tasks: Task[];
  workItems: WorkItem[];
  report: DataQualityReport;
}

/* -------------------------------------------------------------------------- */
/* Column dictionary (exact Russian headers from the export)                  */
/* -------------------------------------------------------------------------- */

const COL = {
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

type ColumnKey = keyof typeof COL;
type Row = readonly unknown[];

const STAGE_BY_ACTIVITY: Record<string, number> = {
  'Оценка трудоёмкости': 1,
  'Разработка ФС': 2,
  'Реализация изменения': 3,
  Встречи: 6,
};

const KNOWN_ACTIVITIES = new Set(Object.keys(STAGE_BY_ACTIVITY));

/* -------------------------------------------------------------------------- */
/* Small value helpers                                                        */
/* -------------------------------------------------------------------------- */

function str(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function num(value: unknown): number {
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
function parseDate(value: unknown): string | undefined {
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

function earliest(dates: readonly string[]): string {
  let best: string | undefined;
  for (const date of dates) {
    if (best === undefined || Date.parse(date) < Date.parse(best)) {
      best = date;
    }
  }
  return best ?? '1970-01-01T00:00:00.000Z';
}

/* -------------------------------------------------------------------------- */
/* Domain mapping                                                             */
/* -------------------------------------------------------------------------- */

function platformOf(team: string): '1С' | 'BPMSoft' | 'other' {
  if (team.includes('1С') || team.includes('1C')) {
    return '1С';
  }
  if (team.includes('BPMSoft')) {
    return 'BPMSoft';
  }
  return 'other';
}

const STANDARD_SPECIALIST = /^Специалист\s+\d+$/i;

/** Stable de-identification: keep `Специалист N`, rename anything else in order. */
function makeMasker(): (raw: string) => string {
  const assigned = new Map<string, string>();
  let counter = 0;
  return (raw: string): string => {
    const value = raw.trim();
    if (value === '' || STANDARD_SPECIALIST.test(value)) {
      return value;
    }
    const existing = assigned.get(value);
    if (existing !== undefined) {
      return existing;
    }
    counter += 1;
    const label = `Специалист ${counter}`;
    assigned.set(value, label);
    return label;
  };
}

/* -------------------------------------------------------------------------- */
/* Workbook parsing                                                           */
/* -------------------------------------------------------------------------- */

interface Group {
  key: string;
  externalId: string;
  changeId: string;
  title: string;
  description: string;
  teamLine: string;
  platform: string;
  state: string;
  dates: string[];
  workItems: WorkItem[];
}

function isBlankRow(row: Row): boolean {
  return row.every((cell) => str(cell) === '');
}

/** Parses an already-read workbook into tasks, flat work items and a quality report. */
export function parseHelpdeskWorkbook(wb: XLSX.WorkBook): HelpdeskResult {
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

  const groups = new Map<string, Group>();
  const seen = new Set<string>();
  const mask = makeMasker();
  const rowsDropped: DataQualityReport['rowsDropped'] = [];
  const warnings: string[] = [];
  let rowsTotal = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row === undefined || isBlankRow(row)) {
      continue;
    }
    rowsTotal += 1;
    const rowNumber = i + 1;

    const number = str(cell(row, 'number'));
    const changeNumber = str(cell(row, 'change'));
    const activity = str(cell(row, 'activity'));
    const rawSpecialist = str(cell(row, 'specialist'));
    const createdAtRaw = cell(row, 'createdAt');
    const created = parseDate(createdAtRaw);

    if (number === '') {
      rowsDropped.push({ row: rowNumber, reason: 'missing_id' });
      continue;
    }

    const dedupeKey = [number, activity, rawSpecialist, created ?? ''].join('\u0001');
    if (seen.has(dedupeKey)) {
      rowsDropped.push({ row: rowNumber, reason: 'duplicate' });
      continue;
    }
    seen.add(dedupeKey);

    const key = changeNumber === '' ? number : changeNumber;
    const team = str(cell(row, 'team'));
    const platform = platformOf(team);
    const kind = str(cell(row, 'kind'));
    const planHours = num(cell(row, 'plan'));
    const actualHours = num(cell(row, 'actual'));
    const quotedHours = num(cell(row, 'quoted'));

    if (created === undefined && str(createdAtRaw) !== '') {
      warnings.push(`row ${rowNumber}: bad_date`);
    }
    if (kind === '') {
      warnings.push(`row ${rowNumber}: empty_kind`);
    }
    if (!KNOWN_ACTIVITIES.has(activity)) {
      warnings.push(`row ${rowNumber}: unknown_activity`);
    }
    if (planHours === 0 && actualHours > 0) {
      warnings.push(`row ${rowNumber}: plan_zero`);
    }
    if (planHours === actualHours && actualHours === quotedHours) {
      warnings.push(`row ${rowNumber}: copied_effort`);
    }
    if (!Number.isInteger(quotedHours)) {
      warnings.push(`row ${rowNumber}: fractional_quota`);
    }

    const specialist = mask(rawSpecialist);
    const base = planHours > 0 ? planHours : actualHours > 0 ? actualHours : 0;
    const stage = STAGE_BY_ACTIVITY[activity] ?? 3;
    const isBpm = platform === 'BPMSoft';

    const workItem: WorkItem = {
      id: `helpdesk:${key}:${activity}:${specialist || 'unknown'}:${created ?? 'unknown'}`,
      stage,
      archetypeId: isBpm ? 'integration_1c_wms' : 'functional_extension_1c',
      unit: 'activity',
      unitsCount: 1,
      optimisticHours: base,
      mostLikelyHours: base,
      pessimisticHours: base,
      expectedHours: (base + 4 * base + base) / 6,
      sigmaHours: (base - base) / 6,
      roleMix: [{ roleId: isBpm ? 'backend' : '1c_developer', share: 100, grade: 'middle' }],
      sourceRefs: [`helpdesk:${rowNumber}`],
      assumption: false,
      effort: { planHours, actualHours, quotedHours },
    };

    let group = groups.get(key);
    if (group === undefined) {
      group = {
        key,
        externalId: number,
        changeId: changeNumber,
        title: str(cell(row, 'title')),
        description: str(cell(row, 'description')),
        teamLine: team,
        platform,
        state: str(cell(row, 'state')),
        dates: [],
        workItems: [],
      };
      groups.set(key, group);
    }
    if (created !== undefined) {
      group.dates.push(created);
    }
    group.workItems.push(workItem);
  }

  const tasks: Task[] = [...groups.values()].map((group) => ({
    id: `helpdesk:${group.key}`,
    title: group.title === '' ? group.key : group.title,
    descriptionRaw: group.description,
    briefVersion: '',
    createdAt: earliest(group.dates),
    externalId: group.externalId,
    changeId: group.changeId,
    teamLine: group.teamLine,
    platform: group.platform,
    params: [
      {
        key: 'state',
        value: group.state,
        unit: '',
        confidence: 1,
        status: 'auto',
        defaultUsed: false,
      },
    ],
    workItems: group.workItems,
  }));

  const workItems = tasks.flatMap((task) => task.workItems ?? []);
  const rowsOk = rowsTotal - rowsDropped.length;

  const report: DataQualityReport = {
    dataset: 'helpdesk',
    rowsTotal,
    rowsOk,
    rowsDropped,
    anomalies: [],
    warnings,
  };

  return { tasks, workItems, report };
}

/** Reads and parses a HelpDesk `.xlsx` file. */
export async function parseHelpdeskFile(filePath: string): Promise<HelpdeskResult> {
  const workbook = XLSX.readFile(filePath);
  return parseHelpdeskWorkbook(workbook);
}

/** Finds the first `*.xlsx` inside `<baseDir>/research/data` (Unicode-safe). */
export async function findHelpdeskFile(baseDir: string = repositoryRoot()): Promise<string> {
  const directory = path.join(baseDir, 'research', 'data');
  const entries = await readdir(directory);
  const xlsxFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.xlsx')).sort();
  const first = xlsxFiles[0];
  if (first === undefined) {
    throw new Error(`No .xlsx file found in ${directory}`);
  }
  return path.join(directory, first);
}
