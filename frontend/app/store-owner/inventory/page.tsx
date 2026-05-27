'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, PackagePlus, PackageSearch } from 'lucide-react';

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
import { MediaFallback } from '@/components/brand-assets';
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
const ACTIVE_STORE_KEY = 'munchies_active_store_id';

type FormState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  customCategory: string;
  price: string;
  stock: string;
  image: File | null;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  category: '',
  customCategory: '',
  price: '',
  stock: '0',
  image: null,
};

const validateForm = (form: FormState) => {
  if (form.name.trim().length < 2) {
    return 'Item name must be at least 2 characters.';
  }

  const effectiveCategory = form.category === 'Others' ? form.customCategory : form.category;
  if (effectiveCategory.trim().length < 2) {
    return 'Category must be at least 2 characters.';
  }

  const price = Number(form.price);
  if (!Number.isFinite(price) || price <= 0) {
    return 'Enter a price greater than zero.';
  }

  const stock = Number(form.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    return 'Stock must be a whole number of zero or more.';
  }

  return '';
};

export default function InventoryPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthorized } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = useCallback(async (storeId: string) => {
    if (!storeId) {
      setItems([]);
      return;
    }

    setIsItemsLoading(true);
    try {
      const data = await getStoreItems(storeId);
      setItems(data.items);
    } finally {
      setIsItemsLoading(false);
    }
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
        if (data.stores.length === 0) {
          setItems([]);
        }

        setSelectedStoreId((current) => {
          const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_STORE_KEY) : '';
          if (current && data.stores.some((store) => store.id === current)) {
            return current;
          }
          if (persisted && data.stores.some((store) => store.id === persisted)) {
            return persisted;
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
    window.localStorage.setItem(ACTIVE_STORE_KEY, selectedStoreId);

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
    window.localStorage.setItem(ACTIVE_STORE_KEY, storeId);
    setSelectedStoreId(storeId);
    setForm(emptyForm);
    setMessage('');
    setFormError('');

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

    const validationMessage = validateForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setFormError('');

    const payload: ItemFormPayload = {
      name: form.name,
      description: form.description,
      category: form.category === 'Others' ? form.customCategory.trim() : form.category,
      price: form.price,
      stock: form.stock,
      image: form.image,
    };

    try {
      if (form.id) {
        const data = await updateStoreItem(selectedStoreId, form.id, payload);
        setItems((currentItems) =>
          currentItems.map((item) => (item.id === data.item.id ? data.item : item)),
        );
        setMessage('Item updated.');
      } else {
        const data = await createStoreItem(selectedStoreId, payload);
        setItems((currentItems) => [data.item, ...currentItems]);
        setMessage('Item created.');
      }

      setForm(emptyForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: Item) => {
    setFormError('');
    setMessage('');
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      category: item.category,
      customCategory: '',
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

  const selectedStore = stores.find((store) => store.id === selectedStoreId);
  const hasStores = stores.length > 0;
  const isFormDisabled = isSubmitting || isLoading || !hasStores;

  return (
    <PageContainer size="wide">
      <SectionHeader description="Manage items for your stores." title="Inventory" />
      {message ? (
        <div className="mt-6">
          <Notice
            tone={/unable|failed|error/i.test(message) ? 'danger' : 'success'}
          >
            {message}
          </Notice>
        </div>
      ) : null}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <form className={formPanelClass} onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
              <PackagePlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {form.id ? 'Edit item' : 'New item'}
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {selectedStore ? selectedStore.name : 'Choose an approved store first.'}
              </p>
            </div>
          </div>

          {formError ? (
            <div className="mt-5 flex gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          ) : null}

          <label className="mt-6 block">
            <span className={labelClass}>Store</span>
            <SelectShell>
              <select
                className={selectClass}
                onChange={handleStoreChange}
                required
                disabled={isSubmitting || isLoading}
                value={selectedStoreId}
              >
                <option value="">{isLoading ? 'Loading stores...' : 'Select store'}</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </SelectShell>
          </label>

          {!isLoading && !hasStores ? (
            <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-200">
              No approved store is linked to your account yet.
            </div>
          ) : null}

          <div className="mt-5 space-y-5">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input
                className={fieldClass}
                disabled={isFormDisabled}
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
                disabled={isFormDisabled}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                value={form.description}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Category</span>
              <SelectShell>
                <select
                  className={selectClass}
                  disabled={isFormDisabled}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value, customCategory: '' })
                  }
                  required
                  value={form.category}
                >
                  <option value="">Select category</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Packet Food">Packet Food</option>
                  <option value="Others">Others</option>
                </select>
              </SelectShell>
            </label>
            {form.category === 'Others' ? (
              <label className="block">
                <span className={labelClass}>Custom category</span>
                <input
                  className={fieldClass}
                  disabled={isFormDisabled}
                  minLength={2}
                  onChange={(event) => setForm({ ...form, customCategory: event.target.value })}
                  required
                  value={form.customCategory}
                />
              </label>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Price</span>
                <input
                  className={`${fieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  disabled={isFormDisabled}
                  min="0.01"
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value.replace(/[^\d.]/g, '') })
                  }
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Stock</span>
                <input
                  className={`${fieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  disabled={isFormDisabled}
                  min="0"
                  onChange={(event) =>
                    setForm({ ...form, stock: event.target.value.replace(/[^\d]/g, '') })
                  }
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
                disabled={isFormDisabled}
                onChange={(event) => setForm({ ...form, image: event.target.files?.[0] ?? null })}
                type="file"
              />
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              className={primaryButtonClass}
              disabled={isFormDisabled || !selectedStoreId}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Live inventory</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {selectedStore ? `${selectedStore.name} products` : 'Select a store to view items.'}
              </p>
            </div>
            {selectedStore ? (
              <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-foreground-secondary">
                {items.length} items
              </span>
            ) : null}
          </div>
          {isLoading || isItemsLoading ? (
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
                    ) : (
                      <MediaFallback className="rounded-lg" subtitle={item.category} title={item.name} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground">{item.name}</h3>
                      <span className="rounded-full bg-accent-muted px-2 py-1 text-xs font-bold text-accent">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground-secondary">
                      {item.description}
                    </p>
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
