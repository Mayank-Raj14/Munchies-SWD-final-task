import { API_BASE_URL, authHeaders, parseApiResponse } from './api';
import type { Booking, BookingStatus } from '@/types/booking';

export const checkoutCart = async (cartId: string) => {
  const response = await fetch(`${API_BASE_URL}/bookings/checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ cartId }),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed');
};

export const getBookings = async (scope?: 'store' | 'personal') => {
  const query = scope ? `?scope=${scope}` : '';
  const response = await fetch(`${API_BASE_URL}/bookings${query}`, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ bookings: Booking[] }>(response, 'Booking request failed');
};

export const getBooking = async (bookingId: string) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    headers: authHeaders(),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed');
};

export const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed');
};

export const requestBookingCancellation = async (bookingId: string) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancellation-request`, {
    method: 'POST',
    headers: authHeaders(),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed');
};

export const approveBookingCancellation = async (bookingId: string) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancellation/approve`, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed');
};

export const rejectBookingCancellation = async (bookingId: string) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancellation/reject`, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  return parseApiResponse<{ booking: Booking }>(response, 'Booking request failed');
};
