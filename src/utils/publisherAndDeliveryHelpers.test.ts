import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEnrichedPublishersList,
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

test('buildEnrichedPublishersList merges stored publishers with book publisher counts and derived publishers', () => {
  const stored: Publisher[] = [
    {
      id: 'pub-1',
      name: 'Guardian Publications',
      banglaName: 'গার্ডিয়ান পাবলিকেশন্স',
      booksCount: 40,
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
      title: 'New Book',
      slug: 'new-book',
      description: 'Book 2',
      category: 'Fiction',
      publisher: 'Mowla Brothers',
      images: ['https://example.com/2.jpg'],
      price: 250,
      stock: 5,
      sku: 'SKU2',
      variants: [],
      rating: 5,
      reviewCount: 1,
      createdAt: 2,
    },
  ];

  const enriched = buildEnrichedPublishersList(stored, products);
  assert.equal(enriched.length, 2);

  const guardian = enriched.find(p => p.name === 'Guardian Publications');
  assert.ok(guardian);
  assert.equal(guardian.liveBooksCount, 1);
  assert.equal(guardian.displayBooksCount, 1);

  const mowla = enriched.find(p => p.name === 'Mowla Brothers');
  assert.ok(mowla);
  assert.equal(mowla.liveBooksCount, 1);
});

test('parseCustomBookDetails and serializeCustomBookDetails round-trip properly', () => {
  const raw = 'Binding: Hardcover Stitch\nPaper Quality: 80 GSM Cream\nCountry: Bangladesh';
  const parsed = parseCustomBookDetails(raw);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { label: 'Binding', value: 'Hardcover Stitch' });
  assert.equal(serializeCustomBookDetails(parsed), raw);
});
