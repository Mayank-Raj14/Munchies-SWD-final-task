import type { Hostel } from '@/types/hostel';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

export const getHostels = async () => {
  const response = await fetch(`${API_BASE_URL}/hostels`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load hostels');
  }

  return data as { hostels: Hostel[] };
};
