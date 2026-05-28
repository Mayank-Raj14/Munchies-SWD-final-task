'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { Ban, CheckCircle2, RefreshCw, ShieldCheck, Store, Unlock } from 'lucide-react';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import {
  approveStoreOwnershipRequest,
  getPendingStoreOwnershipRequests,
  rejectStoreOwnershipRequest,
  type StoreOwnershipRequest,
} from '@/services/store-ownership-requests';
import {
  blockUserForStore,
  blockUserGlobally,
  unblockUserForStore,
  unblockUserGlobally,
} from '@/services/governance';

import {
  blockEveryoneFromStore,
  unblockedEveryoneFromStore,
  reactivateStoreAsAdmin,
  suspendStoreAsAdmin,
  removeStoreAsAdmin,
  searchUsersForModeration,
  listStoresForModeration,
} from '@/services/admin-moderation';

export default function AdminPage() {
  const { isLoading: isAuthLoading, isAuthorized } = useRequireAuth(['ADMIN']);
  const [requests, setRequests] = useState<StoreOwnershipRequest[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Moderation UI state
  const [action, setAction] = useState<string>('global-block');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');


  const loadRequests = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getPendingStoreOwnershipRequests();
      setRequests(data.requests);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin data.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthLoading || !isAuthorized) {
      return;
    }

    void loadRequests();
  }, [isAuthLoading, isAuthorized, loadRequests]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    // load store list once for dropdown/autocomplete baseline
    void (async () => {
      try {
        const data = await listStoresForModeration();
        setStores(data.stores);
      } catch {
        // keep moderation UI functional even if store list fails
      }

    })();

  }, [isAuthorized]);


  const pendingByHostel = useMemo(() => {
    return requests.reduce<Record<string, number>>((groups, request) => {
      groups[request.hostel.name] = (groups[request.hostel.name] ?? 0) + 1;
      return groups;
    }, {});
  }, [requests]);

  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    if (busyId) {
      return;
    }

    setBusyId(requestId);
    setMessage('');
    setError('');

    try {
      if (action === 'approve') {
        await approveStoreOwnershipRequest(requestId);
      } else {
        await rejectStoreOwnershipRequest(requestId);
      }

      await loadRequests();
      setMessage(action === 'approve' ? 'Store approved and synchronized.' : 'Request rejected.');
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Review failed.');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const trimmed = userQuery.trim();
    if (trimmed.length < 2) {
      setUserResults([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await searchUsersForModeration(trimmed);
          setUserResults(data.users);
        } catch {
          setUserResults([]);
        }
      })();
    }, 300);


    return () => window.clearTimeout(timeout);
  }, [isAuthorized, userQuery]);

  const handleModeration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busyId) {
      return;
    }

    setBusyId('moderation');
    setMessage('');
    setError('');

    const formData = new FormData(event.currentTarget);
    const action = String(formData.get('action'));
    const userId = String(formData.get('userId') ?? '').trim();
    const storeId = String(formData.get('storeId') ?? '').trim();
    const reason = String(formData.get('reason') || 'Admin moderation').trim();

    try {
      if (
        (action === 'store-block' || action === 'store-unblock' || action === 'store-block-everyone' ||
          action === 'store-unblock-everyone' || action === 'store-suspend' || action === 'store-reactivate' ||
          action === 'store-remove') &&
        !storeId
      ) {
        throw new Error('Store ID is required for store-level actions.');
      }

      if (
        (action === 'global-block' || action === 'global-unblock' || action === 'store-block' ||
          action === 'store-unblock') &&
        !userId
      ) {
        throw new Error('User ID is required for user actions.');
      }

      if (action === 'global-block') {
        await blockUserGlobally(userId, reason);
      } else if (action === 'global-unblock') {
        await unblockUserGlobally(userId);
      } else if (action === 'store-block') {
        await blockUserForStore(storeId, userId, reason);
      } else if (action === 'store-unblock') {
        await unblockUserForStore(storeId, userId);
      } else if (action === 'store-block-everyone') {
        await blockEveryoneFromStore(storeId, reason);
      } else if (action === 'store-unblock-everyone') {
        await unblockedEveryoneFromStore(storeId);
      } else if (action === 'store-suspend') {
        await suspendStoreAsAdmin(storeId);
      } else if (action === 'store-reactivate') {
        await reactivateStoreAsAdmin(storeId);
      } else {
        await removeStoreAsAdmin(storeId);
      }

      setMessage('Moderation action completed and synced.');
      event.currentTarget.reset();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : 'Moderation failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (isAuthLoading || !isAuthorized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-16">
          <LoadingSpinner className="h-6 w-6" />
          <p className="text-sm text-foreground-muted">Checking access...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <SectionHeader
        action={
          <>
            <button
              className={secondaryButtonClass}
              disabled={isLoading}
              onClick={() => void loadRequests()}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
            <Link className={secondaryButtonClass} href="/admin/store-owner-requests">
              Full queue
            </Link>
          </>
        }
        description="Approve stores and enforce checkout blocks."
        title="Admin"
      />

      {message ? (
        <div className="mt-6">
          <Notice tone="success">{message}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-6">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <MarketSurface className="p-5">
          <p className="text-sm text-foreground-muted">Pending requests</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{requests.length}</p>
        </MarketSurface>
        <MarketSurface className="p-5">
          <p className="text-sm text-foreground-muted">Hostels waiting</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {Object.keys(pendingByHostel).length}
          </p>
        </MarketSurface>
        <MarketSurface className="p-5">
          <p className="text-sm text-foreground-muted">Moderation</p>
          <p className="mt-2 text-base font-semibold text-foreground">Admin-only block controls</p>
        </MarketSurface>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <MarketSurface className="p-5">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Ownership queue</h2>
          </div>

          {isLoading ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((item) => (
                <div className="h-24 animate-pulse rounded-xl bg-surface-raised" key={item} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                description="New seller applications appear here as soon as users submit them."
                icon={ShieldCheck}
                title="No pending requests"
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {requests.map((request) => (
                <article
                  className="rounded-xl border border-border bg-surface-raised p-4"
                  key={request.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{request.storeName}</p>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {request.hostel.name} - Room {request.roomNumber}
                      </p>
                      <p className="mt-2 text-sm text-foreground-muted">
                        {request.user.name} ({request.user.email})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={primaryButtonClass}
                        disabled={busyId === request.id}
                        onClick={() => void handleReview(request.id, 'approve')}
                        type="button"
                      >
                        {busyId === request.id ? (
                          <LoadingSpinner />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        className={secondaryButtonClass}
                        disabled={busyId === request.id}
                        onClick={() => void handleReview(request.id, 'reject')}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </MarketSurface>

        <MarketSurface className="p-5">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Block controls</h2>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleModeration}>
            <label className="block">
              <span className={labelClass}>Action</span>
              <select
                className={fieldClass}
                name="action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="global-block">Global block user</option>
                <option value="global-unblock">Global unblock user</option>
                <option value="store-block">Store block user</option>
                <option value="store-unblock">Store unblock user</option>
                <option value="store-block-everyone">Block everyone from store</option>
                <option value="store-unblock-everyone">Unblock everyone from store</option>
                <option value="store-suspend">Suspend store</option>
                <option value="store-reactivate">Reactivate store</option>
                <option value="store-remove">Remove store</option>
              </select>
            </label>

            {action === 'global-block' || action === 'global-unblock' || action === 'store-block' || action === 'store-unblock' ? (
              <label className="block">
                <span className={labelClass}>User</span>
                <input
                  className={fieldClass}
                  placeholder="Search user by name or email"
                  value={userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setSelectedUserId('');
                  }}
                />

                {userResults.length > 0 ? (
                  <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-border bg-surface-raised">
                    {userResults.slice(0, 8).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setUserQuery(`${u.name} (${u.email})`);
                          setUserResults([]);
                        }}
                      >
                        <span className="font-medium text-foreground">{u.name}</span>
                        <span className="text-foreground-muted">{u.email}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {selectedUserId ? (
                  <input type="hidden" name="userId" value={selectedUserId} />
                ) : null}
              </label>
            ) : null}

            {action === 'store-block' || action === 'store-unblock' || action === 'store-block-everyone' || action === 'store-unblock-everyone' || action === 'store-suspend' || action === 'store-reactivate' || action === 'store-remove' ? (
              <label className="block">
                <span className={labelClass}>Store</span>
                <select
                  className={fieldClass}
                  value={selectedStoreId}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                  }}

                >
                  <option value="">Select a store</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selectedStoreId ? <input type="hidden" name="storeId" value={selectedStoreId} /> : null}
              </label>
            ) : null}

            <label className="block">
              <span className={labelClass}>Reason</span>
              <textarea className={`${fieldClass} min-h-24 resize-none`} name="reason" />
            </label>

            <button
              className={`${primaryButtonClass} w-full`}
              disabled={busyId === 'moderation' || ((action === 'global-block' || action === 'global-unblock' || action === 'store-block' || action === 'store-unblock') && !selectedUserId) || ((action === 'store-block-everyone' || action === 'store-unblock-everyone' || action === 'store-suspend' || action === 'store-reactivate' || action === 'store-remove' || action === 'store-block' || action === 'store-unblock') && !selectedStoreId)}
              type="submit"
            >
              {busyId === 'moderation' ? <LoadingSpinner /> : <Unlock className="h-4 w-4" />}
              Apply moderation
            </button>

          </form>
        </MarketSurface>
      </section>
    </PageContainer>
  );
}
