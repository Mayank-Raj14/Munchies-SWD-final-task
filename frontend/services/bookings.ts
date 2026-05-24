import { API_ROUTES } from '@/lib/api-routes';
import { buildApiUrl } from '@/lib/api-url';
import { apiFetch, authHeaders, parseApiResponse } from './api';
import { notifyDataChanged } from '@/lib/sync-events';
import type { Booking, BookingStatus } from '@/types/booking';

export const checkoutCart = async (cartId: string) => {
  const url = buildApiUrl(API_ROUTES.bookings.checkout);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ cartId }),
  });

  const data = await parseApiResponse<{ booking: Booking }>(response, 'Booking request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged(['bookings', 'cart', 'inventory', 'stores']);
  return data;
};

export const getBookings = async (scope?: 'store' | 'personal') => {
  const url = buildApiUrl(
    API_ROUTES.bookings.list,
    scope ? { scope } : undefined,
  );
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ bookings: Booking[] }>(response, 'Booking request failed', {
    url,
    method: 'GET',
  });
};

export const getBooking = async (bookingId: string) => {
  const url = buildApiUrl(API_ROUTES.bookings.byId(bookingId));
  const response = await apiFetch(url, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed', {
    url,
    method: 'GET',
  });
};

export const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
  const url = buildApiUrl(API_ROUTES.bookings.status(bookingId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await parseApiResponse<{ booking: Booking }>(response, 'Booking request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['bookings', 'inventory', 'stores']);
  return data;
};

export const requestBookingCancellation = async (bookingId: string) => {
  const url = buildApiUrl(API_ROUTES.bookings.cancellationRequest(bookingId));
  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<{ booking: Booking }>(response, 'Booking request failed', {
    url,
    method: 'POST',
  });
  notifyDataChanged('bookings');
  return data;
};

export const approveBookingCancellation = async (bookingId: string) => {
  const url = buildApiUrl(API_ROUTES.bookings.cancellationApprove(bookingId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<{ booking: Booking }>(response, 'Booking request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged(['bookings', 'inventory', 'stores']);
  return data;
};

export const rejectBookingCancellation = async (bookingId: string) => {
  const url = buildApiUrl(API_ROUTES.bookings.cancellationReject(bookingId));
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  const data = await parseApiResponse<{ booking: Booking }>(response, 'Booking request failed', {
    url,
    method: 'PATCH',
  });
  notifyDataChanged('bookings');
  return data;
};
