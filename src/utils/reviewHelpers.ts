import { Review } from '../types';

export type ReactionType = 'like' | 'love' | 'dislike';

/**
 * Pure helper to compute updated reaction counts and userReactions map
 * when a customer clicks Like, Love, or Dislike on a review.
 */
export function applyReviewReaction(
  review: Review,
  visitorId: string,
  reaction: ReactionType
): {
  likesCount: number;
  lovesCount: number;
  dislikesCount: number;
  userReactions: Record<string, ReactionType>;
  activeReaction: ReactionType | null;
} {
  const currentReactions: Record<string, ReactionType> = { ...(review.userReactions || {}) };
  const previousReaction = currentReactions[visitorId] || null;

  let likesCount = Math.max(0, Number(review.likesCount ?? 0));
  let lovesCount = Math.max(0, Number(review.lovesCount ?? 0));
  let dislikesCount = Math.max(0, Number(review.dislikesCount ?? 0));

  // If user already had a reaction, decrement that previous reaction count
  if (previousReaction === 'like') {
    likesCount = Math.max(0, likesCount - 1);
  } else if (previousReaction === 'love') {
    lovesCount = Math.max(0, lovesCount - 1);
  } else if (previousReaction === 'dislike') {
    dislikesCount = Math.max(0, dislikesCount - 1);
  }

  let activeReaction: ReactionType | null = null;

  // Toggle off if clicking the exact same reaction, otherwise apply the new reaction
  if (previousReaction === reaction) {
    delete currentReactions[visitorId];
    activeReaction = null;
  } else {
    currentReactions[visitorId] = reaction;
    activeReaction = reaction;
    if (reaction === 'like') likesCount += 1;
    else if (reaction === 'love') lovesCount += 1;
    else if (reaction === 'dislike') dislikesCount += 1;
  }

  return {
    likesCount,
    lovesCount,
    dislikesCount,
    userReactions: currentReactions,
    activeReaction,
  };
}

/**
 * Validates primary or optional Bangladesh phone numbers.
 */
export function validateBangladeshPhone(phone: string, isOptional = false): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = phone.trim().replace(/[\s-]/g, '');
  if (!cleaned) {
    if (isOptional) {
      return { valid: true, cleaned: '' };
    }
    return { valid: false, cleaned: '', error: 'Please enter your mobile phone number.' };
  }

  const isValidFormat = /^(\+?8801|01)[3-9]\d{8}$/.test(cleaned);
  if (!isValidFormat) {
    return {
      valid: false,
      cleaned,
      error: isOptional
        ? 'Please enter a valid 11-digit optional mobile number (e.g. 01812345678) or leave it blank.'
        : 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).',
    };
  }

  return { valid: true, cleaned };
}
