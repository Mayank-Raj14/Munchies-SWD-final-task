import { CampaignType, Prisma, Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { cacheKeys, getCached, invalidateCache } from '../utils/cache.js';
import { getStoreSender, sendUsersEmail } from './email.service.js';
import { invalidateAnalyticsCaches } from './analytics.service.js';

type DbClient = typeof prisma | Prisma.TransactionClient;

type UserContext = {
  id: string;
  role: Role;
};

type CampaignInput = {
  storeId: string;
  code?: string;
  type: CampaignType;
  value: number;
  minOrderValue?: number;
  globalUsageLimit?: number | null;
  perUserUsageLimit?: number | null;
  startsAt: Date;
  endsAt: Date;
  isActive?: boolean;
};

const campaignInclude = {
  store: {
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  },
} as const;

const normalizeCode = (code: string) =>
  code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const generateCouponCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < 8; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
};

export const assertCampaignStoreAccess = async (
  storeId: string,
  user: UserContext,
  db: DbClient = prisma,
) => {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (user.role !== Role.ADMIN && store.ownerId !== user.id) {
    throw new AppError('You can only manage campaigns for your own stores', 403);
  }
};

const getAvailableCode = async (requestedCode?: string) => {
  if (requestedCode) {
    const code = normalizeCode(requestedCode);

    if (code.length < 4) {
      throw new AppError('Coupon code must contain at least 4 letters or numbers', 400);
    }

    const existing = await prisma.campaign.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      throw new AppError('Coupon code already exists', 409);
    }

    return code;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateCouponCode();
    const existing = await prisma.campaign.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new AppError('Unable to generate a unique coupon code. Please retry.', 409);
};

const validateCampaignWindow = (input: { startsAt: Date; endsAt: Date }) => {
  if (input.endsAt <= input.startsAt) {
    throw new AppError('Campaign end time must be after start time', 400);
  }
};

const validateCampaignValue = (input: { type: CampaignType; value: number }) => {
  if (input.value <= 0) {
    throw new AppError('Campaign value must be positive', 400);
  }

  if (input.type === CampaignType.PERCENTAGE && input.value > 100) {
    throw new AppError('Percentage discounts cannot exceed 100%', 400);
  }
};

export const createCampaign = async (user: UserContext, input: CampaignInput) => {
  validateCampaignWindow(input);
  validateCampaignValue(input);
  await assertCampaignStoreAccess(input.storeId, user);

  const code = await getAvailableCode(input.code);
  const campaign = await prisma.campaign.create({
    data: {
      storeId: input.storeId,
      code,
      type: input.type,
      value: input.value,
      minOrderValue: input.minOrderValue ?? 0,
      globalUsageLimit: input.globalUsageLimit ?? null,
      perUserUsageLimit: input.perUserUsageLimit ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive ?? true,
    },
    include: campaignInclude,
  });

  invalidateCampaignCaches(input.storeId, code);

  const recipients = await prisma.user.findMany({
    where: {
      emailNotificationsEnabled: true,
      globalBlock: null,
    },
    select: { id: true },
  });
  const sender = await getStoreSender(campaign.storeId);

  void sendUsersEmail(
    recipients.map((user) => user.id),
    {
      subject: `New Munchies coupon: ${campaign.code}`,
      text: `${campaign.store.name} has a new ${campaign.type.toLowerCase()} coupon: ${campaign.code}.`,
      topic: 'promotions',
      ...sender,
    },
  ).catch(() => undefined);

  return campaign;
};

export const listCampaignsForStore = async (storeId: string, user?: UserContext) => {
  if (user) {
    await assertCampaignStoreAccess(storeId, user);
  }

  return getCached(cacheKeys.campaigns(storeId), 15_000, () =>
    prisma.campaign.findMany({
      where: { storeId },
      include: campaignInclude,
      orderBy: { createdAt: 'desc' },
    }),
  );
};

export const updateCampaign = async (
  campaignId: string,
  user: UserContext,
  input: Partial<Omit<CampaignInput, 'storeId' | 'code'>>,
) => {
  const existing = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { storeId: true, code: true },
  });

  if (!existing) {
    throw new AppError('Campaign not found', 404);
  }

  await assertCampaignStoreAccess(existing.storeId, user);

  const current = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      startsAt: true,
      endsAt: true,
      type: true,
      value: true,
    },
  });

  if (!current) {
    throw new AppError('Campaign not found', 404);
  }

  validateCampaignWindow({
    startsAt: input.startsAt ?? current.startsAt,
    endsAt: input.endsAt ?? current.endsAt,
  });

  validateCampaignValue({
    type: input.type ?? current.type,
    value: input.value ?? Number(current.value),
  });

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...input,
      minOrderValue: input.minOrderValue,
      globalUsageLimit: input.globalUsageLimit,
      perUserUsageLimit: input.perUserUsageLimit,
    },
    include: campaignInclude,
  });

  invalidateCampaignCaches(existing.storeId, existing.code);
  return campaign;
};

export const deactivateCampaign = async (campaignId: string, user: UserContext) => {
  const existing = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { storeId: true, code: true },
  });

  if (!existing) {
    throw new AppError('Campaign not found', 404);
  }

  await assertCampaignStoreAccess(existing.storeId, user);

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      isActive: false,
      endsAt: new Date(),
    },
    include: campaignInclude,
  });

  invalidateCampaignCaches(existing.storeId, existing.code);
  return campaign;
};

export const calculateDiscount = (
  campaign: { type: CampaignType; value: Prisma.Decimal | number },
  subtotal: Prisma.Decimal,
) => {
  const value = new Prisma.Decimal(campaign.value);
  const discount = campaign.type === CampaignType.PERCENTAGE ? subtotal.mul(value).div(100) : value;

  if (discount.lessThanOrEqualTo(0)) {
    return new Prisma.Decimal(0);
  }

  return Prisma.Decimal.min(discount, subtotal);
};

export const validateCouponForCart = async (
  userId: string,
  cartId: string,
  code: string,
  db: DbClient = prisma,
) => {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    throw new AppError('Coupon code is required', 400);
  }

  const cart = await db.cart.findFirst({
    where: { id: cartId, userId },
    include: {
      items: {
        include: {
          item: {
            select: {
              price: true,
              storeId: true,
              isAvailable: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart not found', 404);
  }

  const subtotal = cart.items.reduce((total, cartItem) => {
    if (!cartItem.item.isAvailable || cartItem.item.storeId !== cart.storeId) {
      throw new AppError('Cart contains an unavailable item', 409);
    }

    return total.plus(new Prisma.Decimal(cartItem.item.price).mul(cartItem.quantity));
  }, new Prisma.Decimal(0));

  const campaign = await validateCouponForStore(userId, cart.storeId, normalizedCode, subtotal, db);
  const discountAmount = calculateDiscount(campaign, subtotal);

  return {
    campaign,
    subtotalAmount: subtotal,
    discountAmount,
    totalAmount: Prisma.Decimal.max(subtotal.minus(discountAmount), new Prisma.Decimal(0)),
  };
};

export const validateCouponForStore = async (
  userId: string,
  storeId: string,
  code: string,
  subtotal: Prisma.Decimal,
  db: DbClient = prisma,
) => {
  const now = new Date();
  const normalizedCode = normalizeCode(code);
  const campaign = await getCached(cacheKeys.campaignCode(normalizedCode), 15_000, () =>
    db.campaign.findUnique({
      where: { code: normalizedCode },
      include: campaignInclude,
    }),
  );

  if (!campaign) {
    throw new AppError('Coupon not found', 404);
  }

  if (campaign.storeId !== storeId) {
    throw new AppError('Coupon cannot be used for this store', 400);
  }

  if (!campaign.isActive || campaign.startsAt > now || campaign.endsAt <= now) {
    throw new AppError('Coupon is not active', 400);
  }

  if (subtotal.lessThan(new Prisma.Decimal(campaign.minOrderValue))) {
    throw new AppError('Cart total is below the coupon minimum order value', 400);
  }

  if (campaign.globalUsageLimit !== null && campaign.usedCount >= campaign.globalUsageLimit) {
    throw new AppError('Coupon usage limit has been reached', 409);
  }

  if (campaign.perUserUsageLimit !== null) {
    const userUsageCount = await db.couponUsage.count({
      where: {
        campaignId: campaign.id,
        userId,
      },
    });

    if (userUsageCount >= campaign.perUserUsageLimit) {
      throw new AppError('You have already used this coupon the maximum number of times', 409);
    }
  }

  return campaign;
};

export const claimCouponUsage = async (
  campaignId: string,
  userId: string,
  bookingId: string,
  db: Prisma.TransactionClient,
) => {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      code: true,
      storeId: true,
      globalUsageLimit: true,
      usedCount: true,
    },
  });

  if (!campaign) {
    throw new AppError('Coupon not found', 404);
  }

  const updated = await db.campaign.updateMany({
    where: {
      id: campaignId,
      ...(campaign.globalUsageLimit === null
        ? {}
        : { usedCount: { lt: campaign.globalUsageLimit } }),
    },
    data: {
      usedCount: { increment: 1 },
    },
  });

  if (updated.count !== 1) {
    throw new AppError('Coupon usage limit has been reached', 409);
  }

  await db.couponUsage.create({
    data: {
      campaignId,
      userId,
      bookingId,
    },
  });

  invalidateCampaignCaches(campaign.storeId, campaign.code);
};

export const synchronizeCampaignActivity = async (now = new Date()) => {
  const [activated, deactivated] = await prisma.$transaction([
    prisma.campaign.updateMany({
      where: {
        isActive: false,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      data: { isActive: true },
    }),
    prisma.campaign.updateMany({
      where: {
        isActive: true,
        endsAt: { lte: now },
      },
      data: { isActive: false },
    }),
  ]);

  if (activated.count || deactivated.count) {
    invalidateCache(['campaigns:', 'campaign:code:', 'stores:']);
  }

  return { activated: activated.count, deactivated: deactivated.count };
};

export const invalidateCampaignCaches = (storeId?: string, code?: string) => {
  invalidateCache([
    'campaigns:',
    ...(storeId ? [cacheKeys.campaigns(storeId)] : []),
    ...(code ? [cacheKeys.campaignCode(code)] : []),
    'stores:',
  ]);
  invalidateAnalyticsCaches(storeId);
};
