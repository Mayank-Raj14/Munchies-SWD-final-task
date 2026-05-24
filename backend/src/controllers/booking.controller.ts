import { BookingStatus } from '@prisma/client';
import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  approveBookingCancellation,
  checkoutCart,
  getBookingById,
  listBookings,
  rejectBookingCancellation,
  requestBookingCancellation,
  updateBookingStatus,
} from '../services/booking.service.js';

export const checkout = async (req: AuthenticatedRequest, res: Response) => {
  const booking = await checkoutCart(req.user?.id ?? '', req.body.cartId);

  res.status(201).json({ booking });
};

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listBookings(req.user ?? { id: '', role: 'USER' }, {
    scope: req.query.scope as 'store' | 'personal' | undefined,
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 20),
    status: req.query.status as BookingStatus | undefined,
    storeId: req.query.storeId ? String(req.query.storeId) : undefined,
    sortBy: (req.query.sortBy as 'createdAt' | 'updatedAt' | 'totalAmount') ?? 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') ?? 'desc',
    dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
    dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
  });

  res.status(200).json(result);
};

export const getBooking = async (req: AuthenticatedRequest, res: Response) => {
  const booking = await getBookingById(
    req.params.bookingId ?? '',
    req.user ?? { id: '', role: 'USER' },
  );

  res.status(200).json({ booking });
};

export const updateStatus = async (req: AuthenticatedRequest, res: Response) => {
  const booking = await updateBookingStatus(
    req.params.bookingId ?? '',
    req.user ?? { id: '', role: 'USER' },
    req.body.status,
  );

  res.status(200).json({ booking });
};

export const requestCancellation = async (req: AuthenticatedRequest, res: Response) => {
  const booking = await requestBookingCancellation(req.params.bookingId ?? '', req.user?.id ?? '');

  res.status(200).json({ booking });
};

export const approveCancellation = async (req: AuthenticatedRequest, res: Response) => {
  const booking = await approveBookingCancellation(
    req.params.bookingId ?? '',
    req.user ?? { id: '', role: 'USER' },
  );

  res.status(200).json({ booking });
};

export const rejectCancellation = async (req: AuthenticatedRequest, res: Response) => {
  const booking = await rejectBookingCancellation(
    req.params.bookingId ?? '',
    req.user ?? { id: '', role: 'USER' },
  );

  res.status(200).json({ booking });
};
