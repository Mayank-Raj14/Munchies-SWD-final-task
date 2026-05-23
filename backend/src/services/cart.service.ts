import { Prisma } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

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
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      storeId: true,
      stock: true,
    },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (quantity > item.stock) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  const cart = await prisma.cart.upsert({
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

  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_itemId: {
        cartId: cart.id,
        itemId,
      },
    },
    select: {
      quantity: true,
    },
  });

  const nextQuantity = (existingCartItem?.quantity ?? 0) + quantity;

  if (nextQuantity > item.stock) {
    throw new AppError('Cart quantity exceeds available stock', 400);
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_itemId: {
        cartId: cart.id,
        itemId,
      },
    },
    create: {
      cartId: cart.id,
      itemId,
      quantity,
    },
    update: {
      quantity: nextQuantity,
    },
  });

  return getCartById(cart.id, userId);
};

export const updateCartItemQuantity = async (
  userId: string,
  cartItemId: string,
  quantity: number,
) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
    include: {
      item: {
        select: {
          stock: true,
        },
      },
      cart: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  if (quantity > cartItem.item.stock) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return getCartById(cartItem.cart.id, userId);
};

export const removeCartItem = async (userId: string, cartItemId: string) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
    select: {
      id: true,
      cartId: true,
    },
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  await prisma.cartItem.delete({
    where: { id: cartItem.id },
  });

  await deleteCartIfEmpty(cartItem.cartId);
};

export const clearCart = async (userId: string, cartId: string) => {
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  await prisma.cart.delete({
    where: { id: cartId },
  });
};

const getCartById = async (cartId: string, userId: string) => {
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
      userId,
    },
    include: cartInclude,
  });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  return formatCart(cart);
};

const deleteCartIfEmpty = async (cartId: string) => {
  const remainingItems = await prisma.cartItem.count({
    where: { cartId },
  });

  if (remainingItems === 0) {
    await prisma.cart.delete({
      where: { id: cartId },
    });
  }
};
