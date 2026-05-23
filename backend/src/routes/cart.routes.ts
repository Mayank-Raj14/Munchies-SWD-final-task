import { Role } from '@prisma/client';
import { Router } from 'express';

import {
  addItem,
  clearUserCart,
  getCarts,
  removeItem,
  updateItemQuantity,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  addCartItemSchema,
  cartItemParamSchema,
  cartParamSchema,
  updateCartItemSchema,
} from '../validators/cart.validator.js';

export const cartRouter = Router();

cartRouter.use(authenticate, requireRole(Role.USER, Role.STORE_OWNER, Role.ADMIN));
cartRouter.get('/', asyncHandler(getCarts));
cartRouter.post('/items', validateRequest(addCartItemSchema), asyncHandler(addItem));
cartRouter.patch(
  '/items/:cartItemId',
  validateRequest(updateCartItemSchema),
  asyncHandler(updateItemQuantity),
);
cartRouter.delete(
  '/items/:cartItemId',
  validateRequest(cartItemParamSchema),
  asyncHandler(removeItem),
);
cartRouter.delete('/:cartId', validateRequest(cartParamSchema), asyncHandler(clearUserCart));
