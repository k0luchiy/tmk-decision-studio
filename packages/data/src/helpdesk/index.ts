/** Public HelpDesk import API: workbook/file parsing and file discovery. */

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { DataQualityReport } from '@app/contract';
import * as XLSX from 'xlsx';
import { repositoryRoot } from '../loaders.js';
import { mapRows } from './map.js';
import { readSheet, type HelpdeskResult } from './parse.js';

export type { HelpdeskResult } from './parse.js';

/** Parses an already-read workbook into tasks, flat work items and a quality report. */
export function parseHelpdeskWorkbook(wb: XLSX.WorkBook): HelpdeskResult {
  const mapped = mapRows(readSheet(wb));

  const report: DataQualityReport = {
    dataset: 'helpdesk',
    rowsTotal: mapped.rowsTotal,
    rowsOk: mapped.rowsTotal - mapped.rowsDropped.length,
    rowsDropped: mapped.rowsDropped,
    anomalies: [],
    warnings: mapped.warnings,
  };

  return { tasks: mapped.tasks, workItems: mapped.workItems, report };
}

/** Reads and parses a HelpDesk `.xlsx` file. */
export async function parseHelpdeskFile(filePath: string): Promise<HelpdeskResult> {
  const workbook = XLSX.readFile(filePath);
  return parseHelpdeskWorkbook(workbook);
}

/** Finds the first `*.xlsx` inside `<baseDir>/data/import` (Unicode-safe). */
export async function findHelpdeskFile(baseDir: string = repositoryRoot()): Promise<string> {
  const directory = path.join(baseDir, 'data', 'import');
  const entries = await readdir(directory);
  const xlsxFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.xlsx')).sort();
  const first = xlsxFiles[0];
  if (first === undefined) {
    throw new Error(`No .xlsx file found in ${directory}`);
  }
  return path.join(directory, first);
}
