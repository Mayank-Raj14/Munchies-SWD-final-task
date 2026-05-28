'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, ShoppingBag, ClipboardList, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { LoadingSpinner, MarketSurface, primaryButtonClass, secondaryButtonClass, divideClass } from '@/components/marketplace-ui';
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
    <main className="min-h-screen px-4 py-12 flex items-center justify-center bg-canvas relative overflow-hidden">
      {/* Background glowing aura overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_50%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.55, bounce: 0.05 }}
        className="w-full max-w-2xl relative z-10"
      >
        <MarketSurface className="p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Confetti sparkle icon loop */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="absolute top-4 right-4 text-accent/25 hidden sm:block"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>

          {/* Success animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-subtle mb-5"
          >
            <CheckCircle2 className="h-7 w-7" />
          </motion.div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Order Confirmed</p>
          <h1 className="mt-2 text-xl font-black text-foreground sm:text-2xl lg:text-3xl tracking-tight">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed font-semibold">
            Your transaction has completed successfully and the campus store vendor has been notified.
          </p>

          {isLoading ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <LoadingSpinner className="h-5 w-5" />
              <p className="text-xs text-foreground-muted font-medium">Fetching details...</p>
            </div>
          ) : null}

          {message ? (
            <div className="mt-8 rounded-xl border border-red-500/15 bg-red-500/5 p-4 text-xs font-semibold text-red-300">
              {message}
            </div>
          ) : null}

          {booking ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-left"
            >
              {/* Receipt details */}
              <div className="rounded-2xl border border-border-subtle bg-surface-raised/40 p-5 shadow-inner">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border-subtle pb-3.5">
                  <div>
                    <h2 className="text-sm font-bold text-foreground leading-tight">{booking.store.name}</h2>
                    <p className="mt-1 text-xs text-foreground-secondary font-semibold">
                      {booking.store.hostel.name} · Room {booking.store.roomNumber}
                    </p>
                  </div>
                  <span className="rounded-lg border border-accent/20 bg-accent-muted px-2.5 py-0.75 text-[10px] font-bold text-accent shadow-sm uppercase tracking-wide">
                    {booking.status}
                  </span>
                </div>

                <div className={`${divideClass} mt-1`}>
                  {booking.items.map((bookingItem) => (
                    <div
                      className="flex items-center justify-between gap-4 py-3 text-xs"
                      key={bookingItem.id}
                    >
                      <div className="font-semibold text-foreground-secondary">
                        <span>{bookingItem.item.name}</span>
                        <span className="text-[10px] text-foreground-muted ml-1.5">x{bookingItem.quantity}</span>
                      </div>
                      <span className="font-bold text-foreground">
                        Rs. {(Number(bookingItem.price) * bookingItem.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-border-subtle pt-3.5 mt-1 font-bold text-sm">
                  <span className="text-foreground-secondary uppercase tracking-wider text-[10px]">Total Paid</span>
                  <span className="text-base font-black text-accent">
                    Rs. {Number(booking.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link className={`${primaryButtonClass} h-9 rounded-xl text-xs inline-flex items-center gap-1.5`} href="/bookings">
                  <ClipboardList className="h-4 w-4" />
                  View order history
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link className={`${secondaryButtonClass} h-9 rounded-xl text-xs inline-flex items-center gap-1.5`} href="/">
                  <ShoppingBag className="h-4 w-4 text-accent" />
                  Browse stores
                </Link>
              </div>
            </motion.div>
          ) : null}
        </MarketSurface>
      </motion.div>
    </main>
  );
}
