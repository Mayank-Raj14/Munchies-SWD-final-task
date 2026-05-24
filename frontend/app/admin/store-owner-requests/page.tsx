'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  divideClass,
  dangerButtonClass,
  primaryButtonClass,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { ApiError } from '@/services/api';
import {
  approveStoreOwnershipRequest,
  getPendingStoreOwnershipRequests,
  rejectStoreOwnershipRequest,
} from '@/services/store-ownership-requests';

type StoreOwnershipRequest = {
  id: string;
  storeName: string;
  roomNumber: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  hostel: {
    name: string;
  };
};

export default function AdminStoreOwnerRequestsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth(['ADMIN']);
  const [requests, setRequests] = useState<StoreOwnershipRequest[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRequests = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsLoading(true);
      }
      setMessage('');

      try {
        const data = await getPendingStoreOwnershipRequests();
        setRequests(data.requests);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          return;
        }

        if (error instanceof ApiError && error.status === 403) {
          setMessage('You do not have permission to view admin requests.');
          return;
        }

        setMessage(error instanceof Error ? error.message : 'Unable to load requests.');
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

    void loadRequests();
  }, [isAuthLoading, loadRequests, user]);

  useSyncedRefresh(['ownership'], () => loadRequests({ silent: true }), {
    enabled: !isAuthLoading && Boolean(user),
  });

  const reviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (busyId) {
      return;
    }

    setBusyId(requestId);
    setMessage('');

    try {
      if (action === 'approve') {
        await approveStoreOwnershipRequest(requestId);
      } else {
        await rejectStoreOwnershipRequest(requestId);
      }

      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
      setMessage(`Request ${action}d.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <section>
        <SectionHeader description="Approve or reject seller applications." title="Approvals" />

        {message ? (
          <div className="mt-6">
            <Notice
              tone={
                message.includes('permission') || message.includes('failed') ? 'danger' : 'success'
              }
            >
              {message}
            </Notice>
          </div>
        ) : null}

        <MarketSurface className="mt-6 overflow-hidden">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[0, 1, 2].map((item) => (
                <div className="h-24 animate-pulse rounded-lg bg-surface-raised" key={item} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6">
              <EmptyState
                description="New seller applications will appear here for review."
                icon={ShieldCheck}
                title="No pending requests"
              />
            </div>
          ) : (
            <div className={divideClass}>
              {requests.map((request) => (
                <article
                  className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center"
                  key={request.id}
                >
                  <div>
                    <h2 className="font-semibold text-foreground">{request.storeName}</h2>
                    <p className="mt-1 text-sm font-medium text-foreground-secondary">
                      {request.hostel.name} - Room {request.roomNumber}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground-secondary">
                      {request.user.name} - {request.user.email}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className={primaryButtonClass}
                      disabled={busyId === request.id}
                      onClick={() => void reviewRequest(request.id, 'approve')}
                      type="button"
                    >
                      {busyId === request.id ? (
                        <>
                          <LoadingSpinner />
                          Saving
                        </>
                      ) : (
                        'Approve'
                      )}
                    </button>
                    <button
                      className={dangerButtonClass}
                      disabled={busyId === request.id}
                      onClick={() => void reviewRequest(request.id, 'reject')}
                      type="button"
                    >
                      Reject
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
