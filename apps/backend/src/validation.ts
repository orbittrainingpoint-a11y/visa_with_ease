import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { validationFailed } from './errors.js';

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(validationFailed('Request body validation failed', parsed.error.flatten()));
      return;
    }
    req.body = parsed.data as z.infer<TSchema>;
    next();
  };
}

export function validateVisaContextBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body.visaContext ?? req.body);
    if (!parsed.success) {
      next(validationFailed('Valid visaContext is required', parsed.error.flatten()));
      return;
    }
    req.body = { visaContext: parsed.data };
    next();
  };
}
