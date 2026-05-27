import { BookingStatus, Prisma, Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { cacheKeys, getCached, invalidateCache } from '../utils/cache.js';

type UserContext = {
  id: string;
  role: Role;
};

type AnalyticsDateRange = {
  dateFrom?: Date;
  dateTo?: Date;
  lowStockThreshold?: number;
};

const LOW_STOCK_THRESHOLD = 5;
const ANALYTICS_TTL_MS = 8_000;

const startOfUtcWeek = (date: Date) => {
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
};

const startOfUtcMonth = (date: Date) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

const decimalToNumber = (value?: Prisma.Decimal | null) => Number(value ?? 0);

const createdAtRange = (input: AnalyticsDateRange) =>
  input.dateFrom || input.dateTo
    ? {
        createdAt: {
          ...(input.dateFrom ? { gte: input.dateFrom } : {}),
          ...(input.dateTo ? { lte: input.dateTo } : {}),
        },
      }
    : {};

const ensureStoreAnalyticsAccess = async (storeId: string, user: UserContext) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (user.role !== Role.ADMIN && store.ownerId !== user.id) {
    throw new AppError('You can only view analytics for your own stores', 403);
  }
};

export const getStoreAnalytics = async (
  storeId: string,
  user: UserContext,
  input: AnalyticsDateRange = {},
  now = new Date(),
) => {
  const normalizedInput = {
    dateFrom: input.dateFrom?.toISOString(),
    dateTo: input.dateTo?.toISOString(),
    lowStockThreshold: input.lowStockThreshold ?? LOW_STOCK_THRESHOLD,
  };
  const key = cacheKeys.storeAnalytics(storeId, user.id, normalizedInput);

  return getCached(key, ANALYTICS_TTL_MS, async () => {
    await ensureStoreAnalyticsAccess(storeId, user);

    const completedWhere = {
      storeId,
      status: BookingStatus.COMPLETED,
      ...createdAtRange(input),
    };
    const lowStockThreshold = input.lowStockThreshold ?? LOW_STOCK_THRESHOLD;

    const [totalRevenue, weeklyRevenue, monthlyRevenue, bookingStats, lowStockItems] =
      await prisma.$transaction([
        prisma.booking.aggregate({
          where: completedWhere,
          _sum: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: {
            ...completedWhere,
            createdAt: {
              gte:
                input.dateFrom && input.dateFrom > startOfUtcWeek(now)
                  ? input.dateFrom
                  : startOfUtcWeek(now),
              ...(input.dateTo ? { lte: input.dateTo } : {}),
            },
          },
          _sum: { totalAmount: true },
        }),
        prisma.booking.aggregate({
          where: {
            ...completedWhere,
            createdAt: {
              gte:
                input.dateFrom && input.dateFrom > startOfUtcMonth(now)
                  ? input.dateFrom
                  : startOfUtcMonth(now),
              ...(input.dateTo ? { lte: input.dateTo } : {}),
            },
          },
          _sum: { totalAmount: true },
        }),
        prisma.booking.groupBy({
          by: ['status'],
          where: { storeId, ...createdAtRange(input) },
          _count: { id: true },
          orderBy: { status: 'asc' },
        }),
        prisma.item.findMany({
          where: {
            storeId,
            isActive: true,
            stock: { lte: lowStockThreshold },
          },
          select: {
            id: true,
            name: true,
            stock: true,
          },
          orderBy: { stock: 'asc' },
        }),
      ]);

    const soldItems = await prisma.bookingItem.groupBy({
      by: ['itemId'],
      where: {
        booking: completedWhere,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    });

    const soldItemIds = soldItems.map((item) => item.itemId);
    const items = soldItemIds.length
      ? await prisma.item.findMany({
          where: { id: { in: soldItemIds } },
          select: { id: true, name: true },
        })
      : [];
    const itemById = new Map(items.map((item) => [item.id, item]));

    const toSoldItem = (item?: (typeof soldItems)[number]) =>
      item
        ? {
            item: itemById.get(item.itemId) ?? { id: item.itemId, name: 'Deleted item' },
            quantity: item._sum.quantity ?? 0,
          }
        : null;

    return {
      revenue: {
        total: decimalToNumber(totalRevenue._sum.totalAmount),
        weekly: decimalToNumber(weeklyRevenue._sum.totalAmount),
        monthly: decimalToNumber(monthlyRevenue._sum.totalAmount),
      },
      mostSoldItem: toSoldItem(soldItems[0]),
      leastSoldItem: toSoldItem(soldItems.at(-1)),
      bookingStatistics: bookingStats.reduce<Record<string, number>>((stats, stat) => {
        const count = typeof stat._count === 'object' ? (stat._count.id ?? 0) : 0;
        stats[stat.status] = count;
        return stats;
      }, {}),
      lowStockThreshold,
      lowStockItems,
    };
  });
};

export const getUserAnalytics = async (userId: string, input: AnalyticsDateRange = {}) => {
  const normalizedInput = {
    dateFrom: input.dateFrom?.toISOString(),
    dateTo: input.dateTo?.toISOString(),
  };
  const key = cacheKeys.userAnalytics(userId, normalizedInput);

  return getCached(key, ANALYTICS_TTL_MS, async () => {
    const completedWhere = {
      userId,
      status: BookingStatus.COMPLETED,
      ...createdAtRange(input),
    };

    const [spending, totalBookings, favoriteStores, bookings] = await prisma.$transaction([
      prisma.booking.aggregate({
        where: completedWhere,
        _sum: { totalAmount: true },
      }),
      prisma.booking.count({ where: { userId, ...createdAtRange(input) } }),
      prisma.booking.groupBy({
        by: ['storeId'],
        where: completedWhere,
        _count: { _all: true },
        orderBy: { _count: { storeId: 'desc' } },
        take: 1,
      }),
      prisma.booking.findMany({
        where: completedWhere,
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const favoriteItems = await prisma.bookingItem.groupBy({
      by: ['itemId'],
      where: {
        booking: completedWhere,
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    });

    const favoriteStore = favoriteStores[0]
      ? await prisma.store.findUnique({
          where: { id: favoriteStores[0].storeId },
          select: { id: true, name: true },
        })
      : null;

    const favoriteItem = favoriteItems[0]
      ? await prisma.item.findUnique({
          where: { id: favoriteItems[0].itemId },
          select: { id: true, name: true },
        })
      : null;

    const monthlySpending = bookings.reduce<Record<string, number>>((months, booking) => {
      const monthKey = `${booking.createdAt.getUTCFullYear()}-${String(
        booking.createdAt.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      months[monthKey] = (months[monthKey] ?? 0) + decimalToNumber(booking.totalAmount);
      return months;
    }, {});

    return {
      totalSpending: decimalToNumber(spending._sum.totalAmount),
      totalBookings,
      favoriteStore,
      favoriteItem,
      monthlySpending,
    };
  });
};

export const invalidateAnalyticsCaches = (storeId?: string, userId?: string) => {
  invalidateCache([
    'analytics:',
    ...(storeId ? [`analytics:store:${storeId}:`] : []),
    ...(userId ? [`analytics:user:${userId}:`] : []),
  ]);
};
