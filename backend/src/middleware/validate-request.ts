import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const data = result.data as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    if (data.body) {
      req.body = data.body;
    }

    if (data.params) {
      req.params = data.params as typeof req.params;
    }

    if (data.query) {
      req.query = data.query as typeof req.query;
    }

    next();
  };
};
