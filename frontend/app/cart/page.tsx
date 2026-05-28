'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingCart, ShoppingBag, Percent, Receipt, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  divideClass,
  dangerOutlineButtonClass,
  orderCardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { MediaFallback } from '@/components/brand-assets';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { checkoutCart } from '@/services/bookings';
import { ApiError, buildAssetUrl } from '@/services/api';
import { clearCart, getCarts, removeCartItem, updateCartItem } from '@/services/carts';
import { validateCoupon } from '@/services/campaigns';
import type { CouponPreview } from '@/types/campaign';
import type { Cart } from '@/types/cart';

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});
  const [couponPreviews, setCouponPreviews] = useState<Record<string, CouponPreview>>({});

  const grandTotal = useMemo(
    () =>
      carts.reduce(
        (total, cart) => total + Number(couponPreviews[cart.id]?.totalAmount ?? cart.total),
        0,
      ),
    [carts, couponPreviews],
  );

  const loadCarts = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
      setMessage('');

      try {
        const data = await getCarts();
        setCarts(data.carts);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Unable to load cart.');
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    void loadCarts();
  }, [isAuthLoading, loadCarts, user]);

  useSyncedRefresh(['cart', 'inventory'], () => loadCarts({ silent: true }), {
    enabled: !isAuthLoading && Boolean(user),
  });

  const replaceCart = (nextCart: Cart) => {
    setCarts((current) => current.map((cart) => (cart.id === nextCart.id ? nextCart : cart)));
  };

  const handleQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1 || busyId) {
      return;
    }

    setBusyId(cartItemId);
    setMessage('');

    try {
      const data = await updateCartItem(cartItemId, quantity);
      replaceCart(data.cart);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update quantity.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    if (busyId) {
      return;
    }

    setBusyId(cartItemId);
    setMessage('');

    try {
      await removeCartItem(cartItemId);
      await loadCarts({ silent: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async (cartId: string) => {
    if (busyId) {
      return;
    }

    setBusyId(cartId);
    setMessage('');

    try {
      await clearCart(cartId);
      setCarts((current) => current.filter((cart) => cart.id !== cartId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to clear cart.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckout = async (cartId: string) => {
    if (busyId) {
      return;
    }

    setBusyId(cartId);
    setMessage('');

    try {
      const data = await checkoutCart(cartId, couponPreviews[cartId]?.campaign.code);
      router.push(`/bookings/success/${data.booking.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to checkout cart.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCouponPreview = async (cartId: string) => {
    if (busyId) {
      return;
    }

    const code = couponCodes[cartId]?.trim();

    if (!code) {
      setMessage('Enter a coupon code first.');
      return;
    }

    setBusyId(`coupon-${cartId}`);
    setMessage('');

    try {
      const preview = await validateCoupon({ cartId, code });
      setCouponPreviews((current) => ({ ...current, [cartId]: preview }));
    } catch (error) {
      setCouponPreviews((current) => {
        const next = { ...current };
        delete next[cartId];
        return next;
      });
      setMessage(error instanceof Error ? error.message : 'Coupon validation failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        action={
          <Link className={`${secondaryButtonClass} h-9 rounded-xl inline-flex items-center gap-1.5 shadow-sm`} href="/">
            <ShoppingBag className="h-4 w-4 text-accent" />
            Browse stores
          </Link>
        }
        description="Your ordering items, grouped by campus store."
        title="Shopping Cart"
      />

      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            <Notice tone="warning">{message}</Notice>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isLoading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {[0, 1].map((item) => (
              <MarketSurface className="h-48 animate-pulse rounded-2xl" key={item} />
            ))}
          </div>
          <MarketSurface className="hidden h-56 animate-pulse lg:block rounded-2xl" />
        </div>
      ) : carts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              <Link className={primaryButtonClass} href="/">
                Browse campus stores
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            }
            description="Your cart is currently empty. Check out what campus canteens are cooking today!"
            icon={ShoppingCart}
            title="Your cart is empty"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_325px]">
          <div className="space-y-6">
            <AnimatePresence>
              {carts.map((cart) => (
                <motion.section
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  className={orderCardClass}
                  key={cart.id}
                >
                  <div className="flex flex-col gap-3 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-foreground leading-tight">{cart.store.name}</h2>
                      <p className="mt-1 text-xs font-semibold text-foreground-secondary flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                        {cart.store.hostel.name} · Room {cart.store.roomNumber}
                      </p>
                    </div>
                    
                    <button
                      className={`${dangerOutlineButtonClass} h-8 text-[11px] font-bold px-3 rounded-lg active:scale-95`}
                      disabled={busyId === cart.id}
                      onClick={() => void handleClear(cart.id)}
                      type="button"
                    >
                      Clear cart
                    </button>
                  </div>

                  <div className={divideClass}>
                    <AnimatePresence>
                      {cart.items.map((cartItem) => (
                        <motion.article
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="grid gap-4 py-4 sm:grid-cols-[80px_1fr_auto] items-center"
                          key={cartItem.id}
                        >
                          <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-surface-raised border border-border shadow-sm">
                            {cartItem.item.imageUrl ? (
                              <Image
                                alt={cartItem.item.name}
                                className="object-cover"
                                fill
                                src={buildAssetUrl(cartItem.item.imageUrl)}
                                sizes="80px"
                              />
                            ) : (
                              <MediaFallback className="rounded-xl" subtitle={cartItem.item.category} title={cartItem.item.name} />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-bold text-foreground leading-tight">{cartItem.item.name}</h3>
                            <p className="mt-0.5 text-xs text-foreground-muted font-medium">
                              {cartItem.item.category}
                            </p>
                            <p className="mt-2 text-xs font-bold text-accent">
                              Rs. {cartItem.item.price}
                            </p>
                          </div>
                          
                          <div className="flex flex-row items-center sm:flex-col sm:items-end gap-3.5">
                            <div className="flex h-8.5 items-center rounded-xl border border-border bg-canvas shadow-subtle overflow-hidden">
                              <button
                                className="h-8.5 w-8 text-center text-xs font-bold text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:text-foreground-faint"
                                disabled={cartItem.quantity <= 1 || busyId === cartItem.id}
                                onClick={() => void handleQuantity(cartItem.id, cartItem.quantity - 1)}
                                type="button"
                              >
                                -
                              </button>
                              
                              <span className="w-8 text-center text-xs font-bold text-foreground">
                                {cartItem.quantity}
                              </span>
                              
                              <button
                                className="h-8.5 w-8 text-center text-xs font-bold text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:text-foreground-faint"
                                disabled={
                                  cartItem.quantity >= cartItem.item.stock || busyId === cartItem.id
                                }
                                onClick={() => void handleQuantity(cartItem.id, cartItem.quantity + 1)}
                                type="button"
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={busyId === cartItem.id}
                              onClick={() => void handleRemove(cartItem.id)}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Coupon Validation and Checkout panel */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-t border-border-subtle pt-4.5">
                    <div className="w-full sm:max-w-xs">
                      <label className="block text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-1">
                          <Percent className="h-3 w-3 text-accent" />
                          Apply Promo Coupon
                        </span>
                        <div className="mt-1.5 flex gap-2">
                          <input
                            className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-canvas px-3 text-xs font-bold uppercase text-foreground outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                            onChange={(event) => {
                              const value = event.target.value.toUpperCase();
                              setCouponCodes((current) => ({ ...current, [cart.id]: value }));
                            }}
                            placeholder="MUNCH20"
                            value={couponCodes[cart.id] ?? ''}
                          />
                          <button
                            className={`${secondaryButtonClass} h-9 text-xs rounded-xl shadow-sm`}
                            disabled={busyId === `coupon-${cart.id}`}
                            onClick={() => void handleCouponPreview(cart.id)}
                            type="button"
                          >
                            {busyId === `coupon-${cart.id}` ? <LoadingSpinner className="h-3 w-3" /> : 'Apply'}
                          </button>
                        </div>
                      </label>
                      
                      <AnimatePresence>
                        {couponPreviews[cart.id] ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="mt-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-left text-xs font-semibold text-emerald-300 shadow-sm"
                          >
                            <div className="flex justify-between gap-3">
                              <span>Promo discount</span>
                              <span>
                                - Rs. {Number(couponPreviews[cart.id].discountAmount).toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-1 flex justify-between gap-3 border-t border-emerald-500/10 pt-1.5 font-bold">
                              <span>Promo price</span>
                              <span>
                                Rs. {Number(couponPreviews[cart.id].totalAmount).toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 w-full sm:w-auto">
                      <p className="text-xs font-semibold text-foreground-secondary">
                        Store total:{' '}
                        <span className="text-sm font-extrabold text-foreground">
                          Rs. {Number(couponPreviews[cart.id]?.totalAmount ?? cart.total).toFixed(2)}
                        </span>
                      </p>
                      
                      <button
                        className={`${primaryButtonClass} h-9.5 text-xs rounded-xl shadow-sm w-full sm:w-auto`}
                        disabled={busyId === cart.id}
                        onClick={() => void handleCheckout(cart.id)}
                        type="button"
                      >
                        {busyId === cart.id ? (
                          <>
                            <LoadingSpinner className="h-3.5 w-3.5" />
                            Checking out...
                          </>
                        ) : (
                          'Proceed to checkout'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>
          </div>

          {/* Grand receipt layout */}
          <aside className="lg:sticky lg:top-[7.5rem] h-fit">
            <motion.div
              layout
              className="rounded-2xl border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3.5">
                <Receipt className="h-4.5 w-4.5 text-accent" />
                <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Summary Receipt</h2>
              </div>
              
              <div className="mt-4 space-y-3.5 text-xs text-foreground-secondary font-semibold">
                <div className="flex justify-between">
                  <span>Active Stores</span>
                  <span className="font-bold text-foreground">{carts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Product Count</span>
                  <span className="font-bold text-foreground">
                    {carts.reduce((total, cart) => total + cart.items.length, 0)}
                  </span>
                </div>
              </div>
              
              <div className="mt-5 border-t border-border-subtle pt-4.5">
                <div className="flex justify-between text-sm font-bold text-foreground">
                  <span className="uppercase text-foreground-secondary tracking-wider text-[10px]">Grand Total</span>
                  <span className="text-base font-black text-accent">Rs. {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
