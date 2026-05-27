import { Role } from '@prisma/client';
import { Router } from 'express';

import {
  createItemForStore,
  deleteItemForStore,
  getItemsForStore,
  updateItemForStore,
} from '../controllers/item.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadItemImage } from '../middleware/upload.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createItemSchema,
  itemParamSchema,
  updateItemSchema,
} from '../validators/item.validator.js';

export const itemRouter = Router({ mergeParams: true });

itemRouter.get(
  '/',
  asyncHandler(getItemsForStore),
);

itemRouter.post(
  '/',
  authenticate,
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  uploadItemImage.single('image'),
  validateRequest(createItemSchema),
  asyncHandler(createItemForStore),
);

itemRouter.patch(
  '/:itemId',
  authenticate,
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  uploadItemImage.single('image'),
  validateRequest(updateItemSchema),
  asyncHandler(updateItemForStore),
);

itemRouter.delete(
  '/:itemId',
  authenticate,
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(itemParamSchema),
  asyncHandler(deleteItemForStore),
);