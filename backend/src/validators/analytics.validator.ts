import { z } from 'zod';

const analyticsDateQuery = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
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
