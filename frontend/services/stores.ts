import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, authHeaders, parseApiResponse } from './api';
import { notifyDataChanged } from '@/lib/sync-events';
import type { Store, StoreListResponse } from '@/types/store';

type StorePayload = {
  name: string;
  hostelId: string;
  roomNumber: string;
  email?: string | null;
};

export const getStores = async (
  params: { search?: string; page?: number; hostelId?: string; limit?: number } = {},
) => {
  const query: Record<string, string> = {
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 12),
  };

  const trimmedSearch = params.search?.trim();

  if (trimmedSearch) {
    query.search = trimmedSearch;
  }

  if (params.hostelId) {
    query.hostelId = params.hostelId;
  }

  const url = buildApiUrl(API_ROUTES.stores.list, query);
  const response = await apiFetch(url);

  return parseApiResponse<StoreListResponse>(response, 'Store request failed', {
    url,
    method: 'GET',
  });
};

export const getStore = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.stores.byId(storeId));
  const response = await apiFetch(url);

  return parseApiResponse<{ store: Store }>(response, 'Store request failed', {
    url,
    method: 'GET',
  });
};

export const getMyStores = async () => {
  const url = buildApiUrl(API_ROUTES.stores.myStores);
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ stores: Store[] }>(response, 'Store request failed', {
    url,
    method: 'GET',
  });
};

export const createStore = async (payload: StorePayload) => {
  const url = buildApiUrl(API_ROUTES.stores.list);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ store: Store }>(response, 'Store request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged(['stores', 'ownership']);
  return data;
};

export const updateStore = async (storeId: string, payload: StorePayload) => {
  const url = buildApiUrl(API_ROUTES.stores.byId(storeId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ store: Store }>(response, 'Store request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['stores']);
  return data;
};

export const deleteStore = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.stores.byId(storeId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Store request failed', {
    url,
    method: 'DELETE',
  });
  notifyDataChanged(['stores', 'inventory']);
  return data;
};
