'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import {
  bookingStatusBadgeClass,
  formatBookingDate,
  formatBookingStatus,
} from '@/lib/booking-display';
import { ApiError } from '@/services/api';
import { getBookings, requestBookingCancellation } from '@/services/bookings';
import type { Booking } from '@/types/booking';

export default function BookingHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading: isAuthLoading } = useRequireAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const bookingData = await getBookings('personal');
      setBookings(bookingData.bookings);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace('/login');
        return;
      }

      setError(loadError instanceof Error ? loadError.message : 'Unable to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    void loadBookings();
  }, [isAuthLoading, loadBookings, user]);

  const replaceBooking = (nextBooking: Booking) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );
  };

  const handleCancellationRequest = async (bookingId: string) => {
    setBusyId(bookingId);
    setMessage('');
    setError('');

    try {
      const data = await requestBookingCancellation(bookingId);
      replaceBooking(data.booking);
      setMessage('Cancellation requested. The store owner will review it.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cancellation request failed.');
    } finally {
      setBusyId(null);
    }
  };

  const isStoreManager = user?.role === 'STORE_OWNER' || user?.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-emerald-700">Bookings</p>
            <h1 className="mt-3 text-4xl font-semibold text-stone-950">Your orders</h1>
            <p className="mt-2 text-sm text-stone-600">
              Track order status updates from stores you ordered from.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isStoreManager ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
                href="/store-owner/orders"
              >
                Manage store orders
              </Link>
            ) : null}
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 shadow-sm hover:border-emerald-700"
              href="/cart"
            >
              View cart
            </Link>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 shadow-sm hover:border-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void loadBookings()}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {message ? <p className="mt-6 text-sm font-medium text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-6 text-sm font-medium text-red-700">{error}</p> : null}

        {isLoading ? (
          <p className="mt-10 text-sm text-stone-600">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-stone-950">No bookings yet</h2>
            <p className="mt-2 text-sm text-stone-600">Browse stores and place your first order.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {bookings.map((booking) => (
              <article
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                key={booking.id}
              >
                <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-950">{booking.store.name}</h2>
                    <p className="mt-1 text-sm text-stone-600">
                      {booking.store.hostel.name} - Room {booking.store.roomNumber}
                    </p>
                    <p className="mt-2 text-sm text-stone-600">
                      Ordered {formatBookingDate(booking.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${bookingStatusBadgeClass(booking.status)}`}
                  >
                    {formatBookingStatus(booking.status)}
                  </span>
                </div>

                {booking.cancellationRequestedAt && booking.status !== 'CANCELLED' ? (
                  <p className="mt-4 text-sm font-medium text-amber-800">
                    Cancellation requested — waiting for store owner review
                  </p>
                ) : null}

                <div className="divide-y divide-stone-200">
                  {booking.items.map((bookingItem) => (
                    <div
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                      key={bookingItem.id}
                    >
                      <div>
                        <p className="font-medium text-stone-950">{bookingItem.item.name}</p>
                        <p className="mt-1 text-stone-600">Qty {bookingItem.quantity}</p>
                      </div>
                      <p className="font-medium text-stone-950">
                        Rs. {(Number(bookingItem.price) * bookingItem.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t border-stone-200 pt-4">
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-sm font-semibold text-stone-950">
                      Total: Rs. {Number(booking.totalAmount).toFixed(2)}
                    </p>
                    {!booking.cancellationRequestedAt &&
                    (booking.status === 'PENDING' || booking.status === 'CONFIRMED') ? (
                      <button
                        className="h-10 rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={busyId === booking.id}
                        onClick={() => void handleCancellationRequest(booking.id)}
                        type="button"
                      >
                        {busyId === booking.id ? 'Requesting...' : 'Request cancellation'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
