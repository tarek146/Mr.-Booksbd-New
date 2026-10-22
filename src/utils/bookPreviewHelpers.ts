import { BookPreviewPage, Product } from '../types';
import { isValidImageUrl, sanitizeImageUrl } from './imageCompressor';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, d => BANGLA_DIGITS[Number(d)] ?? d);
}

/**
 * Sanitizes and re-numbers an array of BookPreviewPage objects.
 * Drops pages that have neither a valid imageUrl nor non-empty text content.
 */
export function sanitizePreviewPages(pages?: BookPreviewPage[] | null): BookPreviewPage[] {
  if (!Array.isArray(pages)) return [];

  const valid: BookPreviewPage[] = [];
  for (let i = 0; i < pages.length; i++) {
    const raw = pages[i];
    if (!raw || typeof raw !== 'object') continue;

    const cleanImage = sanitizeImageUrl(raw.imageUrl);
    const cleanContent = typeof raw.content === 'string' ? raw.content.trim() : '';
    const cleanTitle = typeof raw.title === 'string' ? raw.title.trim() : '';

    if (!isValidImageUrl(cleanImage) && !cleanContent) {
      continue;
    }

    const pageNum = valid.length + 1;
    valid.push({
      id: raw.id && typeof raw.id === 'string' ? raw.id : `page-${pageNum}-${i}`,
      pageNumber: pageNum,
      title: cleanTitle || `পৃষ্ঠা ${toBanglaDigits(pageNum)}`,
      ...(isValidImageUrl(cleanImage) ? { imageUrl: cleanImage } : {}),
      ...(cleanContent ? { content: cleanContent } : {}),
    });
  }

  return valid;
}

/**
 * Reorders a preview page up or down and re-numbers all pages 1..N.
 */
export function movePreviewPage(
  pages: BookPreviewPage[],
  index: number,
  direction: 'up' | 'down'
): BookPreviewPage[] {
  const list = [...pages];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= list.length || targetIndex < 0 || targetIndex >= list.length) {
    return list.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
  }

  const [moved] = list.splice(index, 1);
  list.splice(targetIndex, 0, moved);

  return list.map((p, idx) => ({
    ...p,
    pageNumber: idx + 1,
  }));
}

/**
 * Computes the next page index and slide direction ('next' | 'prev' | 'none')
 * for the interactive book page reader.
 */
export function computePageSlideNavigation(
  currentIndex: number,
  targetIndex: number,
  totalPages: number
): { nextIndex: number; direction: 'next' | 'prev' | 'none' } {
  if (totalPages <= 0) {
    return { nextIndex: 0, direction: 'none' };
  }
  const clampedTarget = Math.max(0, Math.min(totalPages - 1, targetIndex));
  const clampedCurrent = Math.max(0, Math.min(totalPages - 1, currentIndex));

  if (clampedTarget === clampedCurrent) {
    return { nextIndex: clampedCurrent, direction: 'none' };
  }

  return {
    nextIndex: clampedTarget,
    direction: clampedTarget > clampedCurrent ? 'next' : 'prev',
  };
}

/**
 * Returns the custom admin-configured preview pages if present, or generates
 * a rich, authentic 3-page book preview so every product has a realistic
 * page-by-page reading experience out of the box.
 */
export function getEffectiveBookPreviewPages(product: Product): BookPreviewPage[] {
  const customPages = sanitizePreviewPages(product.previewPages);
  if (customPages.length > 0) {
    return customPages;
  }

  const isBook = product.type === 'book';
  const title = product.title || 'বই পরিচিতি';
  const author = product.author || product.brand || 'MR. BOOKS';
  const publisher = product.publisher || 'MR. BOOKS Publications';
  const category = product.category || 'সাহিত্য ও প্রকাশনা';
  const introText =
    product.previewIntro?.trim() ||
    product.description?.trim() ||
    `“${title}” বইটি পাঠকদের জন্য একটি অনন্য সংযোজন। সহজ ও প্রাঞ্জল ভাষায় রচিত এই গ্রন্থটি পাঠকের চিন্তার জগৎকে সমৃদ্ধ করবে।`;

  const titleLower = title.toLowerCase();

  let page2Heading = 'পৃষ্ঠা ২ — প্রথম অধ্যায় (নির্বাচিত অংশ)';
  let page2Body = '';

  if (titleLower.includes('paradoxical') || titleLower.includes('প্যারাডক্সিক্যাল')) {
    page2Body = `হোস্টেলের বারান্দায় দাঁড়িয়ে আছে সাজিদ। বাইরে ঝুম বৃষ্টি। চায়ের কাপে চুমুক দিতে দিতে সে হঠাৎ প্রশ্ন ছুঁড়ে দিল—\n\n“আচ্ছা বল তো, আমরা যা চোখে দেখি না, তার অস্তিত্ব কি আসলেই নেই? মানুষ যখন বাতাসের অস্তিত্ব অনুভব করে, তখন সে বাতাসকে দেখে না—দেখে তার প্রভাব। ঠিক তেমনি মহাবিশ্বের প্রতিটি সুশৃঙ্খল নিয়ম, প্রতিটি অণু-পরমাণুর নিখুঁত সামঞ্জস্য এক মহাপরিকল্পনাকারীর দিকেই ইঙ্গিত দেয়।”\n\nসাজিদের কথায় ঘরের নীরবতা আরও গভীর হয়ে ওঠে। যুক্তির প্রতিটি ধাপে উন্মোচিত হতে থাকে বিশ্বাসের নতুন দিগন্ত...`;
  } else if (titleLower.includes('himu') || titleLower.includes('হিমু')) {
    page2Body = `হলুদ পাঞ্জাবির পকেট থাকে না—কথাটা আমি সবাইকে বলি, কিন্তু কেউ বিশ্বাস করতে চায় না। পিচঢালা তপ্ত দুপুরে খালি পায়ে হাঁটার মধ্যে যে এক ধরনের অদ্ভুত আনন্দ আছে, তা শহরের ব্যস্ত মানুষগুলো কখনো টের পায় না।\n\nরাস্তার মোড়ে দাঁড়িয়ে চা খেতে খেতে বাদল বলল, “হিমু ভাই, আপনি কি আসলেই মহাপুরুষ হওয়ার সাধনা করছেন?”\nআমি একটু হেসে বললাম, “মহাপুরুষ হওয়া তো সহজ কাজ না রে বাদল। তার চেয়ে মানুষের মন ভালো করে দেওয়ার খেলাটা অনেক বেশি মজার...”`;
  } else if (titleLower.includes('rashed') || titleLower.includes('রাশেদ')) {
    page2Body = `স্কুলের বারান্দায় দাঁড়িয়ে রাশেদ চুপচাপ দূর আকাশের দিকে তাকিয়ে ছিল। ১৯৭১ সালের উত্তাল দিনগুলো তখন ছোট্ট মফস্বল শহরটিকেও স্পর্শ করেছে।\n\nআমরা তখনো বুঝতে পারিনি এই চশমা পরা শান্ত ছেলেটি বুকের ভেতর কী অসীম সাহস লুকিয়ে রেখেছে। দেশের মানুষ যখন মুক্তির স্বপ্নে বিভোর, তখন রাশেদের প্রতিটি কথা আমাদের মনে সাহসের প্রদীপ জ্বালিয়ে দিত...`;
  } else if (isBook) {
    page2Body = `“${title}” গ্রন্থের প্রতিটি পৃষ্ঠায় লেখক ${author} তুলে ধরেছেন জীবনঘনিষ্ঠ অনুভূতি, গভীর পর্যবেক্ষণ এবং পাঠকের হৃদয়ে দাগ কাটার মতো অনন্য উপস্থাপনা।\n\nবইটির পাতায় পাতায় রয়েছে সাবলীল ভাষার গাঁথুনি। একটি অধ্যায় শেষ করার পর পরবর্তী পৃষ্ঠায় কী অপেক্ষা করছে তা জানার কৌতূহল পাঠককে শেষ পাতা পর্যন্ত টেনে নিয়ে যায়। প্রিমিয়াম অফসেট পেপার ও স্পষ্ট মুদ্রণের কারণে দীর্ঘ সময় পড়লেও চোখের কোনো ক্লান্তি আসে না।`;
  } else {
    page2Heading = 'পৃষ্ঠা ২ — পণ্যের বৈশিষ্ট্য ও ব্যবহার';
    page2Body = `${title} তৈরি করা হয়েছে উন্নতমানের কাঁচামাল ও প্রিমিয়াম ফিনিশিং দিয়ে।\n\n• ব্র্যান্ড: ${author}\n• ক্যাটাগরি: ${category}\n• প্রতিদিনের লেখালেখি, নোট নেওয়া কিংবা উপহার হিসেবে দেওয়ার জন্য এটি চমৎকার একটি পছন্দ।`;
  }

  const page3Heading = isBook ? 'পৃষ্ঠা ৩ — প্রকাশনা তথ্য ও পাঠক গাইড' : 'পৃষ্ঠা ৩ — বিস্তারিত স্পেসিফিকেশন';
  const page3Lines = [
    `📖 শিরোনাম: ${title}`,
    isBook ? `✍️ লেখক: ${author}` : `🏷️ ব্র্যান্ড: ${author}`,
    isBook ? `🏛️ প্রকাশনী: ${publisher}` : `📂 বিভাগ: ${category}`,
    product.edition ? `🔖 সংস্করণ: ${product.edition}` : `🔖 সংস্করণ: অরিজিনাল প্রিন্ট এডিশন`,
    product.pages ? `📄 মোট পৃষ্ঠা সংখ্যা: ${product.pages} পৃষ্ঠা` : '',
    product.language ? `🌐 ভাষা: ${product.language}` : '🌐 ভাষা: বাংলা',
    product.isbn ? `🔢 ISBN: ${product.isbn}` : '',
    `\nসম্পূর্ণ বইটি পড়তে এবং অরিজিনাল প্রিন্ট কপি আপনার সংগ্রহে রাখতে এখনই "Buy Now" অথবা "Add to Cart" বাটনে ক্লিক করে অর্ডার সম্পন্ন করুন।`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    {
      id: `default-p1-${product.id}`,
      pageNumber: 1,
      title: isBook ? 'পৃষ্ঠা ১ — বই সম্পর্কে কিছু কথা' : 'পৃষ্ঠা ১ — পণ্য পরিচিতি',
      content: `${introText}\n\n— লেখক: ${author}\n— প্রকাশনী: ${publisher}`,
    },
    {
      id: `default-p2-${product.id}`,
      pageNumber: 2,
      title: page2Heading,
      content: page2Body,
    },
    {
      id: `default-p3-${product.id}`,
      pageNumber: 3,
      title: page3Heading,
      content: page3Lines,
    },
  ];
}
