import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApiError } from '../errors.js';
import {
  importCandidates,
  loadHub,
  publishApproved,
  refreshSource,
  setCandidateStatus,
} from '../dataHub/store.js';
import { parseRows } from '../dataHub/parse.js';

const PublishSchema = z.object({
  changelog: z.string().min(1).max(500).optional(),
  approvedBy: z.string().min(1).max(80).optional(),
});

const RefreshSchema = z.object({
  sourceId: z.string().min(1),
});

export async function dataRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/data/hub', async () => loadHub());

  app.post('/api/data/import', async (request) => {
    const upload = await request.file();
    if (upload === undefined) {
      throw new ApiError(422, 'validation_error', 'Multipart field "file" is required');
    }
    const query = request.query as { sourceId?: string };
    const sourceId = query.sourceId?.trim() || 'manual';
    const buffer = await upload.toBuffer();
    let rows: Record<string, unknown>[];
    try {
      rows = parseRows(buffer, upload.filename);
    } catch {
      throw new ApiError(422, 'invalid_file', 'Cannot parse the uploaded file');
    }
    return importCandidates(rows, sourceId);
  });

  app.post('/api/data/candidates/:id/approve', async (request) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    return setCandidateStatus(params.id, 'approved');
  });

  app.post('/api/data/candidates/:id/reject', async (request) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    return setCandidateStatus(params.id, 'rejected');
  });

  app.post('/api/data/publish', async (request) => {
    const body = PublishSchema.parse(request.body ?? {});
    return publishApproved(
      body.changelog ?? 'Публикация одобренных аналогов',
      body.approvedBy ?? 'data-owner',
    );
  });

  app.post('/api/data/refresh', async (request) => {
    const body = RefreshSchema.parse(request.body ?? {});
    return refreshSource(body.sourceId);
  });
}
