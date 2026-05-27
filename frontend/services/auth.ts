import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { ApiError, apiFetch, authHeaders, parseApiResponse } from './api';
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
  user: AuthUserResponse;
};

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'STORE_OWNER' | 'ADMIN';
  warningCount?: number;
  emailNotificationsEnabled?: boolean;
  preferences?: {
    bookings: boolean;
    promotions: boolean;
    newStores: boolean;
  } | null;
  globalBlock?: {
    reason: string;
    createdAt: string;
  } | null;
};

const authRouteByPath: Record<string, string> = {
  register: API_ROUTES.auth.register,
  login: API_ROUTES.auth.login,
};

const requestAuth = async (path: 'register' | 'login', payload: RegisterPayload | LoginPayload) => {
  const route = authRouteByPath[path];
  const url = buildApiUrl(route);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<AuthResponse>(response, 'Authentication request failed', {
    url,
    method: 'POST',
  });
};

export const registerUser = (payload: RegisterPayload) => requestAuth('register', payload);

export const loginUser = (payload: LoginPayload) => requestAuth('login', payload);

export const getCurrentUser = async () => {
  if (!getAuthToken()) {
    throw new ApiError('Authentication is required', 401);
  }

  const url = buildApiUrl(API_ROUTES.auth.me);
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse(response, 'Unable to load current user', {
    url,
    method: 'GET',
  }) as Promise<{ user: AuthUserResponse }>;
};

export const updateEmailPreferences = async (payload: {
  emailNotificationsEnabled: boolean;
  bookings?: boolean;
  promotions?: boolean;
  newStores?: boolean;
}) => {
  const url = buildApiUrl(API_ROUTES.auth.emailPreferences);
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseApiResponse(response, 'Unable to update email preferences', {
    url,
    method: 'PATCH',
  }) as Promise<{ user: AuthUserResponse }>;
};
