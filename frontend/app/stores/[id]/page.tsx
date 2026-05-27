'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Minus,
  PackageOpen,
  Plus,
  ShoppingCart,
  Store as StoreIcon,
} from 'lucide-react';

import {
  badgeClass,
  EmptyState,
  itemCardClass,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { useSyncedRefresh } from '@/lib/sync-events';
import { ApiError, buildAssetUrl } from '@/services/api';
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
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const loadStore = useCallback(
    async (options: { silent?: boolean } = {}) => {
      try {
        const data = await getStore(id);
        setStore(data.store);
      } catch (error) {
        setNotice({
          tone: 'danger',
          text: error instanceof Error ? error.message : 'Unable to load store.',
        });
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  useSyncedRefresh(['inventory', 'stores'], () => loadStore({ silent: true }));

  const setQuantity = (itemId: string, stock: number, quantity: number) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.min(stock, Math.max(1, quantity)),
    }));
  };

  const handleAddToCart = async (itemId: string) => {
    if (activeItemId) {
      return;
    }

    const item = store?.items?.find((storeItem) => storeItem.id === itemId);
    const requestedQuantity = quantities[itemId] ?? 1;

    if (!item || requestedQuantity < 1 || requestedQuantity > item.stock) {
      setNotice({ tone: 'danger', text: 'Choose a quantity that is available in stock.' });
      return;
    }

    setActiveItemId(itemId);
    setNotice(null);

    try {
      await addToCart({
        itemId,
        quantity: requestedQuantity,
      });
      setNotice({ tone: 'success', text: 'Item added to cart.' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login');
        return;
      }

      setNotice({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Unable to add item to cart.',
      });
    } finally {
      setActiveItemId(null);
    }
  };

  return (
    <PageContainer size="wide">
      <Link className={`mb-4 ${secondaryButtonClass}`} href="/">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to stores
      </Link>

      {notice ? (
        <div className="mb-5">
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      ) : null}

      {isLoading ? (
        <MarketSurface className="h-80 animate-pulse">
          <span className="sr-only">Loading store</span>
        </MarketSurface>
      ) : store ? (
        <>
          <MarketSurface className="overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="px-5 py-5 sm:px-6">
                <span className={badgeClass}>{store.hostel.name}</span>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {store.name}
                </h1>
                <p className="mt-1 text-sm text-foreground-muted">Room {store.roomNumber}</p>
              </div>
              <div className="border-t border-border bg-surface-raised/80 p-4 lg:border-l lg:border-t-0">
                <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border-subtle bg-surface p-4">
                  <StoreIcon className="h-8 w-8 text-accent" aria-hidden="true" />
                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-muted">Room</span>
                      <span className="font-medium text-foreground">{store.roomNumber}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-muted">Owner</span>
                      <span className="truncate font-medium text-foreground">
                        {store.owner.name}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-muted">Items</span>
                      <span className="font-medium text-foreground">
                        {store.items?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MarketSurface>

          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">Menu</h2>
            </div>

            {!store.items || store.items.length === 0 ? (
              <EmptyState
                description="Nothing listed yet."
                icon={PackageOpen}
                title="No items listed yet"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {store.items.map((item) => {
                  const quantity = quantities[item.id] ?? 1;

                  return (
                    <article className={itemCardClass} key={item.id}>
                      <div className="relative h-44 bg-surface-raised">
                        {item.imageUrl ? (
                          <Image
                            alt={item.name}
                            className="object-cover"
                            fill
                            src={buildAssetUrl(item.imageUrl)}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-accent">
                            <ShoppingCart className="h-10 w-10" aria-hidden="true" />
                          </div>
                        )}
                        <span className="absolute right-3 top-3 rounded-full border border-border bg-canvas/80 px-3 py-1 text-xs font-medium text-foreground">
                          Rs. {item.price}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-foreground">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-accent">{item.category}</p>
                          </div>
                          <span className="rounded-full border border-border bg-accent-muted px-2.5 py-1 text-xs font-medium text-accent">
                            {item.stock} left
                          </span>
                        </div>
                        {item.description ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground-secondary">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex h-10 items-center rounded-lg border border-border bg-canvas">
                            <button
                              className="flex h-10 w-9 items-center justify-center text-foreground-secondary disabled:cursor-not-allowed disabled:text-foreground-faint"
                              disabled={quantity <= 1 || item.stock === 0}
                              onClick={() => setQuantity(item.id, item.stock, quantity - 1)}
                              type="button"
                            >
                              <Minus className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-foreground">
                              {quantity}
                            </span>
                            <button
                              className="flex h-11 w-10 items-center justify-center text-foreground-secondary disabled:cursor-not-allowed disabled:text-foreground-faint"
                              disabled={quantity >= item.stock || item.stock === 0}
                              onClick={() => setQuantity(item.id, item.stock, quantity + 1)}
                              type="button"
                            >
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            className={`${primaryButtonClass} flex-1 px-4`}
                            disabled={item.stock === 0 || activeItemId === item.id}
                            onClick={() => void handleAddToCart(item.id)}
                            type="button"
                          >
                            {item.stock === 0 ? (
                              'Sold out'
                            ) : activeItemId === item.id ? (
                              <>
                                <LoadingSpinner />
                                Adding
                              </>
                            ) : (
                              'Add'
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <EmptyState
          description="Store not found or unavailable."
          icon={StoreIcon}
          title="Store unavailable"
        />
      )}
    </PageContainer>
  );
}
