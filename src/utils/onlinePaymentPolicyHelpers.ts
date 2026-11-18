import { CartItem, Product } from '../types';

export const ONLINE_PAYMENT_PERCENT_PRESETS = [10, 20, 50, 100] as const;

/**
 * Clamps an advance online payment percentage cleanly into 1..100 integer range.
 * Defaults to 100 (full payment) when missing or invalid.
 */
export function clampOnlinePaymentPercent(value: unknown, fallback = 100): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  if (rounded < 1) return 1;
  if (rounded > 100) return 100;
  return rounded;
}

export interface ProductOnlinePaymentRequirement {
  required: boolean;
  percent: number;
  isFullPrepaid: boolean;
}

export function getProductOnlinePaymentRequirement(
  product?: Pick<Product, 'requireOnlinePayment' | 'onlinePaymentPercent'> | null
): ProductOnlinePaymentRequirement {
  if (!product?.requireOnlinePayment) {
    return {
      required: false,
      percent: 0,
      isFullPrepaid: false,
    };
  }
  const percent = clampOnlinePaymentPercent(product.onlinePaymentPercent, 100);
  return {
    required: true,
    percent,
    isFullPrepaid: percent >= 100,
  };
}

export interface CheckoutRequiredAdvanceItem {
  productId: string;
  title: string;
  percent: number;
  advanceAmount: number;
}

export interface CheckoutOnlinePaymentSummary {
  isOnlineRequired: boolean;
  isFullOnlineRequired: boolean;
  isPartialAdvance: boolean;
  requiredPercent: number;
  payNowAmount: number;
  dueOnDelivery: number;
  requiredItems: CheckoutRequiredAdvanceItem[];
}

export function calculateCheckoutOnlinePaymentSummary(input: {
  checkoutItems: CartItem[];
  products: Product[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  deliveryType: 'standard' | 'sundarban';
  sundarbanForcesPrepayment?: boolean;
}): CheckoutOnlinePaymentSummary {
  const safeTotal = Math.max(0, Math.round(Number(input.total) || 0));
  const safeSubtotal = Math.max(0, Math.round(Number(input.subtotal) || 0));
  const safeDiscount = Math.max(0, Math.round(Number(input.discount) || 0));

  const requiredItems: CheckoutRequiredAdvanceItem[] = [];
  const productDiscount = Math.min(safeSubtotal, safeDiscount);
  const netRatio = safeSubtotal > 0 ? Math.max(0, safeSubtotal - productDiscount) / safeSubtotal : 1;

  let hasFullPrepaidItem = false;
  let maxPercent = 0;
  let rawPartialAdvance = 0;

  for (const item of input.checkoutItems || []) {
    const prod = (input.products || []).find(p => p.id === item.productId);
    const req = getProductOnlinePaymentRequirement(prod);
    if (!req.required) continue;

    if (req.percent > maxPercent) {
      maxPercent = req.percent;
    }
    if (req.isFullPrepaid) {
      hasFullPrepaidItem = true;
    }

    const lineTotal = Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1);
    const effectiveLineTotal = lineTotal * netRatio;
    const itemAdvance = Math.round((effectiveLineTotal * req.percent) / 100);
    rawPartialAdvance += itemAdvance;

    requiredItems.push({
      productId: item.productId,
      title: item.title,
      percent: req.percent,
      advanceAmount: itemAdvance,
    });
  }

  // Hub/Point delivery always enforces 100% online prepayment when enabled
  if (input.deliveryType === 'sundarban' && input.sundarbanForcesPrepayment !== false) {
    return {
      isOnlineRequired: true,
      isFullOnlineRequired: true,
      isPartialAdvance: false,
      requiredPercent: 100,
      payNowAmount: safeTotal,
      dueOnDelivery: 0,
      requiredItems,
    };
  }

  if (requiredItems.length === 0) {
    return {
      isOnlineRequired: false,
      isFullOnlineRequired: false,
      isPartialAdvance: false,
      requiredPercent: 0,
      payNowAmount: safeTotal,
      dueOnDelivery: 0,
      requiredItems: [],
    };
  }

  if (hasFullPrepaidItem || maxPercent >= 100) {
    return {
      isOnlineRequired: true,
      isFullOnlineRequired: true,
      isPartialAdvance: false,
      requiredPercent: 100,
      payNowAmount: safeTotal,
      dueOnDelivery: 0,
      requiredItems,
    };
  }

  const clampedAdvance =
    safeTotal > 0 ? Math.min(safeTotal, Math.max(1, rawPartialAdvance)) : 0;
  const dueOnDelivery = Math.max(0, safeTotal - clampedAdvance);
  const isPartialAdvance = dueOnDelivery > 0;

  return {
    isOnlineRequired: true,
    isFullOnlineRequired: !isPartialAdvance,
    isPartialAdvance,
    requiredPercent: maxPercent,
    payNowAmount: clampedAdvance,
    dueOnDelivery,
    requiredItems,
  };
}

export function formatOnlinePaymentRequirementBadge(
  product?: Pick<Product, 'requireOnlinePayment' | 'onlinePaymentPercent'> | null
): string | null {
  const req = getProductOnlinePaymentRequirement(product);
  if (!req.required) return null;
  return req.isFullPrepaid
    ? '100% Online Payment Required'
    : `${req.percent}% Advance Online Required`;
}
