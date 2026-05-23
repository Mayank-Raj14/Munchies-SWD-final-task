import { BookingStatus } from '@prisma/client';
import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    cartId: z.string().uuid('Invalid cart id'),
  }),
});

export const listBookingsSchema = z.object({
  query: z.object({
    scope: z.enum(['store', 'personal']).optional(),
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
