import { z } from 'zod';

const analyticsDateQuery = z
  .object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000).optional(),
  })
  .refine((value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
    message: 'dateFrom must be before or equal to dateTo',
    path: ['dateTo'],
  });

export const storeAnalyticsParamSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
  }),
  query: analyticsDateQuery,
});

export const userAnalyticsQuerySchema = z.object({
  query: analyticsDateQuery,
});
