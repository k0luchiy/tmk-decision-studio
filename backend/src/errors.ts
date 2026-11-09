/**
 * Unified API error handling (`docs/10_api_contract.md` §3.5).
 *
 * Every failure path funnels through {@link toErrorResponse}, which maps domain
 * errors (`ExportError`, `ZodError`, missing-rate/band) onto the documented HTTP
 * codes. Unknown errors become a bare `500 internal_error`; stacks never leave
 * the server.
 */

import type { FastifyInstance } from 'fastify';
import { MissingBandError, MissingRateError } from '@app/core';
import { ExportError } from '@app/export';
import { ZodError } from 'zod';

/** Free-form diagnostic payload attached to an error response. */
export type ErrorDetails = Record<string, unknown>;

/** Structured error returned by the API. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: ErrorDetails;
  };
}

/** An error that already knows its HTTP status and machine-readable code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetails | undefined;

  constructor(status: number, code: string, message: string, details?: ErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function bodyOf(code: string, message: string, details?: ErrorDetails): ErrorBody {
  return details === undefined ? { error: { code, message } } : { error: { code, message, details } };
}

/** Maps any thrown value to an HTTP status and the documented error envelope. */
export function toErrorResponse(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof ApiError) {
    return { status: error.status, body: bodyOf(error.code, error.message, error.details) };
  }

  if (error instanceof ExportError) {
    return {
      status: error.code === 'needs_review' ? 409 : 422,
      body: bodyOf(error.code, error.message),
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 422,
      body: bodyOf('validation_error', 'Request failed validation', { issues: error.issues }),
    };
  }

  if (error instanceof MissingRateError || error instanceof MissingBandError) {
    return { status: 422, body: bodyOf('validation_error', error.message) };
  }

  return { status: 500, body: bodyOf('internal_error', 'Internal server error') };
}

/** Installs the error handler and a JSON 404 handler on the Fastify instance. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const { status, body } = toErrorResponse(error);
    if (status >= 500) {
      request.log.error({ err: error }, 'unhandled request error');
    }
    reply.status(status).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(bodyOf('not_found', `Route not found: ${request.method} ${request.url}`));
  });
}
