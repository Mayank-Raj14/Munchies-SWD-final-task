import { z } from 'zod';

export const addCartItemSchema = z.object({
  body: z.object({
    itemId: z.string().uuid('Invalid item id'),
    quantity: z.coerce.number().int().positive('Quantity must be at least 1').default(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    cartItemId: z.string().uuid('Invalid cart item id'),
  }),
  body: z.object({
    quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
  }),
});

export const cartItemParamSchema = z.object({
  params: z.object({
    cartItemId: z.string().uuid('Invalid cart item id'),
  }),
});

export const cartParamSchema = z.object({
  params: z.object({
    cartId: z.string().uuid('Invalid cart id'),
  }),
});
