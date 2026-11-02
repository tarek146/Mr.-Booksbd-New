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
