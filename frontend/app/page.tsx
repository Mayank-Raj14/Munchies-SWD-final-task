'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { StoreCard } from '@/components/store-card';
import { getStores } from '@/services/stores';
import type { Store, StoreListResponse } from '@/types/store';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<StoreListResponse['pagination'] | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadStores = useCallback(async (nextSearch = '', page = 1) => {
    setIsLoading(true);
    setMessage('');

    try {
      const data = await getStores({ search: nextSearch, page });
      setStores(data.stores);
      setPagination(data.pagination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load stores.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStores('', 1);
  }, [loadStores]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadStores(search, 1);
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-emerald-700">Munchies</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-stone-950">
              Hostel Stores
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Find student-run food stores by name, hostel, or room number.
            </p>
          </div>
          <form className="flex w-full gap-3 md:w-[420px]" onSubmit={handleSearch}>
            <input
              className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-950 shadow-sm outline-none focus:border-emerald-700"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stores"
              value={search}
            />
            <button
              className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-emerald-800"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>

        {message ? <p className="mt-6 text-sm text-stone-700">{message}</p> : null}

        {isLoading ? (
          <p className="mt-10 text-sm text-stone-600">Loading stores...</p>
        ) : stores.length === 0 ? (
          <p className="mt-10 text-sm text-stone-600">No stores found.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-between text-sm text-stone-600">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-3">
              <button
                className="rounded-md border border-stone-300 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => void loadStores(search, pagination.page - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-md border border-stone-300 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => void loadStores(search, pagination.page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
