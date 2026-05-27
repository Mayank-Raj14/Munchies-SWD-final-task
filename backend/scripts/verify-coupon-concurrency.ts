import { CampaignType, Prisma, Role } from '@prisma/client';
import { prisma } from '../src/prisma/client.js';
import { claimCouponUsage, validateCouponForStore } from '../src/services/campaign.service.js';

const run = async () => {
  const suffix = Date.now().toString(36);
  const now = new Date();

  const userA = await prisma.user.create({ data: { name: `cc-u1-${suffix}`, email: `cc-u1-${suffix}@test.local`, password: 'x', role: Role.USER } });
  const userB = await prisma.user.create({ data: { name: `cc-u2-${suffix}`, email: `cc-u2-${suffix}@test.local`, password: 'x', role: Role.USER } });
  const owner = await prisma.user.create({ data: { name: `cc-owner-${suffix}`, email: `cc-owner-${suffix}@test.local`, password: 'x', role: Role.STORE_OWNER } });
  const hostel = await prisma.hostel.create({ data: { name: `cc-hostel-${suffix}` } });
  const store = await prisma.store.create({ data: { name: `cc-store-${suffix}`, roomNumber: `R-${suffix.slice(-5)}`, ownerId: owner.id, hostelId: hostel.id } });

  const limited = await prisma.campaign.create({
    data: {
      storeId: store.id,
      code: `CC${suffix.toUpperCase()}`.slice(0, 8),
      type: CampaignType.FLAT,
      value: 10,
      minOrderValue: 0,
      globalUsageLimit: 1,
      perUserUsageLimit: 1,
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + 60_000),
      isActive: true,
    },
  });

  const subtotal = 100;
  await validateCouponForStore(userA.id, store.id, limited.code, new Prisma.Decimal(subtotal));

  const attempts = [userA.id, userB.id, userA.id, userB.id].map((userId, idx) =>
    prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({ data: { userId, storeId: store.id, subtotalAmount: subtotal, discountAmount: 0, totalAmount: subtotal } });
      await claimCouponUsage(limited.id, userId, booking.id, tx);
      return booking.id;
    }).then(() => ({ ok: true })).catch((e: unknown) => ({ ok: false, message: e instanceof Error ? e.message : 'error' })),
  );

  const results = await Promise.all(attempts);
  const successCount = results.filter((r) => r.ok).length;

  const expired = await prisma.campaign.create({
    data: {
      storeId: store.id,
      code: `EX${suffix.toUpperCase()}`.slice(0, 8),
      type: CampaignType.FLAT,
      value: 10,
      startsAt: new Date(now.getTime() - 120_000),
      endsAt: new Date(now.getTime() - 60_000),
      isActive: true,
    },
  });

  const inactive = await prisma.campaign.create({
    data: {
      storeId: store.id,
      code: `IN${suffix.toUpperCase()}`.slice(0, 8),
      type: CampaignType.FLAT,
      value: 10,
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + 60_000),
      isActive: false,
    },
  });

  const blockedChecks: string[] = [];
  for (const campaign of [expired, inactive]) {
    try {
      await validateCouponForStore(userA.id, store.id, campaign.code, new Prisma.Decimal(subtotal));
      blockedChecks.push(`${campaign.code}:FAILED`);
    } catch {
      blockedChecks.push(`${campaign.code}:OK`);
    }
  }

  console.log('coupon-concurrency');
  console.log(`successfulClaims=${successCount}`);
  console.log(`globalLimit=${limited.globalUsageLimit}`);
  console.log(`results=${JSON.stringify(results)}`);
  console.log(`expiredInactiveValidation=${blockedChecks.join(',')}`);
  if (successCount > 1) throw new Error('Global usage limit violated under concurrency.');
};

run().finally(async () => {
  await prisma.$disconnect();
});
