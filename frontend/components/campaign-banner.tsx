'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flame } from 'lucide-react';
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
  return `₹${Number(campaign.value).toFixed(0)} OFF`;
};

const formatExpiry = (endsAt: string) => {
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) return `${diffDays}d ${diffHrs % 24}h left`;
  if (diffHrs > 0) return `${diffHrs}h ${diffMins}m left`;
  if (diffMins > 0) return `${diffMins}m left`;
  return 'Ending soon';
};

const CAMPAIGN_PALETTES = [
  { gradient: 'from-orange-950 via-zinc-900 to-zinc-950', accentFrom: '#f97316', accentTo: '#fb923c', patternColor: 'rgba(249,115,22,0.07)', icon: '🔥' },
  { gradient: 'from-rose-950 via-zinc-900 to-zinc-950', accentFrom: '#e11d48', accentTo: '#fb7185', patternColor: 'rgba(225,29,72,0.07)', icon: '⚡' },
  { gradient: 'from-emerald-950 via-zinc-900 to-zinc-950', accentFrom: '#10b981', accentTo: '#34d399', patternColor: 'rgba(16,185,129,0.07)', icon: '🎁' },
  { gradient: 'from-sky-950 via-zinc-900 to-zinc-950', accentFrom: '#0ea5e9', accentTo: '#38bdf8', patternColor: 'rgba(14,165,233,0.07)', icon: '🚀' },
  { gradient: 'from-amber-950 via-zinc-900 to-zinc-950', accentFrom: '#d97706', accentTo: '#fbbf24', patternColor: 'rgba(217,119,6,0.07)', icon: '🏷️' },
];

type SlideData = {
  id: string;
  headline: string;
  sub: string;
  pill: string;
  gradient: string;
  accentFrom: string;
  accentTo: string;
  icon: string;
  patternColor: string;
  campaign: CampaignWithStore;
};

function buildSlides(campaigns: CampaignWithStore[]): SlideData[] {
  return campaigns.map((c, i) => {
    const palette = CAMPAIGN_PALETTES[i % CAMPAIGN_PALETTES.length];
    const discount = formatDiscount(c);
    const minOrder = Number(c.minOrderValue) > 0
      ? ` on orders above ₹${Number(c.minOrderValue).toFixed(0)}`
      : '';

    return {
      id: c.id,
      headline: `${discount}\nat ${c.store.name}`,
      sub: `Use code ${c.code} to save${minOrder}`,
      pill: discount,
      gradient: palette.gradient,
      accentFrom: palette.accentFrom,
      accentTo: palette.accentTo,
      icon: palette.icon,
      patternColor: palette.patternColor,
      campaign: c,
    };
  });
}

function DotGrid({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

function TimeChip({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState(() => formatExpiry(endsAt));

  useEffect(() => {
    const id = setInterval(() => setLabel(formatExpiry(endsAt)), 30_000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white/70 backdrop-blur-sm">
      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

export function CampaignBanner() {
  const [campaigns, setCampaigns] = useState<CampaignWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getActiveCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setIsLoading(false));
  }, []);

  const slides = buildSlides(campaigns);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length, next]);

  if (isLoading) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
        style={{ height: 'clamp(200px, 38vw, 400px)' }}
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-24 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/50"
        style={{ height: 'clamp(120px, 20vw, 180px)' }}
      >
        <p className="text-sm font-medium text-zinc-500">No campaigns to show</p>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl"
      style={{ height: 'clamp(220px, 40vw, 420px)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
        >
          <DotGrid color={slide.patternColor} />

          <div
            className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${slide.accentFrom}33 0%, transparent 70%)` }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${slide.accentTo}22 0%, transparent 70%)` }}
          />

          <div className="relative flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between">
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tracking-widest"
                style={{
                  background: `linear-gradient(135deg, ${slide.accentFrom}, ${slide.accentTo})`,
                  color: '#fff',
                  boxShadow: `0 0 16px ${slide.accentFrom}55`,
                }}
              >
                <Flame className="h-3 w-3" aria-hidden="true" />
                {slide.campaign.type === 'PERCENTAGE' ? 'DISCOUNT' : 'FLAT DEAL'}
              </motion.span>

              <TimeChip endsAt={slide.campaign.endsAt} />
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.45 }}
              >
                <div className="mb-2 text-3xl sm:text-4xl leading-none select-none" aria-hidden="true">
                  {slide.icon}
                </div>
                <h2
                  className="whitespace-pre-line font-black leading-none tracking-tight text-white"
                  style={{
                    fontSize: 'clamp(1.6rem, 5vw, 3.25rem)',
                    textShadow: '0 2px 20px rgba(0,0,0,0.4)',
                  }}
                >
                  {slide.headline}
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="flex flex-wrap items-center gap-2"
              >
                <p className="text-sm font-medium text-white/60 sm:text-base max-w-xs">
                  {slide.sub}
                </p>
                {slide.campaign.code ? (
                  <span
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur-sm sm:text-sm"
                    style={{ boxShadow: `0 0 12px ${slide.accentFrom}33` }}
                  >
                    {slide.campaign.code}
                  </span>
                ) : null}
              </motion.div>
            </div>

            <div className="flex items-end justify-between">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 300 }}
              >
                <span
                  className="rounded-xl px-4 py-2 text-sm font-black text-white sm:text-base"
                  style={{
                    background: `linear-gradient(135deg, ${slide.accentFrom}cc, ${slide.accentTo}cc)`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${slide.accentFrom}44`,
                    boxShadow: `0 4px 20px ${slide.accentFrom}44`,
                  }}
                >
                  {slide.pill}
                </span>
              </motion.div>

              {slides.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Go to slide ${idx + 1}`}
                      type="button"
                      onClick={() => goTo(idx)}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: idx === current ? 24 : 6,
                        height: 6,
                        background:
                          idx === current
                            ? `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})`
                            : 'rgba(255,255,255,0.25)',
                        boxShadow: idx === current ? `0 0 8px ${slide.accentFrom}` : 'none',
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 ? (
        <>
          <button
            aria-label="Previous slide"
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/60 active:scale-90 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            aria-label="Next slide"
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/60 active:scale-90 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      ) : null}

      {slides.length > 1 && !isPaused ? (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          <motion.div
            key={`${slide.id}-progress`}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})` }}
          />
        </div>
      ) : null}
    </div>
  );
}