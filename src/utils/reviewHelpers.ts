import { Review, PaymentMethodConfig } from '../types';
import { isValidImageUrl } from './imageCompressor';

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

const PAYMENT_TYPE_PRIORITY: Record<PaymentMethodConfig['type'], number> = {
  cod: 1,
  bkash: 2,
  nagad: 3,
  rocket: 4,
  upay: 5,
  bank: 6,
};

/**
 * Deterministic payment method sorting:
 * Respects Admin customOrder when reordered via Up/Down controls,
 * otherwise guarantees Cash on Delivery (cod) is 1st, followed by bKash (2nd),
 * then Nagad, Rocket, Upay, and Bank Transfer.
 */
export function sortPaymentMethods(methods: PaymentMethodConfig[]): PaymentMethodConfig[] {
  return [...methods].sort((a, b) => {
    if (a.customOrder && b.customOrder) {
      const orderA = Number(a.displayOrder ?? 99);
      const orderB = Number(b.displayOrder ?? 99);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }
    const prioA = PAYMENT_TYPE_PRIORITY[a.type] ?? 99;
    const prioB = PAYMENT_TYPE_PRIORITY[b.type] ?? 99;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    const orderA = Number(a.displayOrder ?? 99);
    const orderB = Number(b.displayOrder ?? 99);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

const LEGACY_PLACEHOLDER_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
];

/**
 * Returns normalized display title, English name, subtitle, optional promo badge (empty by default),
 * account type, requirement flags, instruction text, and custom logo URL.
 */
export function getPaymentMethodDisplayMeta(method: PaymentMethodConfig): {
  displayTitle: string;
  englishName: string;
  displaySubtitle: string;
  badgeText: string;
  accountType: 'Personal' | 'Merchant' | 'Agent' | 'None';
  requireTrxId: boolean;
  requireSenderPhone: boolean;
  instructionText: string;
  customLogoUrl?: string;
} {
  const rawLogo = (method.logoUrl || '').trim();
  const isLegacyPlaceholder = LEGACY_PLACEHOLDER_LOGOS.some(url => rawLogo.startsWith(url));
  const customLogoUrl = isValidImageUrl(rawLogo) && !isLegacyPlaceholder ? rawLogo : undefined;

  const isDefaultName =
    !method.name ||
    method.name === 'Cash on Delivery (COD)' ||
    method.name === 'bKash Personal' ||
    method.name === 'Nagad Personal' ||
    method.name === 'Rocket Mobile' ||
    method.name === 'Bank Transfer (DBBL / EBL)';

  const badgeText = (method.badgeText || '').trim();

  switch (method.type) {
    case 'cod':
      return {
        displayTitle: isDefaultName ? 'ক্যাশ অন ডেলিভারি' : method.name,
        englishName: method.englishName || 'Cash on Delivery',
        displaySubtitle: method.subtitle || 'হাতে পেয়ে মূল্য পরিশোধ',
        badgeText,
        accountType: method.accountType || 'None',
        requireTrxId: method.requireTrxId ?? false,
        requireSenderPhone: method.requireSenderPhone ?? false,
        instructionText:
          method.instructions && !method.instructions.startsWith('Pay with cash')
            ? method.instructions
            : 'বই হাতে পেয়ে ডেলিভারি ম্যানের কাছে নগদ অর্থ পরিশোধ করুন।',
        customLogoUrl,
      };
    case 'bkash':
      return {
        displayTitle: isDefaultName ? 'বিকাশ' : method.name,
        englishName: method.englishName || 'bKash',
        displaySubtitle: method.subtitle || 'বিকাশ সেন্ড মানি',
        badgeText,
        accountType: method.accountType || 'Personal',
        requireTrxId: method.requireTrxId ?? true,
        requireSenderPhone: method.requireSenderPhone ?? true,
        instructionText:
          method.instructions && !method.instructions.startsWith('1. Go to your bKash app')
            ? method.instructions
            : 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।',
        customLogoUrl,
      };
    case 'nagad':
      return {
        displayTitle: isDefaultName ? 'নগদ' : method.name,
        englishName: method.englishName || 'Nagad',
        displaySubtitle: method.subtitle || 'নগদ সেন্ড মানি',
        badgeText,
        accountType: method.accountType || 'Personal',
        requireTrxId: method.requireTrxId ?? true,
        requireSenderPhone: method.requireSenderPhone ?? true,
        instructionText:
          method.instructions && !method.instructions.startsWith('1. Open Nagad App')
            ? method.instructions
            : 'নগদ অ্যাপ অথবা *167# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।',
        customLogoUrl,
      };
    case 'rocket':
      return {
        displayTitle: isDefaultName ? 'রকেট' : method.name,
        englishName: method.englishName || 'Rocket',
        displaySubtitle: method.subtitle || 'রকেট সেন্ড মানি',
        badgeText,
        accountType: method.accountType || 'Personal',
        requireTrxId: method.requireTrxId ?? true,
        requireSenderPhone: method.requireSenderPhone ?? true,
        instructionText:
          method.instructions && !method.instructions.startsWith('1. Dial *322#')
            ? method.instructions
            : 'রকেট অ্যাপ অথবা *322# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।',
        customLogoUrl,
      };
    case 'upay':
      return {
        displayTitle: isDefaultName ? 'উপায়' : method.name,
        englishName: method.englishName || 'Upay',
        displaySubtitle: method.subtitle || 'উপায় সেন্ড মানি',
        badgeText,
        accountType: method.accountType || 'Personal',
        requireTrxId: method.requireTrxId ?? true,
        requireSenderPhone: method.requireSenderPhone ?? true,
        instructionText:
          method.instructions ||
          'উপায় অ্যাপ অথবা *268# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।',
        customLogoUrl,
      };
    case 'bank':
    default:
      return {
        displayTitle: isDefaultName ? 'ব্যাংক ট্রান্সফার' : method.name,
        englishName: method.englishName || 'Bank Transfer',
        displaySubtitle: method.subtitle || 'ব্যাংক একাউন্টে পেমেন্ট',
        badgeText,
        accountType: method.accountType || 'Merchant',
        requireTrxId: method.requireTrxId ?? true,
        requireSenderPhone: method.requireSenderPhone ?? true,
        instructionText:
          method.instructions && !method.instructions.startsWith('Transfer the exact order amount')
            ? method.instructions
            : 'নির্ধারিত ব্যাংক একাউন্টে মোট টাকার পরিমাণ ট্রান্সফার করে ট্রানজেকশন রেফারেন্স বা রিসিপ্ট আইডি নিচে দিন।',
        customLogoUrl,
      };
  }
}

/**
 * Validates the Sender Mobile Number and Transaction ID (TrxID) in the payment popup
 * when the customer clicks "Done".
 */
export function validatePaymentTransactionPopup(
  methodType: PaymentMethodConfig['type'],
  senderNumber: string,
  transactionId: string
): { valid: boolean; error?: string; cleanSender: string; cleanTrxId: string } {
  if (methodType === 'cod') {
    return { valid: true, cleanSender: '', cleanTrxId: '' };
  }

  const cleanSender = senderNumber.trim().replace(/[\s-]/g, '');
  const cleanTrxId = transactionId.trim().toUpperCase();

  if (!cleanSender) {
    return {
      valid: false,
      cleanSender,
      cleanTrxId,
      error: 'অনুগ্রহ করে যে নাম্বার থেকে টাকা পাঠিয়েছেন সেই নাম্বারটি দিন (Sender Mobile Number)।',
    };
  }

  if (methodType === 'bank') {
    if (cleanSender.length < 3) {
      return {
        valid: false,
        cleanSender,
        cleanTrxId,
        error: 'অনুগ্রহ করে সঠিক ব্যাংক একাউন্ট বা মোবাইল নাম্বার দিন।',
      };
    }
  } else {
    // Allow 11 digits (01XXXXXXXXX) or 12 digits for Rocket (01XXXXXXXXXX)
    if (!/^(\+?8801|01)[3-9]\d{8,9}$/.test(cleanSender)) {
      return {
        valid: false,
        cleanSender,
        cleanTrxId,
        error: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।',
      };
    }
  }

  if (!cleanTrxId || cleanTrxId.length < 4) {
    return {
      valid: false,
      cleanSender,
      cleanTrxId,
      error: 'অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন (যেমন: 9X7D892K)।',
    };
  }

  return { valid: true, cleanSender, cleanTrxId };
}
