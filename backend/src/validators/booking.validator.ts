import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    cartId: z.string().uuid('Invalid cart id'),
    couponCode: z.string().trim().max(24).optional(),
  }),
});

export const listBookingsSchema = z.object({
  query: z.object({
    scope: z.enum(['store', 'personal']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.nativeEnum(BookingStatus).optional(),
    storeId: z.string().uuid('Invalid store id').optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmount']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }),
});

export const bookingParamSchema = z.object({
  params: z.object({
    bookingId: z.string().uuid('Invalid booking id'),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    bookingId: z.string().uuid('Invalid booking id'),
  }),
  body: z.object({
    status: z.nativeEnum(BookingStatus),
  }),
});
