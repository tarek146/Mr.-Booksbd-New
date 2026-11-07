import { Product, ProductType, ProductVariant } from '../types';

export interface CsvFieldDef {
  key: string;
  label: string;
  labelBn: string;
  required?: boolean;
  type: 'text' | 'number' | 'url';
  example: string;
  aliases: string[];
}

export const BOOK_SCHEMA_FIELDS: CsvFieldDef[] = [
  {
    key: 'title',
    label: 'Book Title / Name',
    labelBn: 'বইয়ের নাম',
    required: true,
    type: 'text',
    example: 'প্যারাডক্সিক্যাল সাজিদ ২',
    aliases: ['title', 'name', 'book_title', 'book_name', 'book title', 'book name', 'item_name', 'বইয়ের নাম', 'বইয়ের নাম', 'নাম']
  },
  {
    key: 'price',
    label: 'Offer Price (BDT)',
    labelBn: 'অফার মূল্য (টাকা)',
    required: true,
    type: 'number',
    example: '350',
    aliases: ['price', 'sale_price', 'offer_price', 'selling_price', 'price_bdt', 'current_price', 'দাম', 'মূল্য', 'বিক্রয় মূল্য', 'অফার মূল্য']
  },
  {
    key: 'regularPrice',
    label: 'Regular Price (MRP)',
    labelBn: 'রেগুলার মূল্য (গায়ের দাম)',
    type: 'number',
    example: '450',
    aliases: ['regular_price', 'mrp', 'original_price', 'previous_price', 'old_price', 'list_price', 'গায়ের দাম', 'গায়ের দাম', 'গায়েরদাম', 'রেগুলার মূল্য', 'খুচরা মূল্য']
  },
  {
    key: 'author',
    label: 'Author Name',
    labelBn: 'লেখক',
    required: true,
    type: 'text',
    example: 'আরিফ আজাদ (Arif Azad)',
    aliases: ['author', 'writer', 'author_name', 'writer_name', 'লেখক', 'লেখকের নাম', 'রচয়িতা']
  },
  {
    key: 'publisher',
    label: 'Publisher',
    labelBn: 'প্রকাশনী',
    type: 'text',
    example: 'সমকালীন প্রকাশন / Guardian',
    aliases: ['publisher', 'publication', 'publisher_name', 'প্রকাশনী', 'প্রকাশক']
  },
  {
    key: 'category',
    label: 'Category',
    labelBn: 'ক্যাটাগরি',
    type: 'text',
    example: 'Islamic Books',
    aliases: ['category', 'genre', 'book_category', 'ক্যাটাগরি', 'বিভাগ']
  },
  {
    key: 'edition',
    label: 'Edition',
    labelBn: 'সংস্করণ',
    type: 'text',
    example: '1st Edition',
    aliases: ['edition', 'print_edition', 'সংস্করণ']
  },
  {
    key: 'pages',
    label: 'Pages',
    labelBn: 'পৃষ্ঠা সংখ্যা',
    type: 'number',
    example: '264',
    aliases: ['pages', 'page_count', 'total_pages', 'পৃষ্ঠা', 'পৃষ্ঠা সংখ্যা']
  },
  {
    key: 'language',
    label: 'Language',
    labelBn: 'ভাষা',
    type: 'text',
    example: 'Bengali',
    aliases: ['language', 'lang', 'ভাষা']
  },
  {
    key: 'isbn',
    label: 'ISBN',
    labelBn: 'আইএসবিএন',
    type: 'text',
    example: '9789849312341',
    aliases: ['isbn', 'isbn_code', 'isbn13', 'isbn10', 'আইএসবিএন']
  },
  {
    key: 'stock',
    label: 'Stock Quantity',
    labelBn: 'মজুদ সংখ্যা',
    type: 'number',
    example: '100',
    aliases: ['stock', 'quantity', 'qty', 'inventory', 'মজুদ', 'স্টক']
  },
  {
    key: 'sku',
    label: 'SKU Code',
    labelBn: 'এসকেইউ কোড',
    type: 'text',
    example: 'BK-PS2-01',
    aliases: ['sku', 'code', 'product_code', 'item_code', 'এসকেইউ', 'কোড']
  },
  {
    key: 'imageUrl',
    label: 'Cover Image URL',
    labelBn: 'কভার ছবির লিংক',
    type: 'url',
    example: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
    aliases: ['image', 'image_url', 'cover', 'cover_image', 'photo', 'picture', 'ছবি', 'কভার ছবি']
  },
  {
    key: 'description',
    label: 'Description / Summary',
    labelBn: 'বইয়ের বিবরণ',
    type: 'text',
    example: 'একটি চমৎকার জীবনমুখী ও অনুপ্রেরণামূলক বই।',
    aliases: ['description', 'summary', 'overview', 'details', 'বিবরণ', 'বর্ণনা']
  },
  {
    key: 'badge',
    label: 'Badge',
    labelBn: 'ব্যাজ',
    type: 'text',
    example: 'HOT',
    aliases: ['badge', 'tag', 'label', 'ব্যাজ']
  },
  {
    key: 'deliveryEstimate',
    label: 'Delivery Timing',
    labelBn: 'ডেলিভারি সময়',
    type: 'text',
    example: '২-৩ কার্যদিবস',
    aliases: ['delivery', 'delivery_estimate', 'delivery_time', 'ডেলিভারি']
  }
];

export const STATIONERY_SCHEMA_FIELDS: CsvFieldDef[] = [
  {
    key: 'title',
    label: 'Item Title / Name',
    labelBn: 'পণ্যের নাম',
    required: true,
    type: 'text',
    example: 'Leather Executive Diary 2026',
    aliases: ['title', 'name', 'item_name', 'product_name', 'stationery_name', 'পণ্যের নাম', 'নাম']
  },
  {
    key: 'price',
    label: 'Offer Price (BDT)',
    labelBn: 'অফার মূল্য (টাকা)',
    required: true,
    type: 'number',
    example: '450',
    aliases: ['price', 'sale_price', 'offer_price', 'selling_price', 'দাম', 'মূল্য', 'অফার মূল্য']
  },
  {
    key: 'regularPrice',
    label: 'Regular Price (MRP)',
    labelBn: 'রেগুলার মূল্য',
    type: 'number',
    example: '550',
    aliases: ['regular_price', 'mrp', 'original_price', 'previous_price', 'গায়ের দাম', 'রেগুলার মূল্য']
  },
  {
    key: 'brand',
    label: 'Brand / Manufacturer',
    labelBn: 'ব্র্যান্ড',
    required: true,
    type: 'text',
    example: 'MR. BOOKS Essentials',
    aliases: ['brand', 'manufacturer', 'company', 'make', 'ব্র্যান্ড', 'কোম্পানি']
  },
  {
    key: 'material',
    label: 'Material',
    labelBn: 'উপাদান',
    type: 'text',
    example: 'PU Leather & 100 GSM Paper',
    aliases: ['material', 'fabric', 'substance', 'উপাদান']
  },
  {
    key: 'dimensions',
    label: 'Dimensions / Size',
    labelBn: 'সাইজ / মাপ',
    type: 'text',
    example: 'A5 (21x14 cm)',
    aliases: ['dimensions', 'size', 'dimension', 'মাপ', 'সাইজ']
  },
  {
    key: 'colorModel',
    label: 'Color / Model',
    labelBn: 'রং / মডেল',
    type: 'text',
    example: 'Navy Blue',
    aliases: ['color', 'colour', 'model', 'color_model', 'রং', 'কালার']
  },
  {
    key: 'category',
    label: 'Category',
    labelBn: 'ক্যাটাগরি',
    type: 'text',
    example: 'Notebooks & Diaries',
    aliases: ['category', 'type', 'ক্যাটাগরি']
  },
  {
    key: 'stock',
    label: 'Stock Quantity',
    labelBn: 'মজুদ সংখ্যা',
    type: 'number',
    example: '50',
    aliases: ['stock', 'quantity', 'qty', 'inventory', 'মজুদ']
  },
  {
    key: 'sku',
    label: 'SKU Code',
    labelBn: 'এসকেইউ কোড',
    type: 'text',
    example: 'ST-DIARY-01',
    aliases: ['sku', 'code', 'product_code', 'item_code', 'এসকেইউ']
  },
  {
    key: 'imageUrl',
    label: 'Product Image URL',
    labelBn: 'ছবির লিংক',
    type: 'url',
    example: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600',
    aliases: ['image', 'image_url', 'photo', 'picture', 'ছবি']
  },
  {
    key: 'description',
    label: 'Description',
    labelBn: 'পণ্যের বিবরণ',
    type: 'text',
    example: 'উচ্চমানের এক্সিকিউটিভ নোটবুক ডায়েরি।',
    aliases: ['description', 'summary', 'overview', 'details', 'বিবরণ']
  },
  {
    key: 'badge',
    label: 'Badge',
    labelBn: 'ব্যাজ',
    type: 'text',
    example: 'NEW',
    aliases: ['badge', 'tag', 'label', 'ব্যাজ']
  },
  {
    key: 'deliveryEstimate',
    label: 'Delivery Timing',
    labelBn: 'ডেলিভারি সময়',
    type: 'text',
    example: '২-৩ কার্যদিবস',
    aliases: ['delivery', 'delivery_estimate', 'ডেলিভারি']
  }
];

/**
 * Robust RFC-4180 CSV parser handling quotes, escaped quotes, multiline values, and BOM.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  if (!text) return { headers: [], rows: [] };

  // Remove UTF-8 BOM if present
  let cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return { headers: [], rows: [] };

  const parsedRows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(col => col.length > 0)) {
        parsedRows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
      i++;
      continue;
    }

    currentVal += char;
    i++;
  }

  // Push final cell/row
  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(col => col.length > 0)) {
      parsedRows.push(currentRow);
    }
  }

  if (parsedRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parsedRows[0].map(h => h.trim());
  const rows = parsedRows.slice(1);

  return { headers, rows };
}

function normalizeHeaderStr(str: string): string {
  return str
    .normalize('NFC')
    .replace(/\u09AF\u09BC/g, '\u09DF')
    .replace(/\u09A1\u09BC/g, '\u09DC')
    .replace(/\u09A2\u09BC/g, '\u09DD')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

/**
 * Intelligent auto-mapping of CSV headers to Product schema fields
 */
export function guessColumnMapping(
  headers: string[],
  type: ProductType
): Record<string, string> {
  const fields = type === 'book' ? BOOK_SCHEMA_FIELDS : STATIONERY_SCHEMA_FIELDS;
  const mapping: Record<string, string> = {}; // { schemaFieldKey: csvHeaderName }
  const usedHeaders = new Set<string>();

  // Pass 1: Exact matches
  for (const field of fields) {
    if (mapping[field.key]) continue;
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const normalizedHeader = normalizeHeaderStr(h);
      const exactMatch = field.aliases.some(alias => {
        const normalizedAlias = normalizeHeaderStr(alias);
        return normalizedHeader === normalizedAlias;
      });

      if (exactMatch) {
        mapping[field.key] = h;
        usedHeaders.add(h);
        break;
      }
    }
  }

  // Pass 2: Substring matches for unmapped fields
  for (const field of fields) {
    if (mapping[field.key]) continue;
    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const normalizedHeader = normalizeHeaderStr(h);
      const subMatch = field.aliases.some(alias => {
        const normalizedAlias = normalizeHeaderStr(alias);
        return normalizedAlias.length >= 3 && normalizedHeader.includes(normalizedAlias);
      });

      if (subMatch) {
        mapping[field.key] = h;
        usedHeaders.add(h);
        break;
      }
    }
  }

  return mapping;
}

export interface ParsedProductItem {
  isValid: boolean;
  errors: string[];
  productPayload: Omit<Product, 'id' | 'createdAt'>;
  rawRow: Record<string, string>;
  rowNumber: number;
}

/**
 * Cleans monetary numbers: converts "৳ 450.00" -> 450
 */
export function parseCleanNumber(val?: string | number | null, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

/**
 * Converts a mapped CSV row into a complete, clean Product payload
 */
export function transformRowToProduct(
  rowMap: Record<string, string>,
  type: ProductType,
  rowNumber: number
): ParsedProductItem {
  const errors: string[] = [];

  const title = (rowMap.title || '').trim();
  if (!title) {
    errors.push('Product Title / Name is required');
  }

  const rawPrice = rowMap.price;
  const price = parseCleanNumber(rawPrice, 0);
  if (price <= 0) {
    errors.push('Offer Price must be a positive number (greater than 0)');
  }

  const rawRegularPrice = rowMap.regularPrice;
  const regularPrice = rawRegularPrice ? parseCleanNumber(rawRegularPrice, price) : undefined;

  let author = (rowMap.author || '').trim();
  let brand = (rowMap.brand || '').trim();

  if (type === 'book' && !author) {
    // Provide a friendly default if missing
    author = 'Unknown Author';
  }

  if (type === 'stationery' && !brand) {
    brand = 'MR. BOOKS Essentials';
  }

  const category = (rowMap.category || '').trim() || (type === 'book' ? 'General Books' : 'General Stationery');
  const publisher = (rowMap.publisher || '').trim() || (type === 'book' ? 'MR. BOOKS' : undefined);
  const edition = (rowMap.edition || '').trim() || (type === 'book' ? '1st Edition' : undefined);
  const language = (rowMap.language || '').trim() || (type === 'book' ? 'Bengali' : undefined);
  const isbn = (rowMap.isbn || '').trim() || undefined;
  const pages = rowMap.pages ? parseCleanNumber(rowMap.pages, 1) : undefined;

  const material = (rowMap.material || '').trim() || undefined;
  const dimensions = (rowMap.dimensions || '').trim() || undefined;
  const colorModel = (rowMap.colorModel || '').trim() || undefined;

  const stock = rowMap.stock ? Math.max(0, Math.floor(parseCleanNumber(rowMap.stock, 50))) : 50;
  
  const generatedSku = (type === 'book' ? 'MRB-BK-' : 'MRB-ST-') + Math.floor(1000 + Math.random() * 9000);
  const sku = (rowMap.sku || '').trim() || generatedSku;

  const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now().toString().slice(-6)}`;
  const slug = (rowMap.slug || '').trim() || generatedSlug;

  const fallbackImage = type === 'book'
    ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'
    : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600';

  const imageUrl = (rowMap.imageUrl || '').trim() || fallbackImage;
  const images = [imageUrl];

  const description = (rowMap.description || '').trim() || (type === 'book'
    ? `বই: ${title}${author ? ` | লেখক: ${author}` : ''}`
    : `পণ্য: ${title}${brand ? ` | ব্র্যান্ড: ${brand}` : ''}`);

  const badge = (rowMap.badge || '').trim() || 'NEW';
  const deliveryEstimate = (rowMap.deliveryEstimate || '').trim() || '২-৩ কার্যদিবস';

  const defaultVariant: ProductVariant = {
    id: 'v1',
    name: type === 'book' ? 'Paperback' : 'Standard',
    price: price,
    previousPrice: regularPrice,
    stock: stock,
    sku: sku
  };

  const productPayload: Omit<Product, 'id' | 'createdAt'> = {
    type,
    title,
    slug,
    description,
    category,
    author: type === 'book' ? author : undefined,
    publisher: type === 'book' ? publisher : undefined,
    edition: type === 'book' ? edition : undefined,
    pages: type === 'book' ? pages : undefined,
    language: type === 'book' ? language : undefined,
    isbn: type === 'book' ? isbn : undefined,
    brand: type === 'stationery' ? brand : undefined,
    material: type === 'stationery' ? material : undefined,
    dimensions: type === 'stationery' ? dimensions : undefined,
    colorModel: type === 'stationery' ? colorModel : undefined,
    images,
    price,
    previousPrice: regularPrice,
    stock,
    sku,
    variants: [defaultVariant],
    rating: 5.0,
    reviewCount: 0,
    isFeatured: false,
    isOriginalBadge: type === 'book',
    deliveryEstimate,
    insideDhakaDelivery: '২৪-৪৮ ঘণ্টা',
    outsideDhakaDelivery: '২-৩ কার্যদিবস',
    deliveryTimingTitle: 'ডেলিভারি টাইমিং (Delivery Timing)',
    deliveryTimerHours: 48,
    deliveryChargeType: 'standard',
    badge,
    isActive: true,
    highlights: [
      '১০০% খাঁটি ও আসল পণ্য',
      'সারাদেশে দ্রুত ক্যাশ অন হোম ডেলিভারি',
      'নিরাপদ বাবল-র‍্যাপ প্যাকেজিং'
    ]
  };

  return {
    isValid: errors.length === 0,
    errors,
    productPayload,
    rawRow: rowMap,
    rowNumber
  };
}

/**
 * Generates an exemplary downloadable CSV template with realistic demo rows
 */
export function generateSampleCsv(type: ProductType): string {
  if (type === 'book') {
    const headers = [
      'Book Title',
      'Offer Price',
      'Regular Price',
      'Author',
      'Publisher',
      'Category',
      'Edition',
      'Pages',
      'Language',
      'ISBN',
      'Stock',
      'SKU',
      'Cover Image URL',
      'Description',
      'Badge'
    ];

    const rows = [
      [
        'প্যারাডক্সিক্যাল সাজিদ ২',
        '350',
        '450',
        'আরিফ আজাদ',
        'গার্ডিয়ান পাবলিকেশনস',
        'Islamic Books',
        '1st Edition',
        '264',
        'Bengali',
        '9789849312341',
        '100',
        'BK-PS2-01',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        'বিশ্বাস ও যুক্তিপূর্ণ ভাবনার চমৎকার সমন্বয়ে রচিত আলোড়ন সৃষ্টিকারী গ্রন্থ।',
        'HOT'
      ],
      [
        'হিমু সমগ্র (১ম খণ্ড)',
        '650',
        '800',
        'হুমায়ূন আহমেদ',
        'অন্যপ্রকাশ',
        'Fiction & Literature',
        '5th Edition',
        '512',
        'Bengali',
        '9789844101122',
        '50',
        'BK-HIMU-01',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        'জনপ্রিয় কথাসাহিত্যিক হুমায়ূন আহমেদের কালজয়ী হিমু সিরিজের অমনিবাস।',
        'BEST OFFER'
      ],
      [
        'আমার বন্ধু রাশেদ',
        '220',
        '280',
        'ড. মুহম্মদ জাফর ইকবাল',
        'তাম্রলিপি',
        'Bangla Novels & Poetry',
        '3rd Edition',
        '144',
        'Bengali',
        '9789847005400',
        '80',
        'BK-RASHED-01',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        'মহান মুক্তিযুদ্ধের পটভূমিতে রচিত এক অবিস্মরণীয় কিশোর উপন্যাস।',
        'NEW'
      ]
    ];

    const csvLines = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ];
    return '\uFEFF' + csvLines.join('\r\n');
  } else {
    const headers = [
      'Stationery Title',
      'Offer Price',
      'Regular Price',
      'Brand',
      'Material',
      'Dimensions',
      'Color Model',
      'Category',
      'Stock',
      'SKU',
      'Product Image URL',
      'Description',
      'Badge'
    ];

    const rows = [
      [
        'Executive Leather Bound Diary 2026',
        '450',
        '550',
        'MR. BOOKS Essentials',
        'Italian PU Leather',
        'A5 (21x14 cm)',
        'Navy Blue',
        'Notebooks & Diaries',
        '60',
        'ST-DIARY-01',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600',
        'প্রিমিয়াম এক্সিকিউটিভ ডায়েরি ও গোল্ডেন রিবন বুকমার্ক।',
        'NEW'
      ],
      [
        'Luxury Rollerball Pen Set (Gold Trim)',
        '320',
        '400',
        'Parker / Deli',
        'Metallic Brass',
        '0.5 mm Tip',
        'Matte Black with Gold',
        'Pens & Writing',
        '100',
        'ST-PEN-02',
        'https://images.unsplash.com/photo-1585336261026-7f8a7e0d37e2?w=600',
        'মসৃণ লেখা ও প্রফেশনাল ব্যবহারের জন্য রাজকীয় রোলারবল কলম সেট।',
        'HOT'
      ]
    ];

    const csvLines = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ];
    return '\uFEFF' + csvLines.join('\r\n');
  }
}
