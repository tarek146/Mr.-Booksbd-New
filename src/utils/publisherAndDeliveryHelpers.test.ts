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

test('resolveProductDeliveryTiming returns custom per-book English delivery timing when configured', () => {
  const customBook: Partial<Product> = {
    title: 'Paradoxical Sajid 2',
    deliveryEstimate: '1-2 Days Express',
    deliveryTimingTitle: 'Fast Express Delivery',
    insideDhakaDelivery: 'Within 24 Hours',
    outsideDhakaDelivery: '1-2 Business Days',
    deliveryTimingNote: 'Orders placed before 5 PM dispatch the same day.',
    deliveryTimerHours: 24,
  };

  const resolved = resolveProductDeliveryTiming(customBook);
  assert.equal(resolved.estimateBadge, '1-2 Days Express');
  assert.equal(resolved.title, 'Fast Express Delivery');
  assert.equal(resolved.insideDhaka, 'Within 24 Hours');
  assert.equal(resolved.outsideDhaka, '1-2 Business Days');
  assert.equal(resolved.note, 'Orders placed before 5 PM dispatch the same day.');
  assert.equal(resolved.timerHours, 24);
});

test('resolveProductDeliveryTiming normalizes legacy Bengali defaults to English and falls back to English defaults', () => {
  const legacySavedBook: Partial<Product> = {
    title: 'Legacy Firestore Book',
    deliveryTimingTitle: 'ডেলিভারি টাইমিং (Delivery Timing)',
    deliveryEstimate: '২-৩ কার্যদিবস (2-3 Days)',
    insideDhakaDelivery: '২৪-৪৮ ঘণ্টা (১-২ দিন)',
    outsideDhakaDelivery: '২-৩ কার্যদিবস (সারাদেশে)',
    deliveryTimingNote: 'আজকে অর্ডার করলে দ্রুততম সময়ে বাবল-র‍্যাপ প্যাকেজিংসহ কুরিয়ারে পাঠানো হবে।',
  };

  const normalized = resolveProductDeliveryTiming(legacySavedBook);
  assert.equal(normalized.title, 'Delivery Timing');
  assert.equal(normalized.estimateBadge, '2-3 Business Days');
  assert.equal(normalized.insideDhaka, '24-48 Hours (1-2 Days)');
  assert.equal(normalized.outsideDhaka, '2-3 Business Days (Nationwide)');
  assert.doesNotMatch(normalized.note, /[\u0980-\u09FF]/);

  const minimalBook: Partial<Product> = {
    title: 'Himu Omnibus',
  };

  const resolved = resolveProductDeliveryTiming(minimalBook);
  assert.equal(resolved.title, 'Delivery Timing');
  assert.equal(resolved.estimateBadge, '2-3 Business Days');
  assert.equal(resolved.insideDhaka, '24-48 Hours (1-2 Days)');
  assert.equal(resolved.timerHours, 48);
  assert.doesNotMatch(resolved.note, /[\u0980-\u09FF]/);
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
