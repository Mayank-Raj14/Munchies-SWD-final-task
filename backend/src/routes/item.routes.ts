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
  storeItemParamSchema,
  updateItemSchema,
} from '../validators/item.validator.js';

export const itemRouter = Router({ mergeParams: true });

itemRouter.use(authenticate, requireRole(Role.STORE_OWNER, Role.ADMIN));
itemRouter.get('/', validateRequest(storeItemParamSchema), asyncHandler(getItemsForStore));
itemRouter.post(
  '/',
  uploadItemImage.single('image'),
  validateRequest(createItemSchema),
  asyncHandler(createItemForStore),
);
itemRouter.patch(
  '/:itemId',
  uploadItemImage.single('image'),
  validateRequest(updateItemSchema),
  asyncHandler(updateItemForStore),
);
itemRouter.delete('/:itemId', validateRequest(itemParamSchema), asyncHandler(deleteItemForStore));
