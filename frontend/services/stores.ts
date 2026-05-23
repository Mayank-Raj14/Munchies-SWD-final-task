import { getAuthToken } from './auth';
import type { StoreListResponse } from '@/types/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

type StorePayload = {
  name: string;
  hostelId: string;
  roomNumber: string;
};

const parseResponse = async (response: Response) => {
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? 'Store request failed');
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

export const getStores = async (params: { search?: string; page?: number } = {}) => {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: '12',
  });

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const response = await fetch(`${API_BASE_URL}/stores?${searchParams.toString()}`);

  return parseResponse(response) as Promise<StoreListResponse>;
};

export const getStore = async (storeId: string) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`);

  return parseResponse(response);
};

export const getMyStores = async () => {
  const response = await fetch(`${API_BASE_URL}/stores/my-stores`, {
    headers: authHeaders(),
  });

  return parseResponse(response);
};

export const createStore = async (payload: StorePayload) => {
  const response = await fetch(`${API_BASE_URL}/stores`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const updateStore = async (storeId: string, payload: StorePayload) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const deleteStore = async (storeId: string) => {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseResponse(response);
};
