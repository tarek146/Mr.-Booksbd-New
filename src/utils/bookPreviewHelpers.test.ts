import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBanglaDigits,
  sanitizePreviewPages,
  movePreviewPage,
  computePageSlideNavigation,
  getEffectiveBookPreviewPages,
} from './bookPreviewHelpers';
import { Product } from '../types';

test('toBanglaDigits converts ASCII numbers to Bengali numerals', () => {
  assert.equal(toBanglaDigits(1), '১');
  assert.equal(toBanglaDigits(23), '২৩');
  assert.equal(toBanglaDigits('Page 10'), 'Page ১০');
});

test('sanitizePreviewPages filters out empty or corrupted data:, pages and renumbers', () => {
  const input = [
    { id: 'p1', pageNumber: 5, title: 'প্রথম পাতা', content: 'বইয়ের শুরু...' },
    { id: 'p2', pageNumber: 6, title: 'ভাঙা পাতা', imageUrl: 'data:,', content: '   ' },
    { id: 'p3', pageNumber: 7, title: '', imageUrl: 'https://example.com/page2.jpg' },
  ];

  const result = sanitizePreviewPages(input);
  assert.equal(result.length, 2);
  assert.equal(result[0].pageNumber, 1);
  assert.equal(result[0].title, 'প্রথম পাতা');
  assert.equal(result[0].content, 'বইয়ের শুরু...');
  assert.equal(result[1].pageNumber, 2);
  assert.equal(result[1].title, 'পৃষ্ঠা ২');
  assert.equal(result[1].imageUrl, 'https://example.com/page2.jpg');
});

test('movePreviewPage reorders pages and updates pageNumber sequentially', () => {
  const pages = [
    { id: 'a', pageNumber: 1, title: 'Page A', content: 'A' },
    { id: 'b', pageNumber: 2, title: 'Page B', content: 'B' },
    { id: 'c', pageNumber: 3, title: 'Page C', content: 'C' },
  ];

  const movedDown = movePreviewPage(pages, 0, 'down');
  assert.deepEqual(
    movedDown.map(p => ({ id: p.id, pageNumber: p.pageNumber })),
    [
      { id: 'b', pageNumber: 1 },
      { id: 'a', pageNumber: 2 },
      { id: 'c', pageNumber: 3 },
    ]
  );

  const movedUp = movePreviewPage(movedDown, 2, 'up');
  assert.deepEqual(
    movedUp.map(p => ({ id: p.id, pageNumber: p.pageNumber })),
    [
      { id: 'b', pageNumber: 1 },
      { id: 'c', pageNumber: 2 },
      { id: 'a', pageNumber: 3 },
    ]
  );
});

test('computePageSlideNavigation returns accurate nextIndex and slide direction', () => {
  assert.deepEqual(computePageSlideNavigation(0, 1, 3), { nextIndex: 1, direction: 'next' });
  assert.deepEqual(computePageSlideNavigation(2, 1, 3), { nextIndex: 1, direction: 'prev' });
  assert.deepEqual(computePageSlideNavigation(1, 1, 3), { nextIndex: 1, direction: 'none' });
  assert.deepEqual(computePageSlideNavigation(2, 99, 3), { nextIndex: 2, direction: 'none' });
});

test('getEffectiveBookPreviewPages returns custom pages when present, or 3 fallback pages when empty', () => {
  const sampleBook: Product = {
    id: 'prod-1',
    type: 'book',
    title: 'Paradoxical Sajid 2',
    slug: 'paradoxical-sajid-2',
    description: 'Bestselling Islamic apologetics by Arif Azad.',
    category: 'Islamic Books',
    author: 'Arif Azad',
    publisher: 'Guardian Publications',
    images: ['https://example.com/cover.jpg'],
    price: 350,
    stock: 10,
    sku: 'BK-1',
    variants: [{ id: 'v1', name: 'Hardcover', price: 350, stock: 10, sku: 'BK-1' }],
    rating: 5,
    reviewCount: 10,
    createdAt: 1000,
  };

  const fallback = getEffectiveBookPreviewPages(sampleBook);
  assert.equal(fallback.length, 3);
  assert.equal(fallback[0].pageNumber, 1);
  assert.equal(fallback[1].pageNumber, 2);
  assert.equal(fallback[2].pageNumber, 3);

  const withCustom: Product = {
    ...sampleBook,
    previewPages: [
      { id: 'custom-1', pageNumber: 1, title: 'পিডিএফ পৃষ্ঠা ১', imageUrl: 'https://example.com/p1.png' },
      { id: 'custom-2', pageNumber: 2, title: 'পিডিএফ পৃষ্ঠা ২', imageUrl: 'https://example.com/p2.png' },
    ],
  };

  const customResult = getEffectiveBookPreviewPages(withCustom);
  assert.equal(customResult.length, 2);
  assert.equal(customResult[0].id, 'custom-1');
  assert.equal(customResult[1].id, 'custom-2');
});
