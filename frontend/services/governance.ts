import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { notifyDataChanged } from '@/lib/sync-events';
import { apiFetch, authHeaders, parseApiResponse } from './api';

export const blockUserGlobally = async (userId: string, reason: string) => {
  const url = buildApiUrl(API_ROUTES.governance.globalBlock(userId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });

  const data = await parseApiResponse(response, 'Block request failed', { url, method: 'POST' });
  notifyDataChanged(['auth', 'bookings', 'cart']);
  return data;
};

export const unblockUserGlobally = async (userId: string) => {
  const url = buildApiUrl(API_ROUTES.governance.globalBlock(userId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Unblock request failed', {
    url,
    method: 'DELETE',
  });
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

  const data = await parseApiResponse(response, 'Store block request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged(['bookings', 'cart', 'stores']);
  return data;
};

export const unblockUserForStore = async (storeId: string, userId: string) => {
  const url = buildApiUrl(API_ROUTES.governance.storeBlock(storeId, userId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Store unblock request failed', {
    url,
    method: 'DELETE',
  });
  notifyDataChanged(['bookings', 'cart', 'stores']);
  return data;
};
