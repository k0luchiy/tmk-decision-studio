/** Shared fixtures and helpers for the HelpDesk import/quality test cases. */

import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { parseHelpdeskWorkbook } from './helpdesk.js';
import { loadDatasets } from './loaders.js';
import type { Datasets } from './types.js';

export const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

export const HEADERS = [
  'Номер',
  'Изменение.Номер',
  'Вид',
  'Заголовок',
  'Специалист',
  'Рабочая группа',
  'Состояние',
  'Тип активности ЗНИ',
  'Дата создания',
  'Описание',
  'Плановая дата завершения',
  'Фактическое завершение',
  'Дата изменения',
  'Фактическая трудоемкость (часов)',
  'Плановая трудоемкость (часов)',
  'Заквотированное время, часы',
];

/** Builds one HelpDesk row; `overrides` keys are column indexes from `HEADERS`. */
export function makeRow(
  overrides: Partial<Record<number, string | number>> = {},
): Array<string | number> {
  const base: Array<string | number> = [
    'IM00000001',
    'CR00000001',
    'Изменение',
    'Задача',
    'Специалист 1',
    'Л3. ДИАЙПИ. 1С Производство',
    'Завершена',
    'Реализация изменения',
    '01.01.2026 10:00',
    '',
    '10.01.2026 10:00',
    '05.01.2026 10:00',
    '05.01.2026 10:00',
    1,
    2,
    1,
  ];
  for (const [index, value] of Object.entries(overrides)) {
    base[Number(index)] = value as string | number;
  }
  return base;
}

/**
 * Mirrors the real import path without touching disk: array-of-arrays sheet ->
 * CSV string -> workbook, exactly as the task requires.
 */
export function workbookFromRows(rows: Array<Array<string | number>>): XLSX.WorkBook {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return XLSX.read(csv, { type: 'string' });
}

export function parse(rows: Array<Array<string | number>>) {
  return parseHelpdeskWorkbook(workbookFromRows(rows));
}

export function hasWarning(warnings: readonly string[], suffix: string): boolean {
  return warnings.some((warning) => warning.endsWith(suffix));
}

export function countWarnings(warnings: readonly string[], suffix: string): number {
  return warnings.filter((warning) => warning.endsWith(suffix)).length;
}

export async function loadRealDatasets(): Promise<Datasets> {
  return loadDatasets(repositoryRoot);
}
