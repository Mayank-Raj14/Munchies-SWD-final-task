import { ApiError, API_BASE_URL, authHeaders, parseApiResponse } from './api';
import { getAuthToken } from './session';
export { clearAuthToken, getAuthToken, saveAuthToken } from './session';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'STORE_OWNER' | 'ADMIN';
  };
};

const requestAuth = async (path: string, payload: RegisterPayload | LoginPayload) => {
  const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<AuthResponse>(response, 'Authentication request failed');
};

export const registerUser = (payload: RegisterPayload) => requestAuth('register', payload);

export const loginUser = (payload: LoginPayload) => requestAuth('login', payload);

export const getCurrentUser = async () => {
  if (!getAuthToken()) {
    throw new ApiError('Authentication is required', 401);
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });

  return parseApiResponse(response, 'Unable to load current user') as Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: 'USER' | 'STORE_OWNER' | 'ADMIN';
    };
  }>;
};
