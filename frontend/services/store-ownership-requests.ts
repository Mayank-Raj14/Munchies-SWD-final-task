import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, authHeaders, parseApiResponse } from './api';
import { notifyDataChanged } from '@/lib/sync-events';

type CreateRequestPayload = {
  hostelId: string;
  storeName: string;
  roomNumber: string;
};

export type StoreOwnershipRequest = {
  id: string;
  storeName: string;
  roomNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'STORE_OWNER' | 'ADMIN';
  };
  hostel: {
    id: string;
    name: string;
  };
};

export const createStoreOwnershipRequest = async (payload: CreateRequestPayload) => {
  const url = buildApiUrl(API_ROUTES.storeOwnershipRequests.list);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ request: StoreOwnershipRequest }>(
    response,
    'Request failed',
    { url, method: 'POST' },
  );
  notifyDataChanged('ownership');
  return data;
};

export const getMyStoreOwnershipRequests = async () => {
  const url = buildApiUrl(API_ROUTES.storeOwnershipRequests.list);
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ requests: StoreOwnershipRequest[] }>(response, 'Request failed', {
    url,
    method: 'GET',
  });
};

export const getPendingStoreOwnershipRequests = async () => {
  const url = buildApiUrl(API_ROUTES.storeOwnershipRequests.adminList);
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ requests: StoreOwnershipRequest[] }>(response, 'Request failed', {
    url,
    method: 'GET',
  });
};

export const approveStoreOwnershipRequest = async (requestId: string) => {
  const url = buildApiUrl(API_ROUTES.storeOwnershipRequests.adminApprove(requestId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['auth', 'ownership', 'stores']);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('munchies-auth-refresh-requested'));
  }
  return data;
};

export const rejectStoreOwnershipRequest = async (requestId: string) => {
  const url = buildApiUrl(API_ROUTES.storeOwnershipRequests.adminReject(requestId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  const data = await parseApiResponse(response, 'Request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged('ownership');
  return data;
};
