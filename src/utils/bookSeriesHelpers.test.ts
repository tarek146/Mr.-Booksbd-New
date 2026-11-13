import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSeriesName,
  normalizeSeriesNumber,
  formatSeriesLabel,
  resolveProductSeriesInfo,
  parseSeriesSortOrder,
  filterBooksBySeries,
  sortSeriesBooks,
  getSeriesBooksForProduct,
  collectExistingSeriesNames,
  extractSeriesFromSearch,
  buildBooksPathWithSeries,
} from './bookSeriesHelpers';
import { Product } from '../types';

function makeBook(overrides: Partial<Product>): Product {
  return {
    id: overrides.id || 'p1',
    type: 'book',
    title: overrides.title || 'Sample Book',
    slug: 'sample-book',
    description: 'desc',
    category: 'Fiction',
    images: [],
    price: 350,
    stock: 10,
    sku: 'SKU-1',
    variants: [],
    rating: 5,
    reviewCount: 1,
    createdAt: overrides.createdAt || 1000,
    ...overrides,
  };
}

test('normalizeSeriesName and normalizeSeriesNumber strip extra spaces and leading hashes', () => {
  assert.equal(normalizeSeriesName('  Royal   Elite  '), 'Royal Elite');
  assert.equal(normalizeSeriesName(undefined), '');
  assert.equal(normalizeSeriesNumber('#3'), '3');
  assert.equal(normalizeSeriesNumber('  ##12 '), '12');
  assert.equal(normalizeSeriesNumber(4), '4');
  assert.equal(normalizeSeriesNumber(''), '');
});

test('formatSeriesLabel produces Royal Elite #3 without double hashes', () => {
  assert.equal(formatSeriesLabel('Royal Elite', '3'), 'Royal Elite #3');
  assert.equal(formatSeriesLabel('Royal Elite', '#3'), 'Royal Elite #3');
  assert.equal(formatSeriesLabel('Royal Elite', ''), 'Royal Elite');
  assert.equal(formatSeriesLabel('', '3'), '');
});

test('resolveProductSeriesInfo handles missing and populated series fields', () => {
  assert.deepEqual(resolveProductSeriesInfo(makeBook({})), {
    hasSeries: false,
    seriesName: '',
    seriesNumber: '',
    label: '',
  });

  assert.deepEqual(
    resolveProductSeriesInfo(
      makeBook({ seriesName: '  Royal Elite ', seriesNumber: '#3' })
    ),
    {
      hasSeries: true,
      seriesName: 'Royal Elite',
      seriesNumber: '3',
      label: 'Royal Elite #3',
    }
  );
});

test('parseSeriesSortOrder handles integers, decimals, and non-numeric labels', () => {
  assert.equal(parseSeriesSortOrder('1'), 1);
  assert.equal(parseSeriesSortOrder('#10'), 10);
  assert.equal(parseSeriesSortOrder('2.5'), 2.5);
  assert.equal(parseSeriesSortOrder('Prequel'), Number.POSITIVE_INFINITY);
  assert.equal(parseSeriesSortOrder(''), Number.POSITIVE_INFINITY);
});

test('filterBooksBySeries and sortSeriesBooks return reading order (#1, #2, #3, #10)', () => {
  const catalog = [
    makeBook({ id: 'b10', title: 'Royal Tenth', seriesName: 'Royal Elite', seriesNumber: '10' }),
    makeBook({ id: 'b3', title: 'Twisted Kingdom', seriesName: 'royal elite', seriesNumber: '#3' }),
    makeBook({ id: 'b1', title: 'Deviant King', seriesName: 'Royal Elite ', seriesNumber: '1' }),
    makeBook({ id: 'b2', title: 'Steel Princess', seriesName: 'Royal Elite', seriesNumber: '2' }),
    makeBook({ id: 'b-other', title: 'Paradoxical Sajid', seriesName: 'Sajid Series', seriesNumber: '1' }),
    makeBook({ id: 'b-standalone', title: 'Standalone Book' }),
  ];

  const matched = filterBooksBySeries(catalog, 'Royal Elite');
  assert.equal(matched.length, 4);

  const sorted = sortSeriesBooks(matched);
  assert.deepEqual(
    sorted.map((b) => b.id),
    ['b1', 'b2', 'b3', 'b10']
  );

  const forBook3 = getSeriesBooksForProduct(catalog, matched[1]);
  assert.deepEqual(
    forBook3.map((b) => b.id),
    ['b1', 'b2', 'b3', 'b10']
  );
});

test('collectExistingSeriesNames deduplicates case-insensitively and sorts alphabetically', () => {
  const catalog = [
    makeBook({ id: '1', seriesName: 'Royal Elite' }),
    makeBook({ id: '2', seriesName: 'royal   elite' }),
    makeBook({ id: '3', seriesName: 'Himu Series' }),
    makeBook({ id: '4', seriesName: '' }),
  ];

  assert.deepEqual(collectExistingSeriesNames(catalog), [
    'Himu Series',
    'Royal Elite',
  ]);
});

test('extractSeriesFromSearch and buildBooksPathWithSeries round-trip ?series= query param', () => {
  assert.equal(extractSeriesFromSearch('?series=Royal%20Elite'), 'Royal Elite');
  assert.equal(extractSeriesFromSearch('series=%20Royal%20%20Elite%20'), 'Royal Elite');
  assert.equal(extractSeriesFromSearch(''), '');
  assert.equal(buildBooksPathWithSeries('Royal Elite'), '/books?series=Royal%20Elite');
  assert.equal(buildBooksPathWithSeries('  '), '/books');
});
