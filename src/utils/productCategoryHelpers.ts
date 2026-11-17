import { Product } from '../types';

/**
 * Normalizes and deduplicates an array of category names case-insensitively while preserving order.
 */
export function normalizeCategoryList(list?: (string | null | undefined)[] | null): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of list) {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/**
 * Returns all assigned categories for a product (merging `categories` array and legacy `category` field).
 */
export function getProductCategories(
  product?: Pick<Product, 'category' | 'categories'> | null
): string[] {
  if (!product) return [];
  const merged = [
    ...(Array.isArray(product.categories) ? product.categories : []),
    ...(product.category ? [product.category] : []),
  ];
  return normalizeCategoryList(merged);
}

/**
 * Checks whether a product belongs to a given category name (case-insensitive, supports multi-category products).
 */
export function productHasCategory(
  product?: Pick<Product, 'category' | 'categories'> | null,
  targetCategory?: string | null
): boolean {
  const target = typeof targetCategory === 'string' ? targetCategory.trim().toLowerCase() : '';
  if (!target) return false;
  return getProductCategories(product).some(cat => cat.toLowerCase() === target);
}

/**
 * Checks whether a product matches a search query across any of its assigned categories.
 */
export function productCategoriesMatchQuery(
  product?: Pick<Product, 'category' | 'categories'> | null,
  query?: string | null
): boolean {
  const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
  if (!q) return false;
  return getProductCategories(product).some(cat => cat.toLowerCase().includes(q));
}

/**
 * Toggles a category inside a checkbox selection array cleanly without duplicates.
 */
export function toggleProductCategorySelection(
  selectedCategories: string[],
  categoryName: string
): string[] {
  const cleanTarget = (categoryName || '').trim();
  if (!cleanTarget) return normalizeCategoryList(selectedCategories);

  const current = normalizeCategoryList(selectedCategories);
  const exists = current.some(c => c.toLowerCase() === cleanTarget.toLowerCase());

  if (exists) {
    return current.filter(c => c.toLowerCase() !== cleanTarget.toLowerCase());
  }
  return [...current, cleanTarget];
}

/**
 * Normalizes a multi-category selection into backward-compatible `{ category, categories }` fields for Firestore.
 */
export function buildProductCategoryFields(selectedCategories: string[]): {
  category: string;
  categories: string[];
} {
  const normalized = normalizeCategoryList(selectedCategories);
  return {
    category: normalized[0] || '',
    categories: normalized,
  };
}
