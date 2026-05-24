import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { buildStoreListWhere } from '../utils/search.js';
import { assertUserNotGloballyBlocked } from './governance.service.js';

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
} as const;

const storeDetailInclude = {
  ...storeInclude,
  items: {
    where: { isAvailable: true },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

export const listStores = async ({ page, limit, search, hostelId }: ListStoresInput) => {
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
};

export const getStoreById = async (storeId: string) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: storeDetailInclude,
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  return store;
};

export const listStoresByOwner = async (ownerId: string) => {
  return prisma.store.findMany({
    where: { ownerId },
    include: storeInclude,
    orderBy: { createdAt: 'desc' },
  });
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

  return prisma.store.create({
    data: {
      name: input.name,
      hostelId: input.hostelId,
      roomNumber: input.roomNumber,
      ownerId,
    },
    include: storeInclude,
  });
};

export const updateStore = async (
  storeId: string,
  user: { id: string; role: Role },
  input: UpdateStoreInput,
) => {
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

  if (input.hostelId) {
    const hostel = await prisma.hostel.findUnique({
      where: { id: input.hostelId },
      select: { id: true },
    });

    if (!hostel) {
      throw new AppError('Hostel not found', 404);
    }
  }

  return prisma.store.update({
    where: { id: storeId },
    data: input,
    include: storeInclude,
  });
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
};
