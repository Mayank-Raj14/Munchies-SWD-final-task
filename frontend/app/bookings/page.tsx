'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, ShoppingBag, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          <div className="flex gap-2">
            {isStoreManager ? (
              <Link className={`${primaryButtonClass} h-9 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm`} href="/store-owner/orders">
                <ShoppingBag className="h-4 w-4" />
                Manage store orders
              </Link>
            ) : null}
            <Link className={`${secondaryButtonClass} h-9 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm`} href="/cart">
              <ShoppingCart className="h-4 w-4 text-accent" />
              View cart
            </Link>
            <button
              className={`${secondaryButtonClass} h-9 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm`}
              disabled={isLoading}
              onClick={() => void loadBookings()}
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        }
        description="Check status updates for order checkout from your campus stores."
        title="Your Orders"
      />

      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            <Notice tone="success">{message}</Notice>
          </motion.div>
        ) : null}
        
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            <Notice tone="danger">{error}</Notice>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isLoading && !hasLoaded ? (
        <div className="mt-8 space-y-5">
          {[0, 1, 2].map((item) => (
            <MarketSurface className="animate-pulse p-5 rounded-2xl" key={item}>
              <div className="h-4 w-40 rounded-lg bg-surface-raised" />
              <div className="mt-3.5 h-3.5 w-56 rounded-lg bg-surface-raised" />
              <div className="mt-6 h-10 rounded-xl bg-surface-raised" />
            </MarketSurface>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              <Link className={primaryButtonClass} href="/">
                Browse campus stores
              </Link>
            }
            description="You have not placed any orders yet. Add items to your cart from campus canteens and checkout!"
            icon={ClipboardList}
            title="No orders yet"
          />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          className="mt-8 space-y-5"
        >
          {bookings.map((booking) => (
            <motion.article
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
              }}
              className={orderCardClass}
              key={booking.id}
            >
              <div className="flex flex-col gap-3 border-b border-border-subtle pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{booking.store.name}</h2>
                  <p className="mt-1 text-xs font-semibold text-foreground-secondary">
                    {booking.store.hostel.name} · Room {booking.store.roomNumber}
                  </p>
                  <p className="mt-2 text-xs font-medium text-foreground-muted">
                    Ordered {formatBookingDate(booking.createdAt)}
                  </p>
                </div>
                
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold shadow-subtle ${bookingStatusBadgeClass(booking.status)}`}
                >
                  {formatBookingStatus(booking.status)}
                </span>
              </div>

              {booking.status === 'CANCEL_REQUESTED' ? (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs font-semibold text-amber-200">
                  Cancellation requested - awaiting store owner approval
                </div>
              ) : null}

              <div className={divideClass}>
                {booking.items.map((bookingItem) => (
                  <div
                    className="flex items-center justify-between gap-4 py-3.5 text-xs"
                    key={bookingItem.id}
                  >
                    <div>
                      <p className="font-bold text-foreground">{bookingItem.item.name}</p>
                      <p className="mt-0.5 text-[10px] text-foreground-secondary font-medium">Qty {bookingItem.quantity}</p>
                    </div>
                    <p className="font-bold text-foreground">
                      Rs. {(Number(bookingItem.price) * bookingItem.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-border-subtle pt-4.5">
                <div className="flex flex-col items-end gap-3.5">
                  <p className="text-xs font-semibold text-foreground-secondary">
                    Total paid:{' '}
                    <span className="text-sm font-black text-foreground">
                      Rs. {Number(booking.totalAmount).toFixed(2)}
                    </span>
                  </p>
                  
                  {!booking.cancellationRequestedAt &&
                  (booking.status === 'PENDING' ||
                    booking.status === 'CONFIRMED') ? (
                    <button
                      className={`${dangerOutlineButtonClass} h-8 text-[11px] font-bold px-3 rounded-lg active:scale-95`}
                      disabled={busyId === booking.id}
                      onClick={() => void handleCancellationRequest(booking.id)}
                      type="button"
                    >
                      {busyId === booking.id ? (
                        <>
                          <LoadingSpinner className="h-3 w-3" />
                          Requesting...
                        </>
                      ) : (
                        'Request cancellation'
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
