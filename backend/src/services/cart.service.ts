import { Prisma } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { assertUserCanUseStore, assertUserNotGloballyBlocked } from './governance.service.js';

const cartInclude = {
  store: {
    select: {
      id: true,
      name: true,
      roomNumber: true,
      hostel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  items: {
    include: {
      item: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          imageUrl: true,
          price: true,
          stock: true,
          storeId: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const getCartTotal = (
  cart: Prisma.CartGetPayload<{
    include: typeof cartInclude;
  }>,
) => {
  return cart.items.reduce((total, cartItem) => {
    return total + Number(cartItem.item.price) * cartItem.quantity;
  }, 0);
};

const formatCart = (
  cart: Prisma.CartGetPayload<{
    include: typeof cartInclude;
  }>,
) => ({
  ...cart,
  total: getCartTotal(cart),
});

export const listUserCarts = async (userId: string) => {
  const carts = await prisma.cart.findMany({
    where: {
      userId,
      items: {
        some: {},
      },
    },
    include: cartInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return carts.map(formatCart);
};

export const addItemToCart = async (userId: string, itemId: string, quantity: number) => {
  return prisma.$transaction(
    async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          storeId: true,
          stock: true,
          isAvailable: true,
        },
      });

      if (!item) {
        throw new AppError('Item not found', 404);
      }

      await assertUserCanUseStore(
        userId,
        item.storeId,
        'add items to your cart from this store',
        tx,
      );

      if (!item.isAvailable) {
        throw new AppError('Item is unavailable', 409);
      }

      if (quantity > item.stock) {
        throw new AppError('Requested quantity exceeds available stock', 400);
      }

      const cart = await tx.cart.upsert({
        where: {
          userId_storeId: {
            userId,
            storeId: item.storeId,
          },
        },
        create: {
          userId,
          storeId: item.storeId,
        },
        update: {},
        select: { id: true },
      });

      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          cartId_itemId: {
            cartId: cart.id,
            itemId,
          },
        },
        select: {
          id: true,
          quantity: true,
        },
      });

      const nextQuantity = (existingCartItem?.quantity ?? 0) + quantity;

      if (nextQuantity > item.stock) {
        throw new AppError('Cart quantity exceeds available stock', 400);
      }

      if (existingCartItem) {
        const updated = await tx.cartItem.updateMany({
          where: {
            id: existingCartItem.id,
            quantity: existingCartItem.quantity,
          },
          data: {
            quantity: nextQuantity,
          },
        });

        if (updated.count !== 1) {
          throw new AppError('Cart was updated by another request', 409);
        }
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            itemId,
            quantity,
          },
        });
      }

      const updatedCart = await tx.cart.findFirst({
        where: {
          id: cart.id,
          userId,
        },
        include: cartInclude,
      });

      if (!updatedCart) {
        throw new AppError('Cart not found', 404);
      }

      return formatCart(updatedCart);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const updateCartItemQuantity = async (
  userId: string,
  cartItemId: string,
  quantity: number,
) => {
  return prisma.$transaction(
    async (tx) => {
      await assertUserNotGloballyBlocked(userId, 'modify carts', tx);

      const cartItem = await tx.cartItem.findFirst({
        where: {
          id: cartItemId,
          cart: { userId },
        },
        include: {
          item: {
            select: {
              stock: true,
              isAvailable: true,
            },
          },
          cart: {
            select: {
              id: true,
              storeId: true,
            },
          },
        },
      });

      if (!cartItem) {
        throw new AppError('Cart item not found', 404);
      }

      await assertUserCanUseStore(userId, cartItem.cart.storeId, 'modify this cart', tx);

      if (!cartItem.item.isAvailable) {
        throw new AppError('Item is unavailable', 409);
      }

      if (quantity > cartItem.item.stock) {
        throw new AppError('Requested quantity exceeds available stock', 400);
      }

      const updated = await tx.cartItem.updateMany({
        where: { id: cartItemId, cart: { userId } },
        data: { quantity },
      });

      if (updated.count !== 1) {
        throw new AppError('Cart was updated by another request', 409);
      }

      const cart = await tx.cart.findFirst({
        where: {
          id: cartItem.cart.id,
          userId,
        },
        include: cartInclude,
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      return formatCart(cart);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const removeCartItem = async (userId: string, cartItemId: string) => {
  await prisma.$transaction(
    async (tx) => {
      await assertUserNotGloballyBlocked(userId, 'modify carts', tx);

      const cartItem = await tx.cartItem.findFirst({
        where: {
          id: cartItemId,
          cart: { userId },
        },
        select: {
          id: true,
          cartId: true,
          cart: {
            select: {
              storeId: true,
            },
          },
        },
      });

      if (!cartItem) {
        throw new AppError('Cart item not found', 404);
      }

      await assertUserCanUseStore(userId, cartItem.cart.storeId, 'modify this cart', tx);

      await tx.cartItem.delete({
        where: { id: cartItem.id },
      });

      await deleteCartIfEmpty(cartItem.cartId, tx);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const clearCart = async (userId: string, cartId: string) => {
  await prisma.$transaction(
    async (tx) => {
      await assertUserNotGloballyBlocked(userId, 'modify carts', tx);

      const cart = await tx.cart.findFirst({
        where: {
          id: cartId,
          userId,
        },
        select: {
          id: true,
          storeId: true,
        },
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      await assertUserCanUseStore(userId, cart.storeId, 'modify this cart', tx);

      await tx.cartItem.deleteMany({
        where: { cartId },
      });

      await tx.cart.delete({
        where: { id: cartId },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

const deleteCartIfEmpty = async (cartId: string, db: typeof prisma | Prisma.TransactionClient) => {
  const remainingItems = await db.cartItem.count({
    where: { cartId },
  });

  if (remainingItems === 0) {
    await db.cart.delete({
      where: { id: cartId },
    });
  }
};
