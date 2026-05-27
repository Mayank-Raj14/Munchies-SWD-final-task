import { Role } from '@prisma/client';
import { prisma } from '../src/prisma/client.js';
import { getStoreAnalytics, getUserAnalytics, invalidateAnalyticsCaches } from '../src/services/analytics.service.js';

const run = async () => {
  const suffix = Date.now().toString(36);
  const owner = await prisma.user.create({ data: { name: `an-owner-${suffix}`, email: `an-owner-${suffix}@test.local`, password: 'x', role: Role.STORE_OWNER } });
  const user = await prisma.user.create({ data: { name: `an-user-${suffix}`, email: `an-user-${suffix}@test.local`, password: 'x', role: Role.USER } });
  const hostel = await prisma.hostel.create({ data: { name: `an-hostel-${suffix}` } });
  const store = await prisma.store.create({ data: { name: `an-store-${suffix}`, roomNumber: `AR-${suffix.slice(-5)}`, ownerId: owner.id, hostelId: hostel.id } });

  const emptyStoreAnalytics = await getStoreAnalytics(store.id, { id: owner.id, role: owner.role });
  const emptyUserAnalytics = await getUserAnalytics(user.id);

  const numbers = [
    emptyStoreAnalytics.revenue.total,
    emptyStoreAnalytics.revenue.weekly,
    emptyStoreAnalytics.revenue.monthly,
    emptyUserAnalytics.totalSpending,
    emptyUserAnalytics.totalBookings,
  ];
  if (numbers.some((n) => Number.isNaN(n))) throw new Error('NaN found in empty analytics dataset');

  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const withRange = await getStoreAnalytics(store.id, { id: owner.id, role: owner.role }, { dateFrom: from, dateTo: to });

  if (withRange.revenue.total < 0 || withRange.revenue.weekly < 0 || withRange.revenue.monthly < 0) {
    throw new Error('Invalid negative analytics values for date boundaries');
  }

  await prisma.booking.create({
    data: {
      userId: user.id,
      storeId: store.id,
      subtotalAmount: 100,
      discountAmount: 0,
      totalAmount: 100,
      status: 'COMPLETED',
      createdAt: now,
    },
  });

  invalidateAnalyticsCaches(store.id, user.id);
  const refreshedStoreAnalytics = await getStoreAnalytics(store.id, { id: owner.id, role: owner.role });
  const refreshedUserAnalytics = await getUserAnalytics(user.id);

  console.log('analytics-edge-cases');
  console.log(`emptyOK=${JSON.stringify({ storeRevenue: emptyStoreAnalytics.revenue, userSpending: emptyUserAnalytics.totalSpending })}`);
  console.log(`dateRangeOK=${JSON.stringify(withRange.revenue)}`);
  console.log(`refreshOK=${JSON.stringify({ storeTotal: refreshedStoreAnalytics.revenue.total, userTotal: refreshedUserAnalytics.totalSpending })}`);

  if (refreshedStoreAnalytics.revenue.total <= 0 || refreshedUserAnalytics.totalSpending <= 0) {
    throw new Error('Analytics refresh did not reflect post-booking totals');
  }
};

run().finally(async () => {
  await prisma.$disconnect();
});
