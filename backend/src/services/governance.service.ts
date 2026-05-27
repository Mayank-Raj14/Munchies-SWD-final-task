import { Prisma, Role, WarningType } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { getStoreSender, sendUserEmail } from './email.service.js';

type UserContext = {
  id: string;
  role: Role;
};

type DbClient = typeof prisma | Prisma.TransactionClient;

const warningInclude = {
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
    },
  },
  issuedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

const assertUserExists = async (userId: string, db: DbClient = prisma) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }
};

export const assertUserNotGloballyBlocked = async (
  userId: string,
  action = 'perform this action',
  db: DbClient = prisma,
) => {
  const block = await db.globalUserBlock.findUnique({
    where: { userId },
    select: { reason: true },
  });

  if (block) {
    throw new AppError(`Blocked users cannot ${action}`, 403);
  }
};

export const assertUserCanUseStore = async (
  userId: string,
  storeId: string,
  action = 'use this store',
  db: DbClient = prisma,
) => {
  await assertUserNotGloballyBlocked(userId, action, db);

  const block = await db.storeUserBlock.findUnique({
    where: {
      userId_storeId: {
        userId,
        storeId,
      },
    },
    select: { reason: true },
  });

  if (block) {
    throw new AppError(`You are blocked from this store and cannot ${action}`, 403);
  }
};

export const ensureStoreGovernanceAccess = async (
  storeId: string,
  actor: UserContext,
  db: DbClient = prisma,
) => {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (actor.role !== Role.ADMIN && store.ownerId !== actor.id) {
    throw new AppError('You can only manage governance for your own stores', 403);
  }
};

export const issueWarning = async ({
  userId,
  issuedById,
  storeId,
  bookingId,
  type = WarningType.MANUAL,
  reason,
  db = prisma,
}: {
  userId: string;
  issuedById?: string;
  storeId?: string;
  bookingId?: string;
  type?: WarningType;
  reason: string;
  db?: DbClient;
}) => {
  await assertUserExists(userId, db);

  let warning;

  if (bookingId) {
    warning = await db.warning.upsert({
      where: { bookingId },
      create: {
        userId,
        issuedById,
        storeId,
        bookingId,
        type,
        reason,
      },
      update: {},
      include: warningInclude,
    });
  } else {
    warning = await db.warning.create({
      data: {
        userId,
        issuedById,
        storeId,
        type,
        reason,
      },
      include: warningInclude,
    });
  }

  const warningCount = await db.warning.count({ where: { userId } });
  await db.user.update({
    where: { id: userId },
    data: { warningCount },
  });

  if (warningCount >= 3) {
    await db.globalUserBlock.upsert({
      where: { userId },
      create: {
        userId,
        blockedById: issuedById,
        reason: 'Automatically blocked after 3 warnings',
      },
      update: {},
    });
  }

  void sendUserEmail(userId, {
    subject: warningCount >= 3 ? 'Munchies account blocked' : 'Munchies warning issued',
    text:
      warningCount >= 3
        ? 'Your account was automatically blocked after 3 warnings.'
        : `Warning issued: ${reason}`,
    topic: 'bookings',
    fromName: 'Munchies',
  }).catch(() => undefined);

  return warning;
};

export const warnUserGlobally = async (userId: string, adminId: string, reason: string) => {
  return issueWarning({ userId, issuedById: adminId, reason });
};

export const warnUserForStore = async (
  storeId: string,
  userId: string,
  actor: UserContext,
  reason: string,
) => {
  await ensureStoreGovernanceAccess(storeId, actor);

  return issueWarning({
    userId,
    storeId,
    issuedById: actor.id,
    reason,
  });
};

export const blockUserGlobally = async (userId: string, adminId: string, reason: string) => {
  await assertUserExists(userId);

  const block = await prisma.globalUserBlock.upsert({
    where: { userId },
    create: {
      userId,
      blockedById: adminId,
      reason,
    },
    update: {
      blockedById: adminId,
      reason,
    },
    include: {
      blockedUser: { select: { id: true, name: true, email: true } },
      blockedBy: { select: { id: true, name: true, email: true } },
    },
  });

  void sendUserEmail(userId, {
    subject: 'Munchies account blocked',
    text: `Your account was blocked. Reason: ${reason}`,
    topic: 'bookings',
    fromName: 'Munchies Admin',
  }).catch(() => undefined);

  return block;
};

export const unblockUserGlobally = async (userId: string) => {
  await prisma.globalUserBlock.deleteMany({
    where: { userId },
  });
};

export const blockUserForStore = async (
  storeId: string,
  userId: string,
  actor: UserContext,
  reason: string,
) => {
  await ensureStoreGovernanceAccess(storeId, actor);
  await assertUserExists(userId);

  const block = await prisma.storeUserBlock.upsert({
    where: {
      userId_storeId: {
        userId,
        storeId,
      },
    },
    create: {
      userId,
      storeId,
      blockedById: actor.id,
      reason,
    },
    update: {
      blockedById: actor.id,
      reason,
    },
    include: {
      blockedUser: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true } },
      blockedBy: { select: { id: true, name: true, email: true } },
    },
  });

  const sender = await getStoreSender(storeId);
  void sendUserEmail(userId, {
    subject: 'Munchies store access blocked',
    text: `You were blocked from ${block.store.name}. Reason: ${reason}`,
    topic: 'bookings',
    ...sender,
  }).catch(() => undefined);

  return block;
};

export const unblockUserForStore = async (storeId: string, userId: string, actor: UserContext) => {
  await ensureStoreGovernanceAccess(storeId, actor);

  await prisma.storeUserBlock.deleteMany({
    where: {
      userId,
      storeId,
    },
  });
};

export const listUserWarnings = async (userId: string) => {
  const [warnings, warningCount] = await prisma.$transaction([
    prisma.warning.findMany({
      where: { userId },
      include: warningInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.warning.count({ where: { userId } }),
  ]);

  return { warnings, warningCount };
};
