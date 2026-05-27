'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  divideClass,
  dangerOutlineButtonClass,
  orderCardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBookings = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
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
        setHasLoaded(true);
        setIsLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    void loadBookings();
  }, [isAuthLoading, loadBookings, user]);

  useSyncedRefresh(['bookings'], () => loadBookings({ silent: true }), {
    enabled: !isAuthLoading && Boolean(user),
  });

  const replaceBooking = (nextBooking: Booking) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );
  };

  const handleCancellationRequest = async (bookingId: string) => {
    if (busyId) {
      return;
    }

    setBusyId(bookingId);
    setMessage('');
    setError('');

    try {
      const data = await requestBookingCancellation(bookingId);
      replaceBooking(data.booking);
      setMessage('Cancellation requested. The store owner will review it.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Cancellation request failed.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const isStoreManager = user?.role === 'STORE_OWNER' || user?.role === 'ADMIN';

  return (
    <PageContainer>
      <SectionHeader
        action={
          <>
            {isStoreManager ? (
              <Link className={primaryButtonClass} href="/store-owner/orders">
                Manage store orders
              </Link>
            ) : null}
            <Link className={secondaryButtonClass} href="/cart">
              View cart
            </Link>
            <button
              className={secondaryButtonClass}
              disabled={isLoading}
              onClick={() => void loadBookings()}
              type="button"
            >
              Refresh
            </button>
          </>
        }
        description="Status updates from your stores."
        title="Orders"
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

      {isLoading && !hasLoaded ? (
        <div className="mt-8 space-y-5">
          {[0, 1, 2].map((item) => (
            <MarketSurface className="animate-pulse p-5" key={item}>
              <div className="h-5 w-40 rounded bg-surface-raised" />
              <div className="mt-3 h-4 w-56 rounded bg-surface-raised" />
              <div className="mt-6 h-10 rounded bg-surface-raised" />
            </MarketSurface>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              <Link className={primaryButtonClass} href="/">
                Browse stores
              </Link>
            }
            description="Orders show up here after checkout."
            icon={ClipboardList}
            title="No orders yet"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {bookings.map((booking) => (
            <article className={orderCardClass} key={booking.id}>
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{booking.store.name}</h2>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {booking.store.hostel.name} - Room {booking.store.roomNumber}
                  </p>
                  <p className="mt-2 text-sm text-foreground-secondary">
                    Ordered {formatBookingDate(booking.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${bookingStatusBadgeClass(booking.status)}`}
                >
                  {formatBookingStatus(booking.status)}
                </span>
              </div>

              {booking.status === 'CANCEL_REQUESTED' ? (
                <p className="mt-4 text-sm font-medium text-amber-200">
                  Cancellation requested - waiting for store owner review
                </p>
              ) : null}

              <div className={divideClass}>
                {booking.items.map((bookingItem) => (
                  <div
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                    key={bookingItem.id}
                  >
                    <div>
                      <p className="font-medium text-foreground">{bookingItem.item.name}</p>
                      <p className="mt-1 text-foreground-secondary">Qty {bookingItem.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">
                      Rs. {(Number(bookingItem.price) * bookingItem.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <div className="flex flex-col items-end gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    Total: Rs. {Number(booking.totalAmount).toFixed(2)}
                  </p>
                  {!booking.cancellationRequestedAt &&
                  (booking.status === 'PENDING' ||
                    booking.status === 'CONFIRMED') ? (
                    <button
                      className={dangerOutlineButtonClass}
                      disabled={busyId === booking.id}
                      onClick={() => void handleCancellationRequest(booking.id)}
                      type="button"
                    >
                      {busyId === booking.id ? (
                        <>
                          <LoadingSpinner />
                          Requesting
                        </>
                      ) : (
                        'Request cancellation'
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
