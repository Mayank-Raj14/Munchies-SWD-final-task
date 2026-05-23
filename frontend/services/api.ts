import { clearAuthToken, getAuthToken } from './session';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const authHeaders = (contentType: 'json' | 'form' = 'json') => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (contentType === 'json') {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const parseApiResponse = async <T>(response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('content-type') ?? '';
  const data =
    response.status === 204
      ? null
      : contentType.includes('application/json')
        ? await response.json()
        : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }

    throw new ApiError(data?.message ?? fallbackMessage, response.status);
  }

  return data as T;
};
