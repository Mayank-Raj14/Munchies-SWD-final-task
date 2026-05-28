'use client';

import { useEffect, useState, useCallback } from 'react';
import { BadgePercent, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { buildApiUrl } from '@/lib/api-url';
import { API_ROUTES } from '@/lib/api-routes';
import { apiFetch, parseApiResponse } from '@/services/api';
import type { Campaign } from '@/types/campaign';

type CampaignWithStore = Campaign & {
  store: { id: string; name: string };
};

const getActiveCampaigns = async (): Promise<CampaignWithStore[]> => {
  const url = buildApiUrl(API_ROUTES.campaigns.active);
  const response = await apiFetch(url);
  const data = await parseApiResponse<{ campaigns: CampaignWithStore[] }>(
    response,
    'Failed to load campaigns',
    { url, method: 'GET' },
  );
  return data.campaigns;
};

const formatDiscount = (campaign: CampaignWithStore) => {
  if (campaign.type === 'PERCENTAGE') {
    return `${Number(campaign.value).toFixed(0)}% OFF`;
  }
  return `Rs. ${Number(campaign.value).toFixed(0)} OFF`;
};

const formatExpiry = (endsAt: string) => {
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) return `Ends in ${diffDays}d`;
  if (diffHrs > 0) return `Ends in ${diffHrs}h`;
  return 'Ending soon';
};

export function CampaignBanner() {
  const [campaigns, setCampaigns] = useState<CampaignWithStore[]>([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getActiveCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setIsLoading(false));
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % campaigns.length);
  }, [campaigns.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  }, [campaigns.length]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (campaigns.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [campaigns.length, next]);

  if (isLoading) {
    return (
      <div className="h-20 animate-pulse rounded-2xl bg-surface-raised border border-border" />
    );
  }

  if (campaigns.length === 0) return null;

  const campaign = campaigns[current];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 via-surface to-surface shadow-card">
      {/* Glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.12),transparent_60%)]" />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
          <Megaphone className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-accent px-2.5 py-0.5 text-xs font-black tracking-wider text-accent-contrast">
                  {formatDiscount(campaign)}
                </span>
                <span className="text-xs font-bold text-foreground-secondary">
                  {campaign.store.name}
                </span>
                {campaign.code ? (
                  <span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                    {campaign.code}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted font-medium">
                {Number(campaign.minOrderValue) > 0 ? (
                  <span>Min order Rs. {Number(campaign.minOrderValue).toFixed(0)}</span>
                ) : null}
                <span className="flex items-center gap-1">
                  <BadgePercent className="h-3 w-3 text-accent/60" aria-hidden="true" />
                  {formatExpiry(campaign.endsAt)}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation (only show if multiple campaigns) */}
        {campaigns.length > 1 ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              aria-label="Previous campaign"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-raised text-foreground-secondary transition-all hover:border-accent/30 hover:text-accent active:scale-90"
              onClick={prev}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-[10px] font-bold text-foreground-muted">
              {current + 1}/{campaigns.length}
            </span>
            <button
              aria-label="Next campaign"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-raised text-foreground-secondary transition-all hover:border-accent/30 hover:text-accent active:scale-90"
              onClick={next}
              type="button"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Progress dots */}
      {campaigns.length > 1 ? (
        <div className="flex justify-center gap-1.5 pb-2.5">
          {campaigns.map((_, index) => (
            <button
              aria-label={`Go to campaign ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === current
                  ? 'w-4 bg-accent'
                  : 'w-1.5 bg-foreground-muted/30 hover:bg-foreground-muted/60'
              }`}
              key={index}
              onClick={() => setCurrent(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}