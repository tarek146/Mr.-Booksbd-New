import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount, calculateCartTotal, getDeliveryFee, sanitizeText } from './pricing.ts';

test('calculateDiscount returns percentage discount correctly', () => {
  assert.equal(calculateDiscount(450, 500), 10);
  assert.equal(calculateDiscount(300, 400), 25);
  assert.equal(calculateDiscount(500, 500), 0);
  assert.equal(calculateDiscount(600, 500), 0);
  assert.equal(calculateDiscount(350), 0);
  assert.equal(calculateDiscount(-100, 500), 0); // negative price rejected
});

test('calculateCartTotal calculates subtotal and grand total with delivery and discount', () => {
  const items = [
    { price: 450, quantity: 2 },
    { price: 200, quantity: 1 }
  ];
  const { subtotal, total } = calculateCartTotal(items, 60, 100);
  assert.equal(subtotal, 1100);
  assert.equal(total, 1060);
});

test('Security: calculateCartTotal prevents price and discount manipulation', () => {
  // Test scenario 1: Customer submits negative price or zero quantity
  const badItems = [
    { price: -50, quantity: 2 },
    { price: 300, quantity: 0 },
    { price: 200, quantity: 2 }
  ];
  const res1 = calculateCartTotal(badItems, 60, 0);
  assert.equal(res1.subtotal, 400); // only positive valid items counted
  assert.equal(res1.total, 460);

  // Test scenario 2: Customer manipulates discount = 999999
  const validItems = [{ price: 500, quantity: 1 }];
  const res2 = calculateCartTotal(validItems, 60, 999999);
  assert.equal(res2.subtotal, 500);
  // Discount is capped safely at max allowed (300 BDT cap)
  assert.equal(res2.total, 500 - 300 + 60); // 260
  assert.ok(res2.total >= 0, 'Total must never be negative');

  // Test scenario 3: Negative discount attempt (e.g. -500 to artificially increase or distort)
  const res3 = calculateCartTotal(validItems, 60, -500);
  assert.equal(res3.total, 560); // negative discount treated as 0

  // Test scenario 4: Negative delivery charge attempt (e.g. deliveryCharge = -100)
  const res4 = calculateCartTotal(validItems, -100, 0);
  assert.equal(res4.total, 500); // negative delivery fee treated as 0
});

test('getDeliveryFee properly distinguishes Dhaka and applies free threshold', () => {
  assert.equal(getDeliveryFee('Dhaka', 60, 120), 60);
  assert.equal(getDeliveryFee('dhaka', 60, 120), 60);
  assert.equal(getDeliveryFee('Chittagong', 60, 120), 120);
  assert.equal(getDeliveryFee('Sylhet', 60, 120), 120);
  // Free delivery threshold test
  assert.equal(getDeliveryFee('Sylhet', 60, 120, 2000, 2500), 0);
});

test('Security: sanitizeText strips HTML tags to prevent XSS attacks', () => {
  assert.equal(sanitizeText('<script>alert(1)</script>Hello'), 'scriptalert(1)/scriptHello');
  assert.equal(sanitizeText('Normal Customer Name'), 'Normal Customer Name');
  assert.equal(sanitizeText('<img src="x" onerror="alert(1)">'), 'img src="x" onerror="alert(1)"');
});
