import { BookingStatus, Prisma, Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

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
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const canRequestCancellation = (status: BookingStatus) => {
  return status === BookingStatus.PENDING || status === BookingStatus.CONFIRMED;
};

const assertStatusTransition = (currentStatus: BookingStatus, nextStatus: BookingStatus) => {
  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED],
    [BookingStatus.CANCELLED]: [],
    [BookingStatus.COMPLETED]: [],
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError('Invalid booking status transition', 400);
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

export const checkoutCart = async (userId: string, cartId: string) => {
  return prisma.$transaction(async (tx) => {
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
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    for (const cartItem of cart.items) {
      if (cartItem.quantity > cartItem.item.stock) {
        throw new AppError('Cart quantity exceeds available stock', 400);
      }
    }

    const totalAmount = cart.items.reduce((total, cartItem) => {
      return total.plus(new Prisma.Decimal(cartItem.item.price).mul(cartItem.quantity));
    }, new Prisma.Decimal(0));

    for (const cartItem of cart.items) {
      const result = await tx.item.updateMany({
        where: {
          id: cartItem.itemId,
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

    const booking = await tx.booking.create({
      data: {
        userId,
        storeId: cart.storeId,
        totalAmount,
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

    await tx.cartItem.deleteMany({
      where: { cartId },
    });

    await tx.cart.delete({
      where: { id: cartId },
    });

    return booking;
  });
};

const buildBookingListWhere = (
  user: { id: string; role: Role },
  scope?: 'store' | 'personal',
): Prisma.BookingWhereInput => {
  if (user.role === Role.ADMIN) {
    return scope === 'personal' ? { userId: user.id } : {};
  }

  if (user.role === Role.STORE_OWNER && scope === 'store') {
    return { store: { ownerId: user.id } };
  }

  return { userId: user.id };
};

export const listBookings = async (
  user: { id: string; role: Role },
  scope?: 'store' | 'personal',
) => {
  return prisma.booking.findMany({
    where: buildBookingListWhere(user, scope),
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  });
};

export const getBookingById = async (bookingId: string, user: { id: string; role: Role }) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(user.role === Role.ADMIN
        ? {}
        : user.role === Role.STORE_OWNER
          ? { store: { ownerId: user.id } }
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
  user: { id: string; role: Role },
  status: BookingStatus,
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(user.role === Role.ADMIN ? {} : { store: { ownerId: user.id } }),
    },
    select: {
      id: true,
      status: true,
      cancellationRequestedAt: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.cancellationRequestedAt) {
    throw new AppError('Resolve the cancellation request before changing booking status', 409);
  }

  assertStatusTransition(booking.status, status);

  if (status === BookingStatus.CANCELLED && booking.status === BookingStatus.PENDING) {
    return prisma.$transaction(async (tx) => {
      const bookingItems = await tx.bookingItem.findMany({
        where: { bookingId },
        select: {
          itemId: true,
          quantity: true,
        },
      });

      await restockBookingItems(tx, bookingItems);

      return tx.booking.update({
        where: { id: bookingId },
        data: { status },
        include: bookingInclude,
      });
    });
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    include: bookingInclude,
  });
};

export const requestBookingCancellation = async (bookingId: string, userId: string) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    select: {
      id: true,
      status: true,
      cancellationRequestedAt: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (!canRequestCancellation(booking.status)) {
    throw new AppError('This booking cannot be cancelled', 400);
  }

  if (booking.cancellationRequestedAt) {
    throw new AppError('Cancellation has already been requested', 409);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      cancellationRequestedAt: new Date(),
      cancellationReviewedAt: null,
      cancellationRejectedAt: null,
    },
    include: bookingInclude,
  });
};

export const approveBookingCancellation = async (
  bookingId: string,
  user: { id: string; role: Role },
) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        ...(user.role === Role.ADMIN ? {} : { store: { ownerId: user.id } }),
      },
      include: {
        items: {
          select: {
            itemId: true,
            quantity: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (!booking.cancellationRequestedAt) {
      throw new AppError('Cancellation has not been requested', 400);
    }

    if (!canRequestCancellation(booking.status)) {
      throw new AppError('This booking cannot be cancelled', 400);
    }

    await restockBookingItems(tx, booking.items);

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReviewedAt: new Date(),
        cancellationRejectedAt: null,
      },
      include: bookingInclude,
    });
  });
};

export const rejectBookingCancellation = async (
  bookingId: string,
  user: { id: string; role: Role },
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(user.role === Role.ADMIN ? {} : { store: { ownerId: user.id } }),
    },
    select: {
      id: true,
      status: true,
      cancellationRequestedAt: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (!booking.cancellationRequestedAt) {
    throw new AppError('Cancellation has not been requested', 400);
  }

  if (!canRequestCancellation(booking.status)) {
    throw new AppError('This cancellation request cannot be reviewed', 400);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      cancellationRequestedAt: null,
      cancellationReviewedAt: new Date(),
      cancellationRejectedAt: new Date(),
    },
    include: bookingInclude,
  });
};
