'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReceiptText } from 'lucide-react';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  divideClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
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
import { useSyncedRefresh } from '@/lib/sync-events';

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
    status: 'READY',
    title: 'Ready for pickup',
    description: 'Orders waiting for customer collection.',
  },
  {
    status: 'CANCEL_REQUESTED',
    title: 'Cancellation requests',
    description: 'Customer requests waiting for review.',
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
  {
    status: 'EXPIRED',
    title: 'Expired orders',
    description: 'Uncollected orders restored by policy.',
  },
];

export default function StoreOwnerOrdersPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthorized } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBookings = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
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
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthorized) {
      return;
    }

    void loadBookings();
  }, [isAuthLoading, isAuthorized, loadBookings]);

  useSyncedRefresh(['bookings'], () => loadBookings({ silent: true }), {
    enabled: isAuthorized,
  });

  const bookingsByStatus = useMemo(() => {
    return statusSections.reduce(
      (groups, section) => {
        groups[section.status] = bookings.filter((booking) => booking.status === section.status);
        return groups;
      },
      {} as Record<BookingStatus, Booking[]>,
    );
  }, [bookings]);

  if (isAuthLoading || !isAuthorized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-16">
          <LoadingSpinner className="h-6 w-6" />
          <p className="text-sm text-foreground-muted">Checking access…</p>
        </div>
      </PageContainer>
    );
  }

  const replaceBooking = (nextBooking: Booking) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );
  };

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    if (busyId) {
      return;
    }

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
    if (busyId) {
      return;
    }

    setBusyId(bookingId);
    setMessage('');
    setError('');

    try {
      const data =
        action === 'approve'
          ? await approveBookingCancellation(bookingId)
          : await rejectBookingCancellation(bookingId);

      replaceBooking(data.booking);
      setMessage(
        action === 'approve' ? 'Cancellation approved.' : 'Cancellation request rejected.',
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Cancellation action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer size="wide">
      <section>
        <SectionHeader
          action={
            <button
              className={secondaryButtonClass}
              disabled={isLoading}
              onClick={() => void loadBookings()}
              type="button"
            >
              Refresh
            </button>
          }
          description="Accept, complete, or review cancellations."
          title="Seller orders"
        />

        {message ? (
          <div className="mt-6">
            <Notice tone="success">{message}</Notice>
          </div>
        ) : null}
        {error ? (
          <div className="mt-6">
            <Notice tone="danger">{error}</Notice>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <MarketSurface className="h-48 animate-pulse" key={item} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              description="When customers place orders at your stores, they will appear here."
              icon={ReceiptText}
              title="No orders yet"
            />
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {statusSections.map((section) => {
              const sectionBookings = bookingsByStatus[section.status];

              return (
                <section key={section.status}>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                    <p className="mt-1 text-sm font-medium text-foreground-secondary">
                      {section.description}
                    </p>
                  </div>

                  {sectionBookings.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-sm font-medium text-foreground-secondary">
                      No {section.title.toLowerCase()}.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {sectionBookings.map((booking) => (
                        <article
                          className="rounded-lg border border-border bg-surface p-5  transition hover:border-border-strong"
                          key={booking.id}
                        >
                          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-foreground">
                                {booking.store.name}
                              </h3>
                              <p className="mt-1 text-sm font-medium text-foreground-secondary">
                                {booking.store.hostel.name} - Room {booking.store.roomNumber}
                              </p>
                              <p className="mt-2 text-sm font-medium text-foreground-secondary">
                                Placed {formatBookingDate(booking.createdAt)}
                              </p>
                              {booking.user ? (
                                <p className="mt-2 text-sm font-bold text-foreground">
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

                          {booking.status === 'CANCEL_REQUESTED' ? (
                            <p className="mt-4 text-sm font-medium text-amber-800">
                              Customer requested cancellation
                            </p>
                          ) : null}

                          <div className={divideClass}>
                            {booking.items.map((bookingItem) => (
                              <div
                                className="flex items-center justify-between gap-4 py-3 text-sm"
                                key={bookingItem.id}
                              >
                                <div>
                                  <p className="font-bold text-foreground">
                                    {bookingItem.item.name}
                                  </p>
                                  <p className="mt-1 text-foreground-secondary">
                                    Qty {bookingItem.quantity}
                                  </p>
                                </div>
                                <p className="font-bold text-foreground">
                                  Rs.{' '}
                                  {(Number(bookingItem.price) * bookingItem.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col items-end gap-3 border-t border-border pt-4">
                            <p className="text-sm font-bold text-foreground">
                              Total: Rs. {Number(booking.totalAmount).toFixed(2)}
                            </p>

                            {booking.status === 'PENDING' && !booking.cancellationRequestedAt ? (
                              <div className="flex flex-wrap justify-end gap-3">
                                <button
                                  className={primaryButtonClass}
                                  disabled={busyId === booking.id}
                                  onClick={() => void handleStatusUpdate(booking.id, 'CONFIRMED')}
                                  type="button"
                                >
                                  {busyId === booking.id ? (
                                    <>
                                      <LoadingSpinner />
                                      Saving
                                    </>
                                  ) : (
                                    'Accept order'
                                  )}
                                </button>
                                <button
                                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground-secondary shadow-sm transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                                className={secondaryButtonClass}
                                disabled={busyId === booking.id}
                                onClick={() => void handleStatusUpdate(booking.id, 'READY')}
                                type="button"
                              >
                                {busyId === booking.id ? (
                                  <>
                                    <LoadingSpinner />
                                    Saving
                                  </>
                                ) : (
                                  'Mark ready'
                                )}
                              </button>
                            ) : null}

                            {booking.status === 'READY' && !booking.cancellationRequestedAt ? (
                              <button
                                className={secondaryButtonClass}
                                disabled={busyId === booking.id}
                                onClick={() => void handleStatusUpdate(booking.id, 'COMPLETED')}
                                type="button"
                              >
                                {busyId === booking.id ? (
                                  <>
                                    <LoadingSpinner />
                                    Saving
                                  </>
                                ) : (
                                  'Mark completed'
                                )}
                              </button>
                            ) : null}

                            {booking.status === 'CANCEL_REQUESTED' ? (
                              <div className="flex flex-wrap justify-end gap-3">
                                <button
                                  className={primaryButtonClass}
                                  disabled={busyId === booking.id}
                                  onClick={() =>
                                    void handleCancellationAction(booking.id, 'approve')
                                  }
                                  type="button"
                                >
                                  Approve cancellation
                                </button>
                                <button
                                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground-secondary shadow-sm transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={busyId === booking.id}
                                  onClick={() =>
                                    void handleCancellationAction(booking.id, 'reject')
                                  }
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
    </PageContainer>
  );
}
