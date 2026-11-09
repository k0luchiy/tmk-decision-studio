/**
 * `POST /api/import/helpdesk` — multipart `.xlsx` import (`docs/10_api_contract.md` §3).
 * Returns the quality report plus row counts; task/work-item bodies are not echoed.
 */

import type { FastifyInstance } from 'fastify';
import { parseHelpdeskWorkbook } from '@app/data';
import * as XLSX from 'xlsx';
import { ApiError } from '../errors.js';

export async function importRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/import/helpdesk', async (request) => {
    const upload = await request.file();
    if (upload === undefined) {
      throw new ApiError(422, 'validation_error', 'Multipart field "file" is required');
    }

    const buffer = await upload.toBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const { report, tasks, workItems } = parseHelpdeskWorkbook(workbook);

    return { report, tasks: tasks.length, workItems: workItems.length };
  });
}
