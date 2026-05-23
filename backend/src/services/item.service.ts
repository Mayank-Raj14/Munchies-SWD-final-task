import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

type UserContext = {
  id: string;
  role: Role;
};

type ItemInput = {
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

type UpdateItemInput = Partial<ItemInput>;

const ensureStoreAccess = async (storeId: string, user: UserContext) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) {
    throw new AppError('Store not found', 404);
  }

  if (user.role !== Role.ADMIN && store.ownerId !== user.id) {
    throw new AppError('You can only manage inventory for your own stores', 403);
  }
};

export const listStoreItems = async (storeId: string, user: UserContext) => {
  await ensureStoreAccess(storeId, user);

  return prisma.item.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createStoreItem = async (storeId: string, user: UserContext, input: ItemInput) => {
  await ensureStoreAccess(storeId, user);

  return prisma.item.create({
    data: {
      storeId,
      name: input.name,
      description: input.description,
      category: input.category,
      price: input.price,
      stock: input.stock,
      imageUrl: input.imageUrl,
    },
  });
};

export const updateStoreItem = async (
  storeId: string,
  itemId: string,
  user: UserContext,
  input: UpdateItemInput,
) => {
  await ensureStoreAccess(storeId, user);

  const item = await prisma.item.findFirst({
    where: { id: itemId, storeId },
    select: { id: true },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  return prisma.item.update({
    where: { id: itemId },
    data: input,
  });
};

export const deleteStoreItem = async (storeId: string, itemId: string, user: UserContext) => {
  await ensureStoreAccess(storeId, user);

  const item = await prisma.item.findFirst({
    where: { id: itemId, storeId },
    select: { id: true },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  await prisma.item.delete({
    where: { id: itemId },
  });
};
