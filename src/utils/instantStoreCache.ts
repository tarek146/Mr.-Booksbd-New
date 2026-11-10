/**
 * Instant Store Cache & Non-Blocking Real-Time Snapshot Utilities
 * Ensures 0ms initial page render on both new and returning devices while
 * seamlessly applying real-time Firebase Firestore snapshots.
 */

export const LIVE_CACHE_PREFIX = 'mrb_live_cache_v2:';

function getBrowserStorage(customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null): Pick<Storage, 'getItem' | 'setItem'> | null {
  if (customStorage !== undefined) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Synchronously reads a cached slice from localStorage for 0ms first-paint hydration.
 * Falls back to `fallback` if cache is missing, invalid, or empty array when fallback has items.
 */
export function readCachedSlice<T>(
  sliceKey: string,
  fallback: T,
  customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null
): T {
  const storage = getBrowserStorage(customStorage);
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(`${LIVE_CACHE_PREFIX}${sliceKey}`);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      if (Array.isArray(parsed) && (parsed.length > 0 || fallback.length === 0)) {
        return parsed as unknown as T;
      }
      return fallback;
    }

    if (fallback && typeof fallback === 'object') {
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...fallback, ...parsed } as T;
      }
      return fallback;
    }

    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/**
 * Persists a live Firebase collection/document slice to localStorage safely.
 */
export function writeCachedSlice<T>(
  sliceKey: string,
  data: T,
  customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null
): void {
  const storage = getBrowserStorage(customStorage);
  if (!storage) return;

  try {
    storage.setItem(`${LIVE_CACHE_PREFIX}${sliceKey}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

/**
 * Checks whether a valid non-empty cached slice already exists in storage.
 * Used to determine whether a cold browser session should show immediate Skeleton Screens
 * while real Firebase data fetches in the background.
 */
export function hasCachedSlice(
  sliceKey: string,
  customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null
): boolean {
  const storage = getBrowserStorage(customStorage);
  if (!storage) return false;

  try {
    const raw = storage.getItem(`${LIVE_CACHE_PREFIX}${sliceKey}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.length > 0;
    }
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed).length > 0;
    }
    return Boolean(parsed);
  } catch {
    return false;
  }
}

/**
 * Determines whether primary page components should render their Skeleton Screen
 * while background Firebase listeners synchronize initial data.
 */
export function shouldShowSkeletonScreen(
  isLoading: boolean,
  enableSkeletonLoading: boolean = true
): boolean {
  return Boolean(isLoading && enableSkeletonLoading !== false);
}

/**
 * Clamps the maximum skeleton display duration (in ms) so slow/offline networks
 * gracefully reveal cached/fallback store content without hanging.
 */
export function resolveSkeletonMaxDuration(configuredMs?: number): number {
  if (typeof configuredMs !== 'number' || Number.isNaN(configuredMs)) {
    return 1200;
  }
  return Math.max(300, Math.min(4000, Math.round(configuredMs)));
}

/**
 * Determines whether an incoming Firestore onSnapshot event should update React state:
 * - Server snapshots (`!fromCache`) are ALWAYS applied immediately.
 * - Cached snapshots (`fromCache === true`) are applied immediately ONLY if:
 *   1. We haven't already applied a fresher server snapshot in this session, AND
 *   2. The cached snapshot is not an empty uninitialized IndexedDB store (`!isEmpty`).
 */
export function shouldApplyRealtimeSnapshot(
  isEmpty: boolean,
  fromCache: boolean,
  hasReceivedServerSnapshot: boolean
): boolean {
  if (!fromCache) {
    return true;
  }
  if (hasReceivedServerSnapshot) {
    return false;
  }
  if (isEmpty) {
    return false;
  }
  return true;
}

export type FirestoreFetchStrategy = 'cache-first' | 'realtime-snapshot' | 'network-first';

export function resolveFirestoreFetchStrategy(
  strategy?: string
): FirestoreFetchStrategy {
  if (
    strategy === 'cache-first' ||
    strategy === 'realtime-snapshot' ||
    strategy === 'network-first'
  ) {
    return strategy;
  }
  return 'cache-first';
}

export function resolveFirestoreQueryLimit(configuredLimit?: number): number {
  if (typeof configuredLimit !== 'number' || Number.isNaN(configuredLimit)) {
    return 250;
  }
  return Math.max(20, Math.min(2000, Math.round(configuredLimit)));
}

/**
 * Executes a `getDocFromCache`-first lookup and automatically falls back to `getDoc` (network)
 * when the document is not yet cached in IndexedDB or when `strategy === 'network-first'`.
 */
export async function executeCacheFirstDocFetch<T>(
  getFromCacheFn: () => Promise<T | null>,
  getFromNetworkFn: () => Promise<T | null>,
  strategy: FirestoreFetchStrategy = 'cache-first'
): Promise<{ data: T | null; source: 'cache' | 'server' }> {
  if (strategy !== 'network-first') {
    try {
      const cached = await getFromCacheFn();
      if (cached !== null && cached !== undefined) {
        return { data: cached, source: 'cache' };
      }
    } catch {
      // Cache miss or IndexedDB unavailable: fall back seamlessly to network
    }
  }

  const networkData = await getFromNetworkFn();
  return { data: networkData, source: 'server' };
}

/**
 * Executes a `getDocsFromCache`-first collection/query lookup and automatically falls back
 * to `getDocs` (network) when the local cache is empty or throws.
 */
export async function executeCacheFirstQueryFetch<T>(
  getFromCacheFn: () => Promise<T[]>,
  getFromNetworkFn: () => Promise<T[]>,
  strategy: FirestoreFetchStrategy = 'cache-first'
): Promise<{ items: T[]; source: 'cache' | 'server' }> {
  if (strategy !== 'network-first') {
    try {
      const cachedItems = await getFromCacheFn();
      if (Array.isArray(cachedItems) && cachedItems.length > 0) {
        return { items: cachedItems, source: 'cache' };
      }
    } catch {
      // Cache miss or IndexedDB unavailable: fall back seamlessly to network
    }
  }

  const networkItems = await getFromNetworkFn();
  return { items: networkItems, source: 'server' };
}

export const KNOWN_CACHE_SLICES = [
  'products',
  'categories',
  'authors',
  'publishers',
  'banners',
  'paymentMethods',
  'settings',
  'homeConfig',
  'reviews',
  'reels'
] as const;

export function clearAllCachedSlices(
  customStorage?: Pick<Storage, 'removeItem'> | null
): void {
  const storage =
    customStorage !== undefined
      ? customStorage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;
  if (!storage) return;

  for (const key of KNOWN_CACHE_SLICES) {
    try {
      storage.removeItem(`${LIVE_CACHE_PREFIX}${key}`);
    } catch {
      // Ignore storage removal errors
    }
  }
}


