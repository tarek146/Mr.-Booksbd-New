import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount, calculateCartTotal, getDeliveryFee } from './pricing.ts';

test('calculateDiscount returns percentage discount correctly', () => {
  assert.equal(calculateDiscount(450, 500), 10);
  assert.equal(calculateDiscount(300, 400), 25);
  assert.equal(calculateDiscount(500, 500), 0);
  assert.equal(calculateDiscount(600, 500), 0);
  assert.equal(calculateDiscount(350), 0);
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

test('getDeliveryFee properly distinguishes Dhaka from other districts', () => {
  assert.equal(getDeliveryFee('Dhaka', 60, 120), 60);
  assert.equal(getDeliveryFee('dhaka', 60, 120), 60);
  assert.equal(getDeliveryFee('Chittagong', 60, 120), 120);
  assert.equal(getDeliveryFee('Sylhet', 60, 120), 120);
});
