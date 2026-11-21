import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countBooksForAuthor,
  countBooksForPublisher,
  buildEnrichedAuthorsList,
  buildEnrichedPublishersList,
  buildManageableAuthorOptions,
  buildManageablePublisherOptions,
  resolveAuthoritativePublishersList,
  reconcileIncomingPublishers,
  resolveProductPublisherInfo,
  resolveBookBylineParts,
  resolveProductDeliveryTiming,
  resolveAuthorOrPublisherCountPreview,
  buildSyncedAuthorsAndPublishers,
  parseCustomBookDetails,
  serializeCustomBookDetails,
} from './publisherAndDeliveryHelpers';
import { Author, Product, Publisher } from '../types';

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

  // Strictly mirrors stored Firebase publishers without synthesizing deleted/ghost publishers from products
  const enriched = buildEnrichedPublishersList(stored, products);
  assert.equal(enriched.length, 2);

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

  // Deleted / unmanaged publisher on a book must NOT resurrect in the publishers directory
  assert.equal(enriched.find(p => p.name === 'Mowla Brothers'), undefined);

  // When Admin deletes all publishers, directory MUST remain empty (never resurrect DEFAULT_PUBLISHERS_LIST)
  assert.deepEqual(buildEnrichedPublishersList([], products), []);

  const resolvedPub = resolveProductPublisherInfo(products[0], stored, products);
  assert.ok(resolvedPub);
  assert.equal(resolvedPub.name, 'Guardian Publications');
  assert.equal(resolvedPub.banglaName, 'গার্ডিয়ান পাবলিকেশন্স');
  assert.equal(resolvedPub.displayBooksCount, 2);

  // When publisher is omitted on a book, it MUST return null instead of inferring/defaulting
  const omittedPub = resolveProductPublisherInfo({ title: 'Himu', author: 'Humayun Ahmed' }, stored, products);
  assert.equal(omittedPub, null);

  const blankPub = resolveProductPublisherInfo({ title: 'Throne of Vengeance', author: 'Rina Kent', publisher: '   ' }, stored, products);
  assert.equal(blankPub, null);
});

test('parseCustomBookDetails and serializeCustomBookDetails round-trip properly', () => {
  const raw = 'Binding: Hardcover Stitch\nPaper Quality: 80 GSM Cream\nCountry: Bangladesh';
  const parsed = parseCustomBookDetails(raw);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { label: 'Binding', value: 'Hardcover Stitch' });
  assert.equal(serializeCustomBookDetails(parsed), raw);
});

const makeBook = (id: string, author: string, publisher: string, type: 'book' | 'stationery' = 'book'): Product => ({
  id,
  type,
  title: `Title ${id}`,
  slug: `slug-${id}`,
  description: 'Desc',
  category: 'Fiction',
  author,
  publisher,
  images: ['https://example.com/book.jpg'],
  price: 250,
  stock: 20,
  sku: `SKU-${id}`,
  variants: [],
  rating: 5,
  reviewCount: 1,
  createdAt: 100,
});

test('countBooksForAuthor and buildEnrichedAuthorsList automatically compute 0, 1, 2, 10 books and override stale counts', () => {
  const storedAuthors: Author[] = [
    { id: 'a1', name: 'Humayun Ahmed', bio: 'Renowned author', booksCount: 42 },
    { id: 'a2', name: 'Arif Azad', bio: 'Popular writer', booksCount: 28 },
    { id: 'a3', name: 'New Author', bio: 'New writer', booksCount: 15 },
  ];

  const tenBooks: Product[] = Array.from({ length: 10 }, (_, idx) =>
    makeBook(`h-${idx + 1}`, idx % 2 === 0 ? 'Humayun Ahmed' : 'humayun ahmed', 'Anyaprokash')
  );
  const products: Product[] = [
    ...tenBooks,
    makeBook('aa-1', 'Arif Azad', 'Guardian Publications'),
    makeBook('aa-2', 'Arif Azad', 'Guardian Publications'),
    makeBook('st-1', 'Humayun Ahmed', 'Anyaprokash', 'stationery'), // stationery must NOT be counted as a book
    makeBook('derived-1', 'Rina Kent', 'Sommoy Prokashan'),
  ];

  assert.equal(countBooksForAuthor({ name: 'Humayun Ahmed' }, products), 10);
  assert.equal(countBooksForAuthor({ name: 'Humayun Ahmed' }, products, 'h-1'), 9);
  assert.equal(countBooksForAuthor({ name: 'Arif Azad' }, products), 2);
  assert.equal(countBooksForAuthor({ name: 'New Author' }, products), 0);
  assert.equal(countBooksForAuthor({ name: 'Rina Kent' }, products), 1);

  const enriched = buildEnrichedAuthorsList(storedAuthors, products);
  assert.equal(enriched.length, 4);
  assert.equal(enriched.find(a => a.name === 'Humayun Ahmed')?.liveBooksCount, 10);
  assert.equal(enriched.find(a => a.name === 'Arif Azad')?.liveBooksCount, 2);
  assert.equal(enriched.find(a => a.name === 'New Author')?.liveBooksCount, 0);
  assert.equal(enriched.find(a => a.name === 'Rina Kent')?.liveBooksCount, 1);
});

test('resolveAuthorOrPublisherCountPreview predicts 0->1, 1->2, 9->10 in create mode and handles edits cleanly', () => {
  const authors: Author[] = [{ id: 'a1', name: 'Arif Azad', bio: 'Author', booksCount: 99 }];
  const publishers: Publisher[] = [{ id: 'p1', name: 'Guardian Publications', banglaName: 'গার্ডিয়ান পাবলিকেশন্স', booksCount: 99 }];

  // 0 existing -> 1 after upload
  const zeroPreview = resolveAuthorOrPublisherCountPreview({
    kind: 'author',
    name: 'Arif Azad',
    products: [],
    authors,
    publishers,
    productType: 'book',
  });
  assert.equal(zeroPreview.currentCount, 0);
  assert.equal(zeroPreview.projectedCount, 1);

  // 1 existing -> 2 after upload
  const oneBook = [makeBook('b1', 'Arif Azad', 'Guardian Publications')];
  const onePubPreview = resolveAuthorOrPublisherCountPreview({
    kind: 'publisher',
    name: 'Guardian Publications',
    products: oneBook,
    authors,
    publishers,
    productType: 'book',
  });
  assert.equal(onePubPreview.currentCount, 1);
  assert.equal(onePubPreview.projectedCount, 2);

  // 9 existing -> 10 after upload
  const nineBooks = Array.from({ length: 9 }, (_, i) => makeBook(`b-${i + 1}`, 'Arif Azad', 'Guardian Publications'));
  const nineAuthorPreview = resolveAuthorOrPublisherCountPreview({
    kind: 'author',
    name: 'Arif Azad',
    products: nineBooks,
    authors,
    publishers,
    productType: 'book',
  });
  assert.equal(nineAuthorPreview.currentCount, 9);
  assert.equal(nineAuthorPreview.projectedCount, 10);

  // Editing an existing book keeps projectedCount = 9 (does not double-count b-1)
  const editPreview = resolveAuthorOrPublisherCountPreview({
    kind: 'author',
    name: 'Arif Azad',
    products: nineBooks,
    authors,
    publishers,
    editingProductId: 'b-1',
    productType: 'book',
  });
  assert.equal(editPreview.currentCount, 9);
  assert.equal(editPreview.otherCount, 8);
  assert.equal(editPreview.projectedCount, 9);
});

test('buildSyncedAuthorsAndPublishers increments 1->2->...->10, decrements on delete, and auto-creates missing profiles', () => {
  let currentAuthors: Author[] = [{ id: 'a1', name: 'Humayun Ahmed', bio: 'Legendary author', booksCount: 0 }];
  let currentPublishers: Publisher[] = [];
  let currentProducts: Product[] = [];

  // Upload 10 books sequentially under "Humayun Ahmed" & "Anyaprokash"
  for (let i = 1; i <= 10; i++) {
    const newBook = makeBook(`book-${i}`, 'Humayun Ahmed', 'Anyaprokash');
    currentProducts = [newBook, ...currentProducts];

    const synced = buildSyncedAuthorsAndPublishers({
      nextProducts: currentProducts,
      currentAuthors,
      currentPublishers,
      targetAuthorName: newBook.author,
      targetPublisherName: newBook.publisher,
      now: 1700000000000 + i,
    });

    currentAuthors = synced.nextAuthors;
    currentPublishers = synced.nextPublishers;

    const humayun = currentAuthors.find(a => a.name === 'Humayun Ahmed');
    const anya = currentPublishers.find(p => p.name === 'Anyaprokash');
    assert.equal(humayun?.booksCount, i);
    assert.equal(anya?.booksCount, i);
    // Inherits rich Bangla metadata when matching a default publisher profile
    assert.equal(anya?.banglaName, 'অন্যপ্রকাশ');
  }

  // Delete 3 books -> both counts drop from 10 to 7 automatically
  currentProducts = currentProducts.slice(3);
  const afterDelete = buildSyncedAuthorsAndPublishers({
    nextProducts: currentProducts,
    currentAuthors,
    currentPublishers,
  });
  assert.equal(afterDelete.nextAuthors.find(a => a.name === 'Humayun Ahmed')?.booksCount, 7);
  assert.equal(afterDelete.nextPublishers.find(p => p.name === 'Anyaprokash')?.booksCount, 7);

  // Add 1 book with brand new custom Author & Publisher -> both auto-created with count 1
  const customBook = makeBook('custom-1', 'Custom Writer', 'Custom House');
  const afterCustom = buildSyncedAuthorsAndPublishers({
    nextProducts: [customBook, ...currentProducts],
    currentAuthors: afterDelete.nextAuthors,
    currentPublishers: afterDelete.nextPublishers,
    targetAuthorName: customBook.author,
    targetPublisherName: customBook.publisher,
    now: 1700000009999,
  });
  assert.equal(afterCustom.createdAuthors.length, 1);
  assert.equal(afterCustom.createdAuthors[0].name, 'Custom Writer');
  assert.equal(afterCustom.createdAuthors[0].booksCount, 1);
  assert.equal(afterCustom.createdPublishers.length, 1);
  assert.equal(afterCustom.createdPublishers[0].name, 'Custom House');
  assert.equal(afterCustom.createdPublishers[0].booksCount, 1);
});

test('buildManageableAuthorOptions and buildManageablePublisherOptions strictly mirror managed items without defaults or deleted ghosts', () => {
  const catalogProducts: Product[] = [
    makeBook('b1', 'Arif Azad', 'Guardian Publications'),
    makeBook('b2', 'হুমায়ূন আহমেদ', 'Anyaprokash'),
    makeBook('b3', 'Dr. Muhammad Zafar Iqbal', 'Tamralipi'),
  ];

  // When Admin deleted ALL writers, dropdown MUST be empty even if products still contain author names
  assert.deepEqual(buildManageableAuthorOptions([], catalogProducts), []);

  // When Admin deleted ALL publishers, dropdown MUST be empty (never falls back to DEFAULT_PUBLISHERS_LIST)
  assert.deepEqual(buildManageablePublisherOptions([], catalogProducts), []);

  // When Admin keeps only 1 active writer & 1 active publisher, only those appear with accurate live counts
  const managedAuthors: Author[] = [
    { id: 'a-arif', name: 'Arif Azad', bio: '', photoUrl: '', booksCount: 99 },
    { id: 'a-dup', name: 'arif azad ', bio: '', photoUrl: '', booksCount: 0 },
  ];
  const writerOpts = buildManageableAuthorOptions(managedAuthors, catalogProducts);
  assert.equal(writerOpts.length, 1);
  assert.equal(writerOpts[0].name, 'Arif Azad');
  assert.equal(writerOpts[0].liveBooksCount, 1);

  const managedPublishers: Publisher[] = [
    { id: 'pub-prothoma', name: 'Prothoma Prokashon', banglaName: 'প্রথমা প্রকাশন', booksCount: 5 },
  ];
  const pubOpts = buildManageablePublisherOptions(managedPublishers, catalogProducts);
  assert.equal(pubOpts.length, 1);
  assert.equal(pubOpts[0].name, 'Prothoma Prokashon');
  assert.equal(pubOpts[0].liveBooksCount, 0);
});

test('resolveAuthoritativePublishersList honors initialized empty directory and server empty snapshots without resurrecting defaults', () => {
  // Initialized backup doc with [] overrides leftover stale primary docs
  const deletedAll = resolveAuthoritativePublishersList(
    { received: true, fromServer: true, items: [{ id: 'pub-prothoma', name: 'Prothoma Prokashon' }] },
    { received: true, fromServer: true, exists: true, initialized: true, items: [] }
  );
  assert.deepEqual(deletedAll, { items: [], markInitialized: true });

  // Server confirmed empty primary + no backup doc returns [] and marks initialized
  const serverEmpty = resolveAuthoritativePublishersList(
    { received: true, fromServer: true, items: [] },
    { received: true, fromServer: true, exists: false, initialized: false, items: [] }
  );
  assert.deepEqual(serverEmpty, { items: [], markInitialized: true });

  // Cache-only empty primary snapshot before server response returns null (wait for server)
  const cacheEmpty = resolveAuthoritativePublishersList(
    { received: true, fromServer: false, items: [] },
    { received: false, fromServer: false, exists: false, initialized: false, items: [] }
  );
  assert.equal(cacheEmpty, null);
});

test('reconcileIncomingPublishers prevents deleted publishers from bouncing back and retains pending additions', () => {
  const pubA: Publisher = { id: 'pub-1', name: 'Prothoma', booksCount: 2 };
  const pubB: Publisher = { id: 'pub-2', name: 'Batighar', booksCount: 1 };
  const pubNew: Publisher = { id: 'pub-3', name: 'New House', booksCount: 0 };

  // Stale snapshot still includes pub-1 after Admin deleted it, and doesn't yet include pub-3
  const reconciled = reconcileIncomingPublishers({
    incoming: [pubA, pubB],
    deletedIds: new Set(['pub-1']),
    pendingUpserts: new Map([['pub-3', pubNew]]),
  });

  assert.deepEqual(
    reconciled.map(p => p.id),
    ['pub-2', 'pub-3']
  );
});

test('resolveBookBylineParts strictly reflects only explicitly set writer and publisher without fallbacks', () => {
  const samplePublisher = resolveProductPublisherInfo(
    { title: 'Sample', publisher: 'Guardian Publications' },
    [{ id: 'p1', name: 'Guardian Publications', banglaName: 'গার্ডিয়ান পাবলিকেশন্স' }],
    []
  );
  assert.ok(samplePublisher);

  // 1. Writer only (no Publisher) -> shows writer, no publisher
  const authorOnly = resolveBookBylineParts(
    { type: 'book', title: 'Throne of Vengeance', author: 'Rina Kent', publisher: '' },
    true,
    null
  );
  assert.deepEqual(authorOnly, {
    authorName: 'Rina Kent',
    publisherName: null,
    publisherDisplayName: null,
    hasAny: true,
  });

  // 2. Publisher only (no Writer) -> shows publisher, no writer
  const publisherOnly = resolveBookBylineParts(
    { type: 'book', title: 'Untitled Compilation', author: '', publisher: 'Guardian Publications' },
    true,
    samplePublisher
  );
  assert.deepEqual(publisherOnly, {
    authorName: null,
    publisherName: 'Guardian Publications',
    publisherDisplayName: 'Guardian Publications (গার্ডিয়ান পাবলিকেশন্স)',
    hasAny: true,
  });

  // 3. Neither Writer nor Publisher -> hides byline completely
  const neitherSet = resolveBookBylineParts(
    { type: 'book', title: 'No Meta Book', author: '   ', publisher: '' },
    true,
    null
  );
  assert.deepEqual(neitherSet, {
    authorName: null,
    publisherName: null,
    publisherDisplayName: null,
    hasAny: false,
  });

  // 4. Both Writer and Publisher -> shows both
  const bothSet = resolveBookBylineParts(
    { type: 'book', title: 'Paradoxical Sajid', author: 'Arif Azad', publisher: 'Guardian Publications' },
    true,
    samplePublisher
  );
  assert.deepEqual(bothSet, {
    authorName: 'Arif Azad',
    publisherName: 'Guardian Publications',
    publisherDisplayName: 'Guardian Publications (গার্ডিয়ান পাবলিকেশন্স)',
    hasAny: true,
  });

  // 5. showAuthorInfo disabled -> suppresses author even if present, keeps publisher if present
  const authorDisabled = resolveBookBylineParts(
    { type: 'book', title: 'Paradoxical Sajid', author: 'Arif Azad', publisher: 'Guardian Publications' },
    false,
    samplePublisher
  );
  assert.deepEqual(authorDisabled, {
    authorName: null,
    publisherName: 'Guardian Publications',
    publisherDisplayName: 'Guardian Publications (গার্ডিয়ান পাবলিকেশন্স)',
    hasAny: true,
  });
});

