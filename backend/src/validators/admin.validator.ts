import { z } from 'zod';

export const adminQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(0)
    .max(100)
    .optional()
    .default(''),
});

export const storeIdParamSchema = z.object({
  storeId: z.string().trim().min(1).max(64),
});

