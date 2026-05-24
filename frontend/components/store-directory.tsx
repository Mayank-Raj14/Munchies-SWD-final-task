'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  MapPin,
  Search,
  ShoppingCart,
  Store as StoreIcon,
} from 'lucide-react';

import {
  EmptyState,
  MarketSurface,
  Notice,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { StoreCard } from '@/components/store-card';
import { useAuth } from '@/contexts/auth-context';
import { useSyncedRefresh } from '@/lib/sync-events';
import { getHostels } from '@/services/hostels';
import { getStores } from '@/services/stores';
import type { Hostel } from '@/types/hostel';
import type { Store, StoreListResponse } from '@/types/store';

export function StoreDirectory() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<StoreListResponse['pagination'] | null>(null);
  const [search, setSearch] = useState('');
  const [activeHostelId, setActiveHostelId] = useState<string | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const activeHostel = useMemo(
    () => hostels.find((hostel) => hostel.id === activeHostelId) ?? null,
    [activeHostelId, hostels],
  );

  const loadStores = useCallback(
    async (
      nextSearch = '',
      page = 1,
      options: { silent?: boolean; hostelId?: string | null } = {},
    ) => {
      if (!options.silent) {
        setIsLoading(true);
      }
      setMessage('');

      const hostelId =
        options.hostelId === undefined ? activeHostelId ?? undefined : options.hostelId ?? undefined;

      try {
        const data = await getStores({
          search: nextSearch.trim() || undefined,
          page,
          hostelId: hostelId ?? undefined,
        });
        setStores(data.stores);
        setPagination(data.pagination);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load stores.');
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [activeHostelId],
  );

  useEffect(() => {
    void loadStores('', 1);
  }, [loadStores]);

  useEffect(() => {
    void getHostels()
      .then((data) => setHostels(data.hostels))
      .catch(() => {
        // Hostel filters are optional.
      });
  }, []);

  useSyncedRefresh(['stores', 'inventory', 'ownership'], () =>
    loadStores(search, pagination?.page ?? 1, { silent: true }),
  );

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveHostelId(null);
    void loadStores(search, 1, { hostelId: null });
  };

  const handleHostelFilter = (hostel: Hostel | null) => {
    if (!hostel) {
      setActiveHostelId(null);
      setSearch('');
      void loadStores('', 1, { hostelId: null });
      return;
    }

    setActiveHostelId(hostel.id);
    setSearch('');
    void loadStores('', 1, { hostelId: hostel.id });
  };

  const clearFilters = () => {
    setActiveHostelId(null);
    setSearch('');
    void loadStores('', 1, { hostelId: null });
  };

  return (
    <div className="flex min-h-screen flex-col pb-24 lg:pb-8">
      {/* Blinkit / Zomato-style sticky browse header — single search */}
      <div className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/95 shadow-header backdrop-blur-md">
        <div className="mx-auto w-full max-w-content-wide px-4 pt-3 sm:px-5 lg:px-7">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-contrast">
                M
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-faint">
                  Deliver to
                </p>
                <p className="flex items-center gap-0.5 truncate text-sm font-semibold text-foreground">
                  Campus hostels
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />
                </p>
              </div>
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="text-xs text-foreground-muted">Order from student stores on campus</p>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Stores near you</h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isAuthLoading ? (
                <div className="h-9 w-9 animate-pulse rounded-full bg-surface-raised" />
              ) : user ? (
                <Link
                  href="/profile"
                  aria-label="Profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-contrast"
                >
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground-secondary hover:bg-surface-hover"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/cart"
                aria-label="Cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <form className="mt-3" onSubmit={handleSearch}>
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 shadow-subtle transition-all duration-ui focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 sm:h-12">
              <Search className="h-[18px] w-[18px] shrink-0 text-accent" aria-hidden="true" />
              <span className="sr-only">Search stores</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (activeHostelId) {
                    setActiveHostelId(null);
                  }
                }}
                placeholder="Search stores, hostels, rooms…"
                suppressHydrationWarning
                value={search}
              />
            </label>
          </form>

          {hostels.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-ui ${
                  !activeHostelId
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-border bg-surface text-foreground-secondary hover:border-border-strong'
                }`}
                onClick={() => handleHostelFilter(null)}
                type="button"
              >
                All
              </button>
              {hostels.map((hostel) => (
                <button
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-ui ${
                    activeHostelId === hostel.id
                      ? 'border-accent bg-accent text-accent-contrast'
                      : 'border-border bg-surface text-foreground-secondary hover:border-border-strong'
                  }`}
                  key={hostel.id}
                  onClick={() => handleHostelFilter(hostel)}
                  type="button"
                >
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {hostel.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="pb-3" />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-content-wide flex-1 px-4 sm:px-5 lg:px-7">
        {message ? (
          <div className="mt-4">
            <Notice tone="warning">{message}</Notice>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {activeHostel ? activeHostel.name : search ? 'Search results' : 'All stores'}
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted sm:text-sm">
              {pagination?.total != null
                ? `${pagination.total} ${pagination.total === 1 ? 'store' : 'stores'} available`
                : 'Loading campus stores…'}
            </p>
          </div>
          {(search || activeHostelId) && (
            <button className={secondaryButtonClass} onClick={clearFilters} type="button">
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[5.5rem] animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              action={
                search || activeHostelId ? (
                  <button className={secondaryButtonClass} onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                ) : (
                  <Link className={primaryButtonClass} href="/store-owner-request">
                    Open a store
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )
              }
              description={
                search || activeHostelId
                  ? 'Try another hostel or store name.'
                  : 'Stores appear here once sellers are approved.'
              }
              icon={StoreIcon}
              title={search || activeHostelId ? 'No matches' : 'No stores yet'}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3 lg:hidden">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} variant="list" />
              ))}
            </div>

            <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} variant="grid" />
              ))}
            </div>
          </>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <MarketSurface className="mt-5 flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs text-foreground-secondary">
            <span className="tabular-nums">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                className={secondaryButtonClass}
                disabled={pagination.page <= 1}
                onClick={() => void loadStores(search, pagination.page - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className={secondaryButtonClass}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => void loadStores(search, pagination.page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </MarketSurface>
        ) : null}
      </div>
    </div>
  );
}
