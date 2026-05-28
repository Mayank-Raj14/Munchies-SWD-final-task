'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Store as StoreIcon, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  dangerOutlineButtonClass,
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
import { ApiError } from '@/services/api';
import { getHostels } from '@/services/hostels';
import { createStoreOwnershipRequest } from '@/services/store-ownership-requests';
import { deleteStore, getMyStores, updateStore } from '@/services/stores';
import type { Hostel } from '@/types/hostel';
import type { Store } from '@/types/store';

type FormState = {
  id?: string;
  name: string;
  hostelId: string;
  roomNumber: string;
  email: string;
};

const emptyForm: FormState = {
  name: '',
  hostelId: '',
  roomNumber: '',
  email: '',
};

export default function StoreOwnerStoresPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthorized } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [stores, setStores] = useState<Store[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStores = useCallback(
    async (options: { silent?: boolean; preserveMessage?: boolean } = {}) => {
      if (!options.silent) setIsLoading(true);
      if (!options.preserveMessage) setMessage('');

      try {
        const data = await getMyStores();
        setStores(data.stores);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Unable to load stores.');
      } finally {
        if (!options.silent) setIsLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthorized) return;

    const loadPageData = async () => {
      try {
        const data = await getHostels();
        setHostels(data.hostels);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load hostels.');
      }
      await loadStores({ preserveMessage: true });
    };

    void loadPageData();
  }, [isAuthLoading, isAuthorized, loadStores]);

  useSyncedRefresh(['stores', 'ownership'], () => loadStores({ silent: true }), {
    enabled: isAuthorized,
  });

  if (isAuthLoading || !isAuthorized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-16">
          <LoadingSpinner className="h-6 w-6" />
          <p className="text-xs font-semibold text-foreground-muted">Checking access…</p>
        </div>
      </PageContainer>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      if (form.id) {
        await updateStore(form.id, {
          name: form.name,
          hostelId: form.hostelId,
          roomNumber: form.roomNumber,
          email: form.email || null,
        });
        setMessage('Store updated successfully.');
      } else {
        await createStoreOwnershipRequest({
          storeName: form.name,
          hostelId: form.hostelId,
          roomNumber: form.roomNumber,
        });
        setMessage('Store request submitted for admin approval.');
      }
      setForm(emptyForm);
      await loadStores();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Store save failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (store: Store) => {
    setForm({
      id: store.id,
      name: store.name,
      hostelId: store.hostel.id,
      roomNumber: store.roomNumber,
      email: store.email ?? '',
    });
  };

  const removeStore = async (storeId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      await deleteStore(storeId);
      setStores((current) => current.filter((s) => s.id !== storeId));
      setMessage('Store deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer size="wide">
      <SectionHeader description="Create requests and edit approved storefronts." title="My stores" />

      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="mt-6"
          >
            <Notice tone={/unable|failed|error/i.test(message) ? 'danger' : 'success'}>
              {message}
            </Notice>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Form panel */}
        <form className={formPanelClass} onSubmit={handleSubmit}>
          {/* Panel header */}
          <div className="flex items-start gap-3 border-b border-border-subtle pb-4 mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent shadow-subtle">
              <StoreIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground leading-tight">
                {form.id ? 'Edit Store' : 'New Store'}
              </h2>
              <p className="mt-0.5 text-xs text-foreground-muted font-medium">
                {form.id ? 'Update your store details below.' : 'Submit a new store for admin approval.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Store Name</span>
              <input
                className={fieldClass}
                minLength={2}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Night Canteen"
                required
                value={form.name}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Hostel Block</span>
              <SelectShell>
                <select
                  className={selectClass}
                  onChange={(e) => setForm({ ...form, hostelId: e.target.value })}
                  required
                  value={form.hostelId}
                >
                  <option value="">Select hostel</option>
                  {hostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </label>

            <label className="block">
              <span className={labelClass}>Room / Stall Number</span>
              <input
                className={fieldClass}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="B-214"
                required
                value={form.roomNumber}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Reply Email (optional)</span>
              <input
                className={fieldClass}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                placeholder="store@campus.edu"
                value={form.email}
              />
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button className={`${primaryButtonClass} flex-1`} disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  Saving…
                </>
              ) : form.id ? (
                'Update Store'
              ) : (
                'Submit For Approval'
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

        {/* Stores list panel */}
        <MarketSurface className="p-5 sm:p-6 border border-border">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                Active Stores
              </h2>
              <p className="mt-0.5 text-xs text-foreground-muted font-medium">
                {stores.length} store{stores.length !== 1 ? 's' : ''} registered
              </p>
            </div>
            {stores.length > 0 && (
              <span className="rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-[10px] font-bold text-foreground-secondary shadow-subtle uppercase">
                {stores.length} Total
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3.5">
              {[0, 1, 2].map((i) => (
                <div className="h-24 animate-pulse rounded-xl bg-surface-raised" key={i} />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <EmptyState
              description="Add a store to start listing items and receiving orders."
              icon={StoreIcon}
              title="No stores yet"
            />
          ) : (
            <motion.div layout className="grid gap-3.5">
              <AnimatePresence>
                {stores.map((store, idx) => (
                  <motion.article
                    layout
                    key={store.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28, delay: idx * 0.05 }}
                    className={`grid gap-4 rounded-xl border bg-surface p-4 shadow-sm transition-all duration-200 hover:shadow-card-hover md:grid-cols-[1fr_auto] md:items-center ${
                      form.id === store.id
                        ? 'border-accent/30 bg-accent-muted/10'
                        : 'border-border hover:border-border-strong'
                    }`}
                  >
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-tight">{store.name}</h3>
                      <p className="mt-1 text-xs font-semibold text-foreground-secondary">
                        {store.hostel.name} · Room {store.roomNumber}
                      </p>
                      {store.email ? (
                        <p className="mt-0.5 text-xs text-foreground-muted">{store.email}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className={`${secondaryButtonClass} h-8 text-xs px-3 rounded-lg`}
                        disabled={isSubmitting}
                        onClick={() => startEdit(store)}
                        type="button"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        className={`${dangerOutlineButtonClass} px-3`}
                        disabled={isSubmitting}
                        onClick={() => void removeStore(store.id)}
                        type="button"
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
