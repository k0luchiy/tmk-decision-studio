/**
 * Export adapter and review gate (`docs/04_ux_scenario.md` §8).
 *
 * Export is a computed state: it stays locked until every extracted parameter
 * has been confirmed. The adapter renders JSON, XLSX or PDF and returns a
 * filename, MIME type and bytes. JSON filenames embed the snapshot hash so two
 * exports of the same frozen state are byte-identical by name.
 */

import type { Estimate } from '@app/contract';
import { toPdf } from './pdf.js';
import { snapshotHash, toSnapshot } from './snapshot.js';
import { toXlsx } from './xlsx.js';

/** Supported export formats. */
export type ExportFormat = 'json' | 'xlsx' | 'pdf';

/** Error codes emitted by the export gate. */
export type ExportErrorCode = 'needs_review' | 'incomplete';

/** Raised when an export is blocked by the review gate. */
export class ExportError extends Error {
  readonly code: ExportErrorCode;

  constructor(code: ExportErrorCode, message: string) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
  }
}

/** Minimal shape of an extracted parameter as seen by the gate. */
export interface ExportParam {
  status: string;
}

/** Input of {@link buildExportBundle}. */
export interface BuildExportBundleInput {
  estimate: Estimate;
  params: ExportParam[];
  datasetVersion: string;
  seed: number;
  format: ExportFormat;
}

/** Rendered export ready to be written to disk. */
export interface ExportBundle {
  filename: string;
  mime: string;
  data: Buffer;
}

const MIME: Record<ExportFormat, string> = {
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

function assertReview(input: BuildExportBundleInput): void {
  if (input.params.length === 0) {
    throw new ExportError('incomplete', 'No extracted parameters to review; parse the brief first.');
  }

  const pending = input.params.filter((param) => param.status !== 'confirmed');
  if (pending.length > 0) {
    const statuses = [...new Set(pending.map((param) => param.status))].sort().join(', ');
    throw new ExportError(
      'needs_review',
      `Export blocked: ${pending.length} parameter(s) not confirmed (${statuses}).`,
    );
  }
}

/**
 * Renders the estimate in the requested format.
 *
 * @throws {ExportError} `incomplete` when there is nothing to review,
 * `needs_review` when at least one parameter is not confirmed.
 */
export async function buildExportBundle(input: BuildExportBundleInput): Promise<ExportBundle> {
  assertReview(input);

  const { estimate, datasetVersion, seed, format } = input;

  switch (format) {
    case 'json': {
      const snapshot = toSnapshot({ estimate, datasetVersion, seed, taskRef: estimate.taskId });
      const hash = snapshotHash(snapshot);
      return {
        filename: `${estimate.id}-snapshot-${hash.slice(0, 16)}.json`,
        mime: MIME.json,
        data: Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`, 'utf8'),
      };
    }
    case 'xlsx':
      return {
        filename: `${estimate.id}.xlsx`,
        mime: MIME.xlsx,
        data: toXlsx(estimate),
      };
    case 'pdf':
      return {
        filename: `${estimate.id}.pdf`,
        mime: MIME.pdf,
        data: await toPdf(estimate),
      };
  }
}
