import { API_BASE_URL, authHeaders, parseApiResponse } from './api';
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
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items`, {
    headers: authHeaders('form'),
  });

  return parseApiResponse<{ items: Item[] }>(response, 'Inventory request failed');
};

export const createStoreItem = async (storeId: string, payload: ItemFormPayload) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items`, {
    method: 'POST',
    headers: authHeaders('form'),
    body: toFormData(payload),
  });

  return parseApiResponse(response, 'Inventory request failed');
};

export const updateStoreItem = async (
  storeId: string,
  itemId: string,
  payload: ItemFormPayload,
) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items/${itemId}`, {
    method: 'PATCH',
    headers: authHeaders('form'),
    body: toFormData(payload),
  });

  return parseApiResponse(response, 'Inventory request failed');
};

export const deleteStoreItem = async (storeId: string, itemId: string) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders('form'),
  });

  return parseApiResponse(response, 'Inventory request failed');
};
