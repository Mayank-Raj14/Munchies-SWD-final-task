import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createStore,
  deleteStore,
  getStoreById,
  listStores,
  listStoresByOwner,
  updateStore,
} from '../services/store.service.js';

export const getStores = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listStores({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 12),
    search: req.query.search ? String(req.query.search) : undefined,
  });

  res.status(200).json(result);
};

export const getStore = async (req: AuthenticatedRequest, res: Response) => {
  const store = await getStoreById(req.params.id ?? '');

  res.status(200).json({ store });
};

export const getMyStores = async (req: AuthenticatedRequest, res: Response) => {
  const stores = await listStoresByOwner(req.user?.id ?? '');

  res.status(200).json({ stores });
};

export const createStoreForOwner = async (req: AuthenticatedRequest, res: Response) => {
  const store = await createStore(req.user?.id ?? '', req.body);

  res.status(201).json({ store });
};

export const updateStoreForOwner = async (req: AuthenticatedRequest, res: Response) => {
  const store = await updateStore(req.params.id ?? '', req.user!, req.body);

  res.status(200).json({ store });
};

export const deleteStoreForOwner = async (req: AuthenticatedRequest, res: Response) => {
  await deleteStore(req.params.id ?? '', req.user!);

  res.status(204).send();
};
