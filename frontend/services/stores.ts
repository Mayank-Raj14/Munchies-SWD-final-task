import { API_BASE_URL, authHeaders, parseApiResponse } from './api';
import type { Store, StoreListResponse } from '@/types/store';

type StorePayload = {
  name: string;
  hostelId: string;
  roomNumber: string;
};

export const getStores = async (params: { search?: string; page?: number } = {}) => {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: '12',
  });

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const response = await fetch(`${API_BASE_URL}/stores?${searchParams.toString()}`);

  return parseApiResponse<StoreListResponse>(response, 'Store request failed');
};

export const getStore = async (storeId: string) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`);

  return parseApiResponse<{ store: Store }>(response, 'Store request failed');
};

export const getMyStores = async () => {
  const response = await fetch(`${API_BASE_URL}/stores/my-stores`, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ stores: Store[] }>(response, 'Store request failed');
};

export const createStore = async (payload: StorePayload) => {
  const response = await fetch(`${API_BASE_URL}/stores`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseApiResponse<{ store: Store }>(response, 'Store request failed');
};

export const updateStore = async (storeId: string, payload: StorePayload) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseApiResponse<{ store: Store }>(response, 'Store request failed');
};

export const deleteStore = async (storeId: string) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseApiResponse(response, 'Store request failed');
};
