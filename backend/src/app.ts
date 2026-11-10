/**
 * Fastify application factory (`docs/10_api_contract.md` §2–3).
 *
 * `buildApp` wires CORS, multipart uploads, the unified error handler and every
 * `/api` route. It never calls `listen`, so tests can use `app.inject`.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { registerErrorHandler } from './errors.js';
import { dataRoutes } from './routes/data.js';
import { datasetsRoutes } from './routes/datasets.js';
import { estimatesRoutes } from './routes/estimates.js';
import { exportRoutes } from './routes/export.js';
import { healthRoutes } from './routes/health.js';
import { importRoutes } from './routes/import.js';
import { intakeRoutes } from './routes/intake.js';
import { metaRoutes } from './routes/meta.js';

/** Request body cap from the contract: 256 KB. */
export const BODY_LIMIT = 256 * 1024;

/** Creates a configured Fastify instance without binding a port. */
export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false, bodyLimit: BODY_LIMIT });

  app.register(cors, { origin: true });
  app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  registerErrorHandler(app);

  app.register(healthRoutes);
  app.register(metaRoutes);
  app.register(datasetsRoutes);
  app.register(dataRoutes);
  app.register(intakeRoutes);
  app.register(estimatesRoutes);
  app.register(exportRoutes);
  app.register(importRoutes);

  return app;
}
