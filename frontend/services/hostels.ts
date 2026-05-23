import { API_BASE_URL, parseApiResponse } from './api';
import type { Hostel } from '@/types/hostel';

export const getHostels = async () => {
  const response = await fetch(`${API_BASE_URL}/hostels`);

  return parseApiResponse<{ hostels: Hostel[] }>(response, 'Unable to load hostels');
};
