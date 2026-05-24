import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, parseApiResponse } from './api';
import type { Hostel } from '@/types/hostel';

export const getHostels = async () => {
  const url = buildApiUrl(API_ROUTES.hostels);
  const response = await apiFetch(url);

  return parseApiResponse<{ hostels: Hostel[] }>(response, 'Unable to load hostels', {
    url,
    method: 'GET',
  });
};
