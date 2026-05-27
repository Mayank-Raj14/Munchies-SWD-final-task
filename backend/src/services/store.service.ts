import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { buildStoreListWhere } from '../utils/search.js';
import { cacheKeys, getCached, invalidateCache } from '../utils/cache.js';
import { assertUserNotGloballyBlocked } from './governance.service.js';
import { syncApprovedStoreOwnershipForUser } from './store-ownership-sync.service.js';

type ListStoresInput = {
  page: number;
  limit: number;
  search?: string;
  hostelId?: string;
};

type StoreInput = {
  name: string;
  hostelId: string;
  roomNumber: string;
  email?: string | null;
};

type UpdateStoreInput = Partial<StoreInput>;

const storeInclude = {
  hostel: {
    select: {
      id: true,
      name: true,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  items: {
    select: {
      id: true,
      category: true,
      isAvailable: true,
      price: true,
      stock: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 6,
  },
  _count: {
    select: {
      items: true,
      bookings: true,
    },
  },
} as const;

const storeDetailInclude = {
  ...storeInclude,
  items: {
    where: { isAvailable: true },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

export const listStores = async ({ page, limit, search, hostelId }: ListStoresInput) => {
  const key = cacheKeys.stores({ page, limit, search: search ?? '', hostelId: hostelId ?? '' });

  return getCached(key, 30_000, async () => {
    const where = buildStoreListWhere({ search, hostelId });
    const { page: safePage, limit: safeLimit, skip, take } = getPagination({ page, limit });
    const [stores, total] = await prisma.$transaction([
      prisma.store.findMany({
        where,
        include: storeInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.store.count({ where }),
    ]);

    return {
      stores,
      pagination: buildPaginationMeta(safePage, safeLimit, total),
    };
  });
};

export const getStoreById = async (storeId: string) => {
  const store = await getCached(cacheKeys.store(storeId), 30_000, () =>
    prisma.store.findUnique({
      where: { id: storeId },
      include: storeDetailInclude,
    }),
  );

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  return store;
};

export const listStoresByOwner = async (ownerId: string) => {
  await syncApprovedStoreOwnershipForUser(ownerId);

  return getCached(cacheKeys.ownerStores(ownerId), 15_000, () =>
    prisma.store.findMany({
      where: { ownerId },
      include: storeInclude,
      orderBy: { createdAt: 'desc' },
    }),
  );
};

export const createStore = async (ownerId: string, input: StoreInput) => {
  await assertUserNotGloballyBlocked(ownerId, 'create stores');

  const hostel = await prisma.hostel.findUnique({
    where: { id: input.hostelId },
    select: { id: true },
  });

  if (!hostel) {
    throw new AppError('Hostel not found', 404);
  }

  const existingStore = await prisma.store.findUnique({
    where: {
      hostelId_roomNumber_name: {
        hostelId: input.hostelId,
        roomNumber: input.roomNumber,
        name: input.name,
      },
    },
    select: { id: true },
  });

  if (existingStore) {
    throw new AppError('A store already exists with these details', 409);
  }

  const store = await prisma.store.create({
    data: {
      name: input.name,
      hostelId: input.hostelId,
      roomNumber: input.roomNumber,
      email: input.email ?? null,
      ownerId,
    },
    include: storeInclude,
  });

  invalidateStoreCaches(ownerId, store.id);
  return store;
};

export const updateStore = async (
  storeId: string,
  user: { id: string; role: Role },
  input: UpdateStoreInput,
) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true, hostelId: true, roomNumber: true, name: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (user.role !== Role.ADMIN && store.ownerId !== user.id) {
    throw new AppError('You can only manage your own stores', 403);
  }

  if (input.hostelId) {
    const hostel = await prisma.hostel.findUnique({
      where: { id: input.hostelId },
      select: { id: true },
    });

    if (!hostel) {
      throw new AppError('Hostel not found', 404);
    }
  }

  const nextKey = {
    hostelId: input.hostelId ?? store.hostelId,
    roomNumber: input.roomNumber ?? store.roomNumber,
    name: input.name ?? store.name,
  };

  if (
    nextKey.hostelId !== store.hostelId ||
    nextKey.roomNumber !== store.roomNumber ||
    nextKey.name !== store.name
  ) {
    const duplicate = await prisma.store.findUnique({
      where: { hostelId_roomNumber_name: nextKey },
      select: { id: true },
    });

    if (duplicate && duplicate.id !== storeId) {
      throw new AppError('A store already exists with these details', 409);
    }
  }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: input,
    include: storeInclude,
  });

  invalidateStoreCaches(updatedStore.ownerId, storeId);
  return updatedStore;
};

export const deleteStore = async (storeId: string, user: { id: string; role: Role }) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (user.role !== Role.ADMIN && store.ownerId !== user.id) {
    throw new AppError('You can only manage your own stores', 403);
  }

  await prisma.store.delete({
    where: { id: storeId },
  });

  invalidateStoreCaches(store.ownerId, storeId);
};

export const invalidateStoreCaches = (ownerId?: string, storeId?: string) => {
  invalidateCache([
    'stores:',
    ...(ownerId ? [cacheKeys.ownerStores(ownerId)] : []),
    ...(storeId ? [cacheKeys.store(storeId), cacheKeys.campaigns(storeId)] : []),
  ]);
};
