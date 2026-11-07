import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsv,
  guessColumnMapping,
  transformRowToProduct,
  parseCleanNumber,
  generateSampleCsv
} from './csvProductImport';

test('parseCsv handles RFC-4180 quotes, commas, escaped quotes, and newlines correctly', () => {
  const sample = `"Book Title","Offer Price","Author"\n"প্যারাডক্সিক্যাল সাজিদ ২, ভলিউম ২","350","আরিফ ""আজাদ"""\n"আমার বন্ধু রাশেদ","220","মুহম্মদ জাফর ইকবাল"`;
  const result = parseCsv(sample);
  
  assert.equal(result.headers.length, 3);
  assert.equal(result.headers[0], 'Book Title');
  assert.equal(result.headers[1], 'Offer Price');
  assert.equal(result.headers[2], 'Author');

  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0][0], 'প্যারাডক্সিক্যাল সাজিদ ২, ভলিউম ২');
  assert.equal(result.rows[0][1], '350');
  assert.equal(result.rows[0][2], 'আরিফ "আজাদ"');
  assert.equal(result.rows[1][0], 'আমার বন্ধু রাশেদ');
});

test('parseCleanNumber handles currency symbols and formatting', () => {
  assert.equal(parseCleanNumber('৳ 350.00'), 350);
  assert.equal(parseCleanNumber('450'), 450);
  assert.equal(parseCleanNumber('$1,200.50'), 1200.5);
  assert.equal(parseCleanNumber('', 100), 100);
});

test('guessColumnMapping maps aliases correctly to schema fields', () => {
  const headers = ['বইয়ের নাম', 'বিক্রয় মূল্য', 'গায়ের দাম', 'লেখক', 'প্রকাশনী', 'ক্যাটাগরি'];
  const mapping = guessColumnMapping(headers, 'book');

  assert.equal(mapping.title, 'বইয়ের নাম');
  assert.equal(mapping.price, 'বিক্রয় মূল্য');
  assert.equal(mapping.regularPrice, 'গায়ের দাম');
  assert.equal(mapping.author, 'লেখক');
  assert.equal(mapping.publisher, 'প্রকাশনী');
  assert.equal(mapping.category, 'ক্যাটাগরি');
});

test('transformRowToProduct validates required fields and builds payload', () => {
  const validRow = {
    title: 'প্যারাডক্সিক্যাল সাজিদ',
    price: '320',
    regularPrice: '400',
    author: 'আরিফ আজাদ',
    publisher: 'গার্ডিয়ান পাবলিকেশনস'
  };

  const parsed = transformRowToProduct(validRow, 'book', 1);
  assert.equal(parsed.isValid, true);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.productPayload.title, 'প্যারাডক্সিক্যাল সাজিদ');
  assert.equal(parsed.productPayload.price, 320);
  assert.equal(parsed.productPayload.previousPrice, 400);
  assert.equal(parsed.productPayload.author, 'আরিফ আজাদ');
  assert.equal(parsed.productPayload.publisher, 'গার্ডিয়ান পাবলিকেশনস');
  assert.equal(parsed.productPayload.type, 'book');
  assert.equal(parsed.productPayload.variants.length, 1);
  assert.equal(parsed.productPayload.variants[0].price, 320);

  // Missing title & invalid price
  const invalidRow = {
    title: '',
    price: '0'
  };
  const invalidParsed = transformRowToProduct(invalidRow, 'book', 2);
  assert.equal(invalidParsed.isValid, false);
  assert.ok(invalidParsed.errors.length >= 2);
});

test('generateSampleCsv produces valid CSV for books and stationery', () => {
  const bookCsv = generateSampleCsv('book');
  const parsedBook = parseCsv(bookCsv);
  assert.ok(parsedBook.headers.includes('Book Title'));
  assert.ok(parsedBook.headers.includes('Offer Price'));
  assert.ok(parsedBook.rows.length >= 2);

  const statCsv = generateSampleCsv('stationery');
  const parsedStat = parseCsv(statCsv);
  assert.ok(parsedStat.headers.includes('Stationery Title'));
  assert.ok(parsedStat.headers.includes('Brand'));
  assert.ok(parsedStat.rows.length >= 1);
});
