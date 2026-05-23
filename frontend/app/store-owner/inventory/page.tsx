'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

import { ApiError, API_ORIGIN } from '@/services/api';
import {
  createStoreItem,
  deleteStoreItem,
  getStoreItems,
  updateStoreItem,
  type ItemFormPayload,
} from '@/services/items';
import { getMyStores } from '@/services/stores';
import type { Item } from '@/types/item';
import type { Store } from '@/types/store';

type FormState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  image: File | null;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '0',
  image: null,
};

export default function InventoryPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async (storeId: string) => {
    if (!storeId) {
      setItems([]);
      return;
    }

    const data = await getStoreItems(storeId);
    setItems(data.items);
  };

  useEffect(() => {
    const loadInventory = async () => {
      setIsLoading(true);
      setMessage('');

      try {
        const data = await getMyStores();
        setStores(data.stores);

        if (data.stores[0]) {
          setSelectedStoreId(data.stores[0].id);
          await loadItems(data.stores[0].id);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Unable to load inventory.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInventory();
  }, [router]);

  const handleStoreChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const storeId = event.target.value;
    setSelectedStoreId(storeId);
    setForm(emptyForm);
    setMessage('');

    try {
      await loadItems(storeId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load items.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const payload: ItemFormPayload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: form.price,
      stock: form.stock,
      image: form.image,
    };

    try {
      if (form.id) {
        await updateStoreItem(selectedStoreId, form.id, payload);
        setMessage('Item updated.');
      } else {
        await createStoreItem(selectedStoreId, payload);
        setMessage('Item created.');
      }

      setForm(emptyForm);
      await loadItems(selectedStoreId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: Item) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      category: item.category,
      price: item.price,
      stock: String(item.stock),
      image: null,
    });
  };

  const removeItem = async (itemId: string) => {
    setMessage('');

    try {
      await deleteStoreItem(selectedStoreId, itemId);
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
      setMessage('Item deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete item.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[380px_1fr]">
        <form
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h1 className="text-2xl font-semibold text-slate-950">
            {form.id ? 'Edit Item' : 'Create Item'}
          </h1>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-slate-700">Store</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
              onChange={handleStoreChange}
              required
              value={selectedStoreId}
            >
              <option value="">Select store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                minLength={2}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                value={form.name}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                value={form.description}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                minLength={2}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
                value={form.category}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Price</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                  min="0.01"
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Stock</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                  min="0"
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  required
                  type="number"
                  value={form.stock}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Image</span>
              <input
                accept="image/*"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
                onChange={(event) => setForm({ ...form, image: event.target.files?.[0] ?? null })}
                type="file"
              />
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              className="rounded-md bg-slate-950 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting || !selectedStoreId}
              type="submit"
            >
              {isSubmitting ? 'Saving...' : form.id ? 'Update Item' : 'Create Item'}
            </button>
            {form.id ? (
              <button
                className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-950"
                onClick={() => setForm(emptyForm)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
          {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Inventory</h2>
          {isLoading ? (
            <p className="mt-6 text-sm text-slate-600">Loading inventory...</p>
          ) : items.length === 0 ? (
            <p className="mt-6 text-sm text-slate-600">No items yet.</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {items.map((item) => (
                <article
                  className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center"
                  key={item.id}
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-md bg-slate-100">
                    {item.imageUrl ? (
                      <Image
                        alt={item.name}
                        className="object-cover"
                        fill
                        src={`${API_ORIGIN}${item.imageUrl}`}
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-slate-950">{item.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-2 text-sm text-slate-950">
                      Rs. {item.price} - Stock {item.stock}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-950"
                      onClick={() => startEdit(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-950"
                      onClick={() => void removeItem(item.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
