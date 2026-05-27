import { BookingStatus, Prisma, Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { invalidateCache } from '../utils/cache.js';
import { invalidateAnalyticsCaches } from './analytics.service.js';
import { claimCouponUsage, validateCouponForStore } from './campaign.service.js';
import { assertUserCanUseStore } from './governance.service.js';
import { buildEmailHtml, getStoreSender, sendUserEmail } from './email.service.js';

const BOOKING_EXPIRY_HOURS = 24;

const bookingInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  store: {
    select: {
      id: true,
      name: true,
      roomNumber: true,
      hostel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  items: {
    include: {
      item: {
        select: {
          id: true,
          name: true,
          category: true,
          imageUrl: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

type UserContext = {
  id: string;
  role: Role;
};

type BookingNotificationTarget = {
  id: string;
  userId: string;
  storeId: string;
  status: BookingStatus;
};

type BookingListInput = {
  scope?: 'store' | 'personal';
  page: number;
  limit: number;
  status?: BookingStatus;
  storeId?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'totalAmount';
  sortOrder: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
};

const cancellableStatuses = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.READY,
] as const;

const canRequestCancellation = (status: BookingStatus) => {
  return cancellableStatuses.includes(status as (typeof cancellableStatuses)[number]);
};

const assertStatusTransition = (currentStatus: BookingStatus, nextStatus: BookingStatus) => {
  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [
      BookingStatus.CONFIRMED,
      BookingStatus.CANCEL_REQUESTED,
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
    ],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.READY,
      BookingStatus.CANCEL_REQUESTED,
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
    ],
    [BookingStatus.READY]: [
      BookingStatus.COMPLETED,
      BookingStatus.CANCEL_REQUESTED,
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
    ],
    [BookingStatus.CANCEL_REQUESTED]: [
      BookingStatus.CANCELLED,
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.READY,
    ],
    [BookingStatus.CANCELLED]: [],
    [BookingStatus.COMPLETED]: [],
    [BookingStatus.EXPIRED]: [],
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError('Invalid booking status transition', 400);
  }
};

const getBookingOrThrow = async (bookingId: string, tx: Prisma.TransactionClient) => {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  return booking;
};

const notifyCustomerFromStore = async (booking: BookingNotificationTarget, subject: string, text: string) => {
  const sender = await getStoreSender(booking.storeId);
  await sendUserEmail(booking.userId, {
    subject,
    text,
    html: buildEmailHtml(subject, [text]),
    topic: 'bookings',
    ...sender,
  });
};

const notifyStoreOwner = async (booking: BookingNotificationTarget, subject: string, text: string) => {
  const store = await prisma.store.findUnique({
    where: { id: booking.storeId },
    select: { ownerId: true },
  });
  if (store?.ownerId) {
    await sendUserEmail(store.ownerId, { subject, text, html: buildEmailHtml(subject, [text]), topic: 'bookings' });
  }
};

const restockBookingItems = async (
  tx: Prisma.TransactionClient,
  items: { itemId: string; quantity: number }[],
) => {
  for (const bookingItem of items) {
    await tx.item.update({
      where: { id: bookingItem.itemId },
      data: {
        stock: {
          increment: bookingItem.quantity,
        },
      },
    });
  }
};

const finishBookingWithSingleRestock = async (
  tx: Prisma.TransactionClient,
  bookingId: string,
  input: {
    reason: string;
    status: (typeof BookingStatus)['CANCELLED'] | (typeof BookingStatus)['EXPIRED'];
    reviewedById?: string;
    requireCancellationRequest?: boolean;
  },
) => {
  const now = new Date();
  const claimed = await tx.booking.updateMany({
    where: {
      id: bookingId,
      status: { in: [...cancellableStatuses, BookingStatus.READY, BookingStatus.CANCEL_REQUESTED] },
      inventoryRestoredAt: null,
      ...(input.requireCancellationRequest ? { cancellationRequestedAt: { not: null } } : {}),
    },
    data: {
      status: input.status,
      cancellationReviewedAt: now,
      cancellationRejectedAt: null,
      cancellationReviewedById: input.reviewedById,
      cancellationReason: input.reason,
    },
  });

  if (claimed.count === 0) {
    return null;
  }

  const bookingItems = await tx.bookingItem.findMany({
    where: { bookingId },
    select: {
      itemId: true,
      quantity: true,
    },
  });

  await restockBookingItems(tx, bookingItems);

  await tx.booking.update({
    where: { id: bookingId },
    data: { inventoryRestoredAt: now },
  });

  invalidateBookingCaches();
  return getBookingOrThrow(bookingId, tx);
};

export const checkoutCart = async (userId: string, cartId: string, couponCode?: string) => {
  const booking = await prisma.$transaction(
    async (tx) => {
      const cart = await tx.cart.findFirst({
        where: {
          id: cartId,
          userId,
        },
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  price: true,
                  stock: true,
                  storeId: true,
                  isAvailable: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      await assertUserCanUseStore(userId, cart.storeId, 'checkout from this store', tx);

      if (cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      for (const cartItem of cart.items) {
        if (!cartItem.item.isAvailable || cartItem.item.storeId !== cart.storeId) {
          throw new AppError('Cart contains an unavailable item', 409);
        }

        if (cartItem.quantity > cartItem.item.stock) {
          throw new AppError('Cart quantity exceeds available stock', 400);
        }
      }

      const subtotalAmount = cart.items.reduce((total, cartItem) => {
        return total.plus(new Prisma.Decimal(cartItem.item.price).mul(cartItem.quantity));
      }, new Prisma.Decimal(0));

      const coupon = couponCode
        ? await validateCouponForStore(userId, cart.storeId, couponCode, subtotalAmount, tx)
        : null;
      const discountAmount = coupon
        ? coupon.type === 'PERCENTAGE'
          ? Prisma.Decimal.min(
              subtotalAmount.mul(new Prisma.Decimal(coupon.value)).div(100),
              subtotalAmount,
            )
          : Prisma.Decimal.min(new Prisma.Decimal(coupon.value), subtotalAmount)
        : new Prisma.Decimal(0);
      const totalAmount = Prisma.Decimal.max(
        subtotalAmount.minus(discountAmount),
        new Prisma.Decimal(0),
      );

      for (const cartItem of cart.items) {
        const result = await tx.item.updateMany({
          where: {
            id: cartItem.itemId,
            storeId: cart.storeId,
            isAvailable: true,
            stock: {
              gte: cartItem.quantity,
            },
          },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        });

        if (result.count !== 1) {
          throw new AppError('Cart quantity exceeds available stock', 400);
        }
      }

      const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_HOURS * 60 * 60 * 1000);
      const booking = await tx.booking.create({
        data: {
          userId,
          storeId: cart.storeId,
          campaignId: coupon?.id,
          subtotalAmount,
          discountAmount,
          totalAmount,
          expiresAt,
          items: {
            create: cart.items.map((cartItem) => ({
              itemId: cartItem.itemId,
              quantity: cartItem.quantity,
              price: cartItem.item.price,
            })),
          },
        },
        include: bookingInclude,
      });

      if (coupon) {
        await claimCouponUsage(coupon.id, userId, booking.id, tx);
      }

      await tx.cartItem.deleteMany({
        where: { cartId },
      });

      await tx.cart.delete({
        where: { id: cartId },
      });

      invalidateBookingCaches(cart.storeId, userId);
      return booking;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  void notifyCustomerFromStore(
    booking,
    'Munchies booking created',
    `Booking ${booking.id} was created for ${booking.store.name}.`,
  ).catch(() => undefined);

  return booking;
};

const buildBookingListWhere = (
  user: UserContext,
  input: BookingListInput,
): Prisma.BookingWhereInput => {
  const scopeWhere =
    user.role === Role.ADMIN
      ? input.scope === 'personal'
        ? { userId: user.id }
        : {}
      : user.role === Role.STORE_OWNER && input.scope === 'store'
        ? { store: { ownerId: user.id } }
        : { userId: user.id };

  return {
    ...scopeWhere,
    ...(input.status ? { status: input.status } : {}),
    ...(input.storeId ? { storeId: input.storeId } : {}),
    ...(input.dateFrom || input.dateTo
      ? {
          createdAt: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        }
      : {}),
  };
};

export const listBookings = async (user: UserContext, input: BookingListInput) => {
  const { page, limit, skip, take } = getPagination(input);
  const where = buildBookingListWhere(user, input);

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { [input.sortBy]: input.sortOrder },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

export const getBookingById = async (bookingId: string, user: UserContext) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(user.role === Role.ADMIN
        ? {}
        : user.role === Role.STORE_OWNER
          ? {
              OR: [{ userId: user.id }, { store: { ownerId: user.id } }],
            }
          : { userId: user.id }),
    },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  return booking;
};

export const updateBookingStatus = async (
  bookingId: string,
  user: UserContext,
  status: BookingStatus,
) => {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        ...(user.role === Role.ADMIN ? {} : { store: { ownerId: user.id } }),
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        cancellationRequestedAt: true,
        inventoryRestoredAt: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (
      booking.expiresAt &&
      booking.expiresAt <= new Date() &&
      status !== BookingStatus.CANCELLED
    ) {
      throw new AppError('This order has expired', 409);
    }

    if (booking.cancellationRequestedAt && status !== BookingStatus.CANCELLED) {
      throw new AppError('Resolve the cancellation request before changing booking status', 409);
    }

    assertStatusTransition(booking.status, status);

    if (status === BookingStatus.CANCELLED) {
      const cancelled = await finishBookingWithSingleRestock(tx, bookingId, {
        reason: 'Cancelled by store',
        status: BookingStatus.CANCELLED,
        reviewedById: user.id,
      });

      if (!cancelled) {
        return getBookingOrThrow(bookingId, tx);
      }

      return cancelled;
    }

    const updated = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: booking.status,
        cancellationRequestedAt: null,
      },
      data: {
        status,
        ...(status === BookingStatus.COMPLETED ? { collectedAt: new Date() } : {}),
      },
    });

    if (updated.count !== 1) {
      throw new AppError('Booking was updated by another request', 409);
    }

    const nextBooking = await getBookingOrThrow(bookingId, tx);
    invalidateBookingCaches(nextBooking.storeId, nextBooking.userId);
    return nextBooking;
  });

  void notifyCustomerFromStore(
    booking,
    'Munchies booking status updated',
    `Booking ${booking.id} is now ${booking.status}.`,
  ).catch(() => undefined);

  return booking;
};

export const requestBookingCancellation = async (bookingId: string, userId: string) => {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      select: {
        id: true,
        status: true,
        cancellationRequestedAt: true,
        cancellationRejectedAt: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.cancellationRejectedAt) {
      throw new AppError('Cancellation request has already been reviewed', 409);
    }

    if (!canRequestCancellation(booking.status)) {
      throw new AppError('This booking cannot be cancelled', 400);
    }

    if (booking.cancellationRequestedAt) {
      return getBookingOrThrow(bookingId, tx);
    }

    const updated = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: { in: [...cancellableStatuses] },
        cancellationRequestedAt: null,
      },
      data: {
        status: BookingStatus.CANCEL_REQUESTED,
        cancellationPreviousStatus: booking.status,
        cancellationRequestedAt: new Date(),
        cancellationReviewedAt: null,
        cancellationRejectedAt: null,
        cancellationReviewedById: null,
        cancellationReason: null,
      },
    });

    if (updated.count !== 1) {
      throw new AppError('Booking was updated by another request', 409);
    }

    const nextBooking = await getBookingOrThrow(bookingId, tx);
    invalidateBookingCaches(nextBooking.storeId, nextBooking.userId);
    return nextBooking;
  });

  void notifyStoreOwner(
    booking,
    'Munchies cancellation requested',
    `Cancellation was requested for booking ${booking.id}.`,
  ).catch(() => undefined);

  return booking;
};

export const approveBookingCancellation = async (bookingId: string, user: UserContext) => {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        ...(user.role === Role.ADMIN ? {} : { store: { ownerId: user.id } }),
      },
      select: {
        id: true,
        status: true,
        cancellationRequestedAt: true,
        inventoryRestoredAt: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status === BookingStatus.CANCELLED && booking.inventoryRestoredAt) {
      return getBookingOrThrow(bookingId, tx);
    }

    if (!booking.cancellationRequestedAt) {
      throw new AppError('Cancellation has not been requested', 400);
    }

    if (booking.status !== BookingStatus.CANCEL_REQUESTED) {
      throw new AppError('This booking cannot be cancelled', 400);
    }

    const cancelled = await finishBookingWithSingleRestock(tx, bookingId, {
      reason: 'Cancellation approved',
      status: BookingStatus.CANCELLED,
      reviewedById: user.id,
      requireCancellationRequest: true,
    });

    if (!cancelled) {
      return getBookingOrThrow(bookingId, tx);
    }

    return cancelled;
  });

  void notifyCustomerFromStore(
    booking,
    'Munchies cancellation approved',
    `Cancellation was approved for booking ${booking.id}.`,
  ).catch(() => undefined);

  return booking;
};

export const rejectBookingCancellation = async (bookingId: string, user: UserContext) => {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        ...(user.role === Role.ADMIN ? {} : { store: { ownerId: user.id } }),
      },
      select: {
        id: true,
        status: true,
        cancellationRequestedAt: true,
        cancellationPreviousStatus: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (!booking.cancellationRequestedAt) {
      return getBookingOrThrow(bookingId, tx);
    }

    if (booking.status !== BookingStatus.CANCEL_REQUESTED) {
      throw new AppError('This cancellation request cannot be reviewed', 400);
    }

    const restoredStatus = booking.cancellationPreviousStatus ?? BookingStatus.CONFIRMED;
    assertStatusTransition(booking.status, restoredStatus);

    const updated = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: BookingStatus.CANCEL_REQUESTED,
        cancellationRequestedAt: { not: null },
      },
      data: {
        status: restoredStatus,
        cancellationPreviousStatus: null,
        cancellationRequestedAt: null,
        cancellationReviewedAt: new Date(),
        cancellationRejectedAt: new Date(),
        cancellationReviewedById: user.id,
        cancellationReason: 'Cancellation rejected',
      },
    });

    if (updated.count !== 1) {
      return getBookingOrThrow(bookingId, tx);
    }

    const nextBooking = await getBookingOrThrow(bookingId, tx);
    invalidateBookingCaches(nextBooking.storeId, nextBooking.userId);
    return nextBooking;
  });

  void notifyCustomerFromStore(
    booking,
    'Munchies cancellation rejected',
    `Cancellation was rejected for booking ${booking.id}; status is ${booking.status}.`,
  ).catch(() => undefined);

  return booking;
};

export const expireBookingWithRestock = async (bookingId: string, tx: Prisma.TransactionClient) => {
  return finishBookingWithSingleRestock(tx, bookingId, {
    reason: 'Order expired before collection',
    status: BookingStatus.EXPIRED,
  });
};

export const invalidateBookingCaches = (storeId?: string, userId?: string) => {
  invalidateCache([
    'stores:',
    ...(storeId ? [`store:${storeId}`, `campaigns:${storeId}`] : []),
    ...(userId ? [`stores:owner:${userId}`] : []),
  ]);
  invalidateAnalyticsCaches(storeId, userId);
};
