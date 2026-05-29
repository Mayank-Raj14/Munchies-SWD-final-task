import { Role } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { deleteUploadedFile } from '../utils/file-storage.js';
import { invalidateAnalyticsCaches } from './analytics.service.js';
import { invalidateStoreCaches } from './store.service.js';

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

  return store;
};

export const listStoreItems = async (storeId: string, currentUser?: UserContext | null) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return [];
  }

  if (!store.isActive || store.isDeleted) {
    const isOwner = currentUser && store.ownerId === currentUser.id;
    const isAdmin = currentUser && currentUser.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new AppError('Store not found', 404);
    }
  }

  return prisma.item.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  });
};

export const createStoreItem = async (
  storeId: string,
  user: UserContext,
  input: ItemInput,
) => {
  const store = await ensureStoreAccess(storeId, user);

  if (input.stock < 0) {
    throw new AppError('Stock cannot be negative', 400);
  }

  const item = await prisma.item.create({
    data: {
      storeId,
      name: input.name,
      description: input.description,
      category: input.category,
      price: input.price,
      stock: input.stock,
      imageUrl: input.imageUrl,
      isAvailable: input.stock > 0,
    },
  });

  invalidateStoreCaches(store.ownerId, storeId);
  invalidateAnalyticsCaches(storeId);

  return item;
};

export const updateStoreItem = async (
  storeId: string,
  itemId: string,
  user: UserContext,
  input: UpdateItemInput,
) => {
  const store = await ensureStoreAccess(storeId, user);

  const item = await prisma.item.findFirst({
    where: { id: itemId, storeId },
    select: {
      id: true,
      imageUrl: true,
      stock: true,
      isAvailable: true,
    },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  const isRemoved =
    !item.isAvailable &&
    item.stock === 0 &&
    item.imageUrl === null;

  if (isRemoved) {
    throw new AppError(
      'Item has been removed. Create a new item instead.',
      410,
    );
  }

  if (input.stock !== undefined && input.stock < 0) {
    throw new AppError('Stock cannot be negative', 400);
  }

  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...input,
      ...(input.stock !== undefined
        ? { isAvailable: input.stock > 0 }
        : {}),
    },
  });

  if (
    input.imageUrl &&
    item.imageUrl &&
    item.imageUrl !== input.imageUrl
  ) {
    await deleteUploadedFile(item.imageUrl);
  }

  invalidateStoreCaches(store.ownerId, storeId);
  invalidateAnalyticsCaches(storeId);

  return updatedItem;
};

export const deleteStoreItem = async (
  storeId: string,
  itemId: string,
  user: UserContext,
) => {
  const store = await ensureStoreAccess(storeId, user);

  const item = await prisma.item.findFirst({
    where: { id: itemId, storeId },
    select: {
      id: true,
      imageUrl: true,
    },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({
      where: { itemId },
    });

    await tx.item.update({
      where: { id: itemId },
      data: {
        isAvailable: false,
        stock: 0,
        imageUrl: null,
      },
    });
  });

  await deleteUploadedFile(item.imageUrl);

  invalidateStoreCaches(store.ownerId, storeId);
  invalidateAnalyticsCaches(storeId);
};
