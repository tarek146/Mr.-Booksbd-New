import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countBooksForPublisher,
  buildEnrichedPublishersList,
  resolveProductPublisherInfo,
  resolveProductDeliveryTiming,
  parseCustomBookDetails,
  serializeCustomBookDetails,
} from './publisherAndDeliveryHelpers';
import { Product, Publisher } from '../types';

test('resolveProductDeliveryTiming returns custom per-book delivery timing when configured', () => {
  const customBook: Partial<Product> = {
    title: 'Paradoxical Sajid 2',
    deliveryEstimate: '১-২ দিন (এক্সপ্রেস ডেলিভারি)',
    deliveryTimingTitle: 'স্পেশাল ফাস্ট ডেলিভারি টাইমিং',
    insideDhakaDelivery: '২৪ ঘণ্টা (ঢাকার ভেতরে)',
    outsideDhakaDelivery: '২ দিন (ঢাকার বাইরে)',
    deliveryTimingNote: 'বিকেল ৫টার আগে অর্ডার করলে আজই ডিসপ্যাচ হবে।',
    deliveryTimerHours: 24,
  };

  const resolved = resolveProductDeliveryTiming(customBook);
  assert.equal(resolved.estimateBadge, '১-২ দিন (এক্সপ্রেস ডেলিভারি)');
  assert.equal(resolved.title, 'স্পেশাল ফাস্ট ডেলিভারি টাইমিং');
  assert.equal(resolved.insideDhaka, '২৪ ঘণ্টা (ঢাকার ভেতরে)');
  assert.equal(resolved.outsideDhaka, '২ দিন (ঢাকার বাইরে)');
  assert.equal(resolved.note, 'বিকেল ৫টার আগে অর্ডার করলে আজই ডিসপ্যাচ হবে।');
  assert.equal(resolved.timerHours, 24);
});

test('resolveProductDeliveryTiming falls back to clean defaults when fields are omitted', () => {
  const minimalBook: Partial<Product> = {
    title: 'Himu Omnibus',
  };

  const resolved = resolveProductDeliveryTiming(minimalBook);
  assert.equal(resolved.estimateBadge, '২-৩ কার্যদিবস (2-3 Days)');
  assert.equal(resolved.insideDhaka, '২৪-৪৮ ঘণ্টা (১-২ দিন)');
  assert.equal(resolved.timerHours, 48);
  assert.ok(resolved.note.length > 10);
});

test('countBooksForPublisher and buildEnrichedPublishersList dynamically count books per publisher like categories', () => {
  const stored: Publisher[] = [
    {
      id: 'pub-1',
      name: 'Guardian Publications',
      banglaName: 'গার্ডিয়ান পাবলিকেশন্স',
      booksCount: 45, // legacy stored count should be overridden by actual catalog count
    },
    {
      id: 'pub-2',
      name: 'Empty House',
      banglaName: 'খালি প্রকাশনী',
      booksCount: 99,
    },
  ];

  const products: Product[] = [
    {
      id: 'p1',
      type: 'book',
      title: 'Paradoxical Sajid 2',
      slug: 'ps-2',
      description: 'Book 1',
      category: 'Islamic Books',
      publisher: 'Guardian Publications',
      images: ['https://example.com/1.jpg'],
      price: 350,
      stock: 10,
      sku: 'SKU1',
      variants: [],
      rating: 5,
      reviewCount: 1,
      createdAt: 1,
    },
    {
      id: 'p2',
      type: 'book',
      title: 'Bella Furabar Age',
      slug: 'bfa',
      description: 'Book 2',
      category: 'Islamic Books',
      publisher: 'গার্ডিয়ান পাবলিকেশন্স',
      images: ['https://example.com/2.jpg'],
      price: 300,
      stock: 8,
      sku: 'SKU2',
      variants: [],
      rating: 5,
      reviewCount: 1,
      createdAt: 2,
    },
    {
      id: 'p3',
      type: 'book',
      title: 'New Book',
      slug: 'new-book',
      description: 'Book 3',
      category: 'Fiction',
      publisher: 'Mowla Brothers',
      images: ['https://example.com/3.jpg'],
      price: 250,
      stock: 5,
      sku: 'SKU3',
      variants: [],
      rating: 5,
      reviewCount: 1,
      createdAt: 3,
    },
  ];

  assert.equal(
    countBooksForPublisher({ name: 'Guardian Publications', banglaName: 'গার্ডিয়ান পাবলিকেশন্স' }, products),
    2
  );
  assert.equal(
    countBooksForPublisher({ name: 'Empty House', banglaName: 'খালি প্রকাশনী' }, products),
    0
  );

  const enriched = buildEnrichedPublishersList(stored, products);
  assert.equal(enriched.length, 3);

  const guardian = enriched.find(p => p.name === 'Guardian Publications');
  assert.ok(guardian);
  assert.equal(guardian.liveBooksCount, 2);
  assert.equal(guardian.displayBooksCount, 2);
  assert.equal(guardian.booksCount, 2);

  const emptyHouse = enriched.find(p => p.name === 'Empty House');
  assert.ok(emptyHouse);
  assert.equal(emptyHouse.liveBooksCount, 0);
  assert.equal(emptyHouse.displayBooksCount, 0);
  assert.equal(emptyHouse.booksCount, 0);

  const mowla = enriched.find(p => p.name === 'Mowla Brothers');
  assert.ok(mowla);
  assert.equal(mowla.liveBooksCount, 1);
  assert.equal(mowla.displayBooksCount, 1);

  const resolvedPub = resolveProductPublisherInfo(products[0], stored, products);
  assert.equal(resolvedPub.name, 'Guardian Publications');
  assert.equal(resolvedPub.banglaName, 'গার্ডিয়ান পাবলিকেশন্স');
  assert.equal(resolvedPub.displayBooksCount, 2);

  const fallbackPub = resolveProductPublisherInfo({ title: 'Himu', author: 'Humayun Ahmed' }, [], products);
  assert.equal(fallbackPub.name, 'Anyaprokash');
});

test('parseCustomBookDetails and serializeCustomBookDetails round-trip properly', () => {
  const raw = 'Binding: Hardcover Stitch\nPaper Quality: 80 GSM Cream\nCountry: Bangladesh';
  const parsed = parseCustomBookDetails(raw);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { label: 'Binding', value: 'Hardcover Stitch' });
  assert.equal(serializeCustomBookDetails(parsed), raw);
});
