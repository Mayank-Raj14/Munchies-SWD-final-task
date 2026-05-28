import { API_ROUTES } from '@/lib/api-routes';

import { buildApiUrl } from '@/lib/api-url';
import { notifyDataChanged } from '@/lib/sync-events';
import { apiFetch, authHeaders, parseApiResponse } from './api';

export type UserSearchResult = {
  users: Array<{ id: string; name: string; email: string }>;
};

export type StoreListResult = {
  stores: Array<{ id: string; name: string }>;
};

export type ModerationResult = {
  [key: string]: unknown;
};

export const searchUsersForModeration = async (query: string) => {
  const url = buildApiUrl(API_ROUTES.admin.users.search(query));
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<UserSearchResult>(response, 'User search failed', { url });
};

export const listStoresForModeration = async () => {
  const url = buildApiUrl(API_ROUTES.admin.stores.list);
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<StoreListResult>(response, 'Unable to load stores', { url });
};

export const blockUserGlobally = async (userId: string, reason: string) => {
  const url = buildApiUrl(API_ROUTES.governance.globalBlock(userId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Block request failed', { url });
  notifyDataChanged(['auth', 'bookings', 'cart']);
  return data;
};

export const unblockUserGlobally = async (userId: string) => {
  const url = buildApiUrl(API_ROUTES.governance.globalBlock(userId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Unblock request failed', { url });
  notifyDataChanged(['auth', 'bookings', 'cart']);
  return data;
};

export const blockUserForStore = async (storeId: string, userId: string, reason: string) => {
  const url = buildApiUrl(API_ROUTES.governance.storeBlock(storeId, userId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Store block request failed', { url });
  notifyDataChanged(['bookings', 'cart', 'stores']);
  return data;
};

export const unblockUserForStore = async (storeId: string, userId: string) => {
  const url = buildApiUrl(API_ROUTES.governance.storeBlock(storeId, userId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Store unblock request failed', { url });
  notifyDataChanged(['bookings', 'cart', 'stores']);
  return data;
};

export const blockEveryoneFromStore = async (storeId: string, reason: string) => {
  const url = buildApiUrl(API_ROUTES.admin.stores.blockEveryone(storeId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Block everyone failed', { url });
  notifyDataChanged(['bookings', 'cart', 'stores']);
  return data;
};

export const unblockedEveryoneFromStore = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.admin.stores.blockEveryone(storeId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Unblock everyone failed', { url });
  notifyDataChanged(['bookings', 'cart', 'stores']);
  return data;
};

export const removeStoreAsAdmin = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.admin.stores.remove(storeId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Remove store failed', { url });
  notifyDataChanged(['stores']);
  return data;
};

export const suspendStoreAsAdmin = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.admin.stores.suspend(storeId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Suspend store failed', { url });
  notifyDataChanged(['stores', 'bookings', 'cart']);
  return data;
};

export const reactivateStoreAsAdmin = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.admin.stores.reactivate(storeId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<ModerationResult>(response, 'Reactivate store failed', { url });
  notifyDataChanged(['stores']);
  return data;
};

