import { randomUUID } from 'crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}

export function notFound(message = 'Resource not found') {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function validationFailed(message: string, details?: unknown) {
  return new ApiError(400, 'VALIDATION_FAILED', message, details);
}

export function sendError(res: Response, err: ApiError, traceId: string) {
  res.status(err.status).json({
    error: {
      code: err.code,
      message: err.message,
      traceId,
      details: err.details
    }
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const traceId = getTraceId(req);
  res.setHeader('x-trace-id', traceId);
  if (err instanceof ApiError) {
    sendError(res, err, traceId);
    return;
  }
  if (err instanceof ZodError) {
    sendError(res, validationFailed('Request validation failed', err.flatten()), traceId);
    return;
  }
  if (isBodyParserError(err)) {
    sendError(res, validationFailed('Malformed JSON request body'), traceId);
    return;
  }
  console.error({ traceId }, 'Unhandled API error');
  sendError(res, new ApiError(500, 'INTERNAL_ERROR', 'Unexpected server error'), traceId);
}

// Trace ID is always generated server-side — client-supplied x-request-id is ignored
export function getTraceId(req: Request) {
  if (!req.traceId) {
    req.traceId = randomUUID();
  }
  return req.traceId;
}

export const traceMiddleware: RequestHandler = (req, res, next) => {
  const traceId = getTraceId(req);
  res.setHeader('x-trace-id', traceId);
  next();
};

function isBodyParserError(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed'
  );
}
