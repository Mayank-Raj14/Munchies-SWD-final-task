import { z } from 'zod';

export const createStoreOwnershipRequestSchema = z.object({
  body: z.object({
    hostelId: z.string().uuid('Invalid hostel id'),
    storeName: z.string().trim().min(2, 'Store name must be at least 2 characters'),
    roomNumber: z.string().trim().min(1, 'Room number is required'),
  }),
});

export const requestIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid request id'),
  }),
});
