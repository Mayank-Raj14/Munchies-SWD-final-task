import { API_BASE_URL, authHeaders, parseApiResponse } from './api';
import type { Cart } from '@/types/cart';

export const getCarts = async () => {
  const response = await fetch(`${API_BASE_URL}/carts`, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ carts: Cart[] }>(response, 'Cart request failed');
};

export const addToCart = async (payload: { itemId: string; quantity: number }) => {
  const response = await fetch(`${API_BASE_URL}/carts/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseApiResponse<{ cart: Cart }>(response, 'Cart request failed');
};

export const updateCartItem = async (cartItemId: string, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/carts/items/${cartItemId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ quantity }),
  });

  return parseApiResponse<{ cart: Cart }>(response, 'Cart request failed');
};

export const removeCartItem = async (cartItemId: string) => {
  const response = await fetch(`${API_BASE_URL}/carts/items/${cartItemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseApiResponse(response, 'Cart request failed');
};

export const clearCart = async (cartId: string) => {
  const response = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseApiResponse(response, 'Cart request failed');
};
