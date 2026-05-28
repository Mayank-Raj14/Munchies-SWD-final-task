'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Heart, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  ChartSkeleton,
  EmptyState,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  StatCardSkeleton,
} from '@/components/marketplace-ui';
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
      <SectionHeader title="Your Analytics" description="Your spending history, ordering trends, and canteen patterns." />
      
      {error ? (
        <div className="mt-6">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      
      {loading ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="mt-6">
            <ChartSkeleton />
          </div>
        </>
      ) : analytics ? (
        <>
          {/* Staggered visual cards */}
          <motion.section
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {[
              {
                label: 'Total Spending',
                value: money(analytics.totalSpending),
                desc: 'All completed bookings',
                icon: DollarSign,
                color: 'text-emerald-400 bg-emerald-500/10',
              },
              {
                label: 'Total Orders',
                value: String(analytics.totalBookings),
                desc: 'Campus canteens placed',
                icon: ShoppingBag,
                color: 'text-accent bg-accent/10',
              },
              {
                label: 'Favorite Store',
                value: analytics.favoriteStore?.name ?? 'No orders yet',
                desc: 'Most frequent merchant',
                icon: Heart,
                color: 'text-rose-400 bg-rose-500/10',
              },
              {
                label: 'Top Purchased Item',
                value: analytics.favoriteItem?.name ?? 'No orders yet',
                desc: 'Your favorite dish selection',
                icon: TrendingUp,
                color: 'text-sky-400 bg-sky-500/10',
              },
            ].map((card) => {
              const CardIcon = card.icon;
              return (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 20 } },
                  }}
                  key={card.label}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card hover:border-border-strong transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-secondary">{card.label}</p>
                    <div className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg shadow-sm border border-white/5 ${card.color}`}>
                      <CardIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-2.5 text-xl font-black text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-foreground-faint">{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.section>

          {/* Monthly spending bar graphs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="page-fade-in mt-6"
          >
            <MarketSurface className="p-5 sm:p-6 shadow-card">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-4 mb-5">
                <BarChart3 className="h-4.5 w-4.5 text-accent" />
                <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Monthly Spending</h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(analytics.monthlySpending).length ? (
                  Object.entries(analytics.monthlySpending).map(([month, value]) => {
                    const widthPercent = maxMonth > 0 ? (value / maxMonth) * 100 : 0;
                    return (
                      <div className="grid gap-2.5 sm:grid-cols-[100px_1fr_100px] sm:items-center" key={month}>
                        <span className="text-xs font-bold text-foreground-secondary">{month}</span>
                        
                        <div className="relative h-4 rounded-full bg-surface-raised overflow-hidden border border-border-subtle shadow-inner">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(4, widthPercent)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                            className="block h-full rounded-full bg-gradient-to-r from-accent/80 to-accent shadow-subtle"
                          />
                        </div>
                        
                        <span className="text-xs font-bold text-foreground sm:text-right">{money(value)}</span>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No completed orders yet"
                    description="Spending history charts will render automatically after you place your first order."
                  />
                )}
              </div>
            </MarketSurface>
          </motion.div>
        </>
      ) : null}
    </PageContainer>
  );
}
