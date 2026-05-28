import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export const ensureAdmin = (actor: { id: string; role: Role } | undefined) => {
  if (!actor || actor.role !== Role.ADMIN) {
    throw new AppError('Admin access required', 403);
  }
};

export const ensureStoreExists = async (storeId: string) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, ownerId: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }
};

export const ADMIN_SUSPEND_REASON_PREFIX = '__ADMIN_SUSPEND__:';

export const blockEveryoneFromStore = async (
  storeId: string,
  admin: { id: string; role: Role },
  reason: string,
) => {
  ensureAdmin(admin);

  // Store suspension/block-everyone is represented using StoreUserBlock rows.
  // We insert blocks for all users for the selected store.
  const users = await prisma.user.findMany({
    select: { id: true },
    take: 5000,
  });

  const blocks = users.map((u) => ({
    userId: u.id,
    storeId,
    blockedById: admin.id,
    // Include prefix so reactivate/unblock-everyone can reverse only admin-made blocks.
    reason: `${ADMIN_SUSPEND_REASON_PREFIX}${reason}`,
  }));

  if (blocks.length === 0) {
    return { count: 0 };
  }

  await prisma.storeUserBlock.createMany({
    data: blocks,
    skipDuplicates: true,
  });

  return { count: blocks.length };
};

export const removeStore = async (storeId: string, admin: { id: string; role: Role }) => {
  ensureAdmin(admin);

  // Store deletion is blocked by FK constraints in Prisma error handler; keep it as-is.
  await prisma.store.delete({ where: { id: storeId } });
};

export const suspendStore = async (storeId: string, admin: { id: string; role: Role }) => {
  ensureAdmin(admin);

  // There is no Store status field in schema; use a governance approach.
  // We interpret suspend as blocking everyone from the store.
  await blockEveryoneFromStore(storeId, admin, 'Store suspended by admin');
};

export const reactivateStore = async (storeId: string, admin: { id: string; role: Role }) => {
  ensureAdmin(admin);

  // Reactivate should undo only admin-made "block everyone" / "suspend" blocks.
  await prisma.storeUserBlock.deleteMany({
    where: {
      storeId,
      blockedById: admin.id,
      reason: { startsWith: ADMIN_SUSPEND_REASON_PREFIX },
    },
  });
};

