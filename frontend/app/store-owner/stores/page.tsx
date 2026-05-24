'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Store as StoreIcon } from 'lucide-react';

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
import { ApiError } from '@/services/api';
import { getHostels } from '@/services/hostels';
import { createStore, deleteStore, getMyStores, updateStore } from '@/services/stores';
import type { Hostel } from '@/types/hostel';
import type { Store } from '@/types/store';

type FormState = {
  id?: string;
  name: string;
  hostelId: string;
  roomNumber: string;
};

const emptyForm: FormState = {
  name: '',
  hostelId: '',
  roomNumber: '',
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
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
      setMessage('');

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

    const loadPageData = async () => {
      try {
        const data = await getHostels();
        setHostels(data.hostels);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load hostels.');
      }

      await loadStores();
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
          <p className="text-sm text-foreground-muted">Checking access…</p>
        </div>
      </PageContainer>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      if (form.id) {
        await updateStore(form.id, {
          name: form.name,
          hostelId: form.hostelId,
          roomNumber: form.roomNumber,
        });
        setMessage('Store updated.');
      } else {
        await createStore({
          name: form.name,
          hostelId: form.hostelId,
          roomNumber: form.roomNumber,
        });
        setMessage('Store created.');
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
    });
  };

  const removeStore = async (storeId: string) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await deleteStore(storeId);
      setStores((currentStores) => currentStores.filter((store) => store.id !== storeId));
      setMessage('Store deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer size="wide">
      <SectionHeader description="Create and edit your storefronts." title="My stores" />
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
            {form.id ? 'Edit store' : 'New store'}
          </h2>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className={labelClass}>Store name</span>
              <input
                className={fieldClass}
                minLength={2}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                value={form.name}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Hostel</span>
              <SelectShell>
                <select
                  className={selectClass}
                  onChange={(event) => setForm({ ...form, hostelId: event.target.value })}
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
              <span className={labelClass}>Room number</span>
              <input
                className={fieldClass}
                onChange={(event) => setForm({ ...form, roomNumber: event.target.value })}
                required
                value={form.roomNumber}
              />
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  Saving
                </>
              ) : form.id ? (
                'Update Store'
              ) : (
                'Create Store'
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
          <h2 className="text-xl font-semibold text-foreground">My stores</h2>
          {isLoading ? (
            <div className="mt-6 space-y-4">
              {[0, 1, 2].map((item) => (
                <div className="h-24 animate-pulse rounded-lg bg-surface-raised" key={item} />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                description="Add a store to start listing items."
                icon={StoreIcon}
                title="No stores yet"
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {stores.map((store) => (
                <article
                  className="grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-border-strong md:grid-cols-[1fr_auto] md:items-center"
                  key={store.id}
                >
                  <div>
                    <h3 className="font-bold text-foreground">{store.name}</h3>
                    <p className="mt-1 text-sm font-medium text-foreground-secondary">
                      {store.hostel.name} - Room {store.roomNumber}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className={secondaryButtonClass}
                      disabled={isSubmitting}
                      onClick={() => startEdit(store)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground-secondary shadow-sm transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                      onClick={() => void removeStore(store.id)}
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
