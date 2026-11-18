import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductCategoryFields,
  getProductCategories,
  getSelectableProductCategories,
  productCategoriesMatchQuery,
  productHasCategory,
  toggleProductCategorySelection,
} from './productCategoryHelpers';
import { Category } from '../types';

test('getProductCategories merges categories array and legacy category without duplicates', () => {
  assert.deepEqual(
    getProductCategories({ category: 'Islamic Books' }),
    ['Islamic Books']
  );

  assert.deepEqual(
    getProductCategories({
      category: 'Islamic Books',
      categories: ['Islamic Books', 'Religion Books', 'islamic books', 'Books'],
    }),
    ['Islamic Books', 'Religion Books', 'Books']
  );
});

test('productHasCategory and productCategoriesMatchQuery match any assigned category case-insensitively', () => {
  const multiCatProduct = {
    category: 'Islamic Books',
    categories: ['Islamic Books', 'Religion Books', 'Bangla Novels & Poetry'],
  };

  assert.equal(productHasCategory(multiCatProduct, 'religion books'), true);
  assert.equal(productHasCategory(multiCatProduct, 'Bangla Novels & Poetry'), true);
  assert.equal(productHasCategory(multiCatProduct, 'Thriller & Mystery'), false);

  assert.equal(productCategoriesMatchQuery(multiCatProduct, 'religion'), true);
  assert.equal(productCategoriesMatchQuery(multiCatProduct, 'thriller'), false);
});

test('toggleProductCategorySelection and buildProductCategoryFields toggle & normalize selection order', () => {
  let selected: string[] = [];
  selected = toggleProductCategorySelection(selected, 'Islamic Books');
  selected = toggleProductCategorySelection(selected, 'Religion Books');
  selected = toggleProductCategorySelection(selected, 'Academic & Textbooks');
  assert.deepEqual(selected, ['Islamic Books', 'Religion Books', 'Academic & Textbooks']);

  // Uncheck middle item
  selected = toggleProductCategorySelection(selected, 'religion books');
  assert.deepEqual(selected, ['Islamic Books', 'Academic & Textbooks']);

  const fields = buildProductCategoryFields(selected);
  assert.equal(fields.category, 'Islamic Books');
  assert.deepEqual(fields.categories, ['Islamic Books', 'Academic & Textbooks']);
  assert.deepEqual(buildProductCategoryFields([]), { category: '', categories: [] });
});

test('getSelectableProductCategories sorts by displayOrder, filters strictly by type, and deduplicates', () => {
  const cats: Category[] = [
    { id: 'c1', name: 'Thriller & Mystery', type: 'book', slug: 'thriller', displayOrder: 3 },
    { id: 'c2', name: 'Pen/Calculator', type: 'stationery', slug: 'pen', displayOrder: 1 },
    { id: 'c3', name: 'Islamic Books', type: 'book', slug: 'islamic', displayOrder: 1 },
    { id: 'c4', name: 'islamic books', type: 'book', slug: 'islamic-dup', displayOrder: 2 },
  ];

  const bookOptions = getSelectableProductCategories(cats, 'book', ['Legacy Custom']);
  assert.deepEqual(
    bookOptions.map(o => o.name),
    ['Islamic Books', 'Thriller & Mystery', 'Legacy Custom']
  );

  const statOptions = getSelectableProductCategories(cats, 'stationery', []);
  assert.deepEqual(
    statOptions.map(o => o.name),
    ['Pen/Calculator']
  );
});
