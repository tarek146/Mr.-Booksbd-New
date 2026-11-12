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
} from './storeEnhancementsHelpers.ts';
import type { Product, StoreSettings, CartItem } from '../types.ts';

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

test('resolveVariantFormatDescription dynamically updates description content based on selected format', () => {
  const pb = resolveVariantFormatDescription(sampleBook, sampleBook.variants[0]);
  const hc = resolveVariantFormatDescription(sampleBook, sampleBook.variants[1]);

  assert.equal(pb.formatLabel, 'Paperback');
  assert.match(pb.headline, /পেপারব্যাক|Paperback/);
  assert.equal(hc.formatLabel, 'Hardcover');
  assert.match(hc.headline, /হার্ডকভার|Hardcover/);
  assert.notEqual(pb.detailsText, hc.detailsText);
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
  assert.doesNotMatch(statPres.deliveryScheduleSubtitle, /বইটির/);
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
