import test from 'node:test';
import assert from 'node:assert/strict';
import type { CartItem, Product } from '../types';
import {
  buildDirectCartItem,
  removeCheckoutItem,
  getUnincludedCartItems,
  mergeCheckoutItems,
  computeRemainingCartAfterOrder,
} from './directCheckoutHelpers';

const makeProduct = (id: string, title: string, price: number): Product => ({
  id,
  slug: id,
  type: 'book',
  title,
  category: 'Fiction',
  price,
  stock: 20,
  images: [`https://example.com/${id}.jpg`],
  description: 'Test book',
  variants: [
    { id: 'pb', name: 'Paperback', price, stock: 20, sku: `${id}-pb` },
    { id: 'hc', name: 'Hardcover', price: price + 120, stock: 10, sku: `${id}-hc` },
  ],
  rating: 4.8,
  reviewCount: 10,
  sku: `${id}-sku`,
  createdAt: 1700000000000,
});

const makeCartItem = (
  productId: string,
  variantId: string,
  title: string,
  price: number,
  quantity = 1
): CartItem => ({
  productId,
  variantId,
  title,
  variantName: 'Paperback',
  price,
  image: `https://example.com/${productId}.jpg`,
  quantity,
  stock: 20,
  type: 'book',
});

test('buildDirectCartItem isolates clicked product and clamps to variant stock', () => {
  const prod = makeProduct('p3', 'Paradoxical Sajid 2', 350);
  const directItem = buildDirectCartItem(prod, 'hc', 2);

  assert.equal(directItem.productId, 'p3');
  assert.equal(directItem.variantId, 'hc');
  assert.equal(directItem.variantName, 'Hardcover');
  assert.equal(directItem.price, 470);
  assert.equal(directItem.quantity, 2);

  const clamped = buildDirectCartItem(prod, 'hc', 99);
  assert.equal(clamped.quantity, 10);
});

test('getUnincludedCartItems detects cart items outside the direct order without auto-merging them', () => {
  const cart: CartItem[] = [
    makeCartItem('p1', 'pb', 'Himur Ditiyo Prohor', 290),
    makeCartItem('p2', 'pb', 'Himu Omnibus', 650),
  ];
  const directList: CartItem[] = [
    makeCartItem('p3', 'pb', 'Paradoxical Sajid 2', 350),
  ];

  const unincluded = getUnincludedCartItems(cart, directList);
  assert.equal(unincluded.length, 2);
  assert.deepEqual(
    unincluded.map(i => i.productId),
    ['p1', 'p2']
  );
});

test('mergeCheckoutItems optionally includes unincluded cart items without duplicating existing selection', () => {
  const directList: CartItem[] = [
    makeCartItem('p3', 'pb', 'Paradoxical Sajid 2', 350, 2),
  ];
  const cart: CartItem[] = [
    makeCartItem('p1', 'pb', 'Himur Ditiyo Prohor', 290, 1),
    makeCartItem('p3', 'pb', 'Paradoxical Sajid 2', 350, 1),
  ];

  const merged = mergeCheckoutItems(directList, cart);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].productId, 'p3');
  assert.equal(merged[0].quantity, 2);
  assert.equal(merged[1].productId, 'p1');
});

test('removeCheckoutItem removes only the targeted product variant from checkout summary', () => {
  const items: CartItem[] = [
    makeCartItem('p1', 'pb', 'Himur Ditiyo Prohor', 290),
    makeCartItem('p2', 'pb', 'Himu Omnibus', 650),
    makeCartItem('p3', 'pb', 'Paradoxical Sajid 2', 350),
  ];

  const remaining = removeCheckoutItem(items, 'p2', 'pb');
  assert.equal(remaining.length, 2);
  assert.deepEqual(
    remaining.map(i => i.productId),
    ['p1', 'p3']
  );
});

test('computeRemainingCartAfterOrder keeps un-included cart items safe during direct order checkout', () => {
  const cart: CartItem[] = [
    makeCartItem('p1', 'pb', 'Himur Ditiyo Prohor', 290),
    makeCartItem('p2', 'pb', 'Himu Omnibus', 650),
  ];
  const directOrdered: CartItem[] = [
    makeCartItem('p3', 'pb', 'Paradoxical Sajid 2', 350),
  ];

  // Direct order without cart items leaves cart completely intact
  const untouchedCart = computeRemainingCartAfterOrder(cart, directOrdered, true);
  assert.equal(untouchedCart.length, 2);

  // Direct order where user opted to include p1 removes p1 but keeps p2
  const partiallyCheckedOut = computeRemainingCartAfterOrder(
    cart,
    [directOrdered[0], cart[0]],
    true
  );
  assert.deepEqual(
    partiallyCheckedOut.map(i => i.productId),
    ['p2']
  );

  // Standard cart checkout clears cart
  const clearedCart = computeRemainingCartAfterOrder(cart, cart, false);
  assert.equal(clearedCart.length, 0);
});
