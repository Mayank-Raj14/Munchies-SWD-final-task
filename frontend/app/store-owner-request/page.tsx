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
import { motion, AnimatePresence } from 'framer-motion';

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
          <p className="text-xs font-semibold text-foreground-muted">Checking seller credentials...</p>
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


  const approvedRequest = requests.find((request) => request.status === 'APPROVED');
  const pendingRequest = requests.find((request) => request.status === 'PENDING');
  const rejectedRequest = requests.find((request) => request.status === 'REJECTED');
  const firstStore = stores[0];
  const canSubmit = !pendingRequest && !approvedRequest;

  return (
    <PageContainer size="wide">
      <SectionHeader description="Submit canteen details to student affairs and canteens admin review panel." title="Become a Seller" />
      
      <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form request container */}
        <MarketSurface className="overflow-hidden h-fit shadow-card border border-border glass-panel">
          <div className="border-b border-border bg-surface-raised p-5 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.06),transparent_35%)] pointer-events-none" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-contrast shadow-subtle">
              <StoreIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-3.5 text-base font-extrabold text-foreground leading-tight">Onboarding Request</h2>
            <p className="mt-1 text-xs text-foreground-muted font-medium">Verify your hostel block location details.</p>
          </div>
          
          <div className="p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className={labelClass}>Hostel Block</span>
                <SelectShell>
                  <select className={selectClass} name="hostelId" required disabled={!canSubmit}>
                    <option value="">Select hostel block</option>
                    {hostels.map((hostel) => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name}
                      </option>
                    ))}
                  </select>
                </SelectShell>
              </label>
              
              <label className="block">
                <span className={labelClass}>Store Name</span>
                <input
                  className={fieldClass}
                  name="storeName"
                  minLength={2}
                  placeholder="Example: Night Canteen"
                  required
                  disabled={!canSubmit}
                />
              </label>
              
              <label className="block">
                <span className={labelClass}>Room / Stall Number</span>
                <input
                  className={fieldClass}
                  name="roomNumber"
                  placeholder="Example: B-214"
                  required
                  disabled={!canSubmit}
                />
              </label>
              
              <button
                className={`${primaryButtonClass} w-full mt-2 elevated-hover`}
                disabled={isSubmitting || !canSubmit}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4" />
                    Submitting...
                  </>
                ) : approvedRequest ? (
                  'Seller access active'
                ) : pendingRequest ? (
                  'Verification pending'
                ) : rejectedRequest ? (
                  'Retry application'
                ) : (
                  'Submit canteen request'
                )}
              </button>
            </form>
            
            <AnimatePresence>
              {message ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4"
                >
                  <Notice
                    tone={
                      message.includes('failed') || message.includes('Unable') ? 'danger' : 'success'
                    }
                  >
                    {message}
                  </Notice>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </MarketSurface>

        {/* Visual timeline request flow */}
        <MarketSurface className="p-5 sm:p-6 shadow-card border border-border glass-panel">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4.5 mb-5">
            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Merchant Launch Journey</h2>
            <span className="rounded-lg border border-border bg-surface-raised px-2.5 py-0.75 text-[10px] font-bold text-foreground-secondary shadow-subtle uppercase">
              {requests.length} Application{requests.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-5">
            {[
              { icon: HelpCircle, label: '1. Apply', text: 'Register store location details.' },
              { icon: Clock3, label: '2. Review', text: 'Admin review and credentials check.' },
              { icon: CheckCircle2, label: '3. Launch', text: 'Onboarding tools unlocked.' },
              { icon: PackagePlus, label: '4. Products', text: 'Add canteen inventory.' },
              { icon: Store, label: '5. Orders', text: 'Receive customer bookings.' },
            ].map((step, idx) => {
              const Icon = step.icon;
              const isApproved = Boolean(approvedRequest);
              const isActiveStep = idx === 0 || (idx === 1 && pendingRequest) || (idx > 1 && isApproved);

              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28, delay: idx * 0.06 }}
                  className={`rounded-xl border p-3.5 transition-all duration-200 ${
                    isActiveStep
                      ? 'border-accent/20 bg-accent-muted/40 shadow-subtle'
                      : 'border-border bg-surface-raised/40 opacity-55'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${isActiveStep ? 'text-accent' : 'text-foreground-faint'}`} aria-hidden="true" />
                  <p className="mt-2.5 text-xs font-bold text-foreground leading-tight">{step.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted font-medium">{step.text}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Conditional success alerts */}
          <AnimatePresence>
            {approvedRequest ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="mt-5 rounded-2xl border border-accent/25 bg-accent-muted/30 p-5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_10%,transparent),0_8px_24px_-8px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Your store application is approved!</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary font-medium">
                      {firstStore
                        ? `Congratulations! ${firstStore.name} is now live and listed inside the campus marketplace. Start managing items, updating stock counts, and collecting student bookings.`
                        : 'Your application is approved. Onboarding tools are unlocked, and your store will sync into the canteens registry momentarily.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {firstStore ? (
                      <Link className={`${secondaryButtonClass} h-9 text-xs rounded-xl shadow-sm`} href={`/stores/${firstStore.id}`}>
                        Visit Live Shop
                      </Link>
                    ) : null}
                    <Link className={`${secondaryButtonClass} h-9 text-xs rounded-xl shadow-sm`} href="/store-owner/stores">
                      Configure Stores
                    </Link>
                    <Link className={`${primaryButtonClass} h-9 text-xs rounded-xl shadow-sm inline-flex items-center gap-1`} href="/store-owner/inventory">
                      Manage Inventory
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : pendingRequest ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <Notice tone="warning">
                  Your registration details are currently undergoing verification. Please wait, this console updates live automatically.
                </Notice>
              </motion.div>
            ) : rejectedRequest ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <Notice tone="danger">
                  Your store application was rejected. Please review hostel locations and room numbers and submit an updated application.
                </Notice>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* List of past request applications */}
          {requests.length > 0 ? (
            <div className="mt-5 space-y-3.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Application Registry</h3>
              {requests.map((request) => (
                <motion.article
                  key={request.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm flex items-center justify-between gap-4 transition-all duration-200 hover:border-border-strong hover:shadow-card-hover hover:-translate-y-[1px]"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{request.storeName}</p>
                    <p className="mt-1 text-xs font-semibold text-foreground-secondary">
                      {request.hostel.name} · Room {request.roomNumber}
                    </p>
                  </div>
                  
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-subtle ${
                      request.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : request.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    {request.status}
                  </span>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                description="Submitted onboarding canteen requests will display here in real time."
                icon={Store}
                title="No request history yet"
              />
            </div>
          )}
        </MarketSurface>
      </section>
    </PageContainer>
  );
}
