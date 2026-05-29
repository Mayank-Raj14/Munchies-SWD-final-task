import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getOptionalUser } from '../middleware/auth.middleware.js';
import {
  createStore,
  deleteStore,
  getStoreById,
  listStores,
  listStoresByOwner,
  updateStore,
} from '../services/store.service.js';
import type { StoreListQuery } from '../validators/store.validator.js';

export const getStores = async (req: AuthenticatedRequest, res: Response) => {
  const query = req.query as unknown as StoreListQuery;

  const result = await listStores({
    page: query.page,
    limit: query.limit,
    search: query.search,
    hostelId: query.hostelId,
  });

  res.status(200).json(result);
};

export const getStore = async (req: AuthenticatedRequest, res: Response) => {
  const currentUser = await getOptionalUser(req);
  const store = await getStoreById(req.params.id ?? '', currentUser);

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
