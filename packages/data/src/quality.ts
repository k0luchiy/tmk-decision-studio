import type { DataQualityReport } from '@app/contract';
import type { Datasets } from './types.js';
import { validateDatasets, type ValidationIssue } from './validators.js';

/** Datasets reported on, in the order they are printed and aggregated. */
const DATASET_NAMES = [
  'rateCards',
  'contractorRates',
  'archetypes',
  'analogues',
  'coefficients',
  'contracts',
] as const;

type DatasetName = (typeof DATASET_NAMES)[number];

export interface QualityAggregate {
  datasets: number;
  rowsTotal: number;
  rowsOk: number;
  errors: number;
  warnings: number;
}

export interface QualityReport {
  datasets: DataQualityReport[];
  aggregate: QualityAggregate;
  datasetVersion: string;
}

function lengthOf(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function sectionCount(value: unknown): number {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return 0;
  }
  return Object.keys(value).filter((key) => key !== 'meta').length;
}

/** Row total for each dataset: entity rows where the file is a list, sections otherwise. */
function rowsTotalOf(data: Datasets): Record<DatasetName, number> {
  return {
    rateCards: lengthOf(data.rateCards?.roles),
    contractorRates: lengthOf(data.contractorRates?.bands),
    archetypes: lengthOf(data.archetypes?.archetypes),
    analogues: lengthOf(data.analogues?.analogues) + lengthOf(data.analogues?.tmk_eis_rows),
    coefficients: sectionCount(data.coefficients),
    contracts: lengthOf(data.contracts),
  };
}

/** Maps a validation path (`archetypes.archetypes[0]...`) to its owning dataset. */
function datasetOfPath(path: string): DatasetName | null {
  const separators = [path.indexOf('.'), path.indexOf('[')].filter((index) => index >= 0);
  const end = separators.length > 0 ? Math.min(...separators) : path.length;
  const head = path.slice(0, end);
  return (DATASET_NAMES as readonly string[]).includes(head) ? (head as DatasetName) : null;
}

function isSeverity(issue: ValidationIssue, severity: ValidationIssue['severity']): boolean {
  return issue.severity === severity;
}

/**
 * Builds one `DataQualityReport` for a dataset. Error issues drop a row (the
 * path is the row reference) and become anomalies; warnings are kept verbatim.
 */
export function buildDatasetQuality(
  name: string,
  rowsTotal: number,
  rowsOk: number,
  issues: ValidationIssue[],
): DataQualityReport {
  const errors = issues.filter((issue) => isSeverity(issue, 'error'));
  const warnings = issues.filter((issue) => isSeverity(issue, 'warning'));

  return {
    dataset: name,
    rowsTotal,
    rowsOk,
    rowsDropped: errors.map((issue) => ({ row: issue.path, reason: issue.message })),
    anomalies: errors.map((issue) => issue.message),
    warnings: warnings.map((issue) => issue.message),
  };
}

/**
 * Builds the full dataset quality report. It never throws: validation failures
 * are folded into the aggregate counts instead of propagating to callers, and
 * nothing is written to disk.
 */
export function buildQualityReport(data: Datasets): QualityReport {
  let issues: ValidationIssue[];
  try {
    issues = validateDatasets(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues = [{ code: 'VALIDATION_FAILED', severity: 'error', path: 'datasets', message }];
  }

  const rowsTotals = rowsTotalOf(data);
  const grouped = new Map<DatasetName, ValidationIssue[]>();

  for (const issue of issues) {
    const dataset = datasetOfPath(issue.path);
    if (dataset === null) {
      continue;
    }
    const list = grouped.get(dataset);
    if (list === undefined) {
      grouped.set(dataset, [issue]);
    } else {
      list.push(issue);
    }
  }

  const datasetVersion = data.manifest?.datasetVersion ?? '';
  const reports = DATASET_NAMES.map((name) => {
    const datasetIssues = grouped.get(name) ?? [];
    const rowsTotal = rowsTotals[name];
    const errorCount = datasetIssues.filter((issue) => isSeverity(issue, 'error')).length;
    const rowsOk = Math.max(0, rowsTotal - errorCount);
    return {
      ...buildDatasetQuality(name, rowsTotal, rowsOk, datasetIssues),
      datasetVersion,
    };
  });

  const rowsTotal = DATASET_NAMES.reduce((sum, name) => sum + rowsTotals[name], 0);
  const errors = issues.filter((issue) => isSeverity(issue, 'error')).length;
  const warnings = issues.filter((issue) => isSeverity(issue, 'warning')).length;

  return {
    datasets: reports,
    aggregate: {
      datasets: reports.length,
      rowsTotal,
      rowsOk: Math.max(0, rowsTotal - errors),
      errors,
      warnings,
    },
    datasetVersion,
  };
}
