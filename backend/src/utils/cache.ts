type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const cacheKeys = {
  stores: (input: unknown) => `stores:${JSON.stringify(input)}`,
  store: (storeId: string) => `store:${storeId}`,
  ownerStores: (ownerId: string) => `stores:owner:${ownerId}`,
  campaigns: (storeId: string) => `campaigns:${storeId}`,
  campaignCode: (code: string) => `campaign:code:${code.toUpperCase()}`,
  userAnalytics: (userId: string, input: unknown) => `analytics:user:${userId}:${JSON.stringify(input)}`,
  storeAnalytics: (storeId: string, userId: string, input: unknown) =>
    `analytics:store:${storeId}:user:${userId}:${JSON.stringify(input)}`,
};

export const getCached = async <T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> => {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (entry && entry.expiresAt > now) {
    return entry.value;
  }

  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
};

export const invalidateCache = (patterns: string | string[]) => {
  const normalized = Array.isArray(patterns) ? patterns : [patterns];

  for (const key of cache.keys()) {
    if (normalized.some((pattern) => key === pattern || key.startsWith(pattern))) {
      cache.delete(key);
    }
  }
};

export const cleanupExpiredCache = () => {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      removed += 1;
    }
  }

  return { removed, size: cache.size };
};
