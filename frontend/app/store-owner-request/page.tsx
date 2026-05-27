'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  HelpCircle,
  PackagePlus,
  Store,
  StoreIcon,
} from 'lucide-react';

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
  selectClass,
  SelectShell,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { ApiError } from '@/services/api';
import { getHostels } from '@/services/hostels';
import {
  createStoreOwnershipRequest,
  getMyStoreOwnershipRequests,
  type StoreOwnershipRequest,
} from '@/services/store-ownership-requests';
import { getMyStores } from '@/services/stores';
import type { Hostel } from '@/types/hostel';
import type { Store as StoreType } from '@/types/store';

export default function StoreOwnerRequestPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthorized, refreshUser } = useRequireAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [requests, setRequests] = useState<StoreOwnershipRequest[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequestData = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }
    try {
      const [hostelData, requestData] = await Promise.all([
        getHostels(),
        getMyStoreOwnershipRequests(),
      ]);
      setHostels(hostelData.hostels);
      setRequests(requestData.requests);
      if (requestData.requests.some((request) => request.status === 'APPROVED')) {
        await refreshUser({ silent: true });
        try {
          const storeData = await getMyStores();
          setStores(storeData.stores);
        } catch {
          setStores([]);
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace('/login');
        return;
      }

      setMessage(error instanceof Error ? error.message : 'Unable to load hostels.');
    }
  }, [isAuthorized, refreshUser, router]);

  useEffect(() => {
    if (isAuthLoading || !isAuthorized) {
      return;
    }

    void loadRequestData();
  }, [isAuthLoading, isAuthorized, loadRequestData]);

  useSyncedRefresh(['ownership', 'hostels'], loadRequestData, { enabled: isAuthorized });

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadRequestData();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [isAuthorized, loadRequestData]);

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

    setMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const data = await createStoreOwnershipRequest({
        hostelId: String(formData.get('hostelId')),
        storeName: String(formData.get('storeName')),
        roomNumber: String(formData.get('roomNumber')),
      });
      setRequests((current) => [data.request, ...current]);
      setMessage('Store ownership request submitted.');
      await refreshUser({ silent: true });
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestRequest = requests[0];
  const approvedRequest = requests.find((request) => request.status === 'APPROVED');
  const pendingRequest = requests.find((request) => request.status === 'PENDING');
  const rejectedRequest = requests.find((request) => request.status === 'REJECTED');
  const firstStore = stores[0];
  const canSubmit = !pendingRequest && !approvedRequest;

  return (
    <PageContainer size="wide">
      <SectionHeader description="Submit store details for admin review." title="Open a store" />
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <MarketSurface className="overflow-hidden">
          <div className="border-b border-border bg-surface-raised p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-contrast">
              <StoreIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Application</h2>
            <p className="mt-1 text-sm text-foreground-muted">Hostel, room, and store name.</p>
          </div>
          <div className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className={labelClass}>Hostel</span>
                <SelectShell>
                  <select className={selectClass} name="hostelId" required>
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
                <span className={labelClass}>Store name</span>
                <input
                  className={fieldClass}
                  name="storeName"
                  minLength={2}
                  placeholder="Example: Night Canteen"
                  required
                />
              </label>
              <label className="block">
                <span className={labelClass}>Room number</span>
                <input
                  className={fieldClass}
                  name="roomNumber"
                  placeholder="Example: B-214"
                  required
                />
              </label>
              <button
                className={`${primaryButtonClass} w-full`}
                disabled={isSubmitting || !canSubmit}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    Submitting
                  </>
                ) : approvedRequest ? (
                  'Seller tools unlocked'
                ) : pendingRequest ? (
                  'Review in progress'
                ) : rejectedRequest ? (
                  'Retry application'
                ) : (
                  'Submit request'
                )}
              </button>
            </form>
            {message ? (
              <div className="mt-4">
                <Notice
                  tone={
                    message.includes('failed') || message.includes('Unable') ? 'danger' : 'success'
                  }
                >
                  {message}
                </Notice>
              </div>
            ) : null}
          </div>
        </MarketSurface>

        <MarketSurface className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your requests</h2>
            </div>
            <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-medium text-foreground-muted">
              {requests.length} total
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {[
              { icon: HelpCircle, label: 'Apply', text: 'Send store details' },
              { icon: Clock3, label: 'Review', text: 'Admin checks fit' },
              { icon: CheckCircle2, label: 'Launch', text: 'Seller tools unlock' },
              { icon: PackagePlus, label: 'Products', text: 'Add inventory' },
              { icon: StoreIcon, label: 'Orders', text: 'Receive orders' },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  className={`rounded-lg border p-3 ${
                    approvedRequest
                      ? 'border-accent/30 bg-accent-muted'
                      : latestRequest
                        ? 'border-border bg-surface-raised'
                        : 'border-border bg-surface'
                  }`}
                  key={step.label}
                >
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="mt-1 text-xs font-medium text-foreground-muted">{step.text}</p>
                </div>
              );
            })}
          </div>
          {approvedRequest ? (
            <div className="mt-5 rounded-xl border border-accent/25 bg-accent-muted p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Your seller access is active
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
                    {firstStore
                      ? `${firstStore.name} is live in the marketplace. You can manage the store, add products, and open the seller dashboard.`
                      : 'Your request is approved. Seller tools are unlocked and your store will appear as soon as it finishes syncing.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {firstStore ? (
                    <Link className={secondaryButtonClass} href={`/stores/${firstStore.id}`}>
                      Visit Store
                    </Link>
                  ) : null}
                  <Link className={secondaryButtonClass} href="/store-owner/stores">
                    Manage Store
                  </Link>
                  <Link className={primaryButtonClass} href="/store-owner/inventory">
                    Open Seller Dashboard
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          ) : pendingRequest ? (
            <Notice tone="warning">
              Your request is being reviewed. This page refreshes automatically while you wait.
            </Notice>
          ) : rejectedRequest ? (
            <Notice tone="danger">
              Your last request was rejected. Update the details and submit again when you are
              ready.
            </Notice>
          ) : null}
          {requests.length > 0 ? (
            <div className="mt-5 space-y-3">
              {requests.map((request) => (
                <article
                  className="rounded-lg border border-border bg-surface p-4 shadow-sm"
                  key={request.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{request.storeName}</p>
                      <p className="mt-1 text-xs font-medium text-foreground-secondary">
                        {request.hostel.name} - Room {request.roomNumber}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        request.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : request.status === 'REJECTED'
                            ? 'bg-red-500/10 text-red-300'
                            : 'bg-amber-500/10 text-amber-200'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {request.status === 'APPROVED' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link className={secondaryButtonClass} href="/store-owner/stores">
                        Manage Store
                      </Link>
                      <Link className={primaryButtonClass} href="/store-owner/inventory">
                        Add Products
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                description="Submitted applications appear here."
                icon={Store}
                title="No requests yet"
              />
            </div>
          )}
        </MarketSurface>
      </section>
    </PageContainer>
  );
}
