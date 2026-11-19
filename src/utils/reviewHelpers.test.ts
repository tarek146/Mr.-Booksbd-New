import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReviewReaction,
  validateBangladeshPhone,
  sortPaymentMethods,
  getPaymentMethodDisplayMeta,
  getActiveOnlinePaymentMethods,
  validatePaymentTransactionPopup,
  GENERAL_TESTIMONIAL_PRODUCT_ID,
  isGeneralTestimonial,
  normalizeReviewsList,
  reconcileIncomingReviews,
  filterReviewsForProduct,
  filterAdminReviews,
} from './reviewHelpers';
import { isValidImageUrl, sanitizeImageUrl } from './imageCompressor';
import { Review, PaymentMethodConfig } from '../types';

const baseReview: Review = {
  id: 'rev-101',
  productId: 'prod-1',
  userName: 'Tanvir Ahmed',
  rating: 5,
  comment: 'Great book quality!',
  createdAt: 1700000000000,
  isVerifiedPurchase: true,
  likesCount: 4,
  lovesCount: 2,
  dislikesCount: 0,
  userReactions: {},
};

test('applyReviewReaction increments count when user reacts for the first time', () => {
  const res = applyReviewReaction(baseReview, 'visitor-1', 'like');
  assert.equal(res.likesCount, 5);
  assert.equal(res.lovesCount, 2);
  assert.equal(res.dislikesCount, 0);
  assert.equal(res.activeReaction, 'like');
  assert.equal(res.userReactions['visitor-1'], 'like');
});

test('applyReviewReaction toggles off reaction when clicking the same reaction again', () => {
  const first = applyReviewReaction(baseReview, 'visitor-1', 'love');
  assert.equal(first.lovesCount, 3);
  assert.equal(first.activeReaction, 'love');

  const second = applyReviewReaction(
    { ...baseReview, ...first },
    'visitor-1',
    'love'
  );
  assert.equal(second.lovesCount, 2);
  assert.equal(second.activeReaction, null);
  assert.equal(second.userReactions['visitor-1'], undefined);
});

test('applyReviewReaction switches between like and love accurately and migrates legacy dislike cleanly', () => {
  const liked = applyReviewReaction(baseReview, 'visitor-1', 'like');
  assert.equal(liked.likesCount, 5);
  assert.equal(liked.lovesCount, 2);

  const switchedToLove = applyReviewReaction(
    { ...baseReview, ...liked },
    'visitor-1',
    'love'
  );
  assert.equal(switchedToLove.likesCount, 4);
  assert.equal(switchedToLove.lovesCount, 3);
  assert.equal(switchedToLove.dislikesCount, 0);
  assert.equal(switchedToLove.activeReaction, 'love');

  // Legacy visitor who previously reacted 'dislike' switching to 'like'
  const legacyReview: Review = {
    ...baseReview,
    dislikesCount: 1,
    userReactions: { 'legacy-visitor': 'dislike' },
  };
  const migrated = applyReviewReaction(legacyReview, 'legacy-visitor', 'like');
  assert.equal(migrated.likesCount, 5);
  assert.equal(migrated.dislikesCount, 0);
  assert.equal(migrated.activeReaction, 'like');
  assert.equal(migrated.userReactions['legacy-visitor'], 'like');
});

test('validateBangladeshPhone validates primary and optional phone numbers properly', () => {
  assert.equal(validateBangladeshPhone('', true).valid, true);
  assert.equal(validateBangladeshPhone('   ', true).valid, true);
  assert.equal(validateBangladeshPhone('', false).valid, false);
  assert.equal(validateBangladeshPhone('01712345678', true).valid, true);
  assert.equal(validateBangladeshPhone('01812-345678', true).cleaned, '01812345678');
  assert.equal(validateBangladeshPhone('12345', true).valid, false);
});

test('sortPaymentMethods places Cash on Delivery first, bKash second, followed by Nagad, Rocket, Upay, and Bank, and respects Admin customOrder', () => {
  const unsorted: PaymentMethodConfig[] = [
    { id: 'bank-transfer', name: 'Bank Transfer', type: 'bank', accountName: 'MRB', accountNumber: '123', instructions: '', isActive: true, displayOrder: 1 },
    { id: 'nagad-personal', name: 'Nagad Personal', type: 'nagad', accountName: 'MRB', accountNumber: '018', instructions: '', isActive: true, displayOrder: 2 },
    { id: 'cod', name: 'Cash on Delivery (COD)', type: 'cod', accountName: 'COD', accountNumber: 'N/A', instructions: '', isActive: true, displayOrder: 5 },
    { id: 'rocket-personal', name: 'Rocket Mobile', type: 'rocket', accountName: 'MRB', accountNumber: '019', instructions: '', isActive: true, displayOrder: 3 },
    { id: 'bkash-personal', name: 'bKash Personal', type: 'bkash', accountName: 'MRB', accountNumber: '017', instructions: '', isActive: true, displayOrder: 1 },
  ];

  const sorted = sortPaymentMethods(unsorted);
  assert.deepEqual(sorted.map(m => m.type), ['cod', 'bkash', 'nagad', 'rocket', 'bank']);

  // When Admin reorders via Up/Down arrows (customOrder: true)
  const adminReordered = unsorted.map((m, idx) => ({ ...m, customOrder: true, displayOrder: idx + 1 }));
  const customSorted = sortPaymentMethods(adminReordered);
  assert.deepEqual(customSorted.map(m => m.type), ['bank', 'nagad', 'cod', 'rocket', 'bkash']);
});

test('getActiveOnlinePaymentMethods returns all active non-COD methods in sorted order', () => {
  const methods: PaymentMethodConfig[] = [
    { id: 'cod', name: 'COD', type: 'cod', accountName: 'COD', accountNumber: 'N/A', instructions: '', isActive: true, displayOrder: 1 },
    { id: 'bank', name: 'Bank', type: 'bank', accountName: 'MRB', accountNumber: '123', instructions: '', isActive: true, displayOrder: 6 },
    { id: 'upay', name: 'Upay', type: 'upay', accountName: 'MRB', accountNumber: '017', instructions: '', isActive: true, displayOrder: 5 },
    { id: 'rocket', name: 'Rocket', type: 'rocket', accountName: 'MRB', accountNumber: '019', instructions: '', isActive: true, displayOrder: 4 },
    { id: 'nagad', name: 'Nagad', type: 'nagad', accountName: 'MRB', accountNumber: '018', instructions: '', isActive: true, displayOrder: 3 },
    { id: 'bkash', name: 'bKash', type: 'bkash', accountName: 'MRB', accountNumber: '017', instructions: '', isActive: true, displayOrder: 2 },
  ];
  const activeOnline = getActiveOnlinePaymentMethods(methods);
  assert.deepEqual(activeOnline.map(m => m.type), ['bkash', 'nagad', 'rocket', 'upay', 'bank']);
});

test('getPaymentMethodDisplayMeta provides Bengali labels, empty badgeText by default, custom badgeText when set by Admin, and filters legacy unsplash stock urls', () => {
  const bkashMethod: PaymentMethodConfig = {
    id: 'bkash-personal',
    name: 'bKash Personal',
    type: 'bkash',
    accountName: 'MR. BOOKS Official',
    accountNumber: '01712345678',
    instructions: '1. Go to your bKash app or dial *247#.',
    isActive: true,
    displayOrder: 1,
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
  };

  const meta = getPaymentMethodDisplayMeta(bkashMethod);
  assert.equal(meta.displayTitle, 'বিকাশ');
  assert.equal(meta.englishName, 'bKash');
  assert.equal(meta.displaySubtitle, 'বিকাশ সেন্ড মানি');
  assert.equal(meta.badgeText, '');
  assert.equal(meta.customLogoUrl, undefined);
  assert.equal(meta.qrCodeUrl, undefined);

  const bkashWithQr = getPaymentMethodDisplayMeta({ ...bkashMethod, qrCodeUrl: 'https://example.com/bkash-qr.png' });
  assert.equal(bkashWithQr.qrCodeUrl, 'https://example.com/bkash-qr.png');

  const bkashWithAdminOffer = getPaymentMethodDisplayMeta({ ...bkashMethod, badgeText: '5% OFF' });
  assert.equal(bkashWithAdminOffer.badgeText, '5% OFF');

  // Corrupted "data:," logoUrl is rejected so PaymentBrandIcon uses built-in vector icon instead of broken image
  const bkashWithCorruptedData = getPaymentMethodDisplayMeta({ ...bkashMethod, logoUrl: 'data:,' });
  assert.equal(bkashWithCorruptedData.customLogoUrl, undefined);
});

test('isValidImageUrl and sanitizeImageUrl reject corrupted "data:," URLs and preserve valid image URLs', () => {
  assert.equal(isValidImageUrl(''), false);
  assert.equal(isValidImageUrl('data:,'), false);
  assert.equal(isValidImageUrl('data:image/png;base64,'), false);
  assert.equal(sanitizeImageUrl('data:,'), '');
  const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  assert.equal(isValidImageUrl(validPng), true);
  assert.equal(sanitizeImageUrl(validPng), validPng);
  assert.equal(isValidImageUrl('https://example.com/logo.png'), true);
});

test('validatePaymentTransactionPopup validates sender number and TrxID on popup Done click', () => {
  assert.equal(validatePaymentTransactionPopup('cod', '', '').valid, true);
  assert.equal(validatePaymentTransactionPopup('bkash', '', '9X7D892K').valid, false);
  assert.equal(validatePaymentTransactionPopup('bkash', '01712345678', '').valid, false);
  const ok = validatePaymentTransactionPopup('bkash', '01712-345678', '9x7d892k');
  assert.equal(ok.valid, true);
  assert.equal(ok.cleanSender, '01712345678');
  assert.equal(ok.cleanTrxId, '9X7D892K');
});



test('normalizeReviewsList deduplicates, filters deleted IDs, sorts newest first, and never adds default reviews', () => {
  assert.deepEqual(normalizeReviewsList([]), []);
  assert.deepEqual(normalizeReviewsList(undefined), []);

  const r1: Review = { ...baseReview, id: 'rev-1', createdAt: 1000 };
  const r2: Review = { ...baseReview, id: 'rev-2', createdAt: 3000 };
  const r3: Review = { ...baseReview, id: 'rev-3', createdAt: 2000 };
  const r1Newer: Review = { ...baseReview, id: 'rev-1', createdAt: 4000, comment: 'Updated' };

  const result = normalizeReviewsList([r1, r2, r3, r1Newer], ['rev-2']);
  assert.deepEqual(result.map(r => r.id), ['rev-1', 'rev-3']);
  assert.equal(result[0].comment, 'Updated');
});

test('reconcileIncomingReviews prevents stale cache snapshots from resurrecting deleted reviews and preserves new local adds', () => {
  const existingOld: Review = { ...baseReview, id: 'rev-old', createdAt: 1000 };
  const deletedRev: Review = { ...baseReview, id: 'rev-deleted', createdAt: 2000 };
  const newlyAdded: Review = { ...baseReview, id: 'rev-new', createdAt: 5000, userName: 'New Reviewer' };

  const pendingUpserts = new Map<string, Review>([[newlyAdded.id, newlyAdded]]);
  const deletedIds = new Set<string>(['rev-deleted']);

  // Stale cache snapshot still contains deletedRev and doesn't yet have newlyAdded
  const reconciled = reconcileIncomingReviews({
    incoming: [existingOld, deletedRev],
    current: [newlyAdded, existingOld],
    deletedIds,
    pendingUpserts,
  });

  assert.deepEqual(reconciled.map(r => r.id), ['rev-new', 'rev-old']);
  assert.equal(reconciled.some(r => r.id === 'rev-deleted'), false);
});

test('filterReviewsForProduct returns strictly matching product reviews with zero fake defaults', () => {
  const prodRev: Review = { ...baseReview, id: 'rev-p1', productId: 'book-1', createdAt: 2000 };
  const otherRev: Review = { ...baseReview, id: 'rev-p2', productId: 'book-2', createdAt: 3000 };
  const generalRev: Review = { ...baseReview, id: 'rev-gen', productId: GENERAL_TESTIMONIAL_PRODUCT_ID, createdAt: 4000 };

  assert.deepEqual(filterReviewsForProduct([prodRev, otherRev, generalRev], 'book-1').map(r => r.id), ['rev-p1']);
  assert.deepEqual(filterReviewsForProduct([prodRev, otherRev, generalRev], 'book-999'), []);
  assert.equal(isGeneralTestimonial(generalRev), true);
  assert.equal(isGeneralTestimonial(prodRev), false);
});

test('filterAdminReviews filters by target type and search query across customer name, comment, and product title', () => {
  const prodRev: Review = { ...baseReview, id: 'rev-p1', productId: 'book-1', userName: 'Karim', comment: 'Loved the print', createdAt: 2000 };
  const generalRev: Review = { ...baseReview, id: 'rev-gen', productId: GENERAL_TESTIMONIAL_PRODUCT_ID, userName: 'Farhana', comment: 'Fast delivery from store', createdAt: 3000 };
  const all = [prodRev, generalRev];

  assert.deepEqual(filterAdminReviews(all, '', 'general').map(r => r.id), ['rev-gen']);
  assert.deepEqual(filterAdminReviews(all, '', 'product').map(r => r.id), ['rev-p1']);
  assert.deepEqual(filterAdminReviews(all, 'atomic', 'all', { 'book-1': 'Atomic Habits' }).map(r => r.id), ['rev-p1']);
  assert.deepEqual(filterAdminReviews(all, 'farhana', 'all').map(r => r.id), ['rev-gen']);
});


