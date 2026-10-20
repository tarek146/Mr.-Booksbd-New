/**
 * Synchronization Manager
 * Coordinates multi-collection Firestore sync and determines authoritative data state.
 */

export interface CollectionSyncStatus {
  hasServerData: boolean;
  hasCacheData: boolean;
  error?: string | null;
}

export type RequiredCollection = 
  | 'products' 
  | 'categories' 
  | 'authors' 
  | 'banners' 
  | 'payment_methods' 
  | 'settings';

export const REQUIRED_COLLECTIONS: RequiredCollection[] = [
  'products',
  'categories',
  'authors',
  'banners',
  'payment_methods',
  'settings'
];

export class SyncTracker {
  private statuses: Record<RequiredCollection, CollectionSyncStatus>;
  private isOfflineMode: boolean = false;

  constructor() {
    this.statuses = {
      products: { hasServerData: false, hasCacheData: false },
      categories: { hasServerData: false, hasCacheData: false },
      authors: { hasServerData: false, hasCacheData: false },
      banners: { hasServerData: false, hasCacheData: false },
      payment_methods: { hasServerData: false, hasCacheData: false },
      settings: { hasServerData: false, hasCacheData: false }
    };
  }

  public recordSnapshot(collection: RequiredCollection, fromCache: boolean): void {
    if (this.statuses[collection]) {
      if (fromCache) {
        this.statuses[collection].hasCacheData = true;
      } else {
        this.statuses[collection].hasServerData = true;
      }
    }
  }

  public setOffline(offline: boolean): void {
    this.isOfflineMode = offline;
  }

  public isInitialSyncComplete(): boolean {
    if (this.isOfflineMode) {
      // In offline mode, allow cache data or empty if offline
      return true;
    }

    // Require all primary collections to have received authoritative server data
    for (const key of REQUIRED_COLLECTIONS) {
      if (!this.statuses[key].hasServerData) {
        return false;
      }
    }
    return true;
  }

  /**
   * Determines whether an incoming snapshot should be applied to public state.
   * Prevents stale IndexedDB cache from overwriting or flashing before server confirmation.
   */
  public shouldApplySnapshot(collection: RequiredCollection, fromCache: boolean): boolean {
    // If it's a server snapshot, always apply
    if (!fromCache) {
      return true;
    }

    // If we are in offline mode, apply cached snapshot
    if (this.isOfflineMode) {
      return true;
    }

    // If this collection already received server data, ignore delayed cache echoes
    if (this.statuses[collection]?.hasServerData) {
      return false;
    }

    // During initial loading, hold off on stale cache until server responds
    return false;
  }
}

/**
 * Normalizes an image or asset URL safely without generating volatile timestamps
 * that invalidate browser HTTP caches on every state change.
 */
export function normalizeAssetUrl(url?: string | null, version?: number | string): string {
  if (!url || typeof url !== 'string') return '';
  // Data URLs and blob URLs are embedded, no query params needed
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  // If already versioned, keep existing
  if (url.includes('cb=') || url.includes('_t=') || url.includes('v=')) return url;
  
  if (version !== undefined && version !== null) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }
  
  return url;
}
