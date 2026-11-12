import { Product, Publisher } from '../types';

export const DEFAULT_PUBLISHERS_LIST: Publisher[] = [
  {
    id: 'pub-guardian',
    name: 'Guardian Publications',
    banglaName: 'গার্ডিয়ান পাবলিকেশন্স',
    description: 'সমকালীন ইসলামিক, আদর্শিক ও গবেষণাধর্মী বইয়ের অন্যতম শীর্ষ প্রকাশনী।',
    logoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
    booksCount: 0,
    establishedYear: '2014',
    isFeatured: true,
  },
  {
    id: 'pub-anyaprokash',
    name: 'Anyaprokash',
    banglaName: 'অন্যপ্রকাশ',
    description: 'হুমায়ূন আহমেদসহ বাংলাদেশের প্রথিতযশা কথাসাহিত্যিকদের কালজয়ী বইয়ের প্রকাশনা সংস্থা।',
    logoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80',
    booksCount: 0,
    establishedYear: '1997',
    isFeatured: true,
  },
  {
    id: 'pub-prothoma',
    name: 'Prothoma Prokashon',
    banglaName: 'প্রথমা প্রকাশন',
    description: 'মুক্তিযুদ্ধ, ইতিহাস, সাহিত্য, রাজনীতি ও গবেষণাধর্মী সৃজনশীল বইয়ের বিশ্বস্ত প্রকাশনী।',
    logoUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80',
    booksCount: 0,
    establishedYear: '2009',
    isFeatured: true,
  },
  {
    id: 'pub-tamralipi',
    name: 'Tamralipi',
    banglaName: 'তাম্রলিপি',
    description: 'তরুণ ও জনপ্রিয় লেখকদের উপন্যাস, সায়েন্স ফিকশন ও কিশোর সাহিত্যের জনপ্রিয় প্রকাশনী।',
    logoUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300&auto=format&fit=crop&q=80',
    booksCount: 0,
    establishedYear: '2005',
    isFeatured: true,
  },
  {
    id: 'pub-somoy',
    name: 'Somoy Prokashan',
    banglaName: 'সময় প্রকাশন',
    description: 'বাংলা সাহিত্যের আধুনিক ও ধ্রুপদী গ্রন্থের অন্যতম ঐতিহ্যবাহী প্রকাশনা প্রতিষ্ঠান।',
    logoUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&auto=format&fit=crop&q=80',
    booksCount: 0,
    establishedYear: '1988',
    isFeatured: true,
  },
  {
    id: 'pub-ananya',
    name: 'Ananya',
    banglaName: 'অনন্যা',
    description: 'বাংলাদেশের সৃজনশীল সাহিত্য, উপন্যাস ও রচনাবলীর সুপরিচিত প্রকাশনা সংস্থা।',
    logoUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=300&auto=format&fit=crop&q=80',
    booksCount: 0,
    establishedYear: '1987',
    isFeatured: true,
  },
];

export interface EnrichedPublisher extends Publisher {
  liveBooksCount: number;
  displayBooksCount: number;
}

/**
 * Automatically counts the exact number of books in the catalog belonging to a publisher
 * (matching either English name or Bangla name, case-insensitively).
 */
export function countBooksForPublisher(
  pub: { name: string; banglaName?: string },
  products: Product[]
): number {
  const enKey = (pub.name || '').trim().toLowerCase();
  const bnKey = (pub.banglaName || '').trim().toLowerCase();
  if (!enKey && !bnKey) return 0;

  let count = 0;
  for (const prod of products) {
    if (prod.type !== 'book') continue;
    const prodPub = (prod.publisher || '').trim().toLowerCase();
    if (!prodPub) continue;
    if ((enKey && prodPub === enKey) || (bnKey && prodPub === bnKey)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Merges configured publishers from Firestore (or defaults if empty) with any custom publisher
 * names present on products in the catalog, computing real-time book counts automatically.
 */
export function buildEnrichedPublishersList(
  storedPublishers: Publisher[],
  products: Product[]
): EnrichedPublisher[] {
  const baseList = storedPublishers.length > 0 ? storedPublishers : DEFAULT_PUBLISHERS_LIST;
  const bookCountByNormalizedName = new Map<string, { rawName: string; count: number; sampleImage?: string }>();

  for (const prod of products) {
    if (prod.type !== 'book') continue;
    const rawPub = (prod.publisher || '').trim();
    if (!rawPub) continue;
    const key = rawPub.toLowerCase();
    const existing = bookCountByNormalizedName.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      bookCountByNormalizedName.set(key, {
        rawName: rawPub,
        count: 1,
        sampleImage: prod.images?.[0],
      });
    }
  }

  const seenKeys = new Set<string>();
  const result: EnrichedPublisher[] = [];

  for (const pub of baseList) {
    const key = pub.name.trim().toLowerCase();
    const banglaKey = (pub.banglaName || '').trim().toLowerCase();
    seenKeys.add(key);
    if (banglaKey) seenKeys.add(banglaKey);

    const liveCount = countBooksForPublisher(pub, products);

    result.push({
      ...pub,
      booksCount: liveCount,
      liveBooksCount: liveCount,
      displayBooksCount: liveCount,
    });
  }

  // Also include any publisher entered directly on a book that isn't in baseList yet
  let derivedIdx = 0;
  for (const [key, info] of bookCountByNormalizedName.entries()) {
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      derivedIdx += 1;
      const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || encodeURIComponent(key);
      result.push({
        id: `derived-pub-${slug}-${derivedIdx}`,
        name: info.rawName,
        banglaName: info.rawName,
        description: `All original books published by ${info.rawName}.`,
        logoUrl: info.sampleImage || '',
        booksCount: info.count,
        liveBooksCount: info.count,
        displayBooksCount: info.count,
        isFeatured: true,
      });
    }
  }

  return result;
}

/**
 * Resolves the enriched Publisher profile for a single product on the Product Detail page.
 * Matches `product.publisher` against the store's publishers list (by English or Bangla name),
 * or falls back to author-based publisher inference / default publisher so a book always displays
 * both Writer and Publisher/প্রকাশনী.
 */
export function resolveProductPublisherInfo(
  product: Partial<Product> | null | undefined,
  storedPublishers: Publisher[],
  allProducts: Product[]
): EnrichedPublisher {
  const enrichedList = buildEnrichedPublishersList(storedPublishers, allProducts);
  const rawPubName = (product?.publisher || '').trim();

  if (rawPubName) {
    const key = rawPubName.toLowerCase();
    const matched = enrichedList.find(
      p =>
        p.name.trim().toLowerCase() === key ||
        (p.banglaName || '').trim().toLowerCase() === key ||
        p.name.trim().toLowerCase().includes(key) ||
        key.includes(p.name.trim().toLowerCase())
    );
    if (matched) {
      return matched;
    }

    const liveCount = countBooksForPublisher({ name: rawPubName }, allProducts);
    return {
      id: `pub-custom-${key.replace(/[^a-z0-9]+/g, '-')}`,
      name: rawPubName,
      banglaName: rawPubName,
      description: `${rawPubName} থেকে প্রকাশিত ১০০% অরিজিনাল মুদ্রিত বইসমূহ।`,
      logoUrl: product?.images?.[0] || '',
      booksCount: liveCount || 1,
      liveBooksCount: liveCount || 1,
      displayBooksCount: liveCount || 1,
      isFeatured: true,
    };
  }

  // Fallback inference by author if legacy product did not have `publisher` field populated
  const authorLower = (product?.author || '').trim().toLowerCase();
  if (authorLower.includes('humayun') || authorLower.includes('হুমায়ূন')) {
    const anya = enrichedList.find(p => p.name.toLowerCase().includes('anyaprokash'));
    if (anya) return anya;
  }
  if (authorLower.includes('arif') || authorLower.includes('আরিফ')) {
    const guardian = enrichedList.find(p => p.name.toLowerCase().includes('guardian'));
    if (guardian) return guardian;
  }
  if (authorLower.includes('zafar') || authorLower.includes('জাফর')) {
    const tamralipi = enrichedList.find(p => p.name.toLowerCase().includes('tamralipi'));
    if (tamralipi) return tamralipi;
  }

  return (
    enrichedList[0] || {
      id: 'pub-default',
      name: 'Guardian Publications',
      banglaName: 'গার্ডিয়ান পাবলিকেশন্স',
      description: 'সমকালীন ইসলামিক, আদর্শিক ও গবেষণাধর্মী বইয়ের অন্যতম শীর্ষ প্রকাশনী।',
      logoUrl: '',
      booksCount: 1,
      liveBooksCount: 1,
      displayBooksCount: 1,
      isFeatured: true,
    }
  );
}

export interface ResolvedProductDeliveryTiming {
  title: string;
  estimateBadge: string;
  insideDhaka: string;
  outsideDhaka: string;
  note: string;
  timerHours: number;
}

/**
 * Resolves customizable per-book delivery timing details with sensible defaults
 * so every book can have its own custom delivery timing configured from Admin Panel.
 */
export function resolveProductDeliveryTiming(product: Partial<Product>): ResolvedProductDeliveryTiming {
  const estimateBadge = (product.deliveryEstimate || '').trim() || '২-৩ কার্যদিবস (2-3 Days)';
  const title = (product.deliveryTimingTitle || '').trim() || 'ডেলিভারি টাইমিং (Delivery Timing)';
  const insideDhaka = (product.insideDhakaDelivery || '').trim() || '২৪-৪৮ ঘণ্টা (১-২ দিন)';
  const outsideDhaka =
    (product.outsideDhakaDelivery || '').trim() ||
    ((product.deliveryEstimate || '').trim() ? (product.deliveryEstimate || '').trim() : '২-৩ কার্যদিবস (সারাদেশে)');
  const note =
    (product.deliveryTimingNote || '').trim() ||
    'আজকে অর্ডার করলে দ্রুততম সময়ে বাবল-র‍্যাপ প্যাকেজিংসহ কুরিয়ারে পাঠানো হবে।';
  const rawHours = Number(product.deliveryTimerHours);
  const timerHours = Number.isFinite(rawHours) && rawHours > 0 ? rawHours : 48;

  return {
    title,
    estimateBadge,
    insideDhaka,
    outsideDhaka,
    note,
    timerHours,
  };
}

/**
 * Parses multi-line "Label: Value" text from Admin Panel into structured customBookDetails array.
 */
export function parseCustomBookDetails(input: string): { label: string; value: string }[] {
  if (!input || !input.trim()) return [];
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return null;
      const label = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((item): item is { label: string; value: string } => item !== null);
}

export function serializeCustomBookDetails(details?: { label: string; value: string }[]): string {
  if (!details || !Array.isArray(details) || details.length === 0) return '';
  return details
    .filter(d => d && d.label && d.value)
    .map(d => `${d.label}: ${d.value}`)
    .join('\n');
}
