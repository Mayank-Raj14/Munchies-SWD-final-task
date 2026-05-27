const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

/** Strip whitespace and stray slashes from URL parts (prevents `/api%20/...`). */
export const sanitizeUrlPart = (value: string): string => value.trim().replace(/\s+/g, '');

/**
 * Join a base URL with one or more path segments without duplicate or spaced slashes.
 */
export const joinUrl = (base: string, ...segments: string[]): string => {
  const cleanBase = sanitizeUrlPart(base).replace(/\/+$/, '');
  const path = segments
    .map((segment) => sanitizeUrlPart(segment).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

  if (!path) {
    return cleanBase;
  }

  if (/^https?:\/\//i.test(cleanBase)) {
    return `${cleanBase}/${path}`;
  }

  return cleanBase.startsWith('/')
    ? `${cleanBase}/${path}`
    : `/${cleanBase}/${path}`.replace(/\/+/g, '/');
};

export const resolveApiBaseUrl = (raw?: string): string => {
  const resolved = sanitizeUrlPart(raw ?? DEFAULT_API_BASE_URL);
  if (!resolved) {
    return DEFAULT_API_BASE_URL;
  }
  return resolved.replace(/\/+$/, '');
};

export const getApiOrigin = (baseUrl: string = resolveApiBaseUrl()): string => {
  const base = resolveApiBaseUrl(baseUrl);
  if (base.endsWith('/api')) {
    return base.slice(0, -4);
  }
  return base.replace(/\/api\/?$/, '');
};

export type ApiQuery = URLSearchParams | Record<string, string | number | undefined>;

const toSearchParams = (query?: ApiQuery): URLSearchParams | undefined => {
  if (!query) {
    return undefined;
  }

  if (query instanceof URLSearchParams) {
    return query;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return params;
};

/** Build a full API request URL from a route constant and optional query string. */
export const buildApiUrl = (
  route: string,
  query?: ApiQuery,
  baseUrl: string = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
): string => {
  const url = joinUrl(baseUrl, route);
  const params = toSearchParams(query);

  if (!params || [...params.keys()].length === 0) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

/** Resolve uploaded asset paths against the API origin (not the `/api` prefix). */
export const buildAssetUrl = (assetPath: string): string => {
  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const path = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return joinUrl(getApiOrigin(), path);
};
