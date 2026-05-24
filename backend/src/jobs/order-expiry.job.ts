import { BookingStatus, WarningType } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { expireBookingWithRestock } from '../services/booking.service.js';
import { issueWarning } from '../services/governance.service.js';

const EXPIRY_BATCH_SIZE = 50;

export const expireUncollectedOrders = async (now = new Date()) => {
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
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
        return false;
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

      return true;
    });

    if (expired) {
      expiredCount += 1;
    }
  }

  return { scanned: expiredBookings.length, expired: expiredCount };
};
