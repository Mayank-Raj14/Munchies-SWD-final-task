'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

import { EmptyState, MarketSurface, Notice, PageContainer, SectionHeader } from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getUserAnalytics } from '@/services/analytics';
import type { UserAnalytics } from '@/types/analytics';

const money = (value: number) => `Rs. ${value.toFixed(2)}`;

export default function AnalyticsPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAuth(['USER', 'STORE_OWNER', 'ADMIN']);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    void getUserAnalytics()
      .then((data) => setAnalytics(data.analytics))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load analytics.'))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthorized]);

  if (authLoading || !isAuthorized) return null;
  const maxMonth = Math.max(1, ...Object.values(analytics?.monthlySpending ?? {}));

  return (
    <PageContainer size="wide">
      <SectionHeader title="Analytics" description="Your spending and order patterns." />
      {error ? <div className="mt-6"><Notice tone="danger">{error}</Notice></div> : null}
      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <MarketSurface className="h-32 animate-pulse" key={i} />)}</div>
      ) : analytics ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total spending', money(analytics.totalSpending)],
              ['Total bookings', String(analytics.totalBookings)],
              ['Top store', analytics.favoriteStore?.name ?? 'No completed orders'],
              ['Top item', analytics.favoriteItem?.name ?? 'No completed orders'],
            ].map(([label, value]) => <MarketSurface className="p-5" key={label}><p className="text-sm text-foreground-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{value}</p></MarketSurface>)}
          </section>
          <MarketSurface className="mt-6 p-5">
            <h2 className="text-lg font-semibold text-foreground">Monthly spending</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(analytics.monthlySpending).length ? Object.entries(analytics.monthlySpending).map(([month, value]) => (
                <div className="grid gap-2 sm:grid-cols-[8rem_1fr_7rem] sm:items-center" key={month}>
                  <span className="text-sm font-medium text-foreground-secondary">{month}</span>
                  <span className="h-3 rounded-full bg-accent" style={{ width: `${Math.max(6, (value / maxMonth) * 100)}%` }} />
                  <span className="text-sm font-semibold text-foreground">{money(value)}</span>
                </div>
              )) : <EmptyState icon={BarChart3} title="No spending yet" description="Completed orders will appear here." />}
            </div>
          </MarketSurface>
        </>
      ) : null}
    </PageContainer>
  );
}
