'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

import {
  EmptyState,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  StatCardSkeleton,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { getStoreAnalytics } from '@/services/analytics';
import { getMyStores } from '@/services/stores';
import type { StoreAnalytics } from '@/types/analytics';
import type { Store } from '@/types/store';
const ACTIVE_STORE_KEY = 'munchies_active_store_id';

const money = (value: number) => `Rs. ${value.toFixed(2)}`;

export default function StoreOwnerAnalyticsPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [threshold, setThreshold] = useState(0);
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    void getMyStores().then((data) => {
      setStores(data.stores);
      const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_STORE_KEY) : '';
      setStoreId(
        data.stores.some((store) => store.id === persisted) ? (persisted ?? '') : (data.stores[0]?.id ?? ''),
      );
      setLoading(!data.stores.length);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to load stores.');
      setLoading(false);
    });
  }, [authLoading, isAuthorized]);

  useEffect(() => {
    if (!storeId) return;
    window.localStorage.setItem(ACTIVE_STORE_KEY, storeId);
    setLoading(true);
    setError('');
    void getStoreAnalytics(storeId, threshold)
      .then((data) => setAnalytics(data.analytics))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load analytics.'))
      .finally(() => setLoading(false));
  }, [storeId, threshold]);

  useSyncedRefresh(['analytics', 'bookings', 'inventory', 'stores'], () => {
    if (storeId) {
      void getStoreAnalytics(storeId, threshold)
        .then((data) => setAnalytics(data.analytics))
        .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load analytics.'));
    }
  }, { enabled: isAuthorized });

  if (authLoading || !isAuthorized) return null;

  return (
    <PageContainer size="wide">
      <SectionHeader title="Store analytics" description="Revenue, sales, bookings, and low-stock alerts." />
      {error ? <div className="mt-6"><Notice tone="danger">{error}</Notice></div> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select 
         title="Store selector"
         className="rounded-xl border border-border bg-surface px-3 py-2.5 text-foreground shadow-subtle" onChange={(e) => setStoreId(e.target.value)} value={storeId} disabled={loading}>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
        <input 
        title="Threshold"
        placeholder="Threshold"
        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-foreground shadow-subtle" min={0} onChange={(e) => setThreshold(Number(e.target.value))} type="number" value={threshold} />
      </div>
      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}</div>
      ) : !storeId ? (
        <div className="mt-6"><EmptyState icon={BarChart3} title="No stores" description="Create a store to see analytics." /></div>
      ) : analytics ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total revenue', money(analytics.revenue.total)],
              ['Weekly revenue', money(analytics.revenue.weekly)],
              ['Monthly revenue', money(analytics.revenue.monthly)],
              ['Low stock alerts', String(analytics.lowStockItems.length)],
              ['Most sold item', analytics.mostSoldItem ? `${analytics.mostSoldItem.item.name} (${analytics.mostSoldItem.quantity})` : 'No sales'],
              ['Least sold item', analytics.leastSoldItem ? `${analytics.leastSoldItem.item.name} (${analytics.leastSoldItem.quantity})` : 'No sales'],
            ].map(([label, value]) => <MarketSurface className="page-fade-in p-5" key={label}><p className="text-sm text-foreground-muted">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p></MarketSurface>)}
          </section>
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <MarketSurface className="page-fade-in p-5"><h2 className="text-lg font-semibold text-foreground">Booking statistics</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(analytics.bookingStatistics).map(([status, count]) => <div className="rounded-xl border border-border bg-surface-raised p-3" key={status}><p className="text-sm text-foreground-muted">{status}</p><p className="text-xl font-semibold text-foreground">{count}</p></div>)}</div></MarketSurface>
            <MarketSurface className="page-fade-in p-5"><h2 className="text-lg font-semibold text-foreground">Low stock alerts</h2><div className="mt-4 space-y-2">{analytics.lowStockItems.length ? analytics.lowStockItems.map((item) => <div className="flex justify-between rounded-xl border border-border bg-surface-raised p-3" key={item.id}><span>{item.name}</span><strong>{item.stock}</strong></div>) : <p className="text-sm text-foreground-muted">No items at or below threshold.</p>}</div></MarketSurface>
          </section>
        </>
      ) : null}
    </PageContainer>
  );
}
