import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, authHeaders, parseApiResponse } from './api';
import { notifyDataChanged } from '@/lib/sync-events';
import type { Cart } from '@/types/cart';

export const getCarts = async () => {
  const url = buildApiUrl(API_ROUTES.carts.list);
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ carts: Cart[] }>(response, 'Cart request failed', {
    url,
    method: 'GET',
  });
};

export const addToCart = async (payload: { itemId: string; quantity: number }) => {
  const url = buildApiUrl(API_ROUTES.carts.items);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ cart: Cart }>(response, 'Cart request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged('cart');
  return data;
};

export const updateCartItem = async (cartItemId: string, quantity: number) => {
  const url = buildApiUrl(API_ROUTES.carts.itemById(cartItemId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ quantity }),
  });

  const data = await parseApiResponse<{ cart: Cart }>(response, 'Cart request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged('cart');
  return data;
};

export const removeCartItem = async (cartItemId: string) => {
  const url = buildApiUrl(API_ROUTES.carts.itemById(cartItemId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Cart request failed', {
    url,
    method: 'DELETE',
  });
  notifyDataChanged('cart');
  return data;
};

export const clearCart = async (cartId: string) => {
  const url = buildApiUrl(API_ROUTES.carts.byId(cartId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Cart request failed', {
    url,
    method: 'DELETE',
  });
  notifyDataChanged('cart');
  return data;
};
