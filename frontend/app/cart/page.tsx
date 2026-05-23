'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { clearCart, getCarts, removeCartItem, updateCartItem } from '@/services/carts';
import type { Cart } from '@/types/cart';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api').replace(
  /\/api$/,
  '',
);

export default function CartPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const grandTotal = useMemo(
    () => carts.reduce((total, cart) => total + Number(cart.total), 0),
    [carts],
  );

  const loadCarts = useCallback(async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const data = await getCarts();
      setCarts(data.carts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load cart.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCarts();
  }, [loadCarts]);

  const replaceCart = (nextCart: Cart) => {
    setCarts((current) => current.map((cart) => (cart.id === nextCart.id ? nextCart : cart)));
  };

  const handleQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
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
    setBusyId(cartItemId);
    setMessage('');

    try {
      await removeCartItem(cartItemId);
      await loadCarts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async (cartId: string) => {
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

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-emerald-700">Your carts</p>
            <h1 className="mt-3 text-4xl font-semibold text-stone-950">Cart</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Items are grouped by store so every hostel room keeps a separate cart.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 shadow-sm hover:border-emerald-700"
            href="/"
          >
            Browse stores
          </Link>
        </div>

        {message ? <p className="mt-6 text-sm font-medium text-stone-700">{message}</p> : null}

        {isLoading ? (
          <p className="mt-10 text-sm text-stone-600">Loading cart...</p>
        ) : carts.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-stone-950">Your cart is empty</h2>
            <p className="mt-2 text-sm text-stone-600">Add items from a store to see them here.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              {carts.map((cart) => (
                <section
                  className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                  key={cart.id}
                >
                  <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-stone-950">{cart.store.name}</h2>
                      <p className="mt-1 text-sm text-stone-600">
                        {cart.store.hostel.name} - Room {cart.store.roomNumber}
                      </p>
                    </div>
                    <button
                      className="h-9 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === cart.id}
                      onClick={() => void handleClear(cart.id)}
                      type="button"
                    >
                      Clear cart
                    </button>
                  </div>

                  <div className="divide-y divide-stone-200">
                    {cart.items.map((cartItem) => (
                      <article
                        className="grid gap-4 py-4 sm:grid-cols-[88px_1fr_auto]"
                        key={cartItem.id}
                      >
                        <div className="relative h-24 overflow-hidden rounded-md bg-stone-100">
                          {cartItem.item.imageUrl ? (
                            <Image
                              alt={cartItem.item.name}
                              className="object-cover"
                              fill
                              src={`${API_ORIGIN}${cartItem.item.imageUrl}`}
                            />
                          ) : null}
                        </div>
                        <div>
                          <h3 className="font-medium text-stone-950">{cartItem.item.name}</h3>
                          <p className="mt-1 text-sm text-stone-600">{cartItem.item.category}</p>
                          <p className="mt-2 text-sm font-medium text-stone-950">
                            Rs. {cartItem.item.price}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <div className="flex h-10 items-center rounded-md border border-stone-300 bg-white">
                            <button
                              className="h-10 w-10 text-lg text-stone-700 disabled:cursor-not-allowed disabled:text-stone-300"
                              disabled={cartItem.quantity <= 1 || busyId === cartItem.id}
                              onClick={() =>
                                void handleQuantity(cartItem.id, cartItem.quantity - 1)
                              }
                              type="button"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-medium text-stone-950">
                              {cartItem.quantity}
                            </span>
                            <button
                              className="h-10 w-10 text-lg text-stone-700 disabled:cursor-not-allowed disabled:text-stone-300"
                              disabled={
                                cartItem.quantity >= cartItem.item.stock || busyId === cartItem.id
                              }
                              onClick={() =>
                                void handleQuantity(cartItem.id, cartItem.quantity + 1)
                              }
                              type="button"
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-sm font-medium text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:text-stone-400"
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

                  <div className="flex justify-end border-t border-stone-200 pt-4">
                    <p className="text-sm font-semibold text-stone-950">
                      Store total: Rs. {Number(cart.total).toFixed(2)}
                    </p>
                  </div>
                </section>
              ))}
            </div>

            <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">Totals</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="flex justify-between">
                  <span>Stores</span>
                  <span className="font-medium text-stone-950">{carts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items</span>
                  <span className="font-medium text-stone-950">
                    {carts.reduce((total, cart) => total + cart.items.length, 0)}
                  </span>
                </div>
              </div>
              <div className="mt-5 border-t border-stone-200 pt-5">
                <div className="flex justify-between text-base font-semibold text-stone-950">
                  <span>Total</span>
                  <span>Rs. {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
