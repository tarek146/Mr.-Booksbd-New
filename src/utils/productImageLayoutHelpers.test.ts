import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERENCE_BOOK_ASPECT_RATIO,
  resolveProductImageFitMode,
  resolveProductImageAspectRatio,
  computeSafeAutoAspectRatio,
  resolveContainerAspectRatio,
  formatAspectRatioBadge,
  getProductImageLayoutClasses,
} from './productImageLayoutHelpers';

test('resolveProductImageFitMode defaults to cover and respects admin contain override', () => {
  assert.equal(resolveProductImageFitMode(undefined, undefined), 'cover');
  assert.equal(resolveProductImageFitMode({}, {}), 'cover');
  assert.equal(resolveProductImageFitMode({ productImageFitMode: 'contain' }, null), 'contain');
  assert.equal(resolveProductImageFitMode(null, { productImageFitMode: 'contain' }), 'contain');
  assert.equal(resolveProductImageFitMode({ productImageFitMode: 'cover' }, null), 'cover');
});

test('resolveProductImageAspectRatio defaults to auto (3:4 base) and respects admin presets', () => {
  assert.equal(resolveProductImageAspectRatio(undefined, undefined), 'auto');
  assert.equal(resolveProductImageAspectRatio({}, {}), 'auto');
  assert.equal(resolveProductImageAspectRatio(null, { productImageAspectRatio: '3:4' }), '3:4');
  assert.equal(resolveProductImageAspectRatio({ productImageAspectRatio: '4:5' }, null), '4:5');
  assert.equal(resolveProductImageAspectRatio(null, { productImageAspectRatio: '2:3' }), '2:3');
  assert.equal(resolveProductImageAspectRatio(null, { productImageAspectRatio: '1:1' }), '1:1');
});

test('computeSafeAutoAspectRatio matches exact 3:4 reference photo (1536x2048) and clamps extremes safely', () => {
  // Exact dimensions of user's attached reference photo (Cosmos by Carl Sagan)
  assert.equal(computeSafeAutoAspectRatio(1536, 2048), 0.75);
  assert.equal(computeSafeAutoAspectRatio(900, 1200), 0.75);
  // Square stationery photo
  assert.equal(computeSafeAutoAspectRatio(1000, 1000), 1);
  // 4:5 portrait photo
  assert.equal(computeSafeAutoAspectRatio(800, 1000), 0.8);
  // Missing/invalid dimensions fall back cleanly to 3:4 book standard (0.75)
  assert.equal(computeSafeAutoAspectRatio(undefined, undefined), REFERENCE_BOOK_ASPECT_RATIO);
  assert.equal(computeSafeAutoAspectRatio(0, 0), 0.75);
  // Extreme tall strip or wide panorama gets safely clamped so cards never break
  assert.equal(computeSafeAutoAspectRatio(200, 2000), 0.65);
  assert.equal(computeSafeAutoAspectRatio(3000, 500), 1.35);
});

test('resolveContainerAspectRatio adapts automatically in auto mode and honors fixed presets', () => {
  const autoReference = resolveContainerAspectRatio({
    mode: 'auto',
    naturalWidth: 1536,
    naturalHeight: 2048,
  });
  assert.equal(autoReference.aspectClass, '');
  assert.equal(autoReference.aspectStyle, '0.75');
  assert.equal(autoReference.numericRatio, 0.75);

  // Uses savedRatio before image finishes loading (zero layout shift)
  const autoSaved = resolveContainerAspectRatio({
    mode: 'auto',
    savedRatio: 0.8,
  });
  assert.equal(autoSaved.aspectStyle, '0.8');

  // Defaults cleanly to 0.75 (3:4) before load if no savedRatio exists
  const autoInitial = resolveContainerAspectRatio({ mode: 'auto' });
  assert.equal(autoInitial.aspectStyle, '0.75');

  // Fixed modes emit exact Tailwind aspect classes
  assert.equal(resolveContainerAspectRatio({ mode: '3:4' }).aspectClass, 'aspect-[3/4]');
  assert.equal(resolveContainerAspectRatio({ mode: '4:5' }).aspectClass, 'aspect-[4/5]');
  assert.equal(resolveContainerAspectRatio({ mode: '2:3' }).aspectClass, 'aspect-[2/3]');
  assert.equal(resolveContainerAspectRatio({ mode: '1:1' }).aspectClass, 'aspect-square');
});

test('getProductImageLayoutClasses supports auto/3:4 portrait and 1:1 square cleanly across cover and contain modes', () => {
  const autoCover = getProductImageLayoutClasses('cover', 'auto');
  assert.doesNotMatch(autoCover.cardFrameClass, /aspect-square/);
  assert.match(autoCover.cardImgClass, /object-cover/);
  assert.match(autoCover.cartThumbClass, /w-\[66px\] h-\[88px\]/);

  const portraitFixed = getProductImageLayoutClasses('cover', '3:4');
  assert.match(portraitFixed.cardFrameClass, /aspect-\[3\/4\]/);
  assert.match(portraitFixed.detailFrameClass, /aspect-\[3\/4\]/);

  const squareFixed = getProductImageLayoutClasses('cover', '1:1');
  assert.match(squareFixed.cardFrameClass, /aspect-square/);
  assert.match(squareFixed.cartThumbClass, /w-20 h-20/);

  const containMode = getProductImageLayoutClasses('contain', '3:4');
  assert.match(containMode.cardFrameClass, /\bp-2\b/);
  assert.match(containMode.cardImgClass, /object-contain/);
  assert.match(containMode.detailImgClass, /object-contain/);
});

test('formatAspectRatioBadge labels common photographic ratios cleanly', () => {
  assert.equal(formatAspectRatioBadge(0.75), '3:4 Portrait');
  assert.equal(formatAspectRatioBadge(0.8), '4:5 Portrait');
  assert.equal(formatAspectRatioBadge(1), '1:1 Square');
  assert.equal(formatAspectRatioBadge(2 / 3), '2:3 Book');
});
