import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COUPONS,
  evaluateCoupon,
  calculateCheckoutPricing,
  resolveVariantFormatDescription,
  resolveProductDetailsPresentation,
  resolveFooterQuickLinks,
  filterSpotlightSearch,
  getCouponScheduleState,
  formatDurationCompact,
  resolveActiveCoupons,
  resolvePopupCoupons,
  shouldDisplayCouponPopup,
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
} from './storeEnhancementsHelpers.ts';
import type { Coupon, Product, StoreSettings, CartItem } from '../types.ts';

const sampleBook: Product = {
  id: 'prod-1',
  type: 'book',
  title: 'Paradoxical Sajid 2',
  slug: 'paradoxical-sajid-2',
  description: 'Philosophical responses and apologetics.',
  category: 'Islamic Books',
  author: 'Arif Azad',
  publisher: 'Guardian Publications',
  images: ['cover.jpg'],
  price: 350,
  previousPrice: 420,
  stock: 50,
  sku: 'BK-PS2',
  variants: [
    { id: 'v1', name: 'Paperback', price: 350, previousPrice: 420, stock: 30, sku: 'BK-PS2-PB' },
    { id: 'v2', name: 'Hardcover', price: 480, previousPrice: 550, stock: 20, sku: 'BK-PS2-HC' },
  ],
  rating: 4.9,
  reviewCount: 100,
  createdAt: 1000,
};

const sampleStationery: Product = {
  id: 'prod-4',
  type: 'stationery',
  title: 'Premium Leather Diary 2026',
  slug: 'diary-2026',
  description: 'A5 diary with 200 GSM pages.',
  category: 'Notebooks & Diaries',
  brand: 'Moleskine',
  images: ['diary.jpg'],
  price: 450,
  stock: 20,
  sku: 'ST-DIARY',
  variants: [
    { id: 'v1', name: 'Classic Black A5', price: 450, stock: 20, sku: 'ST-BLK' },
  ],
  rating: 4.8,
  reviewCount: 50,
  createdAt: 1000,
};

test('evaluateCoupon supports percentage, fixed, and free_delivery coupons with minOrder validation', () => {
  const pct = evaluateCoupon('mrbooks10', DEFAULT_COUPONS, 500, 60);
  assert.equal(pct.valid, true);
  assert.equal(pct.discount, 50);
  assert.equal(pct.freeDelivery, false);

  const pctCap = evaluateCoupon('MRBOOKS10', DEFAULT_COUPONS, 5000, 60);
  assert.equal(pctCap.valid, true);
  assert.equal(pctCap.discount, 300);

  const freeDel = evaluateCoupon('FREEDEL', DEFAULT_COUPONS, 600, 120);
  assert.equal(freeDel.valid, true);
  assert.equal(freeDel.freeDelivery, true);
  assert.equal(freeDel.discount, 0);

  const flat = evaluateCoupon('BOOKFEST50', DEFAULT_COUPONS, 500, 60);
  assert.equal(flat.valid, true);
  assert.equal(flat.discount, 50);

  const belowMin = evaluateCoupon('BOOKFEST50', DEFAULT_COUPONS, 200, 60);
  assert.equal(belowMin.valid, false);
});

test('evaluateCoupon enforces startsAt, expiresAt, firstOrderOnly, perCustomerLimit, and usageLimit accurately', () => {
  const now = 1_760_000_000_000;
  const scheduledCoupon: Coupon = {
    id: 'c-sched',
    code: 'FUTURE20',
    title: 'Upcoming Offer',
    description: 'Starts later',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 0,
    isActive: true,
    startsAt: now + 3_600_000,
    expiresAt: now + 86_400_000,
  };
  const expiredCoupon: Coupon = {
    ...scheduledCoupon,
    id: 'c-exp',
    code: 'EXPIRED10',
    startsAt: now - 86_400_000,
    expiresAt: now - 1_000,
  };
  const firstOrderCoupon: Coupon = {
    id: 'c-first',
    code: 'WELCOME15',
    title: 'First Order 15%',
    description: 'Only for first purchase',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 200,
    maxDiscountAmount: 250,
    isActive: true,
    firstOrderOnly: true,
    perCustomerLimit: 1,
    usageLimit: 50,
    usageCount: 10,
    startsAt: now - 10_000,
    expiresAt: now + 3_600_000,
  };

  assert.equal(
    evaluateCoupon('FUTURE20', [scheduledCoupon], 500, 60, { now }).ineligibleReason,
    'scheduled'
  );
  assert.equal(
    evaluateCoupon('EXPIRED10', [expiredCoupon], 500, 60, { now }).ineligibleReason,
    'expired'
  );

  // First-time customer (no matching orders, only cancelled order allowed)
  const okFirst = evaluateCoupon('WELCOME15', [firstOrderCoupon], 1000, 60, {
    now,
    phone: '01711223344',
    orders: [
      { phone: '01711223344', orderStatus: 'cancelled' },
      { phone: '01999999999', orderStatus: 'delivered' },
    ],
  });
  assert.equal(okFirst.valid, true);
  assert.equal(okFirst.discount, 150);

  // Returning customer blocked by prior non-cancelled order (matches last 10 digits +880)
  const blockedRepeat = evaluateCoupon('WELCOME15', [firstOrderCoupon], 1000, 60, {
    now,
    phone: '+8801711223344',
    orders: [{ phone: '01711223344', orderStatus: 'confirmed' }],
  });
  assert.equal(blockedRepeat.valid, false);
  assert.equal(blockedRepeat.ineligibleReason, 'first_order_only');

  // Returning customer blocked via remoteProfile or localOrderHistoryPhones
  const blockedRemote = evaluateCoupon('WELCOME15', [firstOrderCoupon], 1000, 60, {
    now,
    phone: '01800001111',
    remoteProfile: { orderCount: 1, usedCoupons: [] },
  });
  assert.equal(blockedRemote.valid, false);
  assert.equal(blockedRemote.ineligibleReason, 'first_order_only');

  // Exhausted global usage limit
  const exhausted = evaluateCoupon(
    'WELCOME15',
    [{ ...firstOrderCoupon, usageCount: 50 }],
    1000,
    60,
    { now, phone: '01600001111' }
  );
  assert.equal(exhausted.valid, false);
  assert.equal(exhausted.ineligibleReason, 'usage_limit');

  // Deleted/empty pool must return invalid instead of reviving DEFAULT_COUPONS
  const deletedPool = evaluateCoupon('MRBOOKS10', [], 500, 60, { now });
  assert.equal(deletedPool.valid, false);
  assert.equal(deletedPool.ineligibleReason, 'not_found');
});

test('getCouponScheduleState, resolveActiveCoupons, and popup eligibility helpers work accurately', () => {
  const now = 1_760_000_000_000;
  assert.equal(formatDurationCompact(2 * 86_400_000 + 3 * 3_600_000 + 5 * 60_000), '2d 03h 05m');
  assert.equal(formatDurationCompact(3_600_000 + 65_000), '01h 01m 05s');

  const livePopup: Coupon = {
    id: 'c-pop',
    code: 'POP20',
    title: 'Flash Popup 20%',
    description: 'Enjoy 20% off today',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 0,
    isActive: true,
    showAsPopup: true,
    startsAt: now - 5_000,
    expiresAt: now + 7_200_000,
    createdAt: 100,
    updatedAt: 200,
  };
  const expiredPopup: Coupon = {
    ...livePopup,
    id: 'c-pop-old',
    code: 'OLD20',
    expiresAt: now - 1_000,
  };

  const stateLive = getCouponScheduleState(livePopup, now);
  assert.equal(stateLive.status, 'active');
  assert.equal(stateLive.isLive, true);
  assert.equal(stateLive.countdownLabel, '02h 00m 00s left');

  const stateExp = getCouponScheduleState(expiredPopup, now);
  assert.equal(stateExp.status, 'expired');
  assert.equal(stateExp.isLive, false);

  // resolveActiveCoupons respects allowFallbackDefaults=false when admin deleted all coupons
  assert.deepEqual(resolveActiveCoupons([], { allowFallbackDefaults: false }), []);
  assert.equal(
    resolveActiveCoupons([], {
      allowFallbackDefaults: true,
      dismissedIds: ['coupon-mrbooks10'],
    }).some(c => c.id === 'coupon-mrbooks10'),
    false
  );

  // Popup coupons only include live showAsPopup coupons
  const popups = resolvePopupCoupons([expiredPopup, livePopup], now);
  assert.equal(popups.length, 1);
  assert.equal(popups[0].code, 'POP20');

  const homeShow = shouldDisplayCouponPopup({
    coupons: [livePopup],
    settings: { enableCouponPopup: true, couponPopupFrequency: 'once_per_session' },
    activePage: 'home',
    now,
    sessionDismissedKey: null,
  });
  assert.equal(homeShow.show, true);
  assert.equal(homeShow.primaryCoupon?.code, 'POP20');

  const dismissedSameSession = shouldDisplayCouponPopup({
    coupons: [livePopup],
    settings: { enableCouponPopup: true, couponPopupFrequency: 'once_per_session' },
    activePage: 'home',
    now,
    sessionDismissedKey: homeShow.popupKey,
  });
  assert.equal(dismissedSameSession.show, false);

  const checkoutBlocked = shouldDisplayCouponPopup({
    coupons: [livePopup],
    settings: { enableCouponPopup: true },
    activePage: 'checkout',
    now,
  });
  assert.equal(checkoutBlocked.show, false);

  // Round-trip datetime-local conversion
  const roundTrip = fromDateTimeLocalValue(toDateTimeLocalValue(1_760_000_020_000));
  assert.ok(roundTrip && Math.abs(roundTrip - 1_760_000_000_000) < 60_000);
});

test('calculateCheckoutPricing applies Sub Area, extraWeightChargePerKg, freeShippingThreshold, and coupon discount accurately', () => {
  const settings: Partial<StoreSettings> = {
    insideDhakaCharge: 60,
    subAreaCharge: 95,
    outsideDhakaCharge: 120,
    sundarbanDeliveryCharge: 130,
    extraWeightChargePerKg: 25,
    freeShippingThreshold: 1500,
  };

  const cart: CartItem[] = [
    {
      productId: 'prod-1',
      variantId: 'v1',
      title: 'Paradoxical Sajid 2',
      variantName: 'Paperback',
      price: 350,
      image: 'cover.jpg',
      quantity: 2,
      stock: 30,
      type: 'book',
    },
  ];

  // Subtotal = 700, Sub Area = 95, extraWeight (2-1)*25 = 25 => delivery 120, coupon MRBOOKS10 => 70 discount
  const res = calculateCheckoutPricing({
    cart,
    products: [sampleBook],
    district: 'Sub Area',
    deliveryType: 'standard',
    settings,
    couponCode: 'MRBOOKS10',
    coupons: DEFAULT_COUPONS,
  });

  assert.equal(res.subtotal, 700);
  assert.equal(res.baseDelivery, 95);
  assert.equal(res.extraWeightCharge, 25);
  assert.equal(res.deliveryCharge, 120);
  assert.equal(res.discount, 70);
  assert.equal(res.total, 700 - 70 + 120);

  // FREEDEL zeroes delivery
  const freeRes = calculateCheckoutPricing({
    cart,
    products: [sampleBook],
    district: 'Sylhet',
    deliveryType: 'standard',
    settings,
    couponCode: 'FREEDEL',
    coupons: DEFAULT_COUPONS,
  });
  assert.equal(freeRes.hasFreeDelivery, true);
  assert.equal(freeRes.deliveryCharge, 0);
  assert.equal(freeRes.total, 700);
});

test('resolveVariantFormatDescription dynamically updates description content based on selected format in English', () => {
  const pb = resolveVariantFormatDescription(sampleBook, sampleBook.variants[0]);
  const hc = resolveVariantFormatDescription(sampleBook, sampleBook.variants[1]);

  assert.equal(pb.formatLabel, 'Paperback');
  assert.match(pb.headline, /Paperback/);
  assert.equal(hc.formatLabel, 'Hardcover');
  assert.match(hc.headline, /Hardcover/);
  assert.notEqual(pb.detailsText, hc.detailsText);
  assert.doesNotMatch(pb.headline, /[\u0980-\u09FF]/);
  assert.doesNotMatch(pb.detailsText, /[\u0980-\u09FF]/);
  assert.doesNotMatch(hc.headline, /[\u0980-\u09FF]/);
  assert.doesNotMatch(hc.detailsText, /[\u0980-\u09FF]/);
});

test('resolveProductDetailsPresentation eliminates Book/Original Copy/Author labels for stationery items', () => {
  const bookPres = resolveProductDetailsPresentation(sampleBook);
  const statPres = resolveProductDetailsPresentation(sampleStationery);

  assert.equal(bookPres.detailsHeading, 'Book Details');
  assert.equal(bookPres.cardBadgeLabel, 'অরিজিনাল বই');
  assert.equal(statPres.isStationery, true);
  assert.equal(statPres.detailsHeading, 'Product Specifications');
  assert.equal(statPres.authenticityBadge, '100% Authentic Stationery');
  assert.equal(statPres.cardBadgeLabel, 'অরিজিনাল প্রোডাক্ট');
  assert.doesNotMatch(statPres.descriptionSubtitle, /book details/i);
  assert.doesNotMatch(bookPres.detailsSubtitle, /delivery timing/i);
  assert.doesNotMatch(statPres.deliveryScheduleSubtitle, /[\u0980-\u09FF]/);
  assert.doesNotMatch(bookPres.deliveryScheduleSubtitle, /[\u0980-\u09FF]/);
});

test('resolveFooterQuickLinks guarantees Publishers link even on legacy saved link lists', () => {
  const legacyLinks = [
    { id: 'ql-1', label: 'Home', page: 'home', isActive: true },
    { id: 'ql-5', label: 'Track Orders', page: 'track-order', isActive: true },
  ];
  const resolved = resolveFooterQuickLinks(legacyLinks);
  assert.ok(resolved.some(l => l.page === 'publishers'));
});

test('filterSpotlightSearch finds books, authors, and stationery accurately', () => {
  const res = filterSpotlightSearch(
    'sajid',
    'all',
    [sampleBook, sampleStationery],
    [{ id: 'a1', name: 'Arif Azad', bio: 'Author' }],
    [{ id: 'pub-1', name: 'Guardian Publications', banglaName: 'গার্ডিয়ান পাবলিকেশন্স' }],
    []
  );
  assert.equal(res.products.length, 1);
  assert.equal(res.products[0].id, 'prod-1');
});
