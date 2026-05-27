'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Home,
  Mail,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string | null;
  user: {
    id?: string;
    name: string;
    email: string;
  };
  hostel: {
    id?: string;
    name: string;
  };
};

type QueueSort = 'newest' | 'oldest' | 'hostel';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not reviewed';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const statusClass = {
  APPROVED: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20',
  REJECTED: 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20',
};

export default function AdminStoreOwnerRequestsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth(['ADMIN']);
  const [requests, setRequests] = useState<StoreOwnershipRequest[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<QueueSort>('newest');

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

      await loadRequests({ silent: true });
      setMessage(`Request ${action}d.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed.');
    } finally {
      setBusyId(null);
    }
  };

  const visibleRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? requests.filter((request) =>
          [
            request.storeName,
            request.roomNumber,
            request.hostel.name,
            request.user.name,
            request.user.email,
          ]
            .join(' ')
            .toLowerCase()
            .includes(term),
        )
      : requests;

    return [...filtered].sort((a, b) => {
      if (sort === 'hostel') {
        return a.hostel.name.localeCompare(b.hostel.name);
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [query, requests, sort]);

  return (
    <PageContainer size="wide">
      <section>
        <SectionHeader
          description="Review seller applications with context, confidence signals, and low-noise metadata."
          title="Seller approvals"
        />

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

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Pending review', value: requests.length, icon: CalendarClock },
            { label: 'Approved creates store', value: 'Auto', icon: CheckCircle2 },
            { label: 'Rejected can retry', value: 'Clean', icon: XCircle },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <MarketSurface className="p-4" key={metric.label}>
                <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                <p className="mt-3 text-2xl font-semibold text-foreground">{metric.value}</p>
                <p className="mt-1 text-xs font-medium text-foreground-muted">{metric.label}</p>
              </MarketSurface>
            );
          })}
        </div>

        <MarketSurface className="mt-4 overflow-hidden">
          <div className="border-b border-border-subtle bg-surface-raised/60 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Seller request queue</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Screen applications, approve storefront creation, and keep secondary data tucked
                  away.
                </p>
              </div>
              <span className="w-fit rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground-secondary">
                {visibleRequests.length} shown
              </span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
              <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-border bg-canvas px-3 transition-all duration-ui focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10">
                <Search className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                <span className="sr-only">Search requests</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search store, owner, hostel..."
                  value={query}
                />
              </label>
              <select
                className="h-10 rounded-xl border border-border bg-canvas px-3 text-sm font-medium text-foreground outline-none transition-all duration-ui focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                onChange={(event) => setSort(event.target.value as QueueSort)}
                value={sort}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="hostel">Hostel A-Z</option>
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[0, 1, 2].map((item) => (
                <div className="h-24 animate-pulse rounded-lg bg-surface-raised" key={item} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6">
              <EmptyState
                description="New seller applications will appear here with applicant, hostel, room, and review metadata."
                icon={ShieldCheck}
                title="No pending requests"
              />
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="p-6">
              <EmptyState
                description="No applications match that search. Clear the query to return to the full queue."
                icon={Search}
                title="No matching requests"
              />
            </div>
          ) : (
            <div className={divideClass}>
              {visibleRequests.map((request) => {
                const status = request.status ?? 'PENDING';

                return (
                  <article
                    className="grid gap-5 p-4 transition-colors duration-ui hover:bg-surface-hover sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start"
                    key={request.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="min-w-0 truncate text-base font-semibold text-foreground">
                          {request.storeName}
                        </h2>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass[status]}`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 md:grid-cols-3">
                        <div className="rounded-xl border border-border-subtle bg-surface-raised/60 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
                            <UserRound className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                            Applicant
                          </p>
                          <p className="mt-2 truncate text-sm font-semibold text-foreground">
                            {request.user.name}
                          </p>
                          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-foreground-muted">
                            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{request.user.email}</span>
                          </p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-raised/60 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
                            <Building2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                            Location
                          </p>
                          <p className="mt-2 truncate text-sm font-semibold text-foreground">
                            {request.hostel.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
                            <Home className="h-3.5 w-3.5" aria-hidden="true" />
                            Room {request.roomNumber}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-raised/60 p-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
                            <CalendarClock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                            Submitted
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {formatDate(request.createdAt)}
                          </p>
                          <p className="mt-0.5 text-xs text-foreground-muted">
                            Awaiting admin decision
                          </p>
                        </div>
                      </div>
                      <details className="group mt-3 rounded-xl border border-border-subtle bg-canvas/45">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-foreground-secondary marker:hidden">
                          Application details
                          <ChevronDown
                            className="h-4 w-4 text-foreground-muted transition-transform duration-ui group-open:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="grid gap-2 border-t border-border-subtle px-3 py-3 text-xs text-foreground-muted sm:grid-cols-3">
                          <span className="truncate">Request ID: {request.id}</span>
                          <span className="truncate">
                            User ID: {request.user.id ?? 'Not provided'}
                          </span>
                          <span className="truncate">
                            Hostel ID: {request.hostel.id ?? 'Not provided'}
                          </span>
                          <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                          <span className="sm:col-span-2">
                            Linked records: applicant profile, hostel, and store created after
                            approval.
                          </span>
                        </div>
                      </details>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                      <button
                        className={`${primaryButtonClass} min-w-28`}
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
                        className={`${dangerButtonClass} min-w-28`}
                        disabled={busyId === request.id}
                        onClick={() => void reviewRequest(request.id, 'reject')}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </MarketSurface>
      </section>
    </PageContainer>
  );
}
