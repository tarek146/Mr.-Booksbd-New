import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveProductImageFitMode,
  getProductImageLayoutClasses,
} from './productImageLayoutHelpers';

test('resolveProductImageFitMode defaults to full-bleed square cover mode', () => {
  assert.equal(resolveProductImageFitMode(undefined, undefined), 'cover');
  assert.equal(resolveProductImageFitMode({}, {}), 'cover');
});

test('resolveProductImageFitMode respects admin-configured cover or contain setting', () => {
  assert.equal(
    resolveProductImageFitMode({ productImageFitMode: 'contain' }, null),
    'contain'
  );
  assert.equal(
    resolveProductImageFitMode(null, { productImageFitMode: 'contain' }),
    'contain'
  );
  assert.equal(
    resolveProductImageFitMode({ productImageFitMode: 'cover' }, null),
    'cover'
  );
});

test('getProductImageLayoutClasses produces full-bleed 1:1 square classes without side padding in cover mode', () => {
  const cover = getProductImageLayoutClasses('cover');

  assert.match(cover.cardFrameClass, /aspect-square/);
  assert.doesNotMatch(cover.cardFrameClass, /\bp-2\b/);
  assert.match(cover.cardImgClass, /object-cover/);

  assert.match(cover.detailFrameClass, /aspect-square/);
  assert.doesNotMatch(cover.detailFrameClass, /\bp-6\b|\bp-8\b/);
  assert.match(cover.detailImgClass, /w-full h-full object-cover/);

  assert.doesNotMatch(cover.thumbFrameClass, /\bp-1\b/);
  assert.match(cover.thumbImgClass, /object-cover/);
  assert.match(cover.cartThumbClass, /w-20 h-20 object-cover/);
  assert.match(cover.miniThumbClass, /w-11 h-11 object-cover/);
  assert.match(cover.relatedBookThumbFrameClass, /w-14 h-14/);
  assert.match(cover.relatedBookThumbImgClass, /object-cover/);
});

test('getProductImageLayoutClasses preserves padded uncropped classes when admin switches to contain mode', () => {
  const contain = getProductImageLayoutClasses('contain');

  assert.match(contain.cardFrameClass, /\bp-2\b/);
  assert.match(contain.cardImgClass, /object-contain/);
  assert.match(contain.detailFrameClass, /p-6 sm:p-8/);
  assert.match(contain.detailImgClass, /object-contain/);
  assert.match(contain.cartThumbClass, /object-contain/);
  assert.match(contain.miniThumbClass, /object-contain/);
  assert.match(contain.relatedBookThumbImgClass, /object-contain/);
});
