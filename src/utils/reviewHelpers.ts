import { Review, PaymentMethodConfig, PaymentSubOptionConfig, PaymentSubOptionType } from '../types';
import { isValidImageUrl } from './imageCompressor';

export type ReactionType = 'like' | 'love';

/**
 * Pure helper to compute updated reaction counts and userReactions map
 * when a customer clicks Like or Love on a review.
 * Also handles migrating any legacy 'dislike' reaction cleanly if clicked.
 */
export function applyReviewReaction(
  review: Review,
  visitorId: string,
  reaction: ReactionType
): {
  likesCount: number;
  lovesCount: number;
  dislikesCount: number;
  userReactions: Record<string, 'like' | 'love' | 'dislike'>;
  activeReaction: ReactionType | null;
} {
  const currentReactions: Record<string, 'like' | 'love' | 'dislike'> = { ...(review.userReactions || {}) };
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
  }

  return {
    likesCount,
    lovesCount,
    dislikesCount,
    userReactions: currentReactions,
    activeReaction,
  };
}

export const GENERAL_TESTIMONIAL_PRODUCT_ID = 'general-testimonial';

/**
 * Returns true if the review is a general store testimonial (not tied to a single book/product).
 */
export function isGeneralTestimonial(review?: Pick<Review, 'productId'> | null): boolean {
  const pid = (review?.productId || '').trim();
  return !pid || pid === GENERAL_TESTIMONIAL_PRODUCT_ID;
}

/**
 * Deduplicates reviews by ID, filters out tombstoned/deleted IDs and malformed records,
 * and sorts deterministically newest-first (`createdAt` descending).
 * Never injects default, mock, or fallback reviews.
 */
export function normalizeReviewsList(
  items: Review[] | null | undefined,
  deletedIds?: Iterable<string>
): Review[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const deletedSet = deletedIds ? new Set(deletedIds) : null;
  const byId = new Map<string, Review>();

  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) continue;
    if (deletedSet && deletedSet.has(item.id)) continue;
    const existing = byId.get(item.id);
    if (!existing || (item.createdAt || 0) >= (existing.createdAt || 0)) {
      byId.set(item.id, item);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const diff = (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

/**
 * Reconciles incoming Firestore/cache review snapshots with in-flight local mutations:
 * - Never resurrects locally deleted review IDs (prevents stale cache ghosts).
 * - Preserves optimistic local adds/edits until confirmed by Firestore.
 * - Preserves in-flight customer reactions until their transaction completes.
 */
export function reconcileIncomingReviews({
  incoming,
  current,
  pendingReactionIds = [],
  deletedIds,
  pendingUpserts,
}: {
  incoming: Review[];
  current: Review[];
  pendingReactionIds?: string[];
  deletedIds?: Iterable<string>;
  pendingUpserts?: Map<string, Review> | Record<string, Review>;
}): Review[] {
  const deletedSet = new Set(deletedIds || []);
  const pendingReactionSet = new Set(pendingReactionIds);
  const upsertEntries: Review[] = pendingUpserts
    ? pendingUpserts instanceof Map
      ? Array.from(pendingUpserts.values())
      : Object.values(pendingUpserts)
    : [];
  const upsertMap = new Map<string, Review>();
  for (const rev of upsertEntries) {
    if (rev && rev.id && !deletedSet.has(rev.id)) {
      upsertMap.set(rev.id, rev);
    }
  }

  const currentById = new Map<string, Review>();
  for (const rev of current || []) {
    if (rev && rev.id) currentById.set(rev.id, rev);
  }

  const merged: Review[] = [];
  const seen = new Set<string>();

  for (const item of incoming || []) {
    if (!item || !item.id || deletedSet.has(item.id)) continue;
    seen.add(item.id);

    if (upsertMap.has(item.id)) {
      merged.push(upsertMap.get(item.id)!);
      continue;
    }
    if (pendingReactionSet.has(item.id)) {
      const inFlight = currentById.get(item.id);
      if (inFlight) {
        merged.push(inFlight);
        continue;
      }
    }
    merged.push(item);
  }

  for (const [uid, rev] of upsertMap.entries()) {
    if (!seen.has(uid) && !deletedSet.has(uid)) {
      merged.push(rev);
      seen.add(uid);
    }
  }

  for (const pid of pendingReactionSet) {
    if (!seen.has(pid) && !deletedSet.has(pid)) {
      const inFlight = currentById.get(pid);
      if (inFlight) {
        merged.push(inFlight);
        seen.add(pid);
      }
    }
  }

  return normalizeReviewsList(merged, deletedSet);
}

/**
 * Returns strictly real reviews belonging to a specific product, sorted newest first.
 * Zero hardcoded or fallback reviews are ever returned.
 */
export function filterReviewsForProduct(
  reviews: Review[] | null | undefined,
  productId?: string | null
): Review[] {
  const pid = (productId || '').trim();
  if (!pid || !Array.isArray(reviews)) return [];
  return normalizeReviewsList(reviews.filter(r => r && r.productId === pid));
}

/**
 * Filters reviews for the Admin Reviews Manager by search text and target type.
 */
export function filterAdminReviews(
  reviews: Review[] | null | undefined,
  query = '',
  targetFilter: 'all' | 'general' | 'product' = 'all',
  productTitleMap: Record<string, string> = {}
): Review[] {
  const normalized = normalizeReviewsList(reviews);
  const q = query.trim().toLowerCase();

  return normalized.filter(rev => {
    const isGen = isGeneralTestimonial(rev);
    if (targetFilter === 'general' && !isGen) return false;
    if (targetFilter === 'product' && isGen) return false;

    if (!q) return true;
    const prodTitle = productTitleMap[rev.productId] || '';
    const hay = [
      rev.userName,
      rev.comment,
      prodTitle,
      isGen ? 'general store testimonial' : rev.productId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
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
  bangla_qr: 6,
  bank: 7,
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
  qrCodeUrl?: string;
  englishQrCodeUrl?: string;
  bengaliQrCodeUrl?: string;
} {
  const rawLogo = (method.logoUrl || '').trim();
  const isLegacyPlaceholder = LEGACY_PLACEHOLDER_LOGOS.some(url => rawLogo.startsWith(url));
  const customLogoUrl = isValidImageUrl(rawLogo) && !isLegacyPlaceholder ? rawLogo : undefined;

  const rawQr = (method.qrCodeUrl || method.englishQrCodeUrl || method.bengaliQrCodeUrl || '').trim();
  const qrCodeUrl = isValidImageUrl(rawQr) ? rawQr : undefined;
  const englishQrCodeUrl = qrCodeUrl;
  const bengaliQrCodeUrl = undefined;

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
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
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
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
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
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
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
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
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
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
      };
    case 'bangla_qr':
      return {
        displayTitle: isDefaultName ? 'বাংলা কিউআর' : method.name,
        englishName: method.englishName || 'Bangla QR',
        displaySubtitle: method.subtitle || 'যেকোনো ব্যাংক বা এমএফএস অ্যাপ থেকে কিউআর স্ক্যান',
        badgeText,
        accountType: method.accountType || 'Merchant',
        requireTrxId: method.requireTrxId ?? true,
        requireSenderPhone: method.requireSenderPhone ?? true,
        instructionText:
          method.instructions ||
          'বিকাশ, নগদ, রকেট, উপায় বা যেকোনো ব্যাংক অ্যাপের বাংলা কিউআর (Bangla QR) স্ক্যানার দিয়ে স্ক্যান করে পেমেন্ট করুন এবং ট্রানজেকশন আইডি নিচে দিন।',
        customLogoUrl,
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
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
        qrCodeUrl,
        englishQrCodeUrl,
        bengaliQrCodeUrl,
      };
  }
}

/**
 * Returns all active non-COD online payment methods (bKash, Nagad, Rocket, Upay, Bank Transfer, etc.)
 * sorted in deterministic display order for the Payment Instructions Popup.
 */
export function getActiveOnlinePaymentMethods(methods: PaymentMethodConfig[]): PaymentMethodConfig[] {
  return sortPaymentMethods(methods.filter(m => m && m.isActive && m.type !== 'cod'));
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

  if (methodType === 'bank' || methodType === 'bangla_qr') {
    if (cleanSender.length < 3) {
      return {
        valid: false,
        cleanSender,
        cleanTrxId,
        error: 'অনুগ্রহ করে সঠিক ব্যাংক/এমএফএস একাউন্ট বা মোবাইল নাম্বার দিন।',
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

/**
 * Returns default instruction text for the second sub-option ("Payment" / Merchant Payment)
 * based on the payment method gateway type.
 */
export function getDefaultMerchantPaymentInstruction(type: PaymentMethodConfig['type']): string {
  switch (type) {
    case 'bkash':
      return 'বিকাশ অ্যাপের "Make Payment" (পেমেন্ট) অপশনে গিয়ে অথবা *247# ডায়াল করে নির্ধারিত মার্চেন্ট নম্বরে Payment করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
    case 'nagad':
      return 'নগদ অ্যাপের "Merchant Pay" (পেমেন্ট) অপশনে গিয়ে অথবা *167# ডায়াল করে নির্ধারিত মার্চেন্ট নম্বরে Payment করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
    case 'rocket':
      return 'রকেট অ্যাপের "Merchant Pay" অপশনে গিয়ে অথবা *322# ডায়াল করে নির্ধারিত মার্চেন্ট নম্বরে Payment করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
    case 'upay':
      return 'উপায় অ্যাপের "Make Payment" অপশনে গিয়ে অথবা *268# ডায়াল করে নির্ধারিত মার্চেন্ট নম্বরে Payment করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
    case 'bangla_qr':
      return 'যেকোনো ব্যাংক বা এমএফএস অ্যাপের "Bangla QR / Payment" অপশন থেকে স্ক্যান করে মার্চেন্ট পেমেন্ট সম্পন্ন করুন এবং ট্রানজেকশন আইডি নিচে দিন।';
    case 'bank':
      return 'নির্ধারিত মার্চেন্ট / কর্পোরেট ব্যাংক একাউন্টে পেমেন্ট বা ডিপোজিট সম্পন্ন করে ট্রানজেকশন রেফারেন্স বা রিসিপ্ট আইডি নিচে দিন।';
    default:
      return 'নির্ধারিত মার্চেন্ট নম্বরে পেমেন্ট সম্পন্ন করে নিচে আপনার মোবাইল নম্বর এবং ট্রানজেকশন আইডি (TrxID) দিন।';
  }
}

/**
 * Resolves the two dual sub-options (1. Send Money / সেন্ড মানি and 2. Payment / পেমেন্ট)
 * for any payment method, preserving full backward compatibility with existing Firestore documents
 * while allowing complete Admin Panel customization of names, numbers, instructions, and QR codes.
 */
export function getPaymentMethodSubOptions(method: PaymentMethodConfig): {
  sendMoneyOption: PaymentSubOptionConfig;
  paymentOption: PaymentSubOptionConfig;
  activeSubOptions: PaymentSubOptionConfig[];
} {
  const meta = getPaymentMethodDisplayMeta(method);
  const rawSm = method.sendMoneyOption;
  const rawPay = method.paymentOption;

  const cleanImg = (url?: string) => {
    const trimmed = (url || '').trim();
    return isValidImageUrl(trimmed) ? trimmed : undefined;
  };

  const rawSmQr =
    cleanImg(rawSm?.qrCodeUrl) ||
    cleanImg(rawSm?.englishQrCodeUrl) ||
    cleanImg(rawSm?.bengaliQrCodeUrl);
  const rawPayQr =
    cleanImg(rawPay?.qrCodeUrl) ||
    cleanImg(rawPay?.englishQrCodeUrl) ||
    cleanImg(rawPay?.bengaliQrCodeUrl);

  const smExplicitEmpty =
    Boolean(rawSm) &&
    'qrCodeUrl' in (rawSm as object) &&
    !rawSmQr;
  const payExplicitEmpty =
    Boolean(rawPay) &&
    'qrCodeUrl' in (rawPay as object) &&
    !rawPayQr;

  const smQr = rawSmQr || (smExplicitEmpty ? undefined : meta.qrCodeUrl);

  const sendMoneyOption: PaymentSubOptionConfig = {
    id: 'send_money',
    enabled: rawSm?.enabled ?? true,
    label: (rawSm?.label || '').trim() || 'সেন্ড মানি',
    englishLabel: (rawSm?.englishLabel || '').trim() || 'Send Money',
    subtitle: (rawSm?.subtitle || '').trim() || 'পার্সোনাল নাম্বারে সেন্ড মানি করুন',
    accountType: rawSm?.accountType || (method.accountType && method.accountType !== 'None' ? method.accountType : 'Personal'),
    accountName: (rawSm?.accountName || '').trim() || method.accountName || 'MR. BOOKS Official',
    accountNumber: (rawSm?.accountNumber || '').trim() || method.accountNumber || '01712345678',
    instructions: (rawSm?.instructions || '').trim() || meta.instructionText,
    qrCodeUrl: smQr,
    englishQrCodeUrl: smQr,
    bengaliQrCodeUrl: '',
  };

  const payQr =
    rawPayQr ||
    (payExplicitEmpty
      ? undefined
      : rawSmQr && rawSmQr === meta.qrCodeUrl
      ? undefined
      : meta.qrCodeUrl);

  const paymentOption: PaymentSubOptionConfig = {
    id: 'payment',
    enabled: rawPay?.enabled ?? true,
    label: (rawPay?.label || '').trim() || 'পেমেন্ট',
    englishLabel: (rawPay?.englishLabel || '').trim() || 'Payment',
    subtitle: (rawPay?.subtitle || '').trim() || 'মার্চেন্ট নাম্বারে পেমেন্ট করুন',
    accountType: rawPay?.accountType || 'Merchant',
    accountName: (rawPay?.accountName || '').trim() || method.accountName || 'MR. BOOKS Merchant',
    accountNumber: (rawPay?.accountNumber || '').trim() || method.accountNumber || '01712345678',
    instructions: (rawPay?.instructions || '').trim() || getDefaultMerchantPaymentInstruction(method.type),
    qrCodeUrl: payQr,
    englishQrCodeUrl: payQr,
    bengaliQrCodeUrl: '',
  };

  const activeSubOptions: PaymentSubOptionConfig[] = [];
  if (sendMoneyOption.enabled) activeSubOptions.push(sendMoneyOption);
  if (paymentOption.enabled) activeSubOptions.push(paymentOption);
  if (activeSubOptions.length === 0) {
    activeSubOptions.push(sendMoneyOption);
  }

  return {
    sendMoneyOption,
    paymentOption,
    activeSubOptions,
  };
}

export interface ResolvedPaymentQrInfo {
  customQrUrl: string;
  title: string;
  subtitle: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
}

/**
 * Formats a clean single gateway QR title (e.g. "বিকাশ কিউআর কোড", "নগদ কিউআর কোড")
 * with no Bangla/English split phrasing.
 */
export function formatSinglePaymentQrTitle(
  method: PaymentMethodConfig,
  displayTitle?: string
): string {
  const base = (
    displayTitle ||
    getPaymentMethodDisplayMeta(method).displayTitle ||
    method.name ||
    ''
  ).trim();
  if (!base) return 'পেমেন্ট কিউআর কোড';
  if (/(qr|কিউআর)/i.test(base)) {
    return base.includes('কোড') || /\bQR\b/i.test(base) ? base : `${base} কোড`;
  }
  return `${base} কিউআর কোড`;
}

/**
 * Resolves the single authoritative QR image URL and display metadata for a payment method/sub-option.
 * Preserves legacy qrCodeUrl / englishQrCodeUrl / bengaliQrCodeUrl fields from Firestore while never
 * leaking global Bangla QR settings onto gateways like bKash or Nagad.
 */
export function resolveSinglePaymentQrInfo({
  method,
  subOption,
  banglaQrImageUrl,
}: {
  method: PaymentMethodConfig;
  subOption?: PaymentSubOptionConfig;
  banglaQrImageUrl?: string;
}): ResolvedPaymentQrInfo {
  const meta = getPaymentMethodDisplayMeta(method);
  const cleanImg = (url?: string) => {
    const trimmed = (url || '').trim();
    return isValidImageUrl(trimmed) ? trimmed : '';
  };

  const subQr =
    cleanImg(subOption?.qrCodeUrl) ||
    cleanImg(subOption?.englishQrCodeUrl) ||
    cleanImg(subOption?.bengaliQrCodeUrl);

  const methodQr =
    cleanImg(meta.qrCodeUrl) ||
    cleanImg(meta.englishQrCodeUrl) ||
    cleanImg(meta.bengaliQrCodeUrl);

  const fallbackBanglaQr =
    method.type === 'bangla_qr' ? cleanImg(banglaQrImageUrl) : '';

  const customQrUrl =
    subQr ||
    (!subOption ? methodQr : '') ||
    (subOption?.id === 'send_money' && !method.sendMoneyOption ? methodQr : '') ||
    (subOption?.id === 'payment' && !method.paymentOption ? methodQr : '') ||
    fallbackBanglaQr;

  const accountNumber = (subOption?.accountNumber || method.accountNumber || '').trim();
  const accountName = (subOption?.accountName || method.accountName || '').trim();
  const accountType = (subOption?.accountType || meta.accountType || 'Personal').trim();
  const subLabel = (subOption?.label || '').trim();
  const subtitle = [subLabel, accountType !== 'None' ? accountType : '']
    .filter(Boolean)
    .join(' · ');

  return {
    customQrUrl,
    title: formatSinglePaymentQrTitle(method, meta.displayTitle),
    subtitle,
    accountNumber,
    accountName,
    accountType,
  };
}

