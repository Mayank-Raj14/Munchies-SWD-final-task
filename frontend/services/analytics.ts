import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, authHeaders, parseApiResponse } from './api';
import type { StoreAnalytics, UserAnalytics } from '@/types/analytics';

export const getUserAnalytics = async () => {
  const url = buildApiUrl(API_ROUTES.analytics.me);
  const response = await apiFetch(url, { headers: authHeaders() });
  return parseApiResponse<{ analytics: UserAnalytics }>(response, 'Analytics request failed', {
    url,
    method: 'GET',
  });
};

export const getStoreAnalytics = async (storeId: string, lowStockThreshold = 5) => {
  const url = buildApiUrl(API_ROUTES.analytics.store(storeId), {
    lowStockThreshold: String(lowStockThreshold),
  });
  const response = await apiFetch(url, { headers: authHeaders() });
  return parseApiResponse<{ analytics: StoreAnalytics }>(response, 'Analytics request failed', {
    url,
    method: 'GET',
  });
};
