import { Role, StoreOwnershipRequestStatus, type Prisma } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { cacheKeys, invalidateCache } from '../utils/cache.js';

type ApprovedRequestSnapshot = {
  userId: string;
  hostelId: string;
  storeName: string;
  roomNumber: string;
};

export const syncApprovedRequestStore = async (
  tx: Prisma.TransactionClient,
  request: ApprovedRequestSnapshot,
) => {
  const storeKey = {
    hostelId: request.hostelId,
    roomNumber: request.roomNumber,
    name: request.storeName,
  };

  const existingStore = await tx.store.findUnique({
    where: { hostelId_roomNumber_name: storeKey },
    select: { id: true, ownerId: true },
  });

  if (existingStore && existingStore.ownerId !== request.userId) {
    throw new AppError('A store already exists at this hostel and room with another owner', 409);
  }

  const store =
    existingStore ??
    (await tx.store.create({
      data: {
        ...storeKey,
        ownerId: request.userId,
      },
      select: { id: true },
    }));

  await tx.user.update({
    where: { id: request.userId },
    data: { role: Role.STORE_OWNER },
  });

  return store.id;
};

export const syncApprovedStoreOwnershipForUser = async (userId: string) => {
  const approvedRequests = await prisma.storeOwnershipRequest.findMany({
    where: {
      userId,
      status: StoreOwnershipRequestStatus.APPROVED,
    },
    select: {
      userId: true,
      hostelId: true,
      storeName: true,
      roomNumber: true,
    },
  });

  if (approvedRequests.length === 0) {
    return [];
  }

  const storeIds = await prisma.$transaction(async (tx) => {
    const syncedStoreIds: string[] = [];

    for (const request of approvedRequests) {
      syncedStoreIds.push(await syncApprovedRequestStore(tx, request));
    }

    return syncedStoreIds;
  });

  invalidateCache(['stores:', cacheKeys.ownerStores(userId)]);
  for (const storeId of storeIds) {
    invalidateCache([cacheKeys.store(storeId), cacheKeys.campaigns(storeId)]);
  }

  return storeIds;
};
