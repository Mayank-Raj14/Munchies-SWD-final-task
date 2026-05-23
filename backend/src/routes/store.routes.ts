import { Role } from '@prisma/client';
import { Router } from 'express';

import {
  createStoreForOwner,
  deleteStoreForOwner,
  getMyStores,
  getStore,
  getStores,
  updateStoreForOwner,
} from '../controllers/store.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createStoreSchema,
  storeIdParamSchema,
  storeListQuerySchema,
  updateStoreSchema,
} from '../validators/store.validator.js';
import { itemRouter } from './item.routes.js';

export const storeRouter = Router();

storeRouter.get('/', validateRequest(storeListQuerySchema), asyncHandler(getStores));
storeRouter.use('/:storeId/items', itemRouter);
storeRouter.get(
  '/my-stores',
  authenticate,
  requireRole(Role.STORE_OWNER),
  asyncHandler(getMyStores),
);
storeRouter.get('/:id', validateRequest(storeIdParamSchema), asyncHandler(getStore));
storeRouter.post(
  '/',
  authenticate,
  requireRole(Role.STORE_OWNER),
  validateRequest(createStoreSchema),
  asyncHandler(createStoreForOwner),
);
storeRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(updateStoreSchema),
  asyncHandler(updateStoreForOwner),
);
storeRouter.delete(
  '/:id',
  authenticate,
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(storeIdParamSchema),
  asyncHandler(deleteStoreForOwner),
);
