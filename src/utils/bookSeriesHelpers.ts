import { Product } from '../types';

export interface ProductSeriesInfo {
  hasSeries: boolean;
  seriesName: string;
  seriesNumber: string;
  label: string;
}

/**
 * Trims and normalizes internal whitespace of a series name.
 */
export function normalizeSeriesName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Normalizes a series book number so leading "#" symbols don't double up ("#3" -> "3").
 */
export function normalizeSeriesNumber(num?: string | number | null): string {
  if (num === undefined || num === null) return '';
  const raw = String(num).trim();
  if (!raw) return '';
  return raw.replace(/^#+\s*/, '').trim();
}

/**
 * Formats a human-readable editorial series label (e.g., "Royal Elite #3").
 */
export function formatSeriesLabel(
  seriesName?: string | null,
  seriesNumber?: string | number | null
): string {
  const cleanName = normalizeSeriesName(seriesName);
  if (!cleanName) return '';
  const cleanNum = normalizeSeriesNumber(seriesNumber);
  return cleanNum ? `${cleanName} #${cleanNum}` : cleanName;
}

/**
 * Resolves normalized series metadata from a Product object.
 */
export function resolveProductSeriesInfo(
  product?: Pick<Product, 'seriesName' | 'seriesNumber'> | null
): ProductSeriesInfo {
  if (!product) {
    return { hasSeries: false, seriesName: '', seriesNumber: '', label: '' };
  }
  const seriesName = normalizeSeriesName(product.seriesName);
  if (!seriesName) {
    return { hasSeries: false, seriesName: '', seriesNumber: '', label: '' };
  }
  const seriesNumber = normalizeSeriesNumber(product.seriesNumber);
  const label = formatSeriesLabel(seriesName, seriesNumber);
  return {
    hasSeries: true,
    seriesName,
    seriesNumber,
    label,
  };
}

/**
 * Extracts a numeric sort key from seriesNumber (supports "1", "#2", "10", "2.5").
 * Non-numeric or missing numbers sort after numbered entries.
 */
export function parseSeriesSortOrder(seriesNumber?: string | number | null): number {
  const normalized = normalizeSeriesNumber(seriesNumber);
  if (!normalized) return Number.POSITIVE_INFINITY;
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

/**
 * Filters products belonging to a given series name (case-insensitive, trimmed).
 */
export function filterBooksBySeries(products: Product[], seriesName: string): Product[] {
  const target = normalizeSeriesName(seriesName).toLowerCase();
  if (!target) return [];
  return products.filter(
    (p) => normalizeSeriesName(p.seriesName).toLowerCase() === target
  );
}

/**
 * Sorts books within a series in reading order (#1, #2, #3, ..., #10).
 */
export function sortSeriesBooks(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const orderA = parseSeriesSortOrder(a.seriesNumber);
    const orderB = parseSeriesSortOrder(b.seriesNumber);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const titleCmp = (a.title || '').localeCompare(b.title || '');
    if (titleCmp !== 0) return titleCmp;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

/**
 * Returns sorted books in the same series as `currentProduct`.
 */
export function getSeriesBooksForProduct(
  products: Product[],
  currentProduct?: Pick<Product, 'seriesName'> | null
): Product[] {
  const seriesName = normalizeSeriesName(currentProduct?.seriesName);
  if (!seriesName) return [];
  return sortSeriesBooks(filterBooksBySeries(products, seriesName));
}

/**
 * Collects unique existing series names across the catalog for Admin autocomplete.
 */
export function collectExistingSeriesNames(products: Product[]): string[] {
  const seen = new Map<string, string>();
  for (const item of products) {
    const clean = normalizeSeriesName(item.seriesName);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, clean);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

/**
 * Extracts and normalizes `?series=...` from a URL query string.
 */
export function extractSeriesFromSearch(search?: string | null): string {
  if (!search || typeof search !== 'string') return '';
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return normalizeSeriesName(params.get('series'));
  } catch {
    return '';
  }
}

/**
 * Builds `/books` or `/books?series=...` path cleanly.
 */
export function buildBooksPathWithSeries(seriesName?: string | null): string {
  const clean = normalizeSeriesName(seriesName);
  if (!clean) return '/books';
  return `/books?series=${encodeURIComponent(clean)}`;
}

