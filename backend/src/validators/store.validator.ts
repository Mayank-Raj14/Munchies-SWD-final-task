import { z } from 'zod';

export const storeListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(12),
    search: z.string().trim().optional(),
  }),
});

export const storeIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid store id'),
  }),
});

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Store name must be at least 2 characters'),
    hostelId: z.string().uuid('Invalid hostel id'),
    roomNumber: z.string().trim().min(1, 'Room number is required'),
  }),
});

export const updateStoreSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid store id'),
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Store name must be at least 2 characters').optional(),
    hostelId: z.string().uuid('Invalid hostel id').optional(),
    roomNumber: z.string().trim().min(1, 'Room number is required').optional(),
  }),
});
