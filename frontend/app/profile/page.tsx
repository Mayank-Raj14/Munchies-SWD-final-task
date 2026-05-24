'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  History,
  RefreshCw,
  ScrollText,
  Settings,
  ShoppingCart,
  Store,
  User,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  EmptyState,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getBookings } from '@/services/bookings';
import { getMyStoreOwnershipRequests, type StoreOwnershipRequest } from '@/services/store-ownership-requests';
import { getMyStores } from '@/services/stores';
import type { Booking } from '@/types/booking';
import type { Store as StoreType } from '@/types/store';

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: 'emerald' | 'amber' | 'stone';
};

const toneClass = {
  amber: 'bg-amber-500/15 text-amber-200',
  emerald: 'bg-accent-muted text-accent',
  stone: 'bg-surface-raised text-foreground-secondary',
};

function StatCard({ icon: Icon, label, tone = 'stone', value }: StatCardProps) {
  return (
    <MarketSurface className="p-5 transition-all duration-200 hover:border-border-strong">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClass[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </MarketSurface>
  );
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useRequireAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<StoreOwnershipRequest[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [message, setMessage] = useState('');
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsDashboardLoading(true);
    setMessage('');

    try {
      const [bookingData, requestData, storeData] = await Promise.all([
        getBookings('personal'),
        getMyStoreOwnershipRequests(),
        user.role === 'STORE_OWNER' || user.role === 'ADMIN'
          ? getMyStores()
          : Promise.resolve({ stores: [] }),
      ]);

      setBookings(bookingData.bookings);
      setRequests(requestData.requests);
      setStores(storeData.stores);
      await refreshUser({ silent: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to refresh account center.');
    } finally {
      setIsDashboardLoading(false);
    }
  }, [refreshUser, user]);

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    void loadDashboard();
  }, [isLoading, loadDashboard, user]);

  const activeOrders = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED'),
    [bookings],
  );
  const completedOrders = useMemo(
    () => bookings.filter((booking) => booking.status === 'COMPLETED'),
    [bookings],
  );
  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'PENDING'),
    [requests],
  );

  return (
    <PageContainer size="wide">
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

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={ClipboardList} label="Current orders" tone="emerald" value={String(activeOrders.length)} />
            <StatCard icon={History} label="Completed orders" value={String(completedOrders.length)} />
            <StatCard icon={ScrollText} label="Store requests" tone="amber" value={String(requests.length)} />
            <StatCard icon={BarChart3} label="Seller stores" tone="emerald" value={String(stores.length)} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <MarketSurface className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">Orders</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">Current orders</h2>
                </div>
                <Link className={secondaryButtonClass} href="/bookings">
                  View all
                </Link>
              </div>
              {isDashboardLoading ? (
                <div className="mt-5 space-y-3">
                  {[0, 1].map((item) => (
                    <div className="h-20 animate-pulse rounded-lg bg-slate-800/50" key={item} />
                  ))}
                </div>
              ) : activeOrders.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {activeOrders.slice(0, 3).map((booking) => (
                    <article className="rounded-lg border border-border bg-surface-raised p-4" key={booking.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">{booking.store.name}</p>
                          <p className="mt-1 text-sm font-medium text-foreground-muted">
                            {booking.store.hostel.name} - Rs. {Number(booking.totalAmount).toFixed(2)}
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
                    description="Live orders will show here once you checkout from a hostel store."
                    icon={ClipboardList}
                    title="No active orders"
                  />
                </div>
              )}
            </MarketSurface>

            <MarketSurface className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">Activity</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Workflow overview</h2>
              <div className="mt-5 space-y-3">
                {[
                  {
                    icon: ClipboardList,
                    label: `${completedOrders.length} completed orders`,
                    text: 'Finished customer purchases remain available in order history.',
                  },
                  {
                    icon: ScrollText,
                    label: `${pendingRequests.length} pending store requests`,
                    text: 'Approval updates are reflected after refresh, focus, or automatic revalidation.',
                  },
                  {
                    icon: Zap,
                    label: user.role === 'STORE_OWNER' || user.role === 'ADMIN' ? 'Seller tools enabled' : 'Customer mode',
                    text:
                      user.role === 'STORE_OWNER' || user.role === 'ADMIN'
                        ? 'Store, inventory, and seller order controls are available.'
                        : 'Apply for seller access when you are ready to operate a store.',
                  },
                  {
                    icon: Settings,
                    label: 'Backend-ready account data',
                    text: 'This page is structured around live services and can absorb richer analytics later.',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="flex gap-3 rounded-lg border border-border bg-surface-raised p-3" key={item.label}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent-muted text-accent">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-foreground-muted">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">Name</dt>
                  <dd className="mt-2 font-semibold text-foreground">{user.name}</dd>
                </div>
                <div className="rounded-lg bg-slate-900/30 p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">Role</dt>
                  <dd className="mt-2 font-semibold text-foreground">{user.role.replace('_', ' ')}</dd>
                </div>
                <div className="rounded-lg bg-slate-900/30 p-4 sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">Email</dt>
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
            </MarketSurface>
          </section>
        </>
      )}
    </PageContainer>
  );
}
