'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { ApiError, API_ORIGIN } from '@/services/api';
import { addToCart } from '@/services/carts';
import { getStore } from '@/services/stores';
import type { Store } from '@/types/store';

type StorePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function StorePage({ params }: StorePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const data = await getStore(id);
        setStore(data.store);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load store.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadStore();
  }, [id]);

  const handleAddToCart = async (itemId: string) => {
    const item = store?.items?.find((storeItem) => storeItem.id === itemId);
    const requestedQuantity = quantities[itemId] ?? 1;

    if (!item || requestedQuantity < 1 || requestedQuantity > item.stock) {
      setMessage('Choose a quantity that is available in stock.');
      return;
    }

    setActiveItemId(itemId);
    setMessage('');

    try {
      await addToCart({
        itemId,
        quantity: requestedQuantity,
      });
      setMessage('Item added to cart.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login');
        return;
      }

      setMessage(error instanceof Error ? error.message : 'Unable to add item to cart.');
    } finally {
      setActiveItemId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <section className="mx-auto w-full max-w-5xl rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
        <Link className="text-sm font-medium text-stone-600 underline" href="/">
          Back to stores
        </Link>

        {isLoading ? <p className="mt-8 text-sm text-stone-600">Loading store...</p> : null}
        {message ? <p className="mt-8 text-sm text-stone-700">{message}</p> : null}

        {store ? (
          <div className="mt-8">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              {store.hostel.name}
            </span>
            <h1 className="mt-4 text-3xl font-semibold text-stone-950">{store.name}</h1>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-stone-500">Room</dt>
                <dd className="mt-1 text-base text-stone-950">{store.roomNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-stone-500">Owner</dt>
                <dd className="mt-1 text-base text-stone-950">{store.owner.name}</dd>
              </div>
            </dl>

            <div className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-xl font-semibold text-stone-950">Items</h2>
              {!store.items || store.items.length === 0 ? (
                <p className="mt-4 text-sm text-stone-600">No items listed yet.</p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {store.items.map((item) => (
                    <article
                      className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 shadow-sm"
                      key={item.id}
                    >
                      <div className="relative h-36 overflow-hidden rounded-md bg-stone-100">
                        {item.imageUrl ? (
                          <Image
                            alt={item.name}
                            className="object-cover"
                            fill
                            src={`${API_ORIGIN}${item.imageUrl}`}
                          />
                        ) : null}
                      </div>
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-stone-950">{item.name}</h3>
                          <p className="mt-1 text-sm text-stone-600">{item.category}</p>
                        </div>
                        <span className="text-sm font-semibold text-stone-950">
                          Rs. {item.price}
                        </span>
                      </div>
                      {item.description ? (
                        <p className="mt-3 text-sm text-stone-600">{item.description}</p>
                      ) : (
                        <p className="mt-3 text-sm text-stone-500">
                          Details will be added by the store owner soon.
                        </p>
                      )}
                      <p className="mt-3 text-xs font-medium uppercase text-stone-500">
                        Stock: {item.stock}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          className="h-10 w-20 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-emerald-700"
                          disabled={item.stock === 0}
                          min={1}
                          max={item.stock}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: Math.min(
                                item.stock,
                                Math.max(1, Number(event.target.value) || 1),
                              ),
                            }))
                          }
                          type="number"
                          value={quantities[item.id] ?? 1}
                        />
                        <button
                          className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                          disabled={item.stock === 0 || activeItemId === item.id}
                          onClick={() => void handleAddToCart(item.id)}
                          type="button"
                        >
                          {item.stock === 0
                            ? 'Out of stock'
                            : activeItemId === item.id
                              ? 'Adding...'
                              : 'Add to cart'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
