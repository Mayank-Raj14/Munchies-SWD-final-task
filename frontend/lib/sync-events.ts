'use client';

import { useEffect, useRef } from 'react';

export type SyncDomain =
  | 'all'
  | 'auth'
  | 'bookings'
  | 'cart'
  | 'analytics'
  | 'campaigns'
  | 'hostels'
  | 'inventory'
  | 'ownership'
  | 'stores';

const SYNC_EVENT = 'munchies-data-changed';
const SYNC_STORAGE_KEY = 'munchies_sync_tick';

type SyncPayload = {
  domains: SyncDomain[];
  timestamp: number;
};

const intersects = (changed: SyncDomain[], watched: SyncDomain[]) => {
  return (
    changed.includes('all') ||
    watched.includes('all') ||
    changed.some((domain) => watched.includes(domain))
  );
};

export const notifyDataChanged = (domains: SyncDomain | SyncDomain[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: SyncPayload = {
    domains: Array.isArray(domains) ? domains : [domains],
    timestamp: Date.now(),
  };

  window.dispatchEvent(new CustomEvent<SyncPayload>(SYNC_EVENT, { detail: payload }));

  if (payload.domains.includes('auth') || payload.domains.includes('all')) {
    window.dispatchEvent(new Event('munchies-auth-refresh-requested'));
  }

  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
};

export const useSyncedRefresh = (
  watchedDomains: SyncDomain[],
  refresh: () => void | Promise<void>,
  options: { enabled?: boolean; refreshOnFocus?: boolean } = {},
) => {
  const refreshRef = useRef(refresh);
  const watchedRef = useRef(watchedDomains);
  const enabled = options.enabled ?? true;
  const refreshOnFocus = options.refreshOnFocus ?? true;
  const watchedKey = watchedDomains.join('|');

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    watchedRef.current = watchedDomains;
  }, [watchedKey, watchedDomains]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timer: number | null = null;

    const schedule = () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        void refreshRef.current();
      }, 120);
    };

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<SyncPayload>).detail;

      if (!detail || intersects(detail.domains, watchedRef.current)) {
        schedule();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SYNC_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const detail = JSON.parse(event.newValue) as SyncPayload;

        if (intersects(detail.domains, watchedRef.current)) {
          schedule();
        }
      } catch {
        schedule();
      }
    };

    const onFocus = () => {
      if (refreshOnFocus && document.visibilityState === 'visible') {
        schedule();
      }
    };

    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, refreshOnFocus, watchedKey]);
};
