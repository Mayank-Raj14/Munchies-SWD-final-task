import type { Response } from 'express';
import { prisma } from '../prisma/client.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  ADMIN_SUSPEND_REASON_PREFIX,
  blockEveryoneFromStore,
  ensureAdmin,
  ensureStoreExists,
  removeStore,
  suspendStore,
  reactivateStore,
} from '../services/adminModeration.service';
import { Role } from '@prisma/client';

const assertNotStoreOwner = (actor: AuthenticatedRequest['user']) => {
  if (actor?.role === Role.STORE_OWNER) {
    throw new Error('Store owners cannot use admin moderation endpoints');
  }
};

export const adminBlockEveryoneFromStore = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user;
  ensureAdmin(actor);
  assertNotStoreOwner(actor);

  const storeId = req.params.storeId ?? '';
  await ensureStoreExists(storeId);

  const reason = String(req.body.reason ?? 'Admin moderation').trim();
  await blockEveryoneFromStore(storeId, actor!, reason);
  res.status(200).json({ success: true });
};

export const adminUnblockEveryoneFromStore = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user;
  ensureAdmin(actor);
  assertNotStoreOwner(actor);

  const storeId = req.params.storeId ?? '';
  await ensureStoreExists(storeId);

  await prisma.storeUserBlock.deleteMany({
    where: {
      storeId,
      // Only remove admin-made suspension blocks.
      reason: { startsWith: ADMIN_SUSPEND_REASON_PREFIX },
    },
  });

  res.status(204).send();
};

export const adminRemoveStore = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user;
  ensureAdmin(actor);

  const storeId = req.params.storeId ?? '';
  await removeStore(storeId, actor!);
  res.status(204).send();
};

export const adminSuspendStore = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user;
  ensureAdmin(actor);
  assertNotStoreOwner(actor);

  const storeId = req.params.storeId ?? '';
  await suspendStore(storeId, actor!);
  res.status(200).json({ success: true });
};

export const adminReactivateStore = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user;
  ensureAdmin(actor);
  assertNotStoreOwner(actor);

  const storeId = req.params.storeId ?? '';
  await reactivateStore(storeId, actor!);
  res.status(200).json({ success: true });
};

