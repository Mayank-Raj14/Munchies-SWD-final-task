import { Role } from '@prisma/client';
import { Router } from 'express';

import {
  approveCancellation,
  checkout,
  getBooking,
  getBookings,
  rejectCancellation,
  requestCancellation,
  updateStatus,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  bookingParamSchema,
  checkoutSchema,
  listBookingsSchema,
  updateBookingStatusSchema,
} from '../validators/booking.validator.js';

export const bookingRouter = Router();

bookingRouter.use(authenticate, requireRole(Role.USER, Role.STORE_OWNER, Role.ADMIN));
bookingRouter.post(
  '/checkout',
  rateLimit({ keyPrefix: 'checkout', max: 12, windowMs: 60 * 1000 }),
  validateRequest(checkoutSchema),
  asyncHandler(checkout),
);
bookingRouter.get('/', validateRequest(listBookingsSchema), asyncHandler(getBookings));
bookingRouter.get('/:bookingId', validateRequest(bookingParamSchema), asyncHandler(getBooking));
bookingRouter.post(
  '/:bookingId/cancellation-request',
  validateRequest(bookingParamSchema),
  asyncHandler(requestCancellation),
);
bookingRouter.patch(
  '/:bookingId/cancellation/approve',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(bookingParamSchema),
  asyncHandler(approveCancellation),
);
bookingRouter.patch(
  '/:bookingId/cancellation/reject',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(bookingParamSchema),
  asyncHandler(rejectCancellation),
);
bookingRouter.patch(
  '/:bookingId/status',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(updateBookingStatusSchema),
  asyncHandler(updateStatus),
);
