import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Order, Product } from '../types';
import {
  DEFAULT_ALL_BOOKS_LIMIT,
  MAX_HOME_ALL_BOOKS_LIMIT,
  clampHomeSectionLimit,
  getNewArrivalsBooks,
  getBestSellingBooks,
  getHomeAllBooks,
} from './homeCatalogHelpers';

function makeBook(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    type: 'book',
    title: `Book ${id}`,
    slug: `book-${id}`,
    description: 'Test description',
    category: 'Fiction',
    images: [],
    price: 250,
    stock: 10,
    sku: `SKU-${id}`,
    variants: [{ id: 'v1', name: 'Paperback', price: 250, stock: 10, sku: `SKU-${id}` }],
    rating: 4.5,
    reviewCount: 2,
    createdAt: 1000,
    isActive: true,
    ...overrides,
  };
}

function makeOrder(id: string, productId: string, quantity: number, status: Order['orderStatus'] = 'confirmed'): Order {
  return {
    id,
    userId: 'u1',
    customerName: 'Reader',
    phone: '01700000000',
    email: 'reader@example.com',
    district: 'Dhaka',
    city: 'Dhaka',
    address: 'Dhaka',
    items: [
      {
        productId,
        variantId: 'v1',
        title: 'Book',
        variantName: 'Paperback',
        price: 250,
        image: '',
        quantity,
        stock: 10,
        type: 'book',
      },
    ],
    subtotal: 250 * quantity,
    deliveryCharge: 60,
    discount: 0,
    total: 250 * quantity + 60,
    paymentMethodId: 'cod',
    paymentMethodName: 'COD',
    paymentStatus: 'unpaid',
    orderStatus: status,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('homeCatalogHelpers', () => {
  it('caps All Books on Home cleanly between 20 and 25 and reports total count', () => {
    const books = Array.from({ length: 34 }, (_, idx) =>
      makeBook(String(idx + 1), { createdAt: 1000 + idx })
    );

    const defaultRes = getHomeAllBooks(books);
    assert.equal(defaultRes.appliedLimit, DEFAULT_ALL_BOOKS_LIMIT);
    assert.equal(defaultRes.items.length, 20);
    assert.equal(defaultRes.totalBooksCount, 34);
    assert.equal(defaultRes.hasMoreBooks, true);

    const limit25Res = getHomeAllBooks(books, 25);
    assert.equal(limit25Res.appliedLimit, 25);
    assert.equal(limit25Res.items.length, 25);
    assert.equal(limit25Res.hasMoreBooks, true);

    const overCapRes = getHomeAllBooks(books, 100);
    assert.equal(overCapRes.appliedLimit, MAX_HOME_ALL_BOOKS_LIMIT);
    assert.equal(overCapRes.items.length, 25);
  });

  it('excludes inactive books and places out-of-stock books after in-stock books', () => {
    const books = [
      makeBook('out', { stock: 0, createdAt: 5000 }),
      makeBook('inactive', { isActive: false, createdAt: 6000 }),
      makeBook('in-old', { stock: 4, createdAt: 2000 }),
      makeBook('in-new', { stock: 8, createdAt: 4000 }),
    ];

    const res = getHomeAllBooks(books, 20);
    assert.deepEqual(
      res.items.map(b => b.id),
      ['in-new', 'in-old', 'out']
    );
    assert.equal(res.totalBooksCount, 3);
    assert.equal(res.hasMoreBooks, false);
  });

  it('prioritizes new-flagged and newest books in New Arrivals Collection', () => {
    const books = [
      makeBook('b1', { createdAt: 1000 }),
      makeBook('b2', { createdAt: 3000 }),
      makeBook('b3', { createdAt: 2000, isNewProduct: true }),
      makeBook('stat1', { type: 'stationery', createdAt: 9999 }),
    ];

    const arrivals = getNewArrivalsBooks(books, 10);
    assert.deepEqual(
      arrivals.map(b => b.id),
      ['b3', 'b2', 'b1']
    );
  });

  it('ranks Best Selling Books using real non-cancelled order sales, featured flag, and reviews', () => {
    const books = [
      makeBook('b1', { isFeatured: false, reviewCount: 1, createdAt: 1000 }),
      makeBook('b2', { isFeatured: true, reviewCount: 0, createdAt: 1000 }),
      makeBook('b3', { isFeatured: false, reviewCount: 5, createdAt: 2000 }),
      makeBook('b4', { isFeatured: false, reviewCount: 0, createdAt: 4000 }),
    ];

    const orders = [
      makeOrder('o1', 'b3', 4, 'delivered'),
      makeOrder('o2', 'b1', 2, 'confirmed'),
      makeOrder('o3', 'b4', 9, 'cancelled'), // ignored because cancelled
    ];

    const bestSellers = getBestSellingBooks(books, orders, 10);
    assert.deepEqual(
      bestSellers.map(b => b.id),
      ['b3', 'b1', 'b2', 'b4']
    );
  });

  it('clamps invalid or oversized limits safely', () => {
    assert.equal(clampHomeSectionLimit(undefined, 20, 25), 20);
    assert.equal(clampHomeSectionLimit(-5, 20, 25), 20);
    assert.equal(clampHomeSectionLimit(23.8, 20, 25), 23);
    assert.equal(clampHomeSectionLimit(99, 20, 25), 25);
  });
});
