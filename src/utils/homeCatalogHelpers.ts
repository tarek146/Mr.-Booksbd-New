import { Order, Product } from '../types';

export const DEFAULT_NEW_ARRIVALS_LIMIT = 10;
export const DEFAULT_BEST_SELLING_LIMIT = 10;
export const DEFAULT_ALL_BOOKS_LIMIT = 20;
export const MIN_ALL_BOOKS_LIMIT = 1;
export const MAX_HOME_ALL_BOOKS_LIMIT = 25;

export function clampHomeSectionLimit(
  rawLimit: number | undefined,
  fallback: number,
  maxAllowed: number = 30
): number {
  if (typeof rawLimit !== 'number' || !Number.isFinite(rawLimit)) {
    return fallback;
  }
  const rounded = Math.floor(rawLimit);
  if (rounded < MIN_ALL_BOOKS_LIMIT) return fallback;
  return Math.min(rounded, maxAllowed);
}

export function getActiveStoreProducts(products: Product[]): Product[] {
  return (products || []).filter(p => p && p.isActive !== false);
}

export function getNewArrivalsBooks(
  products: Product[],
  limit: number = DEFAULT_NEW_ARRIVALS_LIMIT
): Product[] {
  const safeLimit = clampHomeSectionLimit(limit, DEFAULT_NEW_ARRIVALS_LIMIT, 25);
  const books = getActiveStoreProducts(products).filter(p => p.type === 'book');

  return [...books]
    .sort((a, b) => {
      const aNewFlag = a.isNewProduct ? 1 : 0;
      const bNewFlag = b.isNewProduct ? 1 : 0;
      if (bNewFlag !== aNewFlag) return bNewFlag - aNewFlag;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .slice(0, safeLimit);
}

export function buildProductSalesCountMap(orders: Order[] = []): Map<string, number> {
  const counts = new Map<string, number>();
  for (const order of orders || []) {
    if (!order || order.isTrashed || order.orderStatus === 'cancelled') continue;
    for (const item of order.items || []) {
      if (!item?.productId) continue;
      const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      counts.set(item.productId, (counts.get(item.productId) || 0) + qty);
    }
  }
  return counts;
}

export function getBestSellingBooks(
  products: Product[],
  orders: Order[] = [],
  limit: number = DEFAULT_BEST_SELLING_LIMIT
): Product[] {
  const safeLimit = clampHomeSectionLimit(limit, DEFAULT_BEST_SELLING_LIMIT, 25);
  const books = getActiveStoreProducts(products).filter(p => p.type === 'book');
  const salesMap = buildProductSalesCountMap(orders);

  return [...books]
    .sort((a, b) => {
      const aSold = salesMap.get(a.id) || 0;
      const bSold = salesMap.get(b.id) || 0;
      if (bSold !== aSold) return bSold - aSold;

      const aFeatured = a.isFeatured ? 1 : 0;
      const bFeatured = b.isFeatured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;

      const aReviews = a.reviewCount || 0;
      const bReviews = b.reviewCount || 0;
      if (bReviews !== aReviews) return bReviews - aReviews;

      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      if (bRating !== aRating) return bRating - aRating;

      return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .slice(0, safeLimit);
}

export function getHomeStationeryItems(products: Product[]): Product[] {
  return [...getActiveStoreProducts(products)]
    .filter(p => p.type === 'stationery')
    .sort((a, b) => {
      const aInStock = (a.stock ?? 0) > 0 ? 1 : 0;
      const bInStock = (b.stock ?? 0) > 0 ? 1 : 0;
      if (bInStock !== aInStock) return bInStock - aInStock;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
}

export interface HomeAllBooksResult {
  items: Product[];
  totalBooksCount: number;
  hasMoreBooks: boolean;
  appliedLimit: number;
}

export function getHomeAllBooks(
  products: Product[],
  limit: number = DEFAULT_ALL_BOOKS_LIMIT
): HomeAllBooksResult {
  const appliedLimit = clampHomeSectionLimit(
    limit,
    DEFAULT_ALL_BOOKS_LIMIT,
    MAX_HOME_ALL_BOOKS_LIMIT
  );
  const books = getActiveStoreProducts(products).filter(p => p.type === 'book');

  const ordered = [...books].sort((a, b) => {
    const aInStock = (a.stock ?? 0) > 0 ? 1 : 0;
    const bInStock = (b.stock ?? 0) > 0 ? 1 : 0;
    if (bInStock !== aInStock) return bInStock - aInStock;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const items = ordered.slice(0, appliedLimit);
  return {
    items,
    totalBooksCount: ordered.length,
    hasMoreBooks: ordered.length > items.length,
    appliedLimit,
  };
}
