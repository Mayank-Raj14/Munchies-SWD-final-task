import { API_BASE_URL, authHeaders, parseApiResponse } from './api';

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
  const response = await fetch(`${API_BASE_URL}/store-ownership-requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseApiResponse<{ request: StoreOwnershipRequest }>(response, 'Request failed');
};

export const getMyStoreOwnershipRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/store-ownership-requests`, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ requests: StoreOwnershipRequest[] }>(response, 'Request failed');
};

export const getPendingStoreOwnershipRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/store-ownership-requests`, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ requests: StoreOwnershipRequest[] }>(response, 'Request failed');
};

export const approveStoreOwnershipRequest = async (requestId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/store-ownership-requests/${requestId}/approve`,
    {
      method: 'PATCH',
      headers: authHeaders(),
    },
  );

  return parseApiResponse(response, 'Request failed');
};

export const rejectStoreOwnershipRequest = async (requestId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/store-ownership-requests/${requestId}/reject`,
    {
      method: 'PATCH',
      headers: authHeaders(),
    },
  );

  return parseApiResponse(response, 'Request failed');
};
