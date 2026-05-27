'use client';

import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  Filter,
  PackageSearch,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Store as StoreIcon,
  X,
} from 'lucide-react';

import {
  CardSkeleton,
  EmptyState,
  MarketSurface,
  Notice,
  SelectShell,
  badgeClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from '@/components/marketplace-ui';
import { StoreCard } from '@/components/store-card';
import { useAuth } from '@/contexts/auth-context';
import { useSyncedRefresh } from '@/lib/sync-events';
import { getHostels } from '@/services/hostels';
import { getStores } from '@/services/stores';
import type { Hostel } from '@/types/hostel';
import type { Store, StoreListResponse } from '@/types/store';

type SortMode = 'newest' | 'popular' | 'items';

type Filters = {
  hostelId: string;
  diet: 'all' | 'veg' | 'nonveg';
  category: string;
  rating: string;
  availability: boolean;
  openOnly: boolean;
  deliveryTime: string;
  popularity: string;
  priceMin: string;
  priceMax: string;
  filterSearch: string;
  sort: SortMode;
};

const defaultFilters: Filters = {
  hostelId: '',
  diet: 'all',
  category: '',
  rating: '',
  availability: false,
  openOnly: false,
  deliveryTime: '',
  popularity: '',
  priceMin: '',
  priceMax: '',
  filterSearch: '',
  sort: 'newest',
};

const filterSections = ['Hostel', 'Food', 'Price', 'Store', 'Ratings'] as const;
const pricePresets = [
  { label: 'Under Rs 50', min: '', max: '50' },
  { label: 'Under Rs 100', min: '', max: '100' },
  { label: 'Rs 100-300', min: '100', max: '300' },
  { label: 'Premium', min: '300', max: '' },
];

const parsePrice = (value: string | number | undefined) => {
  const price = Number(value ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const formatStoreAge = (createdAt: string) => {
  const created = new Date(createdAt);
  if (!Number.isFinite(created.getTime())) {
    return 'Recently added';
  }

  return `Added ${created.toISOString().slice(0, 10)}`;
};

const normalizePriceInput = (value: string) => value.replace(/[^\d]/g, '').slice(0, 5);

const getPriceRange = (filters: Filters) => {
  const min = filters.priceMin === '' ? null : Number(filters.priceMin);
  const max = filters.priceMax === '' ? null : Number(filters.priceMax);

  return {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
    isInvalid: min !== null && max !== null && min > max,
  };
};

export function StoreDirectory() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<StoreListResponse['pagination'] | null>(null);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Hostel: true,
    Food: true,
    Price: true,
    Store: true,
    Ratings: true,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const deferredFilterSearch = useDeferredValue(filters.filterSearch);

  const loadStores = useCallback(
    async (nextSearch = submittedSearch, page = 1, options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
      setMessage('');

      try {
        const data = await getStores({
          search: nextSearch.trim() || undefined,
          page,
          hostelId: filters.hostelId || undefined,
          limit: 50,
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
    [filters.hostelId, submittedSearch],
  );

  useEffect(() => {
    void loadStores(submittedSearch, 1);
  }, [loadStores, submittedSearch]);

  useEffect(() => {
    void getHostels()
      .then((data) => setHostels(data.hostels))
      .catch(() => {
        setHostels([]);
      });
  }, []);

  useSyncedRefresh(['stores', 'inventory', 'ownership'], () =>
    loadStores(submittedSearch, pagination?.page ?? 1, { silent: true }),
  );

  const categories = useMemo(() => {
    const values = new Set<string>();
    stores.forEach((store) => store.items?.forEach((item) => values.add(item.category)));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [stores]);

  const visibleStores = useMemo(() => {
    const filterTerm = deferredFilterSearch.trim().toLowerCase();
    const priceRange = getPriceRange(filters);

    if (priceRange.isInvalid) {
      return [];
    }

    const nextStores = stores.filter((store) => {
      const items = store.items ?? [];
      const availableItems = items.filter((item) => item.isAvailable && item.stock > 0);
      const itemPrices = items.map((item) => parsePrice(item.price));
      const haystack = [store.name, store.roomNumber, store.hostel.name, store.owner.name]
        .join(' ')
        .toLowerCase();

      if (filterTerm && !haystack.includes(filterTerm)) return false;
      if (filters.availability && availableItems.length === 0) return false;
      if (filters.category && !items.some((item) => item.category === filters.category))
        return false;
      if (
        (priceRange.min !== null || priceRange.max !== null) &&
        !itemPrices.some((price) => {
          if (priceRange.min !== null && price < priceRange.min) return false;
          if (priceRange.max !== null && price > priceRange.max) return false;
          return true;
        })
      ) {
        return false;
      }
      if (filters.popularity === 'popular' && (store._count?.bookings ?? 0) === 0) return false;

      return true;
    });

    return nextStores.sort((a, b) => {
      if (filters.sort === 'popular') {
        return (b._count?.bookings ?? 0) - (a._count?.bookings ?? 0);
      }
      if (filters.sort === 'items') {
        return (b._count?.items ?? 0) - (a._count?.items ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [deferredFilterSearch, filters, stores]);

  const activeChips = useMemo(() => {
    const chips: { key: keyof Filters | 'search'; label: string }[] = [];
    const hostel = hostels.find((item) => item.id === filters.hostelId);
    const priceRange = getPriceRange(filters);
    if (submittedSearch) chips.push({ key: 'search', label: submittedSearch });
    if (hostel) chips.push({ key: 'hostelId', label: hostel.name });
    if (filters.availability) chips.push({ key: 'availability', label: 'Available now' });
    if (filters.category) chips.push({ key: 'category', label: filters.category });
    if (priceRange.min !== null || priceRange.max !== null) {
      chips.push({
        key: 'priceMax',
        label:
          priceRange.min !== null && priceRange.max !== null
            ? `Rs ${priceRange.min}-${priceRange.max}`
            : priceRange.min !== null
              ? `From Rs ${priceRange.min}`
              : `Under Rs ${priceRange.max}`,
      });
    }
    if (filters.popularity) chips.push({ key: 'popularity', label: 'Popular' });
    return chips;
  }, [filters, hostels, submittedSearch]);

  const priceRange = getPriceRange(filters);

  const updateFilter = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updatePriceFilter = (key: 'priceMin' | 'priceMax', value: string) => {
    updateFilter(key, normalizePriceInput(value));
  };

  const applyPricePreset = (preset: (typeof pricePresets)[number]) => {
    setFilters((current) => ({
      ...current,
      priceMin: preset.min,
      priceMax: preset.max,
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setSubmittedSearch('');
    setFilters(defaultFilters);
  };

  const removeChip = (key: keyof Filters | 'search') => {
    if (key === 'search') {
      setSearch('');
      setSubmittedSearch('');
      return;
    }
    if (key === 'priceMax') {
      setFilters((current) => ({ ...current, priceMin: '', priceMax: '' }));
      return;
    }
    setFilters((current) => ({ ...current, [key]: defaultFilters[key] }));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
    void loadStores(search, 1);
  };

  const FilterContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase text-foreground-faint">Marketplace</p>
          <h2 className="text-base font-semibold text-foreground">Filters</h2>
        </div>
        <button className={secondaryButtonClass} onClick={clearFilters} type="button">
          Clear all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <label className="mb-4 flex h-10 items-center gap-2 rounded-xl border border-border bg-canvas px-3">
          <Search className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
          <span className="sr-only">Search filters</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            onChange={(event) => updateFilter('filterSearch', event.target.value)}
            placeholder="Search within results"
            value={filters.filterSearch}
          />
        </label>

        <div className="divide-y divide-border-subtle">
          {filterSections.map((section) => (
            <section className="py-3" key={section}>
              <button
                className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
                onClick={() =>
                  setOpenSections((current) => ({ ...current, [section]: !current[section] }))
                }
                type="button"
              >
                {section}
                <ChevronDown
                  className={`h-4 w-4 text-foreground-muted transition-transform duration-ui ${
                    openSections[section] ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {openSections[section] ? (
                <div className="mt-3 space-y-3">
                  {section === 'Hostel' ? (
                    <SelectShell>
                      <select
                        className={selectClass}
                        onChange={(event) => updateFilter('hostelId', event.target.value)}
                        value={filters.hostelId}
                      >
                        <option value="">All hostels</option>
                        {hostels.map((hostel) => (
                          <option key={hostel.id} value={hostel.id}>
                            {hostel.name}
                          </option>
                        ))}
                      </select>
                    </SelectShell>
                  ) : null}

                  {section === 'Food' ? (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          ['all', 'All'],
                          ['veg', 'Veg'],
                          ['nonveg', 'Non-veg'],
                        ].map(([value, label]) => (
                          <button
                            className={`h-8 rounded-lg border text-xs font-semibold transition-colors duration-ui ${
                              filters.diet === value
                                ? 'border-accent bg-accent text-accent-contrast'
                                : 'border-border bg-surface-raised text-foreground-secondary hover:border-border-strong'
                            }`}
                            key={value}
                            onClick={() => updateFilter('diet', value as Filters['diet'])}
                            type="button"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <SelectShell>
                        <select
                          className={selectClass}
                          onChange={(event) => updateFilter('category', event.target.value)}
                          value={filters.category}
                        >
                          <option value="">All categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </SelectShell>
                    </>
                  ) : null}

                  {section === 'Price' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <label>
                          <span className="text-xs font-medium text-foreground-muted">Min</span>
                          <input
                            className={`mt-1 h-10 w-full rounded-lg border bg-canvas px-3 text-sm text-foreground outline-none transition-all duration-ui placeholder:text-foreground-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/15 ${
                              priceRange.isInvalid ? 'border-red-500/40' : 'border-border'
                            }`}
                            inputMode="numeric"
                            min={0}
                            onChange={(event) => updatePriceFilter('priceMin', event.target.value)}
                            placeholder="20"
                            type="number"
                            value={filters.priceMin}
                          />
                        </label>
                        <label>
                          <span className="text-xs font-medium text-foreground-muted">Max</span>
                          <input
                            className={`mt-1 h-10 w-full rounded-lg border bg-canvas px-3 text-sm text-foreground outline-none transition-all duration-ui placeholder:text-foreground-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/15 ${
                              priceRange.isInvalid ? 'border-red-500/40' : 'border-border'
                            }`}
                            inputMode="numeric"
                            min={0}
                            onChange={(event) => updatePriceFilter('priceMax', event.target.value)}
                            placeholder="500"
                            type="number"
                            value={filters.priceMax}
                          />
                        </label>
                      </div>
                      {priceRange.isInvalid ? (
                        <p className="text-xs font-medium text-red-300">
                          Min price must be lower than max price.
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5">
                        {pricePresets.map((preset) => {
                          const isActive =
                            filters.priceMin === preset.min && filters.priceMax === preset.max;

                          return (
                            <button
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-ui ${
                                isActive
                                  ? 'border-accent bg-accent text-accent-contrast'
                                  : 'border-border bg-surface-raised text-foreground-secondary hover:border-border-strong hover:text-foreground'
                              }`}
                              key={preset.label}
                              onClick={() => applyPricePreset(preset)}
                              type="button"
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {section === 'Store' ? (
                    <>
                      <label className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground-secondary">
                        Open now
                        <input
                          checked={filters.openOnly}
                          className="h-4 w-4 accent-[var(--accent)]"
                          onChange={(event) => updateFilter('openOnly', event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground-secondary">
                        Available items
                        <input
                          checked={filters.availability}
                          className="h-4 w-4 accent-[var(--accent)]"
                          onChange={(event) => updateFilter('availability', event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                      <SelectShell>
                        <select
                          className={selectClass}
                          onChange={(event) => updateFilter('deliveryTime', event.target.value)}
                          value={filters.deliveryTime}
                        >
                          <option value="">Any pickup time</option>
                          <option value="10">Within 10 minutes</option>
                          <option value="20">Within 20 minutes</option>
                          <option value="30">Within 30 minutes</option>
                        </select>
                      </SelectShell>
                    </>
                  ) : null}

                  {section === 'Ratings' ? (
                    <>
                      <SelectShell>
                        <select
                          className={selectClass}
                          onChange={(event) => updateFilter('rating', event.target.value)}
                          value={filters.rating}
                        >
                          <option value="">Any rating</option>
                          <option value="4">4 stars and above</option>
                          <option value="3">3 stars and above</option>
                        </select>
                      </SelectShell>
                      <button
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors duration-ui ${
                          filters.popularity === 'popular'
                            ? 'border-accent bg-accent-muted text-accent'
                            : 'border-border bg-surface-raised text-foreground-secondary hover:border-border-strong'
                        }`}
                        onClick={() =>
                          updateFilter(
                            'popularity',
                            filters.popularity === 'popular' ? '' : 'popular',
                          )
                        }
                        type="button"
                      >
                        Popular stores first
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col pb-24 lg:pb-8">
      <div className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/95 shadow-header backdrop-blur-md">
        <div className="mx-auto w-full max-w-content-wide px-4 py-3 sm:px-5 lg:px-7">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-foreground-muted">Order from student stores on campus</p>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Stores near you
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                className={`${secondaryButtonClass} lg:hidden`}
                onClick={() => setDrawerOpen(true)}
                type="button"
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filters
              </button>
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
                <Link className={secondaryButtonClass} href="/login">
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stores, hostels, rooms..."
                value={search}
              />
            </label>
          </form>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-content-wide flex-1 gap-5 px-4 pt-5 sm:px-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-7">
        <aside className="sticky top-[7.25rem] hidden h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-card page-fade-in lg:block">
          {FilterContent}
        </aside>

        <main className="min-w-0 page-fade-in">
          {message ? (
            <div className="mb-4">
              <Notice tone="warning">{message}</Notice>
            </div>
          ) : null}

          <MarketSurface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden="true" />
                <h2 className="text-base font-semibold text-foreground">
                  {submittedSearch ? 'Search results' : 'All stores'}
                </h2>
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                {isLoading
                  ? 'Loading campus stores...'
                  : `${visibleStores.length} of ${pagination?.total ?? stores.length} stores shown`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {deferredFilterSearch !== filters.filterSearch ? (
                <span className="text-xs font-medium text-foreground-muted">Updating filters...</span>
              ) : null}
              <SelectShell>
                <select
                  className={`${selectClass} mt-0 h-9 py-0 text-xs`}
                  onChange={(event) => updateFilter('sort', event.target.value as SortMode)}
                  value={filters.sort}
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popularity</option>
                  <option value="items">Most items</option>
                </select>
              </SelectShell>
            </div>
          </MarketSurface>

          {activeChips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  className={`${badgeClass} hover:border-border-strong hover:bg-surface-hover`}
                  key={`${chip.key}-${chip.label}`}
                  onClick={() => removeChip(chip.key)}
                  type="button"
                >
                  {chip.label}
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
              <button className={secondaryButtonClass} onClick={clearFilters} type="button">
                Clear all
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <CardSkeleton className="h-full min-h-56" key={item} />
              ))}
            </div>
          ) : visibleStores.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                action={
                  activeChips.length > 0 ? (
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
                  activeChips.length > 0
                    ? 'Try widening the price, hostel, or availability filters.'
                    : 'Approved sellers appear here as soon as their store is created.'
                }
                icon={activeChips.length > 0 ? PackageSearch : StoreIcon}
                title={activeChips.length > 0 ? 'No matching stores' : 'No stores yet'}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleStores.map((store) => (
                <div key={store.id} className="space-y-2">
                  <StoreCard store={store} variant="grid" />
                  <p className="px-1 text-[11px] text-foreground-faint">
                    {formatStoreAge(store.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-black/55 transition-opacity duration-ui"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,360px)] border-r border-border bg-surface shadow-card transition-transform duration-ui">
            <button
              className="absolute right-3 top-3 z-10 rounded-lg border border-border bg-surface-raised p-2 text-foreground-secondary"
              onClick={() => setDrawerOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {FilterContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
