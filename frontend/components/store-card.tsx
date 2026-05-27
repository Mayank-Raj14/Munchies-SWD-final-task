import Link from 'next/link';
import { memo } from 'react';
import { ChevronRight, Clock3, MapPin, PackageCheck, Star, Store } from 'lucide-react';

import { MediaFallback } from '@/components/brand-assets';
import type { Store as StoreType } from '@/types/store';

type StoreCardProps = {
  store: StoreType;
  variant?: 'grid' | 'list';
};

const headerTones = [
  'from-emerald-500/20 via-surface-raised to-surface-muted',
  'from-amber-500/15 via-surface-raised to-surface-muted',
  'from-sky-500/15 via-surface-raised to-surface-muted',
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
      <Link
        href={`/stores/${store.id}`}
        className="group elevated-hover page-fade-in flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-ui hover:border-border-strong hover:shadow-card-hover"
      >
        <div className={`relative h-32 bg-gradient-to-br ${headerTone}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)]" />
          <span className="absolute left-3 top-3 rounded-md bg-canvas/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary backdrop-blur-sm">
            {store.hostel.name}
          </span>
          <div className="absolute inset-x-3 bottom-3">
            <MediaFallback
              className="h-16 rounded-2xl border border-border-subtle bg-canvas/30 backdrop-blur-sm"
              icon="store"
              subtitle={`Room ${store.roomNumber}`}
              title={store.name}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-sm font-bold text-accent shadow-subtle">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">{store.name}</h2>
              <p className="mt-0.5 text-xs text-foreground-muted">Room {store.roomNumber}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-foreground-muted">
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5">
              <Star className="h-3 w-3 text-amber-400" aria-hidden="true" />
              {orderCount > 0 ? 'Popular' : 'New'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5">
              <PackageCheck className="h-3 w-3 text-accent" aria-hidden="true" />
              {itemCount} items
            </span>
          </div>
          <p className="mt-auto pt-3 text-[11px] text-foreground-faint">by {store.owner.name}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/stores/${store.id}`}
      className="group elevated-hover page-fade-in flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card transition-all duration-ui hover:border-border-strong hover:shadow-card-hover sm:gap-4 sm:p-3.5"
    >
      <div
        className={`relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-accent sm:h-20 sm:w-20 sm:text-xl ${headerTone}`}
      >
        {initial}
        <span className="absolute -bottom-1 -right-1 rounded-md border border-border bg-canvas px-1.5 py-0.5 text-[9px] font-semibold text-foreground-secondary">
          {store.hostel.name.split(' ')[0]}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate text-[15px] font-semibold leading-snug text-foreground sm:text-base">
            {store.name}
          </h2>
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-foreground-faint transition-transform duration-ui group-hover:translate-x-0.5 group-hover:text-accent"
            aria-hidden="true"
          />
        </div>

        <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
          <MapPin className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
          {store.hostel.name} · Room {store.roomNumber}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground-faint">
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5">
            <Store className="h-3 w-3" aria-hidden="true" />
            {categories.length > 0 ? categories.join(', ') : 'Hostel store'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5">
            <Star className="h-3 w-3 text-amber-400" aria-hidden="true" />
            {orderCount > 0 ? `${orderCount} orders` : 'New'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {availableItems > 0 ? `${availableItems} available now` : 'Pickup on campus'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export const StoreCard = memo(StoreCardComponent);