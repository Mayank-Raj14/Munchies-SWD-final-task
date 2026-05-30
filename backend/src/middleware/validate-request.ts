import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Middleware to validate incoming request data using Zod schemas.
 * Supports validation of `params`, `query`, and `body` fields.
 * On validation failure, responds with HTTP 400 and a formatted error.
 */
// NOTE: Many existing route validator schemas are already shaped like:
//   z.object({ params: ... }) / z.object({ query: ... }) / z.object({ body: ... })
// so validateRequest must accept a full ZodSchema that parses into req.params/query/body.
//
// Double-wrapping would break parsing types (e.g. req.body.body).
type ValidatedRequestShape = {
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
  body?: ZodSchema<any>;
};

export const validateRequest = (schema: ZodSchema<any> | ValidatedRequestShape) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('params' in schema && schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if ('query' in schema && schema.query) {
        // Express query is string|string[]; Zod can coerce as needed.
        req.query = schema.query.parse(req.query);
      }
      if ('body' in schema && schema.body) {
        req.body = schema.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          status: 400,
          error: 'ValidationError',
          details: err.errors,
        });
      } else {
        next(err);
      }
    }
  };
};