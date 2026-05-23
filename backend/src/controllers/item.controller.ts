import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createStoreItem,
  deleteStoreItem,
  listStoreItems,
  updateStoreItem,
} from '../services/item.service.js';

const imageUrlFromRequest = (req: AuthenticatedRequest) => {
  const file = req.file;

  return file ? `/uploads/items/${file.filename}` : undefined;
};

export const getItemsForStore = async (req: AuthenticatedRequest, res: Response) => {
  const items = await listStoreItems(req.params.storeId ?? '', req.user!);

  res.status(200).json({ items });
};

export const createItemForStore = async (req: AuthenticatedRequest, res: Response) => {
  const item = await createStoreItem(req.params.storeId ?? '', req.user!, {
    ...req.body,
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    imageUrl: imageUrlFromRequest(req),
  });

  res.status(201).json({ item });
};

export const updateItemForStore = async (req: AuthenticatedRequest, res: Response) => {
  const item = await updateStoreItem(req.params.storeId ?? '', req.params.itemId ?? '', req.user!, {
    ...req.body,
    ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
    ...(req.body.stock !== undefined ? { stock: Number(req.body.stock) } : {}),
    ...(imageUrlFromRequest(req) ? { imageUrl: imageUrlFromRequest(req) } : {}),
  });

  res.status(200).json({ item });
};

export const deleteItemForStore = async (req: AuthenticatedRequest, res: Response) => {
  await deleteStoreItem(req.params.storeId ?? '', req.params.itemId ?? '', req.user!);

  res.status(204).send();
};
