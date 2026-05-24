'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

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
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { checkoutCart } from '@/services/bookings';
import { ApiError, buildAssetUrl } from '@/services/api';
import { clearCart, getCarts, removeCartItem, updateCartItem } from '@/services/carts';
import type { Cart } from '@/types/cart';

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const grandTotal = useMemo(
    () => carts.reduce((total, cart) => total + Number(cart.total), 0),
    [carts],
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
      const data = await checkoutCart(cartId);
      router.push(`/bookings/success/${data.booking.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to checkout cart.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        action={
          <Link className={secondaryButtonClass} href="/">
            Browse stores
          </Link>
        }
        description="Grouped by store."
        title="Cart"
      />

      {message ? (
        <div className="mt-6">
          <Notice tone="warning">{message}</Notice>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {[0, 1].map((item) => (
              <MarketSurface className="h-52 animate-pulse" key={item} />
            ))}
          </div>
          <MarketSurface className="hidden h-56 animate-pulse lg:block" />
        </div>
      ) : carts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              <Link className={primaryButtonClass} href="/">
                Browse stores
              </Link>
            }
            description="Items you add will show up here."
            icon={ShoppingCart}
            title="Your cart is empty"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {carts.map((cart) => (
              <section className={orderCardClass} key={cart.id}>
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{cart.store.name}</h2>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      {cart.store.hostel.name} - Room {cart.store.roomNumber}
                    </p>
                  </div>
                  <button
                    className={dangerOutlineButtonClass}
                    disabled={busyId === cart.id}
                    onClick={() => void handleClear(cart.id)}
                    type="button"
                  >
                    Clear cart
                  </button>
                </div>

                <div className={divideClass}>
                  {cart.items.map((cartItem) => (
                    <article
                      className="grid gap-4 py-4 sm:grid-cols-[88px_1fr_auto]"
                      key={cartItem.id}
                    >
                      <div className="relative h-24 overflow-hidden rounded-lg bg-surface-raised">
                        {cartItem.item.imageUrl ? (
                          <Image
                            alt={cartItem.item.name}
                            className="object-cover"
                            fill
                            src={buildAssetUrl(cartItem.item.imageUrl)}
                          />
                        ) : null}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{cartItem.item.name}</h3>
                        <p className="mt-1 text-sm text-foreground-secondary">{cartItem.item.category}</p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          Rs. {cartItem.item.price}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <div className="flex h-10 items-center rounded-lg border border-border bg-canvas">
                          <button
                            className="h-10 w-10 text-lg text-foreground-secondary disabled:cursor-not-allowed disabled:text-foreground-faint"
                            disabled={cartItem.quantity <= 1 || busyId === cartItem.id}
                            onClick={() => void handleQuantity(cartItem.id, cartItem.quantity - 1)}
                            type="button"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-foreground">
                            {cartItem.quantity}
                          </span>
                          <button
                            className="h-10 w-10 text-lg text-foreground-secondary disabled:cursor-not-allowed disabled:text-foreground-faint"
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
                          className="text-sm font-medium text-red-300 hover:text-red-200 disabled:cursor-not-allowed disabled:text-slate-600"
                          disabled={busyId === cartItem.id}
                          onClick={() => void handleRemove(cartItem.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      Store total: Rs. {Number(cart.total).toFixed(2)}
                    </p>
                    <button
                      className={primaryButtonClass}
                      disabled={busyId === cart.id}
                      onClick={() => void handleCheckout(cart.id)}
                      type="button"
                    >
                      {busyId === cart.id ? (
                        <>
                          <LoadingSpinner />
                          Checking out
                        </>
                      ) : (
                        'Checkout'
                      )}
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className={`${orderCardClass} h-fit`}>
            <h2 className="text-lg font-semibold text-foreground">Totals</h2>
            <div className="mt-4 space-y-3 text-sm text-foreground-secondary">
              <div className="flex justify-between">
                <span>Stores</span>
                <span className="font-medium text-foreground">{carts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Items</span>
                <span className="font-medium text-foreground">
                  {carts.reduce((total, cart) => total + cart.items.length, 0)}
                </span>
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
