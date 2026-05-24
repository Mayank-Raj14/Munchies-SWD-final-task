import Link from 'next/link';
import { ChevronRight, Clock3, MapPin, Store } from 'lucide-react';

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

export function StoreCard({ store, variant = 'list' }: StoreCardProps) {
  const initial = store.name.trim().charAt(0).toUpperCase() || 'M';
  const headerTone = getHeaderTone(store.name);

  if (variant === 'grid') {
    return (
      <Link
        href={`/stores/${store.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-ui hover:border-border-strong hover:shadow-card-hover"
      >
        <div className={`relative h-28 bg-gradient-to-br ${headerTone}`}>
          <span className="absolute left-3 top-3 rounded-md bg-canvas/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary backdrop-blur-sm">
            {store.hostel.name}
          </span>
          <div className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-base font-bold text-accent shadow-subtle">
            {initial}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h2 className="truncate text-base font-semibold text-foreground">{store.name}</h2>
          <p className="mt-0.5 text-xs text-foreground-muted">Room {store.roomNumber}</p>
          <p className="mt-2 text-[11px] text-foreground-faint">by {store.owner.name}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/stores/${store.id}`}
      className="group flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card transition-all duration-ui hover:border-border-strong hover:shadow-card-hover sm:gap-4 sm:p-3.5"
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
            Hostel store
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            Pickup on campus
          </span>
        </div>
      </div>
    </Link>
  );
}
