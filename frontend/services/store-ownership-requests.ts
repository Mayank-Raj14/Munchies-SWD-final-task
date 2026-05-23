import { getAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

type CreateRequestPayload = {
  hostelId: string;
  storeName: string;
  roomNumber: string;
};

const authHeaders = () => {
  const token = getAuthToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data;
};

export const createStoreOwnershipRequest = async (payload: CreateRequestPayload) => {
  const response = await fetch(`${API_BASE_URL}/store-ownership-requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const getPendingStoreOwnershipRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/store-ownership-requests`, {
    headers: authHeaders(),
  });

  return parseResponse(response);
};

export const approveStoreOwnershipRequest = async (requestId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/store-ownership-requests/${requestId}/approve`,
    {
      method: 'PATCH',
      headers: authHeaders(),
    },
  );

  return parseResponse(response);
};

export const rejectStoreOwnershipRequest = async (requestId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/store-ownership-requests/${requestId}/reject`,
    {
      method: 'PATCH',
      headers: authHeaders(),
    },
  );

  return parseResponse(response);
};
