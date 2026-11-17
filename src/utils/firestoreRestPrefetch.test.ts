import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fromFirestoreRestValue,
  decodeFirestoreRestDocument,
  decodeFirestoreRestCollection,
} from './firestoreRestPrefetch.ts';

test('fromFirestoreRestValue converts primitive, null, array, and nested map types cleanly', () => {
  assert.equal(fromFirestoreRestValue({ stringValue: 'MR. BOOKS BD' }), 'MR. BOOKS BD');
  assert.equal(fromFirestoreRestValue({ integerValue: '350' }), 350);
  assert.equal(fromFirestoreRestValue({ doubleValue: 4.85 }), 4.85);
  assert.equal(fromFirestoreRestValue({ booleanValue: true }), true);
  assert.equal(fromFirestoreRestValue({ booleanValue: false }), false);
  assert.equal(fromFirestoreRestValue({ nullValue: null }), null);

  assert.deepEqual(
    fromFirestoreRestValue({
      arrayValue: {
        values: [{ stringValue: 'img1.webp' }, { stringValue: 'img2.webp' }],
      },
    }),
    ['img1.webp', 'img2.webp']
  );

  assert.deepEqual(
    fromFirestoreRestValue({ arrayValue: {} }),
    []
  );

  assert.deepEqual(
    fromFirestoreRestValue({
      mapValue: {
        fields: {
          enabled: { booleanValue: true },
          title: { stringValue: 'Special Offer' },
          items: {
            arrayValue: {
              values: [
                {
                  mapValue: {
                    fields: {
                      productId: { stringValue: 'prod-123' },
                      discountPercentage: { integerValue: '25' },
                      onlinePaymentOnly: { booleanValue: false },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    }),
    {
      enabled: true,
      title: 'Special Offer',
      items: [
        {
          productId: 'prod-123',
          discountPercentage: 25,
          onlinePaymentOnly: false,
        },
      ],
    }
  );
});

test('decodeFirestoreRestDocument extracts document ID from resource name and preserves fields', () => {
  const decoded = decodeFirestoreRestDocument({
    name: 'projects/mr-book-new/databases/(default)/documents/products/prod-abc-1',
    fields: {
      title: { stringValue: 'The Alchemist' },
      price: { integerValue: '320' },
      isFeatured: { booleanValue: true },
      variants: {
        arrayValue: {
          values: [
            {
              mapValue: {
                fields: {
                  id: { stringValue: 'v1' },
                  name: { stringValue: 'Paperback' },
                  price: { integerValue: '320' },
                  pages: { integerValue: '198' },
                },
              },
            },
          ],
        },
      },
    },
  });

  assert.deepEqual(decoded, {
    id: 'prod-abc-1',
    title: 'The Alchemist',
    price: 320,
    isFeatured: true,
    variants: [{ id: 'v1', name: 'Paperback', price: 320, pages: 198 }],
  });
});

test('decodeFirestoreRestCollection handles valid documents, empty {} collection, and API error objects', () => {
  // Empty collection in Firestore REST omits `documents` property
  assert.deepEqual(decodeFirestoreRestCollection({}), []);

  // API error must return null so store does not overwrite state with empty array on network/4xx error
  assert.equal(
    decodeFirestoreRestCollection({ error: { code: 403, message: 'Permission denied' } }),
    null
  );
  assert.equal(decodeFirestoreRestCollection(null), null);

  const list = decodeFirestoreRestCollection({
    documents: [
      {
        name: 'projects/mr-book-new/databases/(default)/documents/categories/cat-1',
        fields: {
          name: { stringValue: 'Fiction' },
          showOnHome: { booleanValue: true },
        },
      },
      {
        name: 'projects/mr-book-new/databases/(default)/documents/categories/cat-2',
        fields: {
          name: { stringValue: 'Science' },
          showOnHome: { booleanValue: false },
        },
      },
    ],
  });

  assert.deepEqual(list, [
    { id: 'cat-1', name: 'Fiction', showOnHome: true },
    { id: 'cat-2', name: 'Science', showOnHome: false },
  ]);
});
