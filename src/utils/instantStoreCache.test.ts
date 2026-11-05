import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_CACHE_PREFIX,
  readCachedSlice,
  writeCachedSlice,
  hasCachedSlice,
  shouldShowSkeletonScreen,
  resolveSkeletonMaxDuration,
  shouldApplyRealtimeSnapshot,
  resolveFirestoreFetchStrategy,
  resolveFirestoreQueryLimit,
  executeCacheFirstDocFetch,
  executeCacheFirstQueryFetch,
  clearAllCachedSlices
} from './instantStoreCache.ts';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
    removeItem(key: string): void {
      map.delete(key);
    }
  };
}

test('readCachedSlice: returns fallback when cache is empty or missing', () => {
  const storage = createMemoryStorage();
  const fallback = [{ id: 'p1', title: 'Book 1' }];
  const result = readCachedSlice('products', fallback, storage);
  assert.deepEqual(result, fallback);
});

test('writeCachedSlice and readCachedSlice: round-trips array and object slices', () => {
  const storage = createMemoryStorage();
  const liveProducts = [{ id: 'live-1', title: 'Live Book' }];
  writeCachedSlice('products', liveProducts, storage);

  const fallback = [{ id: 'seed-1', title: 'Seed Book' }];
  const hydrated = readCachedSlice('products', fallback, storage);
  assert.deepEqual(hydrated, liveProducts);

  const defaultSettings = { storeName: 'MR. BOOKS', insideDhakaCharge: 60 };
  writeCachedSlice('settings', { storeName: 'MR. BOOKS LIVE', insideDhakaCharge: 50 }, storage);
  const hydratedSettings = readCachedSlice('settings', defaultSettings, storage);
  assert.deepEqual(hydratedSettings, { storeName: 'MR. BOOKS LIVE', insideDhakaCharge: 50 });
});

test('readCachedSlice: ignores empty cached array when fallback has seed items', () => {
  const storage = createMemoryStorage();
  storage.setItem(`${LIVE_CACHE_PREFIX}banners`, JSON.stringify([]));
  const fallbackBanners = [{ id: 'b1', title: 'Default Banner' }];
  const hydrated = readCachedSlice('banners', fallbackBanners, storage);
  assert.deepEqual(hydrated, fallbackBanners);
});

test('hasCachedSlice: accurately detects non-empty cached arrays and objects', () => {
  const storage = createMemoryStorage();
  assert.equal(hasCachedSlice('products', storage), false);

  storage.setItem(`${LIVE_CACHE_PREFIX}products`, JSON.stringify([]));
  assert.equal(hasCachedSlice('products', storage), false);

  writeCachedSlice('products', [{ id: 'p1' }], storage);
  assert.equal(hasCachedSlice('products', storage), true);

  writeCachedSlice('settings', { storeName: 'MR. BOOKS' }, storage);
  assert.equal(hasCachedSlice('settings', storage), true);

  clearAllCachedSlices(storage);
  assert.equal(hasCachedSlice('products', storage), false);
  assert.equal(hasCachedSlice('settings', storage), false);
});

test('shouldShowSkeletonScreen and resolveSkeletonMaxDuration: respects loading state and admin config', () => {
  assert.equal(shouldShowSkeletonScreen(true, true), true);
  assert.equal(shouldShowSkeletonScreen(true, undefined), true);
  assert.equal(shouldShowSkeletonScreen(true, false), false);
  assert.equal(shouldShowSkeletonScreen(false, true), false);

  assert.equal(resolveSkeletonMaxDuration(undefined), 1200);
  assert.equal(resolveSkeletonMaxDuration(100), 300);
  assert.equal(resolveSkeletonMaxDuration(800), 800);
  assert.equal(resolveSkeletonMaxDuration(9000), 4000);
});

test('shouldApplyRealtimeSnapshot: applies non-empty cache before server, ignores empty cache, always applies server', () => {
  // 1. Brand new browser: initial IndexedDB cache is empty -> ignore so UI doesn't flash blank
  assert.equal(shouldApplyRealtimeSnapshot(true, true, false), false);

  // 2. Returning browser: IndexedDB cache has items before server responds -> apply immediately
  assert.equal(shouldApplyRealtimeSnapshot(false, true, false), true);

  // 3. Server snapshot arrives (non-empty or empty) -> always apply
  assert.equal(shouldApplyRealtimeSnapshot(false, false, false), true);
  assert.equal(shouldApplyRealtimeSnapshot(true, false, false), true);

  // 4. Delayed cache echo after server snapshot already received -> ignore
  assert.equal(shouldApplyRealtimeSnapshot(false, true, true), false);
});

test('executeCacheFirstDocFetch: uses getDocFromCache first and falls back to network on cache miss', async () => {
  // Hit from cache
  let networkCalled = false;
  const hitRes = await executeCacheFirstDocFetch(
    async () => ({ id: 'doc-1', storeName: 'MR. BOOKS CACHED' }),
    async () => {
      networkCalled = true;
      return { id: 'doc-1', storeName: 'MR. BOOKS NETWORK' };
    },
    'cache-first'
  );
  assert.equal(hitRes.source, 'cache');
  assert.equal(hitRes.data?.storeName, 'MR. BOOKS CACHED');
  assert.equal(networkCalled, false);

  // Cache throws (IndexedDB miss) -> falls back to network
  const fallbackRes = await executeCacheFirstDocFetch(
    async () => {
      throw new Error('Failed to get document from cache');
    },
    async () => ({ id: 'doc-1', storeName: 'MR. BOOKS NETWORK' }),
    'cache-first'
  );
  assert.equal(fallbackRes.source, 'server');
  assert.equal(fallbackRes.data?.storeName, 'MR. BOOKS NETWORK');
});

test('executeCacheFirstQueryFetch and query limit resolvers: uses getDocsFromCache first and falls back to network', async () => {
  assert.equal(resolveFirestoreFetchStrategy(undefined), 'cache-first');
  assert.equal(resolveFirestoreFetchStrategy('network-first'), 'network-first');
  assert.equal(resolveFirestoreQueryLimit(undefined), 250);
  assert.equal(resolveFirestoreQueryLimit(5), 20);
  assert.equal(resolveFirestoreQueryLimit(500), 500);

  // Cache hit
  const cachedQuery = await executeCacheFirstQueryFetch(
    async () => [{ id: 'p1' }, { id: 'p2' }],
    async () => [{ id: 'p1' }],
    'cache-first'
  );
  assert.equal(cachedQuery.source, 'cache');
  assert.equal(cachedQuery.items.length, 2);

  // Empty cache -> falls back to network
  const networkQuery = await executeCacheFirstQueryFetch(
    async () => [],
    async () => [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
    'cache-first'
  );
  assert.equal(networkQuery.source, 'server');
  assert.equal(networkQuery.items.length, 3);
});


