import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

type ListStoresInput = {
  page: number;
  limit: number;
  search?: string;
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
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

export const listStores = async ({ page, limit, search }: ListStoresInput) => {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { roomNumber: { contains: search, mode: 'insensitive' as const } },
          { hostel: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const skip = (page - 1) * limit;
  const [stores, total] = await prisma.$transaction([
    prisma.store.findMany({
      where,
      include: storeInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.store.count({ where }),
  ]);

  return {
    stores,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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
  const hostel = await prisma.hostel.findUnique({
    where: { id: input.hostelId },
    select: { id: true },
  });

  if (!hostel) {
    throw new AppError('Hostel not found', 404);
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
