/** `GET /api/health` — liveness probe (`docs/10_api_contract.md` §3). */

import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => ({ status: 'ok' as const, uptime: process.uptime() }));
}
