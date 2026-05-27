'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  RefreshCw,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react';

import {
  EmptyState,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { getBookings } from '@/services/bookings';
import { updateEmailPreferences } from '@/services/auth';
import type { Booking } from '@/types/booking';


export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useRequireAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [preferenceMessage, setPreferenceMessage] = useState('');
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const loadDashboard = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) {
      return;
    }

    const silent = options?.silent ?? false;
    if (!silent) {
      setIsDashboardLoading(true);
    }
    setMessage('');

    try {
      const bookingData = await getBookings('personal');

      setBookings(bookingData.bookings);
      setHasLoadedDashboard(true);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to refresh account center.');
    } finally {
      if (!silent) {
        setIsDashboardLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    void loadDashboard();
  }, [isLoading, loadDashboard, user]);

  useSyncedRefresh(['auth', 'stores', 'bookings', 'ownership', 'analytics'], () => {
    void loadDashboard({ silent: true });
  }, { enabled: !isLoading && Boolean(user) });

  const activeOrders = bookings.filter(
    (booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED',
  );

  const handleEmailPreferenceChange = async (
    payload: {
      emailNotificationsEnabled?: boolean;
      bookings?: boolean;
      promotions?: boolean;
      newStores?: boolean;
    },
  ) => {
    if (isSavingPreferences) {
      return;
    }

    setIsSavingPreferences(true);
    setPreferenceMessage('');

    try {
      await updateEmailPreferences({
        emailNotificationsEnabled: payload.emailNotificationsEnabled ?? user?.emailNotificationsEnabled ?? true,
        bookings: payload.bookings ?? user?.preferences?.bookings ?? true,
        promotions: payload.promotions ?? user?.preferences?.promotions ?? true,
        newStores: payload.newStores ?? user?.preferences?.newStores ?? true,
      });
      await refreshUser({ silent: true });
      setPreferenceMessage('Email preferences updated.');
    } catch (error) {
      setPreferenceMessage(
        error instanceof Error ? error.message : 'Unable to update email preferences.',
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <PageContainer className="overflow-x-hidden" size="wide">
      <SectionHeader
        action={
          <button
            className={secondaryButtonClass}
            disabled={isDashboardLoading}
            onClick={() => void loadDashboard()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
        title="Profile"
      />

      {message ? (
        <div className="mt-6">
          <Notice tone="danger">{message}</Notice>
        </div>
      ) : null}

      {isLoading || !user ? (
        <MarketSurface className="mt-6 h-56 animate-pulse" />
      ) : (
        <>
          <MarketSurface className="mt-6 overflow-hidden">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-contrast">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold text-foreground">{user.name}</h2>
                  <p className="mt-1 truncate text-sm text-foreground-muted">{user.email}</p>
                  <span className="mt-3 inline-flex rounded-full bg-accent-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-80">
                <Link className={secondaryButtonClass} href="/stores">
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Browse stores
                </Link>
                <Link
                  className={secondaryButtonClass}
                  href={user.role === 'USER' ? '/store-owner-request' : '/store-owner/stores'}
                >
                  <Store className="h-4 w-4" aria-hidden="true" />
                  {user.role === 'USER' ? 'Open store' : 'Manage stores'}
                </Link>
              </div>
            </div>
          </MarketSurface>

          {user.globalBlock ? (
            <div className="mt-6">
              <Notice tone="danger">
                Your account is blocked from checkout. Reason: {user.globalBlock.reason}
              </Notice>
            </div>
          ) : user.warningCount ? (
            <div className="mt-6">
              <Notice tone="warning">
                You have {user.warningCount} warning{user.warningCount === 1 ? '' : 's'}. Three
                warnings automatically block checkout.
              </Notice>
            </div>
          ) : null}

          <section className="mt-6">
            <MarketSurface className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
                    Orders
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">Current orders</h2>
                </div>
                <Link className={secondaryButtonClass} href="/bookings">
                  View all
                </Link>
              </div>
              {activeOrders.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {activeOrders.slice(0, 3).map((booking) => (
                    <article
                      className="rounded-lg border border-border bg-surface-raised p-4"
                      key={booking.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">{booking.store.name}</p>
                          <p className="mt-1 text-sm font-medium text-foreground-muted">
                            {booking.store.hostel.name} - Rs.{' '}
                            {Number(booking.totalAmount).toFixed(2)}
                          </p>
                        </div>
                        <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
                          {booking.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    action={
                      <Link className={secondaryButtonClass} href="/stores">
                        Browse stores
                      </Link>
                    }
                    description={
                      isDashboardLoading
                        ? 'Refreshing your latest orders...'
                        : 'Live orders will show here once you checkout from a hostel store.'
                    }
                    icon={ClipboardList}
                    title="No active orders"
                  />
                </div>
              )}
            </MarketSurface>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <MarketSurface className="p-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-foreground">Account info</h2>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-900/30 p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">
                    Name
                  </dt>
                  <dd className="mt-2 font-semibold text-foreground">{user.name}</dd>
                </div>
                <div className="rounded-lg bg-slate-900/30 p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">
                    Role
                  </dt>
                  <dd className="mt-2 font-semibold text-foreground">
                    {user.role.replace('_', ' ')}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-900/30 p-4 sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">
                    Email
                  </dt>
                  <dd className="mt-2 break-all font-semibold text-foreground">{user.email}</dd>
                </div>
              </dl>
            </MarketSurface>

            <MarketSurface className="p-6">
              <h2 className="text-xl font-semibold text-foreground">Quick actions</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link className={secondaryButtonClass} href="/cart">
                  Cart
                </Link>
                <Link className={secondaryButtonClass} href="/bookings">
                  Orders
                </Link>
                {user.role === 'USER' ? (
                  <Link className={secondaryButtonClass} href="/store-owner-request">
                    Store requests
                  </Link>
                ) : (
                  <>
                    <Link className={secondaryButtonClass} href="/store-owner/stores">
                      My stores
                    </Link>
                    <Link className={secondaryButtonClass} href="/store-owner/inventory">
                      Inventory
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-6 rounded-lg border border-border bg-surface-raised p-4">
                <label className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      Email notifications
                    </span>
                    <span className="mt-1 block text-xs text-foreground-muted">
                      Booking, campaign, and store alerts.
                    </span>
                  </span>
                  <input
                    checked={user.emailNotificationsEnabled ?? true}
                    className="h-5 w-5 accent-[var(--accent)]"
                    disabled={isSavingPreferences}
                    onChange={(event) =>
                      void handleEmailPreferenceChange({
                        emailNotificationsEnabled: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                </label>
                {(['bookings', 'promotions', 'newStores'] as const).map((key) => (
                  <label className="mt-3 flex items-center justify-between gap-4" key={key}>
                    <span className="text-xs font-medium text-foreground-muted">
                      {key === 'newStores' ? 'New stores' : key[0].toUpperCase() + key.slice(1)}
                    </span>
                    <input
                      checked={user.preferences?.[key] ?? true}
                      className="h-4 w-4 accent-[var(--accent)]"
                      disabled={isSavingPreferences || !(user.emailNotificationsEnabled ?? true)}
                      onChange={(event) =>
                        void handleEmailPreferenceChange({ [key]: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </label>
                ))}
                {preferenceMessage ? (
                  <p className="mt-3 text-xs font-medium text-foreground-muted">
                    {preferenceMessage}
                  </p>
                ) : null}
              </div>
            </MarketSurface>
          </section>
        </>
      )}
    </PageContainer>
  );
}
