import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Category, Product } from '../types';
import {
  sortCategoriesBySerial,
  getHomeVisibleCategorySliderItems,
  getHomeCategoryProductSections,
  getProductsEligibleForCategoryModal,
  clampCategoryHomeLimit,
} from './categoryHomeHelpers';

function makeCat(id: string, overrides: Partial<Category> = {}): Category {
  return {
    id,
    name: `Category ${id}`,
    slug: `cat-${id}`,
    type: 'book',
    showOnHome: true,
    showProductsOnHome: false,
    ...overrides,
  };
}

function makeProduct(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    type: 'book',
    title: `Product ${id}`,
    slug: `product-${id}`,
    description: 'Description',
    category: 'Fiction',
    images: [],
    price: 300,
    stock: 10,
    sku: `SKU-${id}`,
    variants: [{ id: 'v1', name: 'Paperback', price: 300, stock: 10, sku: `SKU-${id}` }],
    rating: 4.5,
    reviewCount: 1,
    createdAt: 1000,
    isActive: true,
    ...overrides,
  };
}

describe('categoryHomeHelpers', () => {
  it('sorts categories strictly by displayOrder ascending while preserving relative order for unranked items', () => {
    const cats = [
      makeCat('c1', { name: 'Third', displayOrder: 3 }),
      makeCat('c2', { name: 'Unranked' }),
      makeCat('c3', { name: 'First', displayOrder: 1 }),
      makeCat('c4', { name: 'Second', displayOrder: 2 }),
    ];

    const sorted = sortCategoriesBySerial(cats);
    assert.deepEqual(
      sorted.map(c => c.name),
      ['First', 'Second', 'Third', 'Unranked']
    );
  });

  it('returns all categories sorted by serial below the banner without hiding or limiting any category', () => {
    const cats = [
      makeCat('c1', { name: 'Visible Both', showOnHome: true, showProductsOnHome: true, displayOrder: 2 }),
      makeCat('c2', { name: 'Slider Only', showOnHome: true, showProductsOnHome: false, displayOrder: 1 }),
      makeCat('c3', { name: 'Previously Hidden Flag', showOnHome: false, showProductsOnHome: false, displayOrder: 0 }),
    ];

    const sliderItems = getHomeVisibleCategorySliderItems(cats);
    assert.deepEqual(
      sliderItems.map(c => c.name),
      ['Previously Hidden Flag', 'Slider Only', 'Visible Both']
    );
  });

  it('builds per-category homepage sections strictly when showProductsOnHome is true, honoring limits, remaining count, and type separation', () => {
    const categories = [
      makeCat('books-cat', {
        name: 'Fiction',
        type: 'book',
        showProductsOnHome: true,
        homeProductLimit: 2,
        displayOrder: 2,
      }),
      makeCat('islamic-cat', {
        name: 'Islamic Books',
        type: 'book',
        showProductsOnHome: true,
        homeProductLimit: 3,
        displayOrder: 1,
      }),
      makeCat('off-cat', {
        name: 'Hidden Row Cat',
        type: 'book',
        showProductsOnHome: false,
        displayOrder: 0,
      }),
      makeCat('pen-cat', {
        name: 'Pens',
        type: 'stationery',
        showProductsOnHome: true,
        homeProductLimit: 2,
        displayOrder: 1,
      }),
    ];

    const products = [
      makeProduct('b1', { type: 'book', category: 'Fiction', createdAt: 100 }),
      makeProduct('b2', { type: 'book', category: 'Fiction', createdAt: 200 }),
      makeProduct('b3', { type: 'book', category: 'Fiction', createdAt: 300 }),
      // Stationery mistakenly tagged Fiction MUST NOT leak into book category section
      makeProduct('s-leak', { type: 'stationery', category: 'Fiction', createdAt: 999 }),
      makeProduct('i1', { type: 'book', category: 'Islamic Books', createdAt: 400 }),
      makeProduct('s1', { type: 'stationery', category: 'Pens', createdAt: 500 }),
      makeProduct('s2', { type: 'stationery', category: 'Pens', createdAt: 600 }),
      makeProduct('s3', { type: 'stationery', category: 'Pens', createdAt: 700 }),
    ];

    const bookSections = getHomeCategoryProductSections(categories, products, 'book');
    assert.deepEqual(
      bookSections.map(s => s.category.name),
      ['Islamic Books', 'Fiction']
    );
    assert.equal(bookSections[1].visibleItems.length, 2);
    assert.equal(bookSections[1].totalCount, 3);
    assert.equal(bookSections[1].hasMore, true);
    assert.equal(bookSections[1].remainingCount, 1);
    assert.ok(bookSections[1].visibleItems.every(p => p.type === 'book'));

    const stationerySections = getHomeCategoryProductSections(categories, products, 'stationery');
    assert.equal(stationerySections.length, 1);
    assert.equal(stationerySections[0].category.name, 'Pens');
    assert.equal(stationerySections[0].visibleItems.length, 2);
    assert.equal(stationerySections[0].totalCount, 3);
    assert.equal(stationerySections[0].hasMore, true);
  });

  it('respects admin-selected homeFeaturedProductIds order and calculates See More remaining products accurately', () => {
    const categories = [
      makeCat('c1', {
        name: 'Fiction',
        type: 'book',
        showProductsOnHome: true,
        homeProductLimit: 2,
        homeFeaturedProductIds: ['b3', 'b1', 'b2'],
      }),
    ];

    const products = [
      makeProduct('b1', { type: 'book', category: 'Fiction' }),
      makeProduct('b2', { type: 'book', category: 'Fiction' }),
      makeProduct('b3', { type: 'book', category: 'Fiction' }),
      makeProduct('b4', { type: 'book', category: 'Fiction' }),
    ];

    const sections = getHomeCategoryProductSections(categories, products, 'book');
    assert.equal(sections.length, 1);
    assert.deepEqual(
      sections[0].visibleItems.map(p => p.id),
      ['b3', 'b1']
    );
    assert.equal(sections[0].totalCount, 4);
    assert.equal(sections[0].hasMore, true);
    assert.equal(sections[0].remainingCount, 2);
  });

  it('keeps book and stationery pools separated inside category modal product picker and clamps limits cleanly', () => {
    const products = [
      makeProduct('b1', { type: 'book', category: 'Other' }),
      makeProduct('b2', { type: 'book', category: 'Novels' }),
      makeProduct('s1', { type: 'stationery', category: 'Novels' }),
    ];

    const eligibleBooks = getProductsEligibleForCategoryModal(products, 'book', 'Novels');
    assert.deepEqual(
      eligibleBooks.map(p => p.id),
      ['b2', 'b1']
    );

    assert.equal(clampCategoryHomeLimit(undefined), 5);
    assert.equal(clampCategoryHomeLimit(-1), 5);
    assert.equal(clampCategoryHomeLimit(99), 25);
    assert.equal(clampCategoryHomeLimit(6), 6);
  });
});
