'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { PackageSearch } from 'lucide-react';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  fieldClass,
  formPanelClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  SelectShell,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { ApiError, buildAssetUrl } from '@/services/api';
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
  const { isLoading: isAuthLoading, isAuthorized } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = useCallback(async (storeId: string) => {
    if (!storeId) {
      setItems([]);
      return;
    }

    const data = await getStoreItems(storeId);
    setItems(data.items);
  }, []);

  const loadStores = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
      setMessage('');

      try {
        const data = await getMyStores();
        setStores(data.stores);

        setSelectedStoreId((current) => {
          if (current && data.stores.some((store) => store.id === current)) {
            return current;
          }

          return data.stores[0]?.id ?? '';
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Unable to load inventory.');
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthorized) {
      return;
    }

    void loadStores();
  }, [isAuthLoading, isAuthorized, loadStores]);

  useEffect(() => {
    if (!isAuthorized || !selectedStoreId) {
      return;
    }

    void loadItems(selectedStoreId).catch((error) => {
      setMessage(error instanceof Error ? error.message : 'Unable to load items.');
    });
  }, [isAuthorized, loadItems, selectedStoreId]);

  useSyncedRefresh(
    ['inventory', 'stores'],
    () => {
      void loadStores({ silent: true });
      if (selectedStoreId) {
        void loadItems(selectedStoreId);
      }
    },
    { enabled: isAuthorized },
  );

  if (isAuthLoading || !isAuthorized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-16">
          <LoadingSpinner className="h-6 w-6" />
          <p className="text-sm text-foreground-muted">Checking access…</p>
        </div>
      </PageContainer>
    );
  }

  const handleStoreChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    if (isSubmitting) {
      return;
    }

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
    if (isSubmitting || !selectedStoreId) {
      return;
    }

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
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await deleteStoreItem(selectedStoreId, itemId);
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
      setMessage('Item deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer size="wide">
      <SectionHeader description="Manage items for your stores." title="Inventory" />
      {message ? (
        <div className="mt-6">
          <Notice
            tone={message.includes('Unable') || message.includes('failed') ? 'danger' : 'success'}
          >
            {message}
          </Notice>
        </div>
      ) : null}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <form className={formPanelClass} onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold text-foreground">
            {form.id ? 'Edit item' : 'New item'}
          </h2>

          <label className="mt-6 block">
            <span className={labelClass}>Store</span>
            <SelectShell>
              <select
                className={selectClass}
                onChange={handleStoreChange}
                required
                disabled={isSubmitting}
                value={selectedStoreId}
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </SelectShell>
          </label>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input
                className={fieldClass}
                minLength={2}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                value={form.name}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Description</span>
              <textarea
                className={`${fieldClass} min-h-24`}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                value={form.description}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Category</span>
              <input
                className={fieldClass}
                minLength={2}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
                value={form.category}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Price</span>
                <input
                  className={fieldClass}
                  min="0.01"
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Stock</span>
                <input
                  className={fieldClass}
                  min="0"
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  required
                  type="number"
                  value={form.stock}
                />
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>Image</span>
              <input
                accept="image/*"
                className={fieldClass}
                onChange={(event) => setForm({ ...form, image: event.target.files?.[0] ?? null })}
                type="file"
              />
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              className={primaryButtonClass}
              disabled={isSubmitting || !selectedStoreId}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  Saving
                </>
              ) : form.id ? (
                'Update Item'
              ) : (
                'Create Item'
              )}
            </button>
            {form.id ? (
              <button
                className={secondaryButtonClass}
                onClick={() => setForm(emptyForm)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <MarketSurface className="p-6">
          <h2 className="text-xl font-semibold text-foreground">Live inventory</h2>
          {isLoading ? (
            <div className="mt-6 space-y-4">
              {[0, 1, 2].map((item) => (
                <div className="h-28 animate-pulse rounded-lg bg-surface-raised" key={item} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                description="Add real products for the selected store. Customer pages stay empty until inventory is available."
                icon={PackageSearch}
                title="No items yet"
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {items.map((item) => (
                <article
                  className="grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-border-strong sm:grid-cols-[96px_1fr_auto] sm:items-center"
                  key={item.id}
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-surface-raised">
                    {item.imageUrl ? (
                      <Image
                        alt={item.name}
                        className="object-cover"
                        fill
                        src={buildAssetUrl(item.imageUrl)}
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground">{item.name}</h3>
                      <span className="rounded-full bg-accent-muted px-2 py-1 text-xs font-bold text-accent">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground-secondary">{item.description}</p>
                    <p className="mt-2 text-sm font-bold text-foreground">
                      Rs. {item.price} - Stock {item.stock}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className={secondaryButtonClass}
                      disabled={isSubmitting}
                      onClick={() => startEdit(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground-secondary shadow-sm transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
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
        </MarketSurface>
      </section>
    </PageContainer>
  );
}
