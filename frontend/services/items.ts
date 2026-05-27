import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, authHeaders, parseApiResponse } from './api';
import { notifyDataChanged } from '@/lib/sync-events';
import type { Item } from '@/types/item';

export type ItemFormPayload = {
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  image?: File | null;
};

const toFormData = (payload: ItemFormPayload) => {
  const formData = new FormData();

  formData.set('name', payload.name);
  formData.set('description', payload.description);
  formData.set('category', payload.category);
  formData.set('price', payload.price);
  formData.set('stock', payload.stock);

  if (payload.image) {
    formData.set('image', payload.image);
  }

  return formData;
};

export const getStoreItems = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.stores.items(storeId));
  const response = await apiFetch(url, {
    headers: authHeaders('form'),
  });

  return parseApiResponse<{ items: Item[] }>(response, 'Inventory request failed', {
    url,
    method: 'GET',
  });
};

export const createStoreItem = async (storeId: string, payload: ItemFormPayload) => {
  const url = buildApiUrl(API_ROUTES.stores.items(storeId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders('form'),
    body: toFormData(payload),
  });

  const data = await parseApiResponse<{ item: Item }>(response, 'Inventory request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged(['inventory', 'stores', 'analytics']);
  return data;
};

export const updateStoreItem = async (
  storeId: string,
  itemId: string,
  payload: ItemFormPayload,
) => {
  const url = buildApiUrl(API_ROUTES.stores.itemById(storeId, itemId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders('form'),
    body: toFormData(payload),
  });

  const data = await parseApiResponse<{ item: Item }>(response, 'Inventory request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['inventory', 'stores', 'cart', 'analytics']);
  return data;
};

export const deleteStoreItem = async (storeId: string, itemId: string) => {
  const url = buildApiUrl(API_ROUTES.stores.itemById(storeId, itemId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders('form'),
  });

  const data = await parseApiResponse<void>(response, 'Inventory request failed', {
    url,
    method: 'DELETE',
  });
  notifyDataChanged(['inventory', 'stores', 'cart', 'analytics']);
  return data;
};
