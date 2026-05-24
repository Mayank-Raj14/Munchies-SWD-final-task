import { buildApiUrl, getApiOrigin, resolveApiBaseUrl } from '@/lib/api-url';
import { clearAuthToken, getAuthToken } from './session';

export const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export const API_ORIGIN = getApiOrigin(API_BASE_URL);

export { buildApiUrl, buildAssetUrl, getApiOrigin, joinUrl, resolveApiBaseUrl } from '@/lib/api-url';
export { API_ROUTES } from '@/lib/api-routes';

export class ApiError extends Error {
  status: number;
  url?: string;
  method?: string;

  constructor(message: string, status: number, meta?: { url?: string; method?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = meta?.url;
    this.method = meta?.method;
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

const isDev = process.env.NODE_ENV === 'development';

const logApiFailure = (
  response: Response,
  requestUrl: string,
  method: string,
  body: unknown,
) => {
  if (!isDev) {
    return;
  }

  console.error('[Munchies API]', {
    method,
    url: requestUrl,
    status: response.status,
    statusText: response.statusText,
    message: typeof body === 'object' && body !== null && 'message' in body ? body.message : body,
  });
};

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method ?? 'GET';

  if (isDev && /\s|%20/i.test(requestUrl)) {
    console.warn('[Munchies API] Malformed URL contains whitespace:', requestUrl);
  }

  try {
    return await globalThis.fetch(input, {
      cache: 'no-store',
      ...init,
      headers: init?.headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      if (isDev) {
        console.error('[Munchies API] Network error:', { method, url: requestUrl, error });
      }

      throw new ApiError('API is offline. Start the backend and try again.', 0, {
        url: requestUrl,
        method,
      });
    }

    throw error;
  }
};

export const parseApiResponse = async <T>(
  response: Response,
  fallbackMessage: string,
  meta?: { url?: string; method?: string },
): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';
  let data: { message?: string } | null = null;

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      data = await response.json();
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }

    if (response.status === 403 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('munchies-auth-refresh-requested'));
    }

    logApiFailure(response, meta?.url ?? response.url, meta?.method ?? 'GET', data);

    throw new ApiError(data?.message ?? fallbackMessage, response.status, meta);
  }

  return data as T;
};
