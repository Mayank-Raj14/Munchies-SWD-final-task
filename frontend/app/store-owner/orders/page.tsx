'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  bookingStatusBadgeClass,
  formatBookingDate,
  formatBookingStatus,
} from '@/lib/booking-display';
import { ApiError } from '@/services/api';
import {
  approveBookingCancellation,
  getBookings,
  rejectBookingCancellation,
  updateBookingStatus,
} from '@/services/bookings';
import type { Booking, BookingStatus } from '@/types/booking';
import { useRequireAuth } from '@/hooks/use-require-auth';

const statusSections: { status: BookingStatus; title: string; description: string }[] = [
  {
    status: 'PENDING',
    title: 'Pending orders',
    description: 'New orders waiting for your response.',
  },
  {
    status: 'CONFIRMED',
    title: 'Accepted orders',
    description: 'Orders you accepted and are preparing.',
  },
  {
    status: 'COMPLETED',
    title: 'Completed orders',
    description: 'Orders marked as fulfilled.',
  },
  {
    status: 'CANCELLED',
    title: 'Rejected / cancelled orders',
    description: 'Orders you rejected or cancellations that were approved.',
  },
];

export default function StoreOwnerOrdersPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getBookings('store');
      setBookings(data.bookings);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace('/login');
        return;
      }

      setError(loadError instanceof Error ? loadError.message : 'Unable to load orders.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void loadBookings();
  }, [isAuthLoading, loadBookings]);

  const bookingsByStatus = useMemo(() => {
    return statusSections.reduce(
      (groups, section) => {
        groups[section.status] = bookings.filter((booking) => booking.status === section.status);
        return groups;
      },
      {} as Record<BookingStatus, Booking[]>,
    );
  }, [bookings]);

  const replaceBooking = (nextBooking: Booking) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );
  };

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    setBusyId(bookingId);
    setMessage('');
    setError('');

    try {
      const data = await updateBookingStatus(bookingId, status);
      replaceBooking(data.booking);
      setMessage(`Order ${formatBookingStatus(status).toLowerCase()}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Status update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancellationAction = async (bookingId: string, action: 'approve' | 'reject') => {
    setBusyId(bookingId);
    setMessage('');
    setError('');

    try {
      const data =
        action === 'approve'
          ? await approveBookingCancellation(bookingId)
          : await rejectBookingCancellation(bookingId);

      replaceBooking(data.booking);
      setMessage(action === 'approve' ? 'Cancellation approved.' : 'Cancellation request rejected.');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Cancellation action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">Store owner</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Order management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Accept, reject, and complete orders from your stores. Changes save to the database
              immediately.
            </p>
          </div>
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadBookings()}
            type="button"
          >
            Refresh
          </button>
        </div>

        {message ? <p className="mt-6 text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-6 text-sm font-medium text-red-700">{error}</p> : null}

        {isLoading ? (
          <p className="mt-10 text-sm text-slate-600">Loading orders...</p>
        ) : bookings.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-950">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              When customers place orders at your stores, they will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {statusSections.map((section) => {
              const sectionBookings = bookingsByStatus[section.status];

              return (
                <section key={section.status}>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{section.description}</p>
                  </div>

                  {sectionBookings.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                      No {section.title.toLowerCase()}.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {sectionBookings.map((booking) => (
                        <article
                          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                          key={booking.id}
                        >
                          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-950">
                                {booking.store.name}
                              </h3>
                              <p className="mt-1 text-sm text-slate-600">
                                {booking.store.hostel.name} - Room {booking.store.roomNumber}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Placed {formatBookingDate(booking.createdAt)}
                              </p>
                              {booking.user ? (
                                <p className="mt-2 text-sm text-slate-950">
                                  Customer: {booking.user.name} ({booking.user.email})
                                </p>
                              ) : null}
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${bookingStatusBadgeClass(booking.status)}`}
                            >
                              {formatBookingStatus(booking.status)}
                            </span>
                          </div>

                          {booking.cancellationRequestedAt && booking.status !== 'CANCELLED' ? (
                            <p className="mt-4 text-sm font-medium text-amber-800">
                              Customer requested cancellation
                            </p>
                          ) : null}

                          <div className="divide-y divide-slate-200">
                            {booking.items.map((bookingItem) => (
                              <div
                                className="flex items-center justify-between gap-4 py-3 text-sm"
                                key={bookingItem.id}
                              >
                                <div>
                                  <p className="font-medium text-slate-950">
                                    {bookingItem.item.name}
                                  </p>
                                  <p className="mt-1 text-slate-600">Qty {bookingItem.quantity}</p>
                                </div>
                                <p className="font-medium text-slate-950">
                                  Rs.{' '}
                                  {(Number(bookingItem.price) * bookingItem.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col items-end gap-3 border-t border-slate-200 pt-4">
                            <p className="text-sm font-semibold text-slate-950">
                              Total: Rs. {Number(booking.totalAmount).toFixed(2)}
                            </p>

                            {booking.status === 'PENDING' && !booking.cancellationRequestedAt ? (
                              <div className="flex flex-wrap justify-end gap-3">
                                <button
                                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  disabled={busyId === booking.id}
                                  onClick={() => void handleStatusUpdate(booking.id, 'CONFIRMED')}
                                  type="button"
                                >
                                  {busyId === booking.id ? 'Saving...' : 'Accept order'}
                                </button>
                                <button
                                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={busyId === booking.id}
                                  onClick={() => void handleStatusUpdate(booking.id, 'CANCELLED')}
                                  type="button"
                                >
                                  Reject order
                                </button>
                              </div>
                            ) : null}

                            {booking.status === 'CONFIRMED' && !booking.cancellationRequestedAt ? (
                              <button
                                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={busyId === booking.id}
                                onClick={() => void handleStatusUpdate(booking.id, 'COMPLETED')}
                                type="button"
                              >
                                {busyId === booking.id ? 'Saving...' : 'Mark completed'}
                              </button>
                            ) : null}

                            {booking.cancellationRequestedAt &&
                            booking.status !== 'CANCELLED' &&
                            booking.status !== 'COMPLETED' ? (
                              <div className="flex flex-wrap justify-end gap-3">
                                <button
                                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  disabled={busyId === booking.id}
                                  onClick={() => void handleCancellationAction(booking.id, 'approve')}
                                  type="button"
                                >
                                  Approve cancellation
                                </button>
                                <button
                                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={busyId === booking.id}
                                  onClick={() => void handleCancellationAction(booking.id, 'reject')}
                                  type="button"
                                >
                                  Reject cancellation
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
