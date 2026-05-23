'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

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
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase text-emerald-700">Booking created</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">Checkout successful</h1>

        {isLoading ? <p className="mt-8 text-sm text-stone-600">Loading booking...</p> : null}
        {message ? <p className="mt-8 text-sm text-stone-700">{message}</p> : null}

        {booking ? (
          <div className="mt-8">
            <div className="rounded-lg border border-stone-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">{booking.store.name}</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {booking.store.hostel.name} - Room {booking.store.roomNumber}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  {booking.status}
                </span>
              </div>
              <p className="mt-5 text-sm font-semibold text-stone-950">
                Total: Rs. {Number(booking.totalAmount).toFixed(2)}
              </p>
              {booking.cancellationRequestedAt && booking.status !== 'CANCELLED' ? (
                <p className="mt-3 text-sm font-medium text-stone-700">Cancellation requested</p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
                href="/bookings"
              >
                View booking history
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:border-emerald-700"
                href="/"
              >
                Browse stores
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
