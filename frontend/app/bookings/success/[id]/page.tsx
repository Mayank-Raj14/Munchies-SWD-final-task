'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import {
  MarketSurface,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { ApiError } from '@/services/api';
import { getBooking } from '@/services/bookings';
import type { Booking } from '@/types/booking';

type BookingSuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function BookingSuccessPage({ params }: BookingSuccessPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const data = await getBooking(id);
        setBooking(data.booking);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Unable to load booking.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBooking();
  }, [id, router]);

  return (
    <main className="min-h-screen px-6 py-10">
      <MarketSurface className="mx-auto w-full max-w-3xl p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">Booking created</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Checkout successful</h1>

        {isLoading ? (
          <p className="mt-8 text-sm text-foreground-secondary">Loading booking...</p>
        ) : null}
        {message ? <p className="mt-8 text-sm text-foreground-secondary">{message}</p> : null}

        {booking ? (
          <div className="mt-8">
            <div className="rounded-xl border border-border p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{booking.store.name}</h2>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {booking.store.hostel.name} - Room {booking.store.roomNumber}
                  </p>
                </div>
                <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
                  {booking.status}
                </span>
              </div>
              <p className="mt-5 text-sm font-semibold text-foreground">
                Total: Rs. {Number(booking.totalAmount).toFixed(2)}
              </p>
              {booking.cancellationRequestedAt && booking.status !== 'CANCELLED' ? (
                <p className="mt-3 text-sm font-medium text-foreground-secondary">
                  Cancellation requested
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={primaryButtonClass} href="/bookings">
                View booking history
              </Link>
              <Link className={secondaryButtonClass} href="/">
                Browse stores
              </Link>
            </div>
          </div>
        ) : null}
      </MarketSurface>
    </main>
  );
}
