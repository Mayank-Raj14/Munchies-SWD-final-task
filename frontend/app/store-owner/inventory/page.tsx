'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, PackagePlus, PackageSearch, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          <p className="text-xs font-semibold text-foreground-muted">Checking seller credentials...</p>
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
        setMessage('Item updated successfully.');
      } else {
        const data = await createStoreItem(selectedStoreId, payload);
        setItems((currentItems) => [data.item, ...currentItems]);
        setMessage('Item added to live inventory.');
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
      setMessage('Item removed from inventory.');
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
      <SectionHeader description="Edit details, price sheets, image preview assets, and product stocks." title="Canteen Inventory" />
      
      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            <Notice tone={/unable|failed|error/i.test(message) ? 'danger' : 'success'}>{message}</Notice>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* New Item Form */}
        <form className={formPanelClass} onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 border-b border-border-subtle pb-4.5 mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent shadow-subtle">
              <PackagePlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground leading-tight">
                {form.id ? 'Edit Dish details' : 'New Dish Item'}
              </h2>
              <p className="mt-1 text-xs text-foreground-muted font-medium truncate max-w-[220px]">
                {selectedStore ? selectedStore.name : 'No approved store linked.'}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {formError ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-4 flex gap-2 rounded-xl border border-red-500/15 bg-red-500/5 p-3.5 text-xs font-semibold text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                <span>{formError}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <label className="block">
            <span className={labelClass}>Select Canteen Store</span>
            <SelectShell>
              <select
                className={selectClass}
                onChange={handleStoreChange}
                required
                disabled={isSubmitting || isLoading}
                value={selectedStoreId}
              >
                <option value="">{isLoading ? 'Loading canteens...' : 'Select canteen block'}</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </SelectShell>
          </label>

          {!isLoading && !hasStores ? (
            <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 text-xs font-semibold text-amber-200 leading-relaxed">
              No approved canteen block registration is linked. Submit an application in Seller Onboarding.
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className={labelClass}>Dish Name</span>
              <input
                className={fieldClass}
                disabled={isFormDisabled}
                minLength={2}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                placeholder="Example: Paneer Butter Masala"
                value={form.name}
              />
            </label>
            
            <label className="block">
              <span className={labelClass}>Description</span>
              <textarea
                className={`${fieldClass} min-h-24`}
                disabled={isFormDisabled}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Delicious paneer curry with creamy tomato gravy..."
                value={form.description}
              />
            </label>
            
            <label className="block">
              <span className={labelClass}>Category Category</span>
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
            
            <AnimatePresence>
              {form.category === 'Others' ? (
                <motion.label
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="block"
                >
                  <span className={labelClass}>Custom Category Name</span>
                  <input
                    className={fieldClass}
                    disabled={isFormDisabled}
                    minLength={2}
                    onChange={(event) => setForm({ ...form, customCategory: event.target.value })}
                    required
                    placeholder="Example: Main Course"
                    value={form.customCategory}
                  />
                </motion.label>
              ) : null}
            </AnimatePresence>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Price (Rs.)</span>
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
                  placeholder="120"
                  value={form.price}
                />
              </label>
              
              <label className="block">
                <span className={labelClass}>Initial Stock Count</span>
                <input
                  className={`${fieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  disabled={isFormDisabled}
                  min="0"
                  onChange={(event) =>
                    setForm({ ...form, stock: event.target.value.replace(/[^\d]/g, '') })
                  }
                  required
                  type="number"
                  placeholder="10"
                  value={form.stock}
                />
              </label>
            </div>
            
            <label className="block">
              <span className={labelClass}>Product Image File</span>
              <input
                accept="image/*"
                className={`${fieldClass} file:bg-surface-raised file:border-0 file:rounded-lg file:text-xs file:font-bold file:px-2.5 file:py-1 file:mr-2 file:text-foreground`}
                disabled={isFormDisabled}
                onChange={(event) => setForm({ ...form, image: event.target.files?.[0] ?? null })}
                type="file"
              />
            </label>
          </div>

          <div className="mt-6 flex gap-3.5">
            <button
              className={`${primaryButtonClass} flex-1 text-xs h-9.5`}
              disabled={isFormDisabled || !selectedStoreId}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="h-3 w-3" />
                  Saving...
                </>
              ) : form.id ? (
                'Update Item'
              ) : (
                'Add Item'
              )}
            </button>
            
            {form.id ? (
              <button
                className={`${secondaryButtonClass} h-9.5 text-xs px-4`}
                onClick={() => setForm(emptyForm)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {/* Live inventory panel list */}
        <MarketSurface className="p-5 sm:p-6 shadow-card border border-border flex flex-col h-full min-h-[500px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-4.5 mb-5">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Live Active Inventory</h2>
              <p className="mt-1 text-xs text-foreground-muted font-semibold">
                {selectedStore ? `${selectedStore.name} active items` : 'Choose a canteen block first.'}
              </p>
            </div>
            {selectedStore ? (
              <span className="rounded-lg border border-border bg-surface-raised px-2.5 py-0.75 text-[10px] font-bold text-foreground-secondary shadow-subtle uppercase">
                {items.length} Product{items.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>

          {isLoading || isItemsLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((item) => (
                <div className="h-24 animate-pulse rounded-xl bg-surface-raised" key={item} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <EmptyState
                description="List your canteen products using the form on the left. Customer store catalogs will render instantly."
                icon={PackageSearch}
                title="Your inventory is empty"
              />
            </div>
          ) : (
            <motion.div
              layout
              className="grid gap-3.5"
            >
              <AnimatePresence>
                {items.map((item) => (
                  <motion.article
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="grid gap-4 rounded-xl border border-border bg-surface p-3 shadow-sm hover:border-border-strong sm:grid-cols-[80px_1fr_auto] sm:items-center"
                    key={item.id}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-surface-raised border border-border">
                      {item.imageUrl ? (
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          src={buildAssetUrl(item.imageUrl)}
                          sizes="80px"
                        />
                      ) : (
                        <MediaFallback className="rounded-xl" subtitle={item.category} title={item.name} />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground leading-tight">{item.name}</h3>
                        <span className="rounded-lg bg-accent-muted border border-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent shadow-sm uppercase tracking-wide">
                          {item.category}
                        </span>
                      </div>
                      
                      {item.description ? (
                        <p className="mt-1 text-xs text-foreground-muted font-medium line-clamp-1 max-w-[280px]">
                          {item.description}
                        </p>
                      ) : null}
                      
                      <p className="mt-2 text-xs font-bold text-foreground">
                        Rs. {item.price} · <span className="text-accent">{item.stock} left in stock</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      <button
                        className={`${secondaryButtonClass} h-8 text-[11px] font-bold px-3 rounded-lg active:scale-95`}
                        disabled={isSubmitting}
                        onClick={() => startEdit(item)}
                        type="button"
                        aria-label="Edit item"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-3 text-[11px] font-bold text-foreground-secondary shadow-sm transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                        disabled={isSubmitting}
                        onClick={() => void removeItem(item.id)}
                        type="button"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </MarketSurface>
      </section>
    </PageContainer>
  );
}
