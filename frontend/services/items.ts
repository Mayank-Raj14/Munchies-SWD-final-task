import { getAuthToken } from './auth';
import type { Item } from '@/types/item';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

export type ItemFormPayload = {
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  image?: File | null;
};

const authHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response: Response) => {
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? 'Inventory request failed');
  }

  return data;
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
    headers: authHeaders(),
  });

  return parseResponse(response) as Promise<{ items: Item[] }>;
};

export const createStoreItem = async (storeId: string, payload: ItemFormPayload) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: toFormData(payload),
  });

  return parseResponse(response);
};

export const updateStoreItem = async (
  storeId: string,
  itemId: string,
  payload: ItemFormPayload,
) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items/${itemId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: toFormData(payload),
  });

  return parseResponse(response);
};

export const deleteStoreItem = async (storeId: string, itemId: string) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseResponse(response);
};
