import { getAuthToken } from './auth';
import type { Cart } from '@/types/cart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

const parseResponse = async (response: Response) => {
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? 'Cart request failed');
  }

  return data;
};

const authHeaders = () => {
  const token = getAuthToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getCarts = async () => {
  const response = await fetch(`${API_BASE_URL}/carts`, {
    headers: authHeaders(),
  });

  return parseResponse(response) as Promise<{ carts: Cart[] }>;
};

export const addToCart = async (payload: { itemId: string; quantity: number }) => {
  const response = await fetch(`${API_BASE_URL}/carts/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response) as Promise<{ cart: Cart }>;
};

export const updateCartItem = async (cartItemId: string, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/carts/items/${cartItemId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ quantity }),
  });

  return parseResponse(response) as Promise<{ cart: Cart }>;
};

export const removeCartItem = async (cartItemId: string) => {
  const response = await fetch(`${API_BASE_URL}/carts/items/${cartItemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseResponse(response);
};

export const clearCart = async (cartId: string) => {
  const response = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseResponse(response);
};
