import {
  Author,
  CartItem,
  Category,
  Coupon,
  FooterQuickLinkItem,
  Product,
  ProductVariant,
  Publisher,
  StoreSettings,
} from '../types';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-mrbooks10',
    code: 'MRBOOKS10',
    title: '10% Instant Book Discount',
    description: 'সব বই ও স্টেশনারি অর্ডারে ১০% ইনস্ট্যান্ট ডিসকাউন্ট (সর্বোচ্চ ৳৩০০)।',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 250,
    maxDiscountAmount: 300,
    badgeText: '10% OFF',
    isActive: true,
    createdAt: 1700000000000,
  },
  {
    id: 'coupon-freedel',
    code: 'FREEDEL',
    title: 'Free Home Delivery Coupon',
    description: '৳৫০০ বা তার বেশি অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি চার্জ!',
    discountType: 'free_delivery',
    discountValue: 0,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    badgeText: 'FREE DELIVERY',
    isActive: true,
    createdAt: 1700000000001,
  },
  {
    id: 'coupon-bookfest50',
    code: 'BOOKFEST50',
    title: '৳50 Flat Reader Bonus',
    description: '৳৪৫০+ অর্ডারে সরাসরি ৳৫০ টাকা ক্যাশ ডিসকাউন্ট পান।',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 450,
    maxDiscountAmount: 50,
    badgeText: '৳50 OFF',
    isActive: true,
    createdAt: 1700000000002,
  },
];

export const DEFAULT_CANCEL_EXCHANGE_POLICY = `১. অর্ডার বাতিল (Order Cancellation): পার্সেল কুরিয়ারে হস্তান্তরের আগে যেকোনো সময় আপনার অর্ডারটি বাতিল করতে পারবেন। কুরিয়ারে বের হয়ে গেলে অনুগ্রহ করে ডেলিভারি ম্যানের সাথে যোগাযোগ অথবা লাইভ চ্যাটে জানাবেন।
২. বই ও প্রোডাক্ট এক্সচেঞ্জ (Easy Exchange): ভুল বই, ছেঁড়া-ফাটা বা প্রিন্টিং মিস্টেক থাকলে ডেলিভারি পাওয়ার ৭ দিনের মধ্যে কোনো অতিরিক্ত চার্জ ছাড়াই সম্পূর্ণ ফ্রি এক্সচেঞ্জ সুবিধা পাবেন।
৩. রিফান্ড নীতিমালা (Fast Refund): অগ্রিম পেমেন্ট করা অর্ডার বাতিল হলে বা স্টক না থাকলে ২-৩ কর্মদিবসের মধ্যে আপনার বিকাশ/নগদ/ব্যাংক একাউন্টে সম্পূর্ণ টাকা রিফান্ড করা হবে।`;

export interface CouponEvaluationResult {
  valid: boolean;
  code: string;
  discount: number;
  freeDelivery: boolean;
  message: string;
  coupon?: Coupon;
  pendingPhoneVerification?: boolean;
  ineligibleReason?:
    | 'empty'
    | 'not_found'
    | 'inactive'
    | 'scheduled'
    | 'expired'
    | 'usage_limit'
    | 'first_order_only'
    | 'per_customer_limit'
    | 'min_order';
}

export interface CouponCustomerOrderRef {
  id?: string;
  phone?: string;
  optionalPhone?: string;
  userId?: string;
  email?: string;
  orderStatus?: string;
  isTrashed?: boolean;
  couponCode?: string;
}

export interface CouponCustomerContext {
  now?: number;
  phone?: string;
  userId?: string;
  email?: string;
  orders?: CouponCustomerOrderRef[];
  remoteProfile?: {
    orderCount?: number;
    usedCoupons?: string[];
  } | null;
  localOrderHistoryPhones?: string[];
  localUsedCoupons?: string[];
}

export type CouponScheduleStatus = 'active' | 'scheduled' | 'expired' | 'paused' | 'exhausted';

export interface CouponScheduleState {
  status: CouponScheduleStatus;
  isLive: boolean;
  remainingMs: number | null;
  startsInMs: number | null;
  label: string;
  countdownLabel: string;
  timeSummary: string;
}

export function normalizeCouponPhoneLast10(phone?: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.length < 10) return '';
  return digits.slice(-10);
}

export function formatCouponScheduleDate(ts?: number): string {
  if (!ts || ts <= 0 || Number.isNaN(ts)) return '';
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatDurationCompact(ms: number): string {
  if (!ms || ms <= 0) return '00m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  }
  if (hours > 0) {
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(minutes)}m ${pad(seconds)}s`;
}

export function toDateTimeLocalValue(ts?: number): string {
  if (!ts || ts <= 0 || Number.isNaN(ts)) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocalValue(value?: string): number | undefined {
  const trimmed = (value || '').trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function getCouponScheduleState(
  coupon: Coupon,
  now: number = Date.now()
): CouponScheduleState {
  const hasStart = Boolean(coupon.startsAt && coupon.startsAt > 0);
  const hasEnd = Boolean(coupon.expiresAt && coupon.expiresAt > 0);
  const startStr = hasStart ? formatCouponScheduleDate(coupon.startsAt) : '';
  const endStr = hasEnd ? formatCouponScheduleDate(coupon.expiresAt) : '';

  const timeSummary =
    hasStart && hasEnd
      ? `${startStr} → ${endStr}`
      : hasStart
      ? `Starts ${startStr}`
      : hasEnd
      ? `Ends ${endStr}`
      : 'Always Active (No Expiry)';

  if (coupon.isActive === false) {
    return {
      status: 'paused',
      isLive: false,
      remainingMs: null,
      startsInMs: null,
      label: 'Paused',
      countdownLabel: 'Manually paused',
      timeSummary,
    };
  }

  if (
    typeof coupon.usageLimit === 'number' &&
    coupon.usageLimit > 0 &&
    (coupon.usageCount || 0) >= coupon.usageLimit
  ) {
    return {
      status: 'exhausted',
      isLive: false,
      remainingMs: 0,
      startsInMs: null,
      label: 'Limit Reached',
      countdownLabel: `${coupon.usageCount || 0}/${coupon.usageLimit} redeemed`,
      timeSummary,
    };
  }

  if (hasStart && coupon.startsAt! > now) {
    const startsInMs = coupon.startsAt! - now;
    return {
      status: 'scheduled',
      isLive: false,
      remainingMs: hasEnd ? coupon.expiresAt! - coupon.startsAt! : null,
      startsInMs,
      label: 'Scheduled',
      countdownLabel: `Starts in ${formatDurationCompact(startsInMs)}`,
      timeSummary,
    };
  }

  if (hasEnd && now > coupon.expiresAt!) {
    return {
      status: 'expired',
      isLive: false,
      remainingMs: 0,
      startsInMs: null,
      label: 'Expired',
      countdownLabel: 'Expired',
      timeSummary,
    };
  }

  const remainingMs = hasEnd ? Math.max(0, coupon.expiresAt! - now) : null;
  return {
    status: 'active',
    isLive: true,
    remainingMs,
    startsInMs: null,
    label: 'Live',
    countdownLabel: remainingMs !== null ? `${formatDurationCompact(remainingMs)} left` : 'Ongoing',
    timeSummary,
  };
}

export function resolveActiveCoupons(
  storedCoupons?: Coupon[],
  options?: { allowFallbackDefaults?: boolean; dismissedIds?: string[] }
): Coupon[] {
  const map = new Map<string, Coupon>();
  if (storedCoupons && storedCoupons.length > 0) {
    for (const c of storedCoupons) {
      if (c && c.code) {
        map.set(c.code.trim().toUpperCase(), {
          ...c,
          code: c.code.trim().toUpperCase(),
        });
      }
    }
    return Array.from(map.values());
  }
  if (options?.allowFallbackDefaults) {
    const dismissedSet = new Set(options.dismissedIds || []);
    return DEFAULT_COUPONS.filter(c => !dismissedSet.has(c.id));
  }
  return [];
}

export function getCustomerOrderHistorySignals(
  customerContext?: CouponCustomerContext,
  couponCode?: string
): {
  priorNonCancelledOrders: number;
  couponUsesCount: number;
  hasIdentitySignal: boolean;
} {
  if (!customerContext) {
    return { priorNonCancelledOrders: 0, couponUsesCount: 0, hasIdentitySignal: false };
  }

  const normPhone = normalizeCouponPhoneLast10(customerContext.phone);
  const normEmail = (customerContext.email || '').trim().toLowerCase();
  const uid = (customerContext.userId || '').trim();
  const isRealUid = Boolean(uid && !uid.startsWith('guest-'));
  const targetCode = (couponCode || '').trim().toUpperCase();

  const matchingOrders = (customerContext.orders || []).filter(o => {
    if (!o || o.isTrashed || o.orderStatus === 'cancelled') return false;
    const oPhone = normalizeCouponPhoneLast10(o.phone);
    const oAltPhone = normalizeCouponPhoneLast10(o.optionalPhone);
    const oEmail = (o.email || '').trim().toLowerCase();
    const oUid = (o.userId || '').trim();

    if (normPhone && (oPhone === normPhone || oAltPhone === normPhone)) return true;
    if (isRealUid && oUid && oUid === uid) return true;
    if (normEmail && oEmail && oEmail === normEmail) return true;
    return false;
  });

  const remoteCount = Math.max(0, Number(customerContext.remoteProfile?.orderCount) || 0);
  const localPhoneMatch = Boolean(
    normPhone &&
      (customerContext.localOrderHistoryPhones || []).some(
        p => normalizeCouponPhoneLast10(p) === normPhone
      )
  );

  const priorNonCancelledOrders = Math.max(
    matchingOrders.length,
    remoteCount,
    localPhoneMatch ? 1 : 0
  );

  const orderUsesCount = targetCode
    ? matchingOrders.filter(o => (o.couponCode || '').trim().toUpperCase() === targetCode).length
    : 0;
  const remoteUsed = Boolean(
    targetCode &&
      (customerContext.remoteProfile?.usedCoupons || []).some(
        c => c.trim().toUpperCase() === targetCode
      )
  );
  const localUsed = Boolean(
    targetCode &&
      (customerContext.localUsedCoupons || []).some(c => c.trim().toUpperCase() === targetCode)
  );

  const couponUsesCount = Math.max(orderUsesCount, remoteUsed ? 1 : 0, localUsed ? 1 : 0);
  const hasIdentitySignal = Boolean(normPhone || isRealUid || normEmail);

  return {
    priorNonCancelledOrders,
    couponUsesCount,
    hasIdentitySignal,
  };
}

export function evaluateCoupon(
  rawCode: string,
  coupons?: Coupon[],
  subtotal: number = 0,
  currentDeliveryFee: number = 0,
  customerContext?: CouponCustomerContext
): CouponEvaluationResult {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      code: '',
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'empty',
      message: 'অনুগ্রহ করে একটি কুপন কোড লিখুন।',
    };
  }

  const activePool = coupons !== undefined ? coupons : DEFAULT_COUPONS;
  let matched = activePool.find(c => c.code.trim().toUpperCase() === cleanCode);
  if (!matched && cleanCode === 'BOOKFAIR' && coupons === undefined) {
    matched = {
      id: 'coupon-bookfair-alias',
      code: 'BOOKFAIR',
      title: 'Book Fair 10% Special',
      description: '10% Instant Book Fair Discount',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 300,
      badgeText: '10% OFF',
      isActive: true,
    };
  }

  if (!matched) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'not_found',
      message: `কুপন কোড "${cleanCode}" সঠিক নয় অথবা আর উপলব্ধ নেই।`,
    };
  }

  if (matched.isActive === false) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'inactive',
      message: `কুপন কোড "${cleanCode}" বর্তমানে বন্ধ বা নিষ্ক্রিয় রয়েছে।`,
    };
  }

  const now = customerContext?.now ?? Date.now();
  if (matched.startsAt && matched.startsAt > 0 && now < matched.startsAt) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'scheduled',
      message: `কুপন "${cleanCode}" এখনও চালু হয়নি (${formatCouponScheduleDate(matched.startsAt)} থেকে শুরু হবে)।`,
    };
  }

  if (matched.expiresAt && matched.expiresAt > 0 && now > matched.expiresAt) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'expired',
      message: `কুপন কোড "${cleanCode}"-এর মেয়াদ শেষ হয়ে গেছে।`,
    };
  }

  if (
    typeof matched.usageLimit === 'number' &&
    matched.usageLimit > 0 &&
    (matched.usageCount || 0) >= matched.usageLimit
  ) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'usage_limit',
      message: `কুপন "${cleanCode}"-এর সর্বোচ্চ ব্যবহার সীমা পূর্ণ হয়ে গেছে।`,
    };
  }

  const history = getCustomerOrderHistorySignals(customerContext, cleanCode);
  if (matched.firstOrderOnly && history.priorNonCancelledOrders > 0) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'first_order_only',
      message: `"${cleanCode}" শুধুমাত্র প্রথম অর্ডারের (First Purchase) জন্য প্রযোজ্য। আপনার আগে থেকেই অর্ডার রয়েছে।`,
    };
  }

  if (
    typeof matched.perCustomerLimit === 'number' &&
    matched.perCustomerLimit > 0 &&
    history.couponUsesCount >= matched.perCustomerLimit
  ) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'per_customer_limit',
      message: `আপনি ইতোমধ্যে "${cleanCode}" কুপনটি সর্বোচ্চ সীমা অনুযায়ী ব্যবহার করেছেন।`,
    };
  }

  const minOrder = Number(matched.minOrderAmount) || 0;
  if (subtotal < minOrder) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      ineligibleReason: 'min_order',
      message: `এই কুপনটি ব্যবহার করতে কমপক্ষে ৳${minOrder} টাকার অর্ডার হতে হবে (আরো ৳${minOrder - subtotal} যোগ করুন)।`,
    };
  }

  const pendingPhoneVerification = Boolean(matched.firstOrderOnly && !normalizeCouponPhoneLast10(customerContext?.phone));

  if (matched.discountType === 'free_delivery') {
    return {
      valid: true,
      code: cleanCode,
      discount: 0,
      freeDelivery: true,
      coupon: matched,
      pendingPhoneVerification,
      message: pendingPhoneVerification
        ? `"${cleanCode}" অ্যাপ্লাই হয়েছে — সম্পূর্ণ ফ্রি ডেলিভারি (৳${currentDeliveryFee} সেভ)। মোবাইল নম্বর দিলে ১ম অর্ডার যাচাই হবে।`
        : `"${cleanCode}" কুপন অ্যাপ্লাই হয়েছে — সম্পূর্ণ ফ্রি ডেলিভারি (৳${currentDeliveryFee} সেভ)!`,
    };
  }

  let discount = 0;
  if (matched.discountType === 'percentage') {
    const rawPct = Math.round((subtotal * (Number(matched.discountValue) || 0)) / 100);
    const cap =
      matched.maxDiscountAmount && matched.maxDiscountAmount > 0 ? matched.maxDiscountAmount : rawPct;
    discount = Math.min(subtotal, Math.min(rawPct, cap));
  } else if (matched.discountType === 'fixed') {
    discount = Math.min(subtotal, Math.max(0, Number(matched.discountValue) || 0));
  }

  return {
    valid: true,
    code: cleanCode,
    discount,
    freeDelivery: false,
    coupon: matched,
    pendingPhoneVerification,
    message: pendingPhoneVerification
      ? `"${cleanCode}" অ্যাপ্লাই হয়েছে — ৳${discount} ছাড়! (চেকআউটে মোবাইল নম্বর দিলে ১ম অর্ডার যাচাই হবে)`
      : `"${cleanCode}" কুপন অ্যাপ্লাই হয়েছে — ৳${discount} ডিসকাউন্ট পাওয়া গেছে!`,
  };
}

export function resolvePopupCoupons(coupons: Coupon[], now: number = Date.now()): Coupon[] {
  return (coupons || [])
    .filter(c => c && c.showAsPopup === true && getCouponScheduleState(c, now).isLive)
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
}

export function shouldDisplayCouponPopup(params: {
  coupons: Coupon[];
  settings?: Partial<StoreSettings>;
  activePage: string;
  now?: number;
  sessionDismissedKey?: string | null;
  lastDismissedAt?: number | null;
  lastDismissedKey?: string | null;
}): { show: boolean; primaryCoupon: Coupon | null; allPopupCoupons: Coupon[]; popupKey: string } {
  const {
    coupons,
    settings,
    activePage,
    now = Date.now(),
    sessionDismissedKey,
    lastDismissedAt,
    lastDismissedKey,
  } = params;

  if (settings?.enableCouponPopup === false) {
    return { show: false, primaryCoupon: null, allPopupCoupons: [], popupKey: '' };
  }

  const allowedPages = ['home', 'books', 'shop', 'stationery', 'product-detail', 'authors', 'publishers'];
  if (!allowedPages.includes(activePage)) {
    return { show: false, primaryCoupon: null, allPopupCoupons: [], popupKey: '' };
  }

  const livePopupCoupons = resolvePopupCoupons(coupons, now);
  if (livePopupCoupons.length === 0) {
    return { show: false, primaryCoupon: null, allPopupCoupons: [], popupKey: '' };
  }

  const primaryCoupon = livePopupCoupons[0];
  const popupKey = `${primaryCoupon.id}:${primaryCoupon.updatedAt || primaryCoupon.createdAt || 0}`;
  const frequency = settings?.couponPopupFrequency || 'once_per_session';

  if (frequency === 'once_per_session' && sessionDismissedKey === popupKey) {
    return { show: false, primaryCoupon, allPopupCoupons: livePopupCoupons, popupKey };
  }

  if (
    frequency === 'once_per_day' &&
    lastDismissedKey === popupKey &&
    lastDismissedAt &&
    now - lastDismissedAt < 86400000
  ) {
    return { show: false, primaryCoupon, allPopupCoupons: livePopupCoupons, popupKey };
  }

  return {
    show: true,
    primaryCoupon,
    allPopupCoupons: livePopupCoupons,
    popupKey,
  };
}

export interface CheckoutPricingInput {
  cart: CartItem[];
  products: Product[];
  district: string;
  deliveryType: 'standard' | 'sundarban';
  settings: Partial<StoreSettings>;
  couponCode?: string;
  coupons?: Coupon[];
  customerContext?: CouponCustomerContext;
}

export interface CheckoutPricingSummary {
  subtotal: number;
  totalQuantity: number;
  baseDelivery: number;
  extraWeightCharge: number;
  deliveryCharge: number;
  hasFreeDelivery: boolean;
  freeDeliveryReason: 'product' | 'threshold' | 'coupon' | null;
  discount: number;
  appliedCoupon: CouponEvaluationResult | null;
  total: number;
}

export function calculateCheckoutPricing({
  cart,
  products,
  district,
  deliveryType,
  settings,
  couponCode,
  coupons,
  customerContext,
}: CheckoutPricingInput): CheckoutPricingSummary {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const hasProductFreeDelivery =
    cart.length > 0 &&
    cart.some(item => {
      const prod = (products || []).find(p => p.id === item.productId);
      return prod?.isFreeDelivery === true || prod?.deliveryChargeType === 'free';
    });

  const freeThreshold = settings.freeShippingThreshold ?? 2000;
  const reachesFreeThreshold = freeThreshold > 0 && subtotal >= freeThreshold;

  let baseDelivery = 0;
  if (deliveryType === 'sundarban') {
    const customSundarbanFee = cart
      .map(item => (products || []).find(p => p.id === item.productId)?.sundarbanDeliveryFee)
      .find(fee => fee !== undefined && fee > 0);
    baseDelivery = customSundarbanFee ?? (settings.sundarbanDeliveryCharge ?? 120);
  } else {
    const cleanDistrict = (district || '').trim().toLowerCase();
    if (cleanDistrict === 'dhaka') {
      const customInside = cart
        .map(item => {
          const p = (products || []).find(pr => pr.id === item.productId);
          return p?.insideDhakaFee ?? p?.homeDeliveryFee;
        })
        .find(f => f !== undefined && f > 0);
      baseDelivery = customInside ?? (settings.insideDhakaCharge ?? 60);
    } else if (cleanDistrict === 'sub area') {
      const customSub = cart
        .map(item => (products || []).find(p => p.id === item.productId)?.subAreaFee)
        .find(f => f !== undefined && f > 0);
      baseDelivery = customSub ?? (settings.subAreaCharge ?? 90);
    } else {
      const customOutside = cart
        .map(item => (products || []).find(p => p.id === item.productId)?.outsideDhakaFee)
        .find(f => f !== undefined && f > 0);
      baseDelivery = customOutside ?? (settings.outsideDhakaCharge ?? 120);
    }
  }

  const perKgFee = settings.extraWeightChargePerKg ?? 20;
  const extraWeightCharge = totalQuantity > 1 ? (totalQuantity - 1) * perKgFee : 0;
  const rawDeliveryTotal = baseDelivery + extraWeightCharge;

  let appliedCoupon: CouponEvaluationResult | null = null;
  if (couponCode && couponCode.trim()) {
    appliedCoupon = evaluateCoupon(
      couponCode,
      coupons !== undefined ? coupons : DEFAULT_COUPONS,
      subtotal,
      rawDeliveryTotal,
      customerContext
    );
  }

  const couponFreeDelivery = Boolean(appliedCoupon?.valid && appliedCoupon.freeDelivery);
  const hasFreeDelivery = hasProductFreeDelivery || reachesFreeThreshold || couponFreeDelivery;
  const freeDeliveryReason: 'product' | 'threshold' | 'coupon' | null = hasProductFreeDelivery
    ? 'product'
    : reachesFreeThreshold
    ? 'threshold'
    : couponFreeDelivery
    ? 'coupon'
    : null;

  const effectiveBaseDelivery = hasFreeDelivery ? 0 : baseDelivery;
  const effectiveExtraWeight = hasFreeDelivery ? 0 : extraWeightCharge;
  const deliveryCharge = hasFreeDelivery ? 0 : rawDeliveryTotal;
  const discount = appliedCoupon?.valid ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  return {
    subtotal,
    totalQuantity,
    baseDelivery: effectiveBaseDelivery,
    extraWeightCharge: effectiveExtraWeight,
    deliveryCharge,
    hasFreeDelivery,
    freeDeliveryReason,
    discount,
    appliedCoupon,
    total,
  };
}

export interface VariantFormatDescription {
  formatLabel: string;
  headline: string;
  detailsText: string;
  highlights: string[];
  savingsAmount: number;
}

export function resolveVariantFormatDescription(
  product: Product,
  variant: ProductVariant
): VariantFormatDescription {
  const name = (variant?.name || product?.edition || 'Standard').trim();
  const lower = name.toLowerCase();
  const savingsAmount =
    variant?.previousPrice && variant.previousPrice > variant.price
      ? variant.previousPrice - variant.price
      : 0;

  if (variant?.description && variant.description.trim()) {
    return {
      formatLabel: name,
      headline: `${name} Edition`,
      detailsText: variant.description.trim(),
      highlights: [
        `Price: ৳${variant.price}`,
        `SKU: ${variant.sku || product.sku}`,
        variant.stock > 0 ? `In Stock (${variant.stock})` : 'Out of Stock',
      ],
      savingsAmount,
    };
  }

  if (product.type === 'stationery') {
    return {
      formatLabel: name,
      headline: `${name} Variant`,
      detailsText: `Selected ${name} option for "${product.title}". Authentic ${product.brand || 'premium'} quality, carefully inspected and packed for safe delivery.`,
      highlights: [
        `Price: ৳${variant.price}`,
        `Brand: ${product.brand || 'Premium Brand'}`,
        `SKU: ${variant.sku || product.sku}`,
      ],
      savingsAmount,
    };
  }

  if (lower.includes('hardcover') || lower.includes('hard cover')) {
    return {
      formatLabel: name,
      headline: `${name} — Hardbound Edition`,
      detailsText: `Hardcover edition of "${product.title}" with reinforced board binding, crisp offset print, and 80-100 GSM eye-comfort paper — ideal for long-term collecting and gifting.`,
      highlights: [
        'Durable sewn hardboard binding',
        '80-100 GSM eye-comfort paper',
        `Pages: ${product.pages || 'Standard'} · ৳${variant.price}`,
      ],
      savingsAmount,
    };
  }

  if (lower.includes('premium') || lower.includes('deluxe') || lower.includes('original')) {
    return {
      formatLabel: name,
      headline: `${name} — Official Publisher Print`,
      detailsText: `Authentic publisher print edition of "${product.title}" featuring high-grade cream paper and sharp typography.`,
      highlights: [
        `Publisher: ${product.publisher || 'Official Publisher'}`,
        '100% Original Publisher Edition',
        `Price: ৳${variant.price}`,
      ],
      savingsAmount,
    };
  }

  if (lower.includes('pdf') || lower.includes('ebook')) {
    return {
      formatLabel: name,
      headline: `${name} — Digital Format`,
      detailsText: `High-resolution digital edition optimized for mobile, tablet, and desktop reading.`,
      highlights: [
        'Readable across all devices',
        'Instant digital access & crisp layout',
        `Price: ৳${variant.price}`,
      ],
      savingsAmount,
    };
  }

  // Paperback / Regular Print / Default
  return {
    formatLabel: name,
    headline: `${name} — Standard Paperback`,
    detailsText: `Lightweight ${name} edition of "${product.title}" printed on clean readable paper for comfortable everyday reading.`,
    highlights: [
      'Lightweight paperback binding',
      `Language: ${product.language || 'Bengali'} · Pages: ${product.pages || 'Standard'}`,
      `Price: ৳${variant.price}`,
    ],
    savingsAmount,
  };
}

export interface ProductDetailsPresentation {
  isBook: boolean;
  isStationery: boolean;
  descriptionSubtitle: string;
  authenticityBadge: string;
  cardBadgeLabel: string;
  detailsHeading: string;
  detailsSubtitle: string;
  deliveryScheduleSubtitle: string;
  typeTag: string;
  creatorLabel: string;
}

export function resolveProductDetailsPresentation(
  product: Pick<Product, 'type' | 'author' | 'brand' | 'category'>
): ProductDetailsPresentation {
  const isStationery = product.type === 'stationery';
  return {
    isBook: !isStationery,
    isStationery,
    descriptionSubtitle: isStationery
      ? 'Overview, features & stationery specifications'
      : 'Overview, summary & book details',
    authenticityBadge: isStationery ? '100% Authentic Stationery' : '100% Original Copy',
    cardBadgeLabel: isStationery ? 'অরিজিনাল প্রোডাক্ট' : 'অরিজিনাল বই',
    detailsHeading: isStationery ? 'Product Specifications' : 'Book Details',
    detailsSubtitle: isStationery
      ? 'Brand, material, dimensions, model & SKU'
      : 'Author, publisher, edition, pages, language & ISBN',
    deliveryScheduleSubtitle: isStationery
      ? 'Estimated shipping schedule for this item'
      : 'Estimated dispatch & delivery schedule',
    typeTag: isStationery ? 'Stationery' : 'Book',
    creatorLabel: isStationery
      ? product.brand || product.category || 'Premium Stationery'
      : product.author || product.category || 'Renowned Author',
  };
}

export const DEFAULT_FOOTER_QUICK_LINKS: FooterQuickLinkItem[] = [
  { id: 'ql-1', label: 'Home', page: 'home', isActive: true },
  { id: 'ql-2', label: 'Books Catalog', page: 'books', isActive: true },
  { id: 'ql-3', label: 'Stationery', page: 'stationery', isActive: true },
  { id: 'ql-4', label: 'Authors', page: 'authors', isActive: true },
  { id: 'ql-publishers', label: 'Publishers / প্রকাশনী', page: 'publishers', isActive: true },
  { id: 'ql-5', label: 'Track Orders', page: 'track-order', isActive: true },
];

export function resolveFooterQuickLinks(configured?: FooterQuickLinkItem[]): FooterQuickLinkItem[] {
  if (!configured || configured.length === 0) {
    return DEFAULT_FOOTER_QUICK_LINKS.filter(l => l.isActive !== false);
  }
  const hasPublisherEntry = configured.some(
    l => l.page === 'publishers' || l.id === 'ql-publishers'
  );
  const combined = [...configured];
  if (!hasPublisherEntry) {
    // Insert right after Authors (or before Track Orders) so legacy Firestore lists include Publishers automatically
    const trackIdx = combined.findIndex(l => l.page === 'track-order');
    const pubItem: FooterQuickLinkItem = {
      id: 'ql-publishers',
      label: 'Publishers / প্রকাশনী',
      page: 'publishers',
      isActive: true,
    };
    if (trackIdx >= 0) {
      combined.splice(trackIdx, 0, pubItem);
    } else {
      combined.push(pubItem);
    }
  }
  return combined.filter(l => l.isActive !== false);
}

export type SpotlightSearchScope = 'all' | 'books' | 'stationery' | 'authors' | 'publishers';

export interface SpotlightSearchResults {
  products: Product[];
  authors: Author[];
  publishers: Publisher[];
  categories: Category[];
}

export function filterSpotlightSearch(
  query: string,
  scope: SpotlightSearchScope,
  products: Product[],
  authors: Author[],
  publishers: Publisher[],
  categories: Category[]
): SpotlightSearchResults {
  const q = (query || '').trim().toLowerCase();

  const matchingProducts = products.filter(p => {
    if (scope === 'books' && p.type !== 'book') return false;
    if (scope === 'stationery' && p.type !== 'stationery') return false;
    if (!q) return p.isFeatured !== false;
    return (
      p.title.toLowerCase().includes(q) ||
      (p.author && p.author.toLowerCase().includes(q)) ||
      (p.publisher && p.publisher.toLowerCase().includes(q)) ||
      (p.seriesName && p.seriesName.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const matchingAuthors =
    scope === 'stationery' || scope === 'publishers'
      ? []
      : authors.filter(a => !q || a.name.toLowerCase().includes(q) || a.bio.toLowerCase().includes(q));

  const matchingPublishers =
    scope === 'stationery' || scope === 'authors'
      ? []
      : publishers.filter(
          pub =>
            !q ||
            pub.name.toLowerCase().includes(q) ||
            (pub.banglaName && pub.banglaName.toLowerCase().includes(q))
        );

  const matchingCategories = categories.filter(
    c =>
      (!q || c.name.toLowerCase().includes(q)) &&
      (scope === 'all' ||
        (scope === 'books' && c.type === 'book') ||
        (scope === 'stationery' && c.type === 'stationery'))
  );

  return {
    products: matchingProducts.slice(0, 8),
    authors: matchingAuthors.slice(0, 5),
    publishers: matchingPublishers.slice(0, 5),
    categories: matchingCategories.slice(0, 6),
  };
}
