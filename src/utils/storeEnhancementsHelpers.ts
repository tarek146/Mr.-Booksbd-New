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
}

export function resolveActiveCoupons(storedCoupons?: Coupon[]): Coupon[] {
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
  return DEFAULT_COUPONS;
}

export function evaluateCoupon(
  rawCode: string,
  coupons: Coupon[],
  subtotal: number,
  currentDeliveryFee: number = 0
): CouponEvaluationResult {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      code: '',
      discount: 0,
      freeDelivery: false,
      message: 'অনুগ্রহ করে একটি কুপন কোড লিখুন।',
    };
  }

  // Backward-compatible alias BOOKFAIR -> 10% off if not explicitly in stored list
  const activePool = coupons && coupons.length > 0 ? coupons : DEFAULT_COUPONS;
  let matched = activePool.find(c => c.code.trim().toUpperCase() === cleanCode);
  if (!matched && cleanCode === 'BOOKFAIR') {
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

  if (!matched || matched.isActive === false) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      message: `কুপন কোড "${cleanCode}" সঠিক নয় অথবা মেয়াদ শেষ হয়েছে।`,
    };
  }

  if (matched.expiresAt && matched.expiresAt > 0 && Date.now() > matched.expiresAt) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      message: `কুপন কোড "${cleanCode}"-এর মেয়াদ শেষ হয়ে গেছে।`,
    };
  }

  const minOrder = Number(matched.minOrderAmount) || 0;
  if (subtotal < minOrder) {
    return {
      valid: false,
      code: cleanCode,
      discount: 0,
      freeDelivery: false,
      message: `এই কুপনটি ব্যবহার করতে কমপক্ষে ৳${minOrder} টাকার অর্ডার হতে হবে (আরো ৳${minOrder - subtotal} যোগ করুন)।`,
    };
  }

  if (matched.discountType === 'free_delivery') {
    return {
      valid: true,
      code: cleanCode,
      discount: 0,
      freeDelivery: true,
      coupon: matched,
      message: `🎉 "${cleanCode}" কুপন অ্যাপ্লাই হয়েছে — সম্পূর্ণ ফ্রি ডেলিভারি (৳${currentDeliveryFee} সেভ)!`,
    };
  }

  let discount = 0;
  if (matched.discountType === 'percentage') {
    const rawPct = Math.round((subtotal * (Number(matched.discountValue) || 0)) / 100);
    const cap = matched.maxDiscountAmount && matched.maxDiscountAmount > 0 ? matched.maxDiscountAmount : rawPct;
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
    message: `🎉 "${cleanCode}" কুপন অ্যাপ্লাই হয়েছে — ৳${discount} ডিসকাউন্ট পাওয়া গেছে!`,
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
    appliedCoupon = evaluateCoupon(couponCode, coupons || DEFAULT_COUPONS, subtotal, rawDeliveryTotal);
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
      headline: `${name} — নির্বাচিত এডিশন বিবরণ`,
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
      headline: `নির্বাচিত ভ্যারিয়েন্ট: ${name}`,
      detailsText: `আপনি "${product.title}" প্রোডাক্টটির ${name} ভ্যারিয়েন্টটি নির্বাচন করেছেন। প্রিমিয়াম ${product.brand || 'অরিজিনাল'} কোয়ালিটি এবং নিখুঁত ফিনিশিং সহ ডেলিভারির জন্য প্রস্তুত।`,
      highlights: [
        `ভ্যারিয়েন্ট মূল্য: ৳${variant.price}`,
        `ব্র্যান্ড: ${product.brand || 'Premium Brand'}`,
        `কোড (SKU): ${variant.sku || product.sku}`,
      ],
      savingsAmount,
    };
  }

  if (lower.includes('hardcover') || lower.includes('hard cover')) {
    return {
      formatLabel: name,
      headline: `${name} (মজবুত হার্ডকভার বাঁধাই)`,
      detailsText: `${product.title}-এর এই হার্ডকভার সংস্করণটি টেকসই বোর্ড বাইন্ডিং, প্রিমিয়াম ৮০-১০০ জিএসএম অফ-হোয়াইট কাগজ এবং স্পষ্ট ঝকঝকে মুদ্রণে তৈরি — সংগ্রহ ও উপহারের জন্য সেরা।`,
      highlights: [
        'টেকসই হার্ডবোর্ড ও সেলাই বাইন্ডিং',
        'প্রিমিয়াম আই-কম্ফোর্ট পেপার কোয়ালিটি',
        `পৃষ্ঠা: ${product.pages || 'স্ট্যান্ডার্ড'} • সংস্করণ মূল্য: ৳${variant.price}`,
      ],
      savingsAmount,
    };
  }

  if (lower.includes('premium') || lower.includes('deluxe') || lower.includes('original')) {
    return {
      formatLabel: name,
      headline: `${name} (অফিসিয়াল প্রিমিয়াম প্রিন্ট)`,
      detailsText: `${product.title}-এর ${name} সংস্করণটিতে রয়েছে প্রকাশকের মূল অরিজিনাল প্রিন্ট, ক্রিম/হাই-গ্রেড কাগজ ও নিখুঁত ফন্ট ক্লিয়ারিটি।`,
      highlights: [
        `প্রকাশনী: ${product.publisher || 'স্বনামধন্য প্রকাশনী'}`,
        '১০০% অরিজিনাল পাবলিশার্স এডিশন',
        `সংস্করণ মূল্য: ৳${variant.price}`,
      ],
      savingsAmount,
    };
  }

  if (lower.includes('pdf') || lower.includes('ebook')) {
    return {
      formatLabel: name,
      headline: `${name} (ডিজিটাল ই-বুক ফরম্যাট)`,
      detailsText: `এই ফরম্যাটটি অর্ডার করলে মোবাইল, ট্যাব ও কম্পিউটারে পড়ার উপযোগী হাই-রেজোলিউশন ডিজিটাল ফরম্যাট সরবরাহ করা হবে।`,
      highlights: [
        'যেকোনো ডিভাইসে পড়ার উপযোগী',
        'দ্রুত ডেলিভারি ও ক্লিয়ার টেক্সট',
        `মূল্য: ৳${variant.price}`,
      ],
      savingsAmount,
    };
  }

  // Paperback / Regular Print / Default
  return {
    formatLabel: name,
    headline: `${name} (স্ট্যান্ডার্ড পেপারব্যাক এডিশন)`,
    detailsText: `${product.title}-এর ${name} সংস্করণটি হালকা, আরামদায়ক ও হাতে নিয়ে পড়ার জন্য উপযোগী। ঝকঝকে মুদ্রণ এবং সুন্দর ফিনিশিং সহ সরাসরি সংগ্রহ থেকে সরবরাহ করা হয়।`,
    highlights: [
      `সহজপাঠ্য ও হালকা পেপারব্যাক বাঁধাই`,
      `ভাষা: ${product.language || 'Bengali'} • পৃষ্ঠা: ${product.pages || 'স্ট্যান্ডার্ড'}`,
      `সংস্করণ মূল্য: ৳${variant.price}`,
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
      ? 'Brand, material, dimensions, model, SKU & delivery timing'
      : 'Author, publisher, edition, pages, language, ISBN & delivery timing',
    deliveryScheduleSubtitle: isStationery
      ? 'এই প্রোডাক্টটির জন্য নির্ধারিত ডেলিভারি সময়সূচী'
      : 'এই বইটির জন্য নির্ধারিত ডেলিভারি সময়সূচী',
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
