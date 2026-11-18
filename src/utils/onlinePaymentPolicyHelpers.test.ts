import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCheckoutOnlinePaymentSummary,
  clampOnlinePaymentPercent,
  formatOnlinePaymentRequirementBadge,
  getProductOnlinePaymentRequirement,
} from './onlinePaymentPolicyHelpers';
import { CartItem, Product } from '../types';

const makeProduct = (id: string, price: number, overrides: Partial<Product> = {}): Product => ({
  id,
  type: 'book',
  title: `Book ${id}`,
  slug: `book-${id}`,
  description: 'Desc',
  category: 'Books',
  images: [],
  price,
  stock: 20,
  sku: `SKU-${id}`,
  variants: [],
  rating: 5,
  reviewCount: 1,
  createdAt: 1000,
  ...overrides,
});

const makeCartItem = (id: string, price: number, quantity = 1): CartItem => ({
  productId: id,
  variantId: 'v1',
  title: `Book ${id}`,
  variantName: 'Paperback',
  price,
  image: '',
  quantity,
  stock: 20,
  type: 'book',
});

test('clampOnlinePaymentPercent clamps bounds and defaults missing values to 100', () => {
  assert.equal(clampOnlinePaymentPercent(undefined), 100);
  assert.equal(clampOnlinePaymentPercent(0), 1);
  assert.equal(clampOnlinePaymentPercent(-15), 1);
  assert.equal(clampOnlinePaymentPercent(150), 100);
  assert.equal(clampOnlinePaymentPercent(20), 20);
  assert.equal(clampOnlinePaymentPercent('50'), 50);
});

test('getProductOnlinePaymentRequirement and badge formatter report exact requirement states', () => {
  assert.deepEqual(getProductOnlinePaymentRequirement(makeProduct('p0', 300)), {
    required: false,
    percent: 0,
    isFullPrepaid: false,
  });
  assert.equal(formatOnlinePaymentRequirementBadge(makeProduct('p0', 300)), null);

  assert.deepEqual(
    getProductOnlinePaymentRequirement(
      makeProduct('p1', 300, { requireOnlinePayment: true, onlinePaymentPercent: 20 })
    ),
    { required: true, percent: 20, isFullPrepaid: false }
  );
  assert.equal(
    formatOnlinePaymentRequirementBadge(
      makeProduct('p1', 300, { requireOnlinePayment: true, onlinePaymentPercent: 20 })
    ),
    '20% Advance Online Required'
  );
  assert.equal(
    formatOnlinePaymentRequirementBadge(
      makeProduct('p2', 300, { requireOnlinePayment: true, onlinePaymentPercent: 100 })
    ),
    '100% Online Payment Required'
  );
});

test('calculateCheckoutOnlinePaymentSummary computes partial advance (10%, 20%, 50%) and full 100% accurately', () => {
  const book20 = makeProduct('b20', 500, { requireOnlinePayment: true, onlinePaymentPercent: 20 });
  const book100 = makeProduct('b100', 500, { requireOnlinePayment: true, onlinePaymentPercent: 100 });
  const bookCod = makeProduct('bcod', 300, { requireOnlinePayment: false });

  // 1. Standard COD product -> not required
  const codSummary = calculateCheckoutOnlinePaymentSummary({
    checkoutItems: [makeCartItem('bcod', 300)],
    products: [bookCod],
    subtotal: 300,
    deliveryCharge: 60,
    discount: 0,
    total: 360,
    deliveryType: 'standard',
  });
  assert.equal(codSummary.isOnlineRequired, false);
  assert.equal(codSummary.payNowAmount, 360);
  assert.equal(codSummary.dueOnDelivery, 0);

  // 2. Single 20% advance product -> 20% of 500 = 100 advance, 460 due on delivery
  const partialSummary = calculateCheckoutOnlinePaymentSummary({
    checkoutItems: [makeCartItem('b20', 500)],
    products: [book20],
    subtotal: 500,
    deliveryCharge: 60,
    discount: 0,
    total: 560,
    deliveryType: 'standard',
  });
  assert.equal(partialSummary.isOnlineRequired, true);
  assert.equal(partialSummary.isPartialAdvance, true);
  assert.equal(partialSummary.requiredPercent, 20);
  assert.equal(partialSummary.payNowAmount, 100);
  assert.equal(partialSummary.dueOnDelivery, 460);

  // 3. Mixed cart (20% book + normal COD book) -> advance applies only to required book
  const mixedSummary = calculateCheckoutOnlinePaymentSummary({
    checkoutItems: [makeCartItem('b20', 500), makeCartItem('bcod', 300)],
    products: [book20, bookCod],
    subtotal: 800,
    deliveryCharge: 60,
    discount: 0,
    total: 860,
    deliveryType: 'standard',
  });
  assert.equal(mixedSummary.isOnlineRequired, true);
  assert.equal(mixedSummary.isPartialAdvance, true);
  assert.equal(mixedSummary.payNowAmount, 100);
  assert.equal(mixedSummary.dueOnDelivery, 760);

  // 4. Coupon discount scales partial advance proportionally (10% discount on 500 => net 450, 20% => 90)
  const discountedPartial = calculateCheckoutOnlinePaymentSummary({
    checkoutItems: [makeCartItem('b20', 500)],
    products: [book20],
    subtotal: 500,
    deliveryCharge: 60,
    discount: 50,
    total: 510,
    deliveryType: 'standard',
  });
  assert.equal(discountedPartial.payNowAmount, 90);
  assert.equal(discountedPartial.dueOnDelivery, 420);

  // 5. 100% full online required item -> full order total (including delivery) online now, 0 COD
  const fullSummary = calculateCheckoutOnlinePaymentSummary({
    checkoutItems: [makeCartItem('b100', 500)],
    products: [book100],
    subtotal: 500,
    deliveryCharge: 60,
    discount: 0,
    total: 560,
    deliveryType: 'standard',
  });
  assert.equal(fullSummary.isOnlineRequired, true);
  assert.equal(fullSummary.isFullOnlineRequired, true);
  assert.equal(fullSummary.isPartialAdvance, false);
  assert.equal(fullSummary.payNowAmount, 560);
  assert.equal(fullSummary.dueOnDelivery, 0);

  // 6. Sundarban overrides partial item to 100% prepaid
  const sundarbanOverride = calculateCheckoutOnlinePaymentSummary({
    checkoutItems: [makeCartItem('b20', 500)],
    products: [book20],
    subtotal: 500,
    deliveryCharge: 120,
    discount: 0,
    total: 620,
    deliveryType: 'sundarban',
    sundarbanForcesPrepayment: true,
  });
  assert.equal(sundarbanOverride.isFullOnlineRequired, true);
  assert.equal(sundarbanOverride.payNowAmount, 620);
  assert.equal(sundarbanOverride.dueOnDelivery, 0);
});
