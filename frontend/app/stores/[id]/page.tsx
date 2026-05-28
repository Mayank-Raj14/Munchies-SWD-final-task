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
  Store as StoreIcon,
  ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { BrandMark, MediaFallback } from '@/components/brand-assets';
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
      setNotice({ tone: 'success', text: `Added ${requestedQuantity}x ${item.name} to cart.` });
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
      {/* Back button */}
      <Link className={`mb-5 ${secondaryButtonClass} h-9 rounded-xl inline-flex items-center gap-1.5`} href="/">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to stores
      </Link>

      {/* Dynamic Alerts */}
      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5"
          >
            <Notice tone={notice.tone}>{notice.text}</Notice>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isLoading ? (
        <MarketSurface className="h-80 animate-pulse rounded-2xl">
          <span className="sr-only">Loading store profile...</span>
        </MarketSurface>
      ) : store ? (
        <>
          {/* Exquisite header panel details */}
          <MarketSurface className="overflow-hidden rounded-2xl shadow-card border border-border">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] bg-gradient-to-br from-surface to-surface-raised">
              <div className="relative p-6 sm:p-8 flex flex-col justify-center">
                {/* Radial accent glow background inside header card */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.08),transparent_50%)] pointer-events-none" />
                
                <span className={`${badgeClass} text-[10px] uppercase font-bold tracking-wider mb-2.5 w-fit`}>
                  {store.hostel.name}
                </span>
                
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-tight">
                  {store.name}
                </h1>
                
                <p className="mt-1.5 text-sm font-medium text-foreground-secondary flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Room {store.roomNumber}
                </p>
                
                <div className="mt-6">
                  <BrandMark compact />
                </div>
              </div>
              
              <div className="border-t border-border bg-surface-raised/40 p-5 lg:border-l lg:border-t-0 backdrop-blur-sm flex flex-col justify-center">
                <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
                      <StoreIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Vendor Info</span>
                  </div>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-secondary font-medium">Room Location</span>
                      <span className="font-semibold text-foreground">{store.roomNumber}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-secondary font-medium">Owner</span>
                      <span className="truncate font-semibold text-foreground">
                        {store.owner.name}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-secondary font-medium">Menu Catalog</span>
                      <span className="font-semibold text-foreground">
                        {store.items?.length ?? 0} listed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MarketSurface>

          {/* Menu Catalog Section */}
          <section className="mt-8">
            <div className="mb-5 flex items-center gap-2.5">
              <ShoppingBag className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Menu Catalog</h2>
            </div>

            {!store.items || store.items.length === 0 ? (
              <EmptyState
                description="This merchant has not listed any inventory products yet. Check back soon!"
                icon={PackageOpen}
                title="No items listed yet"
              />
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {store.items.map((item) => {
                  const quantity = quantities[item.id] ?? 1;

                  return (
                    <motion.article
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
                      }}
                      className={`${itemCardClass} flex flex-col h-full`}
                      key={item.id}
                    >
                      {/* Product image section */}
                      <div className="relative h-44 bg-surface-raised overflow-hidden group">
                        {item.imageUrl ? (
                          <Image
                            alt={item.name}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            fill
                            src={buildAssetUrl(item.imageUrl)}
                            sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 33vw"
                          />
                        ) : (
                          <MediaFallback subtitle={item.category} title={item.name} />
                        )}
                        
                        <span className="absolute right-3 top-3 rounded-xl border border-white/5 bg-canvas/80 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-md shadow-sm">
                          Rs. {item.price}
                        </span>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground leading-tight">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-xs font-bold text-accent tracking-wide">{item.category}</p>
                          </div>
                          
                          <span className={`rounded-lg border border-border bg-surface-raised px-2 py-0.5 text-[10px] font-bold shadow-subtle ${item.stock > 0 ? 'text-foreground-secondary' : 'text-red-400 border-red-500/20 bg-red-500/5'}`}>
                            {item.stock > 0 ? `${item.stock} left` : 'Sold out'}
                          </span>
                        </div>
                        
                        {item.description ? (
                          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-foreground-secondary font-medium">
                            {item.description}
                          </p>
                        ) : (
                          <div className="flex-1 min-h-[2.5rem]" />
                        )}
                        
                        {/* Quantity adjusters and trigger button */}
                        <div className="mt-auto pt-4 flex items-center gap-3">
                          <div className="flex h-9 items-center rounded-xl border border-border bg-canvas overflow-hidden shadow-subtle">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              className="flex h-9 w-9.5 items-center justify-center text-foreground-secondary disabled:cursor-not-allowed disabled:text-foreground-faint hover:bg-surface-raised hover:text-foreground transition-colors"
                              disabled={quantity <= 1 || item.stock === 0}
                              onClick={() => setQuantity(item.id, item.stock, quantity - 1)}
                              type="button"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.button>
                            
                            <span className="w-7 text-center text-xs font-bold text-foreground">
                              {quantity}
                            </span>
                            
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              className="flex h-9 w-9.5 items-center justify-center text-foreground-secondary disabled:cursor-not-allowed disabled:text-foreground-faint hover:bg-surface-raised hover:text-foreground transition-colors"
                              disabled={quantity >= item.stock || item.stock === 0}
                              onClick={() => setQuantity(item.id, item.stock, quantity + 1)}
                              type="button"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.button>
                          </div>
                          
                          <button
                            className={`${primaryButtonClass} flex-1 h-9 text-xs px-4`}
                            disabled={item.stock === 0 || activeItemId === item.id}
                            onClick={() => void handleAddToCart(item.id)}
                            type="button"
                          >
                            {item.stock === 0 ? (
                              'Sold out'
                            ) : activeItemId === item.id ? (
                              <>
                                <LoadingSpinner className="h-3 w-3" />
                                Adding...
                              </>
                            ) : (
                              'Add to cart'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </section>
        </>
      ) : (
        <EmptyState
          description="We couldn't locate this campus canteen store in the network."
          icon={StoreIcon}
          title="Store Unavailable"
        />
      )}
    </PageContainer>
  );
}
