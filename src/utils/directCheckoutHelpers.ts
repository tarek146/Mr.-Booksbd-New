import type { CartItem, Product } from '../types';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';

/**
 * Builds a single isolated CartItem for a direct "Order Now" / "Buy Now" flow
 * without touching or merging existing shopping cart items.
 */
export function buildDirectCartItem(
  product: Product,
  variantId: string,
  quantity: number
): CartItem {
  const variant =
    product.variants.find(v => v.id === variantId) ||
    product.variants[0] || {
      id: variantId || 'v1',
      name: 'Standard',
      price: product.price,
      stock: product.stock,
    };

  const maxStock = Math.max(0, Number(variant.stock ?? product.stock ?? 0));
  const safeQty =
    maxStock > 0
      ? Math.max(1, Math.min(Math.floor(Number(quantity) || 1), maxStock))
      : Math.max(1, Math.floor(Number(quantity) || 1));

  return {
    productId: product.id,
    variantId: variant.id,
    title: product.title,
    variantName: variant.name,
    price: variant.price,
    image: product.images?.[0] || FALLBACK_PRODUCT_IMAGE,
    quantity: safeQty,
    stock: variant.stock,
    type: product.type,
  };
}

/**
 * Removes an individual line item from a checkout or cart item list.
 */
export function removeCheckoutItem(
  items: CartItem[],
  productId: string,
  variantId: string
): CartItem[] {
  return items.filter(
    item => !(item.productId === productId && item.variantId === variantId)
  );
}

/**
 * Returns cart items that are not already present (by productId + variantId)
 * in the active direct checkout list.
 */
export function getUnincludedCartItems(
  cart: CartItem[],
  activeCheckoutItems: CartItem[]
): CartItem[] {
  if (!Array.isArray(cart) || cart.length === 0) return [];
  const activeKeys = new Set(
    (activeCheckoutItems || []).map(item => `${item.productId}::${item.variantId}`)
  );
  return cart.filter(
    item => !activeKeys.has(`${item.productId}::${item.variantId}`)
  );
}

/**
 * Merges optional cart items into the direct checkout list without duplicating
 * identical product+variant entries.
 */
export function mergeCheckoutItems(
  primaryItems: CartItem[],
  additionalItems: CartItem[]
): CartItem[] {
  const merged = primaryItems.map(item => ({ ...item }));
  for (const extra of additionalItems) {
    const idx = merged.findIndex(
      item =>
        item.productId === extra.productId && item.variantId === extra.variantId
    );
    if (idx === -1) {
      merged.push({ ...extra });
    }
  }
  return merged;
}

/**
 * Computes which items should remain in the persistent shopping cart after an order
 * is placed.
 * - In standard cart checkout mode (`isDirectMode = false`), clears the cart.
 * - In direct checkout mode (`isDirectMode = true`), preserves any cart items that
 *   were NOT included in the placed order, and removes only items that were ordered.
 */
export function computeRemainingCartAfterOrder(
  cart: CartItem[],
  orderedItems: CartItem[],
  isDirectMode: boolean
): CartItem[] {
  if (!isDirectMode) {
    return [];
  }
  const orderedKeys = new Set(
    (orderedItems || []).map(item => `${item.productId}::${item.variantId}`)
  );
  return (cart || []).filter(
    item => !orderedKeys.has(`${item.productId}::${item.variantId}`)
  );
}
