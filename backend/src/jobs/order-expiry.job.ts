import { BookingStatus, WarningType } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { expireBookingWithRestock } from '../services/booking.service.js';
import { getStoreSender, sendUserEmail } from '../services/email.service.js';
import { issueWarning } from '../services/governance.service.js';

const EXPIRY_BATCH_SIZE = 50;

export const expireUncollectedOrders = async (now = new Date()) => {
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.READY,
          BookingStatus.CANCEL_REQUESTED,
        ],
      },
      expiresAt: { lte: now },
      inventoryRestoredAt: null,
      expiredWarningIssuedAt: null,
    },
    select: {
      id: true,
    },
    orderBy: { expiresAt: 'asc' },
    take: EXPIRY_BATCH_SIZE,
  });

  let expiredCount = 0;

  for (const booking of expiredBookings) {
    const expired = await prisma.$transaction(async (tx) => {
      const cancelled = await expireBookingWithRestock(booking.id, tx);

      if (!cancelled) {
        return null;
      }

      await issueWarning({
        userId: cancelled.userId,
        storeId: cancelled.storeId,
        bookingId: cancelled.id,
        type: WarningType.ORDER_EXPIRED,
        reason: 'Order expired before collection',
        db: tx,
      });

      await tx.booking.updateMany({
        where: {
          id: cancelled.id,
          expiredWarningIssuedAt: null,
        },
        data: {
          expiredWarningIssuedAt: now,
        },
      });

      const store = await tx.store.findUnique({
        where: { id: cancelled.storeId },
        select: { ownerId: true },
      });

      return {
        bookingId: cancelled.id,
        userId: cancelled.userId,
        ownerId: store?.ownerId,
        storeId: cancelled.storeId,
      };
    });

    if (expired) {
      expiredCount += 1;
      void getStoreSender(expired.storeId).then((sender) => sendUserEmail(expired.userId, {
        subject: 'Munchies order expired',
        text: `Booking ${expired.bookingId} expired after 24 hours and inventory was restored.`,
        topic: 'bookings',
        ...sender,
      })).catch(() => undefined);
      if (expired.ownerId) {
        void sendUserEmail(expired.ownerId, {
          subject: 'Munchies order expired',
          text: `Booking ${expired.bookingId} expired after 24 hours and inventory was restored.`,
          topic: 'bookings',
          fromName: 'Munchies',
        }).catch(() => undefined);
      }
    }
  }

  return { scanned: expiredBookings.length, expired: expiredCount };
};
