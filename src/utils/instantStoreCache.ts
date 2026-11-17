/**
 * Instant Store Cache & Non-Blocking Real-Time Snapshot Utilities
 * Ensures 0ms initial page render on both new and returning devices while
 * seamlessly applying real-time Firebase Firestore snapshots.
 */

import type { StoreSettings } from '../types';

export const LIVE_CACHE_PREFIX = 'mrb_live_cache_v3:';
export const LEGACY_CACHE_PREFIX = 'mrb_live_cache_v2:';

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

  try {
    const networkData = await getFromNetworkFn();
    return { data: networkData, source: 'server' };
  } catch {
    return { data: null, source: 'cache' };
  }
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

  try {
    const networkItems = await getFromNetworkFn();
    return { items: networkItems, source: 'server' };
  } catch {
    return { items: [], source: 'cache' };
  }
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
  'siteSettings',
  'coupons',
  'reviews',
  'reels'
] as const;

export function clearLegacyV2CachedSlices(
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
      storage.removeItem(`${LEGACY_CACHE_PREFIX}${key}`);
    } catch {
      // Ignore storage removal errors
    }
  }
}

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
      storage.removeItem(`${LEGACY_CACHE_PREFIX}${key}`);
    } catch {
      // Ignore storage removal errors
    }
  }
}

export interface CriticalHydrationState {
  settings: boolean;
  homeConfig: boolean;
  siteSettings: boolean;
  banners: boolean;
  categories: boolean;
  products: boolean;
  coupons: boolean;
  authors?: boolean;
  publishers?: boolean;
  productDetailDoc?: boolean;
}

/**
 * Ensures the UI stays in clean Skeleton state until ALL critical above-the-fold and
 * page-specific live storefront slices have confirmed from cache/REST/server, preventing
 * any flash of stale default arrays or half-hydrated sections.
 */
export function areCriticalStoreSlicesReady(
  state: CriticalHydrationState,
  activePage: string = 'home'
): boolean {
  const coreSettingsReady = Boolean(
    state.settings && state.homeConfig && state.siteSettings
  );
  if (!coreSettingsReady) return false;

  if (activePage === 'product-detail') {
    return Boolean(
      (state.products || state.productDetailDoc) &&
      state.coupons
    );
  }

  if (activePage === 'authors') {
    return Boolean(state.authors && state.products && state.categories);
  }

  if (activePage === 'publishers') {
    return Boolean(state.publishers && state.products && state.categories);
  }

  if (activePage === 'books' || activePage === 'stationery') {
    return Boolean(state.products && state.categories && state.coupons);
  }

  // Home & default storefront: require hero banners, categories, products, coupons, and directory slices
  return Boolean(
    state.banners &&
    state.categories &&
    state.products &&
    state.coupons &&
    state.authors &&
    state.publishers
  );
}

/**
 * On cold browsers (no local cache), keep the skeleton screen visible long enough for
 * live Firestore/REST responses to arrive instead of timing out at 1200ms and revealing empty/default state.
 */
export function resolveColdHydrationTimeoutMs(configuredMs?: number): number {
  const base = resolveSkeletonMaxDuration(configuredMs);
  return Math.max(4500, base);
}

/**
 * Strictly neutral storefront shell settings used ONLY during cold browser loading
 * before live Firebase settings arrive. Contains ZERO hardcoded promotional strings,
 * phone numbers, demo announcements, or fake special offer items.
 */
export const COLD_NEUTRAL_SETTINGS: StoreSettings = {
  storeName: 'MR. BOOKS',
  tagline: '',
  phone: '',
  email: '',
  address: '',
  insideDhakaCharge: 60,
  subAreaCharge: 90,
  subAreaLocations: [],
  outsideDhakaCharge: 120,
  freeShippingThreshold: 2000,
  logoUrl: '',
  footerLogoUrl: '',
  faviconUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  bkashNumber: '',
  nagadNumber: '',
  showHeaderIcon: true,
  headerNameColor1: '#171717',
  headerNameColor2: '#D71920',
  adminLogoUrl: '',
  showAdminIcon: true,
  adminIconBgColor: '#D71920',
  adminBrandName: 'MR. BOOKS BD',
  adminPanelSubtitle: 'Store Admin Console',
  adminNameColor1: '#FFFFFF',
  adminNameColor2: '#D71920',
  adminUseTwoToneName: false,
  showHeaderTagline: false,
  showHeaderContact: false,
  enableThemeToggle: true,
  allowDarkMode: true,
  enableSkeletonLoading: true,
  skeletonAnimationStyle: 'shimmer',
  skeletonMaxDurationMs: 4500,
  firestoreFetchStrategy: 'cache-first',
  firestoreQueryLimit: 250,
  enableIndexedQuerySnapshots: true,
  productImageFitMode: 'cover',
  showAnnouncementBar: false,
  announcementItems: [],
  facebookPixelId: '',
  facebookCapiToken: '',
  gaMeasurementId: '',
  tiktokPixelId: '',
  showFooterIcon: true,
  footerBrandName: 'MR. BOOKS',
  footerNameColor1: '#FFFFFF',
  footerNameColor2: '#D71920',
  footerBgColor: '#121212',
  footerCardBgColor: '#1c1c1e',
  footerDescription: '',
  footerPaymentTitle: 'Payment Options',
  footerPaymentBannerUrl: '',
  footerQuickLinksTitle: 'QUICK LINKS',
  footerQuickLinks: [],
  footerCategoriesTitle: 'CATEGORIES',
  footerCategoryLinks: [],
  footerSocialTitle: 'Social Media',
  copyrightText: `© ${new Date().getFullYear()} MR. BOOKS`,
  footerBottomTagline: '',
  footerPaymentMethods: [],
  socialLinks: [],
  showFooterSubscription: false,
  subscriptionTitle: 'VIP Club',
  subscriptionSubtitle: '',
  subscriptionDiscountBadge: '',
  showFooterTracking: false,
  trackingTitle: 'Track Order',
  trackingSubtitle: '',
  showFooterCoupons: false,
  couponsTitle: 'Coupons',
  couponsBadge: '',
  showFooterPolicy: false,
  policyTitle: 'Policy',
  policyBadge: '',
  cancelExchangePolicyText: '',
  enableLiveChat: false,
  enableLiveChatSound: false,
  liveChatAutoHideSeconds: 4,
  liveChatRequireContactInfo: false,
  liveChatShowEmailField: false,
  liveChatTitle: 'Support',
  liveChatWelcomeMessage: '',
  whatsappNumber: '',
  callNumber: '',
  telegramUrl: '',
  messengerUrl: '',
  metaTitle: 'MR. BOOKS',
  metaDescription: '',
  ogImageUrl: '',
  keywords: '',
  enableCouponPopup: false,
  couponsInitialized: true,
  dismissedDefaultCouponIds: [],
  specialOffer: {
    enabled: false,
    title: 'Special Offer',
    endTime: 0,
    autoRemoveExpired: true,
    showItemCountdown: false,
    items: [],
  },
};



