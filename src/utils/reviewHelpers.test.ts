import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReviewReaction, validateBangladeshPhone } from './reviewHelpers';
import { Review } from '../types';

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

test('applyReviewReaction switches from one reaction to another accurately', () => {
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

  const switchedToDislike = applyReviewReaction(
    { ...baseReview, ...switchedToLove },
    'visitor-1',
    'dislike'
  );
  assert.equal(switchedToDislike.likesCount, 4);
  assert.equal(switchedToDislike.lovesCount, 2);
  assert.equal(switchedToDislike.dislikesCount, 1);
  assert.equal(switchedToDislike.activeReaction, 'dislike');
});

test('validateBangladeshPhone validates primary and optional phone numbers properly', () => {
  assert.equal(validateBangladeshPhone('', true).valid, true);
  assert.equal(validateBangladeshPhone('   ', true).valid, true);
  assert.equal(validateBangladeshPhone('', false).valid, false);
  assert.equal(validateBangladeshPhone('01712345678', true).valid, true);
  assert.equal(validateBangladeshPhone('01812-345678', true).cleaned, '01812345678');
  assert.equal(validateBangladeshPhone('12345', true).valid, false);
});
