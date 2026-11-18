import { Category, Product, ProductType } from '../types';
import { getActiveStoreProducts } from './homeCatalogHelpers';
import { productHasCategory } from './productCategoryHelpers';

export const DEFAULT_CATEGORY_HOME_LIMIT = 5;
export const MIN_CATEGORY_HOME_LIMIT = 1;
export const MAX_CATEGORY_HOME_LIMIT = 25;

export function clampCategoryHomeLimit(rawLimit: number | undefined): number {
  if (typeof rawLimit !== 'number' || !Number.isFinite(rawLimit)) {
    return DEFAULT_CATEGORY_HOME_LIMIT;
  }
  const rounded = Math.floor(rawLimit);
  if (rounded < MIN_CATEGORY_HOME_LIMIT) return DEFAULT_CATEGORY_HOME_LIMIT;
  return Math.min(rounded, MAX_CATEGORY_HOME_LIMIT);
}

export function normalizeDisplayOrder(rawOrder: number | undefined, fallbackIndex: number): number {
  if (typeof rawOrder === 'number' && Number.isFinite(rawOrder) && rawOrder >= 0) {
    return Math.floor(rawOrder);
  }
  return fallbackIndex;
}

export function sortCategoriesBySerial(categories: Category[]): Category[] {
  return (categories || [])
    .map((cat, index) => ({ cat, index }))
    .sort((a, b) => {
      const aOrder =
        typeof a.cat.displayOrder === 'number' && Number.isFinite(a.cat.displayOrder)
          ? a.cat.displayOrder
          : Number.MAX_SAFE_INTEGER;
      const bOrder =
        typeof b.cat.displayOrder === 'number' && Number.isFinite(b.cat.displayOrder)
          ? b.cat.displayOrder
          : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.index - b.index;
    })
    .map(entry => entry.cat);
}

export function getHomeVisibleCategorySliderItems(categories: Category[]): Category[] {
  return sortCategoriesBySerial(categories);
}

export function getProductsEligibleForCategoryModal(
  products: Product[],
  categoryType: ProductType,
  categoryName: string
): Product[] {
  const activeSameType = getActiveStoreProducts(products).filter(p => p.type === categoryType);
  const trimmedName = (categoryName || '').trim();
  return [...activeSameType].sort((a, b) => {
    const aInCat = trimmedName && productHasCategory(a, trimmedName) ? 1 : 0;
    const bInCat = trimmedName && productHasCategory(b, trimmedName) ? 1 : 0;
    if (bInCat !== aInCat) return bInCat - aInCat;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

export interface HomeCategoryProductSection {
  category: Category;
  visibleItems: Product[];
  allCategoryItems: Product[];
  totalCount: number;
  hasMore: boolean;
  remainingCount: number;
  appliedLimit: number;
}

export function getHomeCategoryProductSections(
  categories: Category[],
  products: Product[],
  targetType?: ProductType
): HomeCategoryProductSection[] {
  const sortedCategories = sortCategoriesBySerial(categories).filter(cat => {
    if (cat.showProductsOnHome !== true) return false;
    if (targetType && cat.type !== targetType) return false;
    return true;
  });

  if (sortedCategories.length === 0) return [];

  const activeProducts = getActiveStoreProducts(products);

  return sortedCategories
    .map(cat => {
      const sameTypeActive = activeProducts.filter(p => p.type === cat.type);
      const byCategory = sameTypeActive.filter(p => productHasCategory(p, cat.name));
      const limit = clampCategoryHomeLimit(cat.homeProductLimit);

      const selectedIds = Array.isArray(cat.homeFeaturedProductIds)
        ? cat.homeFeaturedProductIds.filter(Boolean)
        : [];

      let allCategoryItems: Product[];
      let visibleSource: Product[];

      if (selectedIds.length > 0) {
        const selectedProducts = selectedIds
          .map(id => sameTypeActive.find(p => p.id === id))
          .filter((p): p is Product => Boolean(p));

        const selectedSet = new Set(selectedProducts.map(p => p.id));
        const extraFromCategory = byCategory.filter(p => !selectedSet.has(p.id));
        allCategoryItems = [...selectedProducts, ...extraFromCategory];
        visibleSource = selectedProducts;
      } else {
        allCategoryItems = [...byCategory].sort((a, b) => {
          const aInStock = (a.stock ?? 0) > 0 ? 1 : 0;
          const bInStock = (b.stock ?? 0) > 0 ? 1 : 0;
          if (bInStock !== aInStock) return bInStock - aInStock;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        visibleSource = allCategoryItems;
      }

      const visibleItems = visibleSource.slice(0, limit);
      const totalCount = allCategoryItems.length;
      const remainingCount = Math.max(0, totalCount - visibleItems.length);

      return {
        category: cat,
        visibleItems,
        allCategoryItems,
        totalCount,
        hasMore: totalCount > visibleItems.length,
        remainingCount,
        appliedLimit: limit,
      };
    })
    .filter(section => section.visibleItems.length > 0);
}
