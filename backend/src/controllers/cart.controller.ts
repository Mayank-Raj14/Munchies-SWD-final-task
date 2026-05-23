import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  addItemToCart,
  clearCart,
  listUserCarts,
  removeCartItem,
  updateCartItemQuantity,
} from '../services/cart.service.js';

export const getCarts = async (req: AuthenticatedRequest, res: Response) => {
  const carts = await listUserCarts(req.user?.id ?? '');

  res.status(200).json({ carts });
};

export const addItem = async (req: AuthenticatedRequest, res: Response) => {
  const cart = await addItemToCart(req.user?.id ?? '', req.body.itemId, req.body.quantity);

  res.status(201).json({ cart });
};

export const updateItemQuantity = async (req: AuthenticatedRequest, res: Response) => {
  const cart = await updateCartItemQuantity(
    req.user?.id ?? '',
    req.params.cartItemId ?? '',
    req.body.quantity,
  );

  res.status(200).json({ cart });
};

export const removeItem = async (req: AuthenticatedRequest, res: Response) => {
  await removeCartItem(req.user?.id ?? '', req.params.cartItemId ?? '');

  res.status(204).send();
};

export const clearUserCart = async (req: AuthenticatedRequest, res: Response) => {
  await clearCart(req.user?.id ?? '', req.params.cartId ?? '');

  res.status(204).send();
};
