import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { notifyDataChanged } from '@/lib/sync-events';
import type { Campaign, CampaignType, CouponPreview } from '@/types/campaign';
import { apiFetch, authHeaders, parseApiResponse } from './api';

export type CampaignPayload = {
  storeId: string;
  code?: string;
  type: CampaignType;
  value: number;
  minOrderValue: number;
  globalUsageLimit?: number | null;
  perUserUsageLimit?: number | null;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
  itemIds?: string[];
};

export const getCampaigns = async (storeId: string) => {
  const url = buildApiUrl(API_ROUTES.campaigns.list, { storeId });
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ campaigns: Campaign[] }>(response, 'Campaign request failed', {
    url,
    method: 'GET',
  });
};

export const createCampaign = async (payload: CampaignPayload) => {
  const url = buildApiUrl(API_ROUTES.campaigns.list);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ campaign: Campaign }>(response, 'Campaign request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged(['campaigns', 'stores']);
  return data;
};

export const toggleCampaignActive = async (campaignId: string, isActive: boolean) => {
  const url = buildApiUrl(API_ROUTES.campaigns.deactivate(campaignId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ isActive }),
  });

  const data = await parseApiResponse<{ campaign: Campaign }>(response, 'Campaign request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['campaigns', 'stores']);
  return data;
};

export const deactivateCampaign = async (campaignId: string) => {
  return toggleCampaignActive(campaignId, false);
};

export const updateCampaign = async (campaignId: string, payload: Partial<CampaignPayload>) => {
  const url = buildApiUrl(API_ROUTES.campaigns.byId(campaignId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ campaign: Campaign }>(response, 'Campaign request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['campaigns', 'stores']);
  return data;
};

export const deleteCampaign = async (campaignId: string) => {
  const url = buildApiUrl(API_ROUTES.campaigns.delete(campaignId));
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<{ campaign: Campaign }>(response, 'Campaign request failed', {
    url,
    method: 'DELETE',
  });
  notifyDataChanged(['campaigns', 'stores']);
  return data;
};

export const validateCoupon = async (payload: { cartId: string; code: string }) => {
  const url = buildApiUrl(API_ROUTES.campaigns.validate);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseApiResponse<CouponPreview>(response, 'Coupon validation failed', {
    url,
    method: 'POST',
  });
};
