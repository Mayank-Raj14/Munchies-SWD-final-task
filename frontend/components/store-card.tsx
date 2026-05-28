'use client';

import Link from 'next/link';
import { memo } from 'react';
import { ChevronRight, Clock3, MapPin, PackageCheck, Star, Store } from 'lucide-react';
import { motion } from 'framer-motion';

import { MediaFallback } from '@/components/brand-assets';
import type { Store as StoreType } from '@/types/store';

type StoreCardProps = {
  store: StoreType;
  variant?: 'grid' | 'list';
};

const headerTones = [
  'from-emerald-500/20 via-surface-raised/80 to-surface',
  'from-orange-500/15 via-surface-raised/80 to-surface',
  'from-sky-500/15 via-surface-raised/80 to-surface',
];

function getHeaderTone(name: string) {
  return headerTones[name.charCodeAt(0) % headerTones.length];
}

function StoreCardComponent({ store, variant = 'list' }: StoreCardProps) {
  const initial = store.name.trim().charAt(0).toUpperCase() || 'M';
  const headerTone = getHeaderTone(store.name);
  const itemCount = store._count?.items ?? store.items?.length ?? 0;
  const orderCount = store._count?.bookings ?? 0;
  const availableItems =
    store.items?.filter((item) => item.isAvailable && item.stock > 0).length ?? 0;
  const categories = Array.from(
    new Set(store.items?.map((item) => item.category).filter(Boolean)),
  ).slice(0, 2);

  if (variant === 'grid') {
    return (
      <Link href={`/stores/${store.id}`} className="block h-full group">
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card hover:border-border-strong hover:shadow-card-hover"
        >
          {/* Header tone banner with dynamic gradient */}
          <div className={`relative h-28 bg-gradient-to-br ${headerTone} transition-all duration-300 group-hover:opacity-90`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
            <span className="absolute left-3 top-3 rounded-lg border border-white/5 bg-canvas/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground-secondary backdrop-blur-sm shadow-sm">
              {store.hostel.name}
            </span>
            <div className="absolute inset-x-3 bottom-3">
              <MediaFallback
                className="h-14 rounded-xl border border-border-subtle bg-canvas/20 backdrop-blur-md shadow-sm"
                icon="store"
                subtitle={`Room ${store.roomNumber}`}
                title={store.name}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-xs font-bold text-accent shadow-subtle group-hover:bg-accent-muted group-hover:border-accent/20 transition-colors">
                {initial}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
                  {store.name}
                </h2>
                <p className="mt-0.5 text-xs text-foreground-muted font-medium">Room {store.roomNumber}</p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] text-foreground-muted font-semibold">
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2 py-0.75 shadow-sm">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                {orderCount > 0 ? 'Popular' : 'New'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2 py-0.75 shadow-sm">
                <PackageCheck className="h-3 w-3 text-accent" aria-hidden="true" />
                {itemCount} items
              </span>
            </div>
            
            <p className="mt-auto pt-4 text-[10px] text-foreground-faint font-semibold">
              by {store.owner.name}
            </p>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/stores/${store.id}`} className="block group">
      <motion.div
        whileHover={{ y: -3, scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="flex gap-4 rounded-2xl border border-border bg-surface p-3.5 shadow-card hover:border-border-strong hover:shadow-card-hover"
      >
        <div
          className={`relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base font-extrabold text-accent sm:h-18 sm:w-18 shadow-sm ${headerTone}`}
        >
          {initial}
          <span className="absolute -bottom-1 -right-1 rounded-md border border-border bg-canvas px-1.5 py-0.5 text-[9px] font-bold text-foreground-secondary shadow-subtle uppercase tracking-wider">
            {store.hostel.name.split(' ')[0]}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-sm font-bold leading-tight text-foreground sm:text-base group-hover:text-accent transition-colors">
              {store.name}
            </h2>
            <ChevronRight
              className="mt-0.5 h-4 w-4 shrink-0 text-foreground-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
              aria-hidden="true"
            />
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted font-medium">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            {store.hostel.name} · Room {store.roomNumber}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-foreground-faint font-semibold">
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2 py-0.75 shadow-sm">
              <Store className="h-3 w-3" aria-hidden="true" />
              {categories.length > 0 ? categories.join(', ') : 'Hostel store'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2 py-0.75 shadow-sm">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" aria-hidden="true" />
              {orderCount > 0 ? `${orderCount} orders` : 'New'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {availableItems > 0 ? `${availableItems} in stock` : 'Campus pickup'}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export const StoreCard = memo(StoreCardComponent);