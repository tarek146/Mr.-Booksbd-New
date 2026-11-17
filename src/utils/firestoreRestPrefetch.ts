/**
 * Firestore v1 REST Prefetch Decoder & Bridge
 * Converts raw Firestore REST API JSON payloads (prefetched at t=0ms in index.html
 * before the React & Firebase SDK bundles finish downloading) into clean JS objects.
 */

export interface FirestoreRestValue {
  stringValue?: string;
  integerValue?: string | number;
  doubleValue?: string | number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  bytesValue?: string;
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
}

export interface FirestoreRestDocument {
  name?: string;
  fields?: Record<string, FirestoreRestValue>;
  createTime?: string;
  updateTime?: string;
}

export interface FirestoreRestCollectionResponse {
  documents?: FirestoreRestDocument[];
  nextPageToken?: string;
}

export type PrefetchCollectionKey =
  | 'settings'
  | 'products'
  | 'productDetail'
  | 'categories'
  | 'banners'
  | 'authors'
  | 'publishers'
  | 'coupons'
  | 'reels'
  | 'reviews'
  | 'payment_methods';

export interface EarlyPrefetchRegistry {
  startedAt: number;
  promises: Partial<Record<PrefetchCollectionKey, Promise<any>>>;
}

/**
 * Recursively converts a Firestore REST typed field value to a native JS value.
 */
export function fromFirestoreRestValue(val: FirestoreRestValue | null | undefined): any {
  if (!val || typeof val !== 'object') return undefined;

  if ('nullValue' in val) return null;
  if ('stringValue' in val) return val.stringValue ?? '';
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) {
    const n = Number(val.integerValue);
    return Number.isNaN(n) ? 0 : n;
  }
  if ('doubleValue' in val) {
    const n = Number(val.doubleValue);
    return Number.isNaN(n) ? 0 : n;
  }
  if ('timestampValue' in val) return val.timestampValue;
  if ('referenceValue' in val) return val.referenceValue;
  if ('bytesValue' in val) return val.bytesValue;
  if ('geoPointValue' in val) return val.geoPointValue;

  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    if (!Array.isArray(values)) return [];
    return values.map(item => fromFirestoreRestValue(item));
  }

  if ('mapValue' in val) {
    const fields = val.mapValue?.fields;
    if (!fields || typeof fields !== 'object') return {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      const decoded = fromFirestoreRestValue(v);
      if (decoded !== undefined) {
        out[k] = decoded;
      }
    }
    return out;
  }

  return undefined;
}

/**
 * Decodes a single Firestore REST document into `{ id, ...fields }`.
 */
export function decodeFirestoreRestDocument<T = Record<string, any>>(
  rawDoc: FirestoreRestDocument | null | undefined
): (T & { id: string }) | null {
  if (!rawDoc || typeof rawDoc !== 'object' || !rawDoc.name) {
    return null;
  }
  const segments = rawDoc.name.split('/').filter(Boolean);
  const id = segments[segments.length - 1];
  if (!id) return null;

  const out: Record<string, any> = {};
  const fields = rawDoc.fields || {};
  for (const [key, value] of Object.entries(fields)) {
    const decoded = fromFirestoreRestValue(value);
    if (decoded !== undefined) {
      out[key] = decoded;
    }
  }

  return {
    ...out,
    id,
  } as T & { id: string };
}

/**
 * Decodes a Firestore REST list response into an array of `{ id, ...fields }`.
 * Returns `null` if the response itself appears to be an error/invalid payload,
 * or `[]` when the collection genuinely contains 0 documents.
 */
export function decodeFirestoreRestCollection<T = Record<string, any>>(
  rawPayload: FirestoreRestCollectionResponse | { error?: unknown } | null | undefined
): (T & { id: string })[] | null {
  if (!rawPayload || typeof rawPayload !== 'object') return null;
  if ('error' in rawPayload && rawPayload.error) return null;

  const docs = (rawPayload as FirestoreRestCollectionResponse).documents;
  if (!Array.isArray(docs)) {
    // Firestore REST omits `documents` property when a collection has 0 documents (`{}`)
    return [];
  }

  const results: (T & { id: string })[] = [];
  for (const docItem of docs) {
    const decoded = decodeFirestoreRestDocument<T>(docItem);
    if (decoded) results.push(decoded);
  }
  return results;
}

const FIRESTORE_REST_BASE =
  'https://firestore.googleapis.com/v1/projects/mr-book-new/databases/(default)/documents';

export async function fetchFirestoreRestCollection<T = Record<string, any>>(
  collectionName: string,
  pageSize = 250
): Promise<(T & { id: string })[] | null> {
  try {
    const res = await fetch(
      `${FIRESTORE_REST_BASE}/${encodeURIComponent(collectionName)}?pageSize=${pageSize}`,
      { method: 'GET', mode: 'cors', credentials: 'omit' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return decodeFirestoreRestCollection<T>(json);
  } catch {
    return null;
  }
}

export async function fetchFirestoreRestDoc<T = Record<string, any>>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const res = await fetch(
      `${FIRESTORE_REST_BASE}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}`,
      { method: 'GET', mode: 'cors', credentials: 'omit' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return decodeFirestoreRestDocument<T>(json);
  } catch {
    return null;
  }
}

/**
 * Safely retrieves the `<head>` early prefetch promise for a collection if already started.
 */
export function getEarlyPrefetchPromise(
  key: PrefetchCollectionKey
): Promise<any> | null {
  if (typeof window === 'undefined') return null;
  const reg = (window as unknown as { __MRB_PREFETCH__?: EarlyPrefetchRegistry }).__MRB_PREFETCH__;
  if (!reg || !reg.promises) return null;
  return reg.promises[key] || null;
}
