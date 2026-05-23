import { z } from 'zod';

export const storeItemParamSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
  }),
});

export const itemParamSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
    itemId: z.string().uuid('Invalid item id'),
  }),
});

export const createItemSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Item name must be at least 2 characters'),
    description: z.string().trim().optional(),
    category: z.string().trim().min(2, 'Category must be at least 2 characters'),
    price: z.coerce.number().positive('Price must be greater than zero'),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
    itemId: z.string().uuid('Invalid item id'),
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Item name must be at least 2 characters').optional(),
    description: z.string().trim().optional(),
    category: z.string().trim().min(2, 'Category must be at least 2 characters').optional(),
    price: z.coerce.number().positive('Price must be greater than zero').optional(),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative').optional(),
  }),
});
