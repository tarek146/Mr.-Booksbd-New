import QRCode from 'qrcode';
import { CartItem, Order, Product, StoreSettings } from '../types';

export type LabelPaperSize = '3x3' | '2x3';
export type InvoicePaperSize = 'A4' | 'A5' | '3in';

export interface Code128Bar {
  x: number;
  width: number;
}

export interface Code128EncodingResult {
  encodedText: string;
  bars: Code128Bar[];
  totalWidth: number;
}

export interface QrMatrixResult {
  size: number;
  rects: { x: number; y: number }[];
  payload: string;
}

export interface DocumentOrderItemBreakdown {
  productId: string;
  variantId: string;
  title: string;
  variantName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  regularUnitPrice: number;
  itemDiscountPerUnit: number;
  itemDiscountTotal: number;
  lineRegularTotal: number;
  lineTotal: number;
  hasOfferDiscount: boolean;
}

export interface OrderDocumentFinancials {
  items: DocumentOrderItemBreakdown[];
  itemsRegularTotal: number;
  itemsOfferDiscountTotal: number;
  subtotal: number;
  deliveryCharge: number;
  codCharge: number;
  orderDiscount: number;
  totalSavings: number;
  grandTotal: number;
  isPaidOnline: boolean;
  paidAmount: number;
  amountToCollect: number;
}

export interface OrderDocumentMeta {
  storeName: string;
  merchantId: string;
  storePhone: string;
  storeAddress: string;
  invoiceCode: string;
  invoiceNoDisplay: string;
  parcelIdDisplay: string;
  barcodeValue: string;
  trackingDisplay: string;
  deliveryTypeLabel: string;
  weightLabel: string;
  invoiceDateLabel: string;
  printedAtLabel: string;
  logisticsText: string;
}

// Standard ISO/IEC 15417 Code 128 bar/space width patterns (indices 0..106)
const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

/**
 * Encodes an ASCII string into a crisp scannable Code 128-B bar array.
 */
export function encodeCode128B(rawText: string): Code128EncodingResult {
  const sanitized = (rawText || 'MRB000001')
    .replace(/[^\x20-\x7E]/g, '')
    .trim() || 'MRB000001';

  const startCode = 104; // Start Code B
  const stopCode = 106;  // Stop pattern (7 modules: 2331112)
  const codes: number[] = [startCode];

  let weightedSum = startCode;
  for (let i = 0; i < sanitized.length; i++) {
    const val = sanitized.charCodeAt(i) - 32;
    codes.push(val);
    weightedSum += val * (i + 1);
  }
  const checksum = weightedSum % 103;
  codes.push(checksum);
  codes.push(stopCode);

  const quietZone = 8;
  let cursor = quietZone;
  const bars: Code128Bar[] = [];

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    for (let j = 0; j < pattern.length; j++) {
      const width = Number(pattern[j]);
      if (j % 2 === 0) {
        bars.push({ x: cursor, width });
      }
      cursor += width;
    }
  }

  return {
    encodedText: sanitized,
    bars,
    totalWidth: cursor + quietZone,
  };
}

/**
 * Builds an ISO-compliant QR Code boolean matrix synchronously for vector SVG rendering.
 */
export function buildQrMatrix(payload: string): QrMatrixResult {
  const safePayload = (payload || 'MRB').trim().slice(0, 240) || 'MRB';
  const qr = QRCode.create(safePayload, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const rects: { x: number; y: number }[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) {
        rects.push({ x, y });
      }
    }
  }

  return {
    size,
    rects,
    payload: safePayload,
  };
}

/**
 * Parses weight notes like "350g", "450 gm", "1.2 kg", "0.5kg" into kilograms.
 */
export function parseProductWeightKg(weightNote?: string | null): number {
  if (!weightNote) return 0;
  const normalized = weightNote.toLowerCase().trim();
  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    return Math.max(0, parseFloat(kgMatch[1]) || 0);
  }
  const gmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|grams)\b/);
  if (gmMatch) {
    return Math.max(0, (parseFloat(gmMatch[1]) || 0) / 1000);
  }
  return 0;
}

export function resolveOrderWeightKg(order: Partial<Order>, products: Product[] = []): number {
  if (typeof order.weightKg === 'number' && !Number.isNaN(order.weightKg) && order.weightKg > 0) {
    return Number(order.weightKg.toFixed(2));
  }

  let estimatedKg = 0;
  for (const item of order.items || []) {
    const prod = products.find(p => p.id === item.productId);
    const perUnitKg = parseProductWeightKg(prod?.weightNote);
    if (perUnitKg > 0) {
      estimatedKg += perUnitKg * Math.max(1, Number(item.quantity) || 1);
    }
  }
  return Number(estimatedKg.toFixed(2));
}

export function formatWeightDisplay(weightKg: number): string {
  if (!weightKg || weightKg <= 0 || Number.isNaN(weightKg)) {
    return 'N/G';
  }
  return `${Number(weightKg.toFixed(2))} kg`;
}

export function computeOrderDocumentFinancials(
  order: Partial<Order>,
  products: Product[] = []
): OrderDocumentFinancials {
  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items: DocumentOrderItemBreakdown[] = rawItems.map(item => {
    const matchedProduct = products.find(p => p.id === item.productId);
    const matchedVariant = matchedProduct?.variants?.find(
      v => v.id === item.variantId || v.name === item.variantName
    );
    const resolvedImage =
      item.image ||
      matchedVariant?.image ||
      matchedProduct?.images?.[0] ||
      '';

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unitPrice = Math.max(0, Number(item.price) || 0);
    const candidateRegular = Number(
      item.originalPrice ??
        matchedVariant?.previousPrice ??
        matchedProduct?.previousPrice ??
        unitPrice
    );
    const regularUnitPrice =
      !Number.isNaN(candidateRegular) && candidateRegular > unitPrice
        ? candidateRegular
        : unitPrice;
    const itemDiscountPerUnit = Math.max(0, regularUnitPrice - unitPrice);
    const itemDiscountTotal = itemDiscountPerUnit * quantity;
    const lineRegularTotal = regularUnitPrice * quantity;
    const lineTotal = unitPrice * quantity;

    return {
      productId: item.productId,
      variantId: item.variantId,
      title: item.title || matchedProduct?.title || 'Product',
      variantName: item.variantName || matchedVariant?.name || 'Standard',
      image: resolvedImage,
      quantity,
      unitPrice,
      regularUnitPrice,
      itemDiscountPerUnit,
      itemDiscountTotal,
      lineRegularTotal,
      lineTotal,
      hasOfferDiscount: itemDiscountPerUnit > 0,
    };
  });

  const itemsRegularTotal = items.reduce((acc, it) => acc + it.lineRegularTotal, 0);
  const itemsOfferDiscountTotal = items.reduce((acc, it) => acc + it.itemDiscountTotal, 0);
  const subtotal =
    items.length > 0
      ? items.reduce((acc, it) => acc + it.lineTotal, 0)
      : Math.max(0, Number(order.subtotal) || 0);
  const deliveryCharge = Math.max(0, Number(order.deliveryCharge) || 0);
  const codCharge = Math.max(0, Number(order.codCharge) || 0);
  const orderDiscount = Math.max(0, Number(order.discount) || 0);
  const totalSavings = itemsOfferDiscountTotal + orderDiscount;
  const computedTotal = Math.max(0, subtotal + deliveryCharge + codCharge - orderDiscount);
  const grandTotal =
    items.length > 0
      ? computedTotal
      : Math.max(0, Number(order.total) || computedTotal);

  const isPaidOnline = order.paymentStatus === 'approved';
  const paidAmount = isPaidOnline ? grandTotal : 0;
  const hasExplicitCod =
    typeof order.courierCodAmount === 'number' && !Number.isNaN(order.courierCodAmount);
  const amountToCollect = isPaidOnline
    ? 0
    : Math.max(0, hasExplicitCod ? Number(order.courierCodAmount) : grandTotal);

  return {
    items,
    itemsRegularTotal,
    itemsOfferDiscountTotal,
    subtotal,
    deliveryCharge,
    codCharge,
    orderDiscount,
    totalSavings,
    grandTotal,
    isPaidOnline,
    paidAmount,
    amountToCollect,
  };
}

/**
 * Shared calculator for FullPageOrderEdit so edits automatically keep
 * subtotal, grand total, and COD collectible synchronized.
 */
export function calculateEditedOrderFinancials(input: {
  items: CartItem[];
  deliveryCharge: number;
  discount: number;
  codCharge: number;
  paymentStatus: Order['paymentStatus'];
}) {
  const subtotal = (input.items || []).reduce(
    (sum, item) => sum + Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    0
  );
  const deliveryCharge = Math.max(0, Number(input.deliveryCharge) || 0);
  const discount = Math.max(0, Number(input.discount) || 0);
  const codCharge = Math.max(0, Number(input.codCharge) || 0);
  const total = Math.max(0, subtotal + deliveryCharge + codCharge - discount);
  const courierCodAmount = input.paymentStatus === 'approved' ? 0 : total;

  return {
    subtotal,
    deliveryCharge,
    discount,
    codCharge,
    total,
    courierCodAmount,
  };
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatInvoiceDate(ts: unknown): string {
  const num = typeof ts === 'number' && !Number.isNaN(ts) ? ts : Date.now();
  const d = new Date(num);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTH_SHORT[d.getMonth()] || 'Jan';
  const yr = d.getFullYear();
  return `${day} ${mon} ${yr}`;
}

export function formatOrderAddressLine(order: Partial<Order>): string {
  const seen = new Set<string>();
  const cleanTokens: string[] = [];
  for (const field of [order.address, order.city, order.district]) {
    if (!field) continue;
    for (const part of String(field).split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        cleanTokens.push(trimmed);
      }
    }
  }
  return cleanTokens.join(', ');
}

export function formatPrintedTimestamp(ts: number = Date.now()): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yy} ${String(hours).padStart(2, '0')}:${mins}${ampm}`;
}

export function resolveOrderDocumentMeta(
  order: Partial<Order>,
  products: Product[] = [],
  settings?: Partial<StoreSettings> | null,
  nowTs: number = Date.now()
): OrderDocumentMeta {
  const cleanRawId = String(order.id || '000001').replace(/^#/, '').trim();
  const invoiceCode = cleanRawId.toUpperCase().startsWith('MRB-')
    ? cleanRawId.toUpperCase()
    : `MRB-${cleanRawId.toUpperCase()}`;
  const invoiceNoDisplay = `#${invoiceCode}`;

  const rawConsignment = order.consignmentId ? String(order.consignmentId).trim() : '';
  const numericOrderDigits = cleanRawId.replace(/[^0-9]/g, '');
  const parcelIdDisplay =
    rawConsignment ||
    (numericOrderDigits.length >= 6 ? numericOrderDigits : cleanRawId.toUpperCase());

  const barcodeValue = rawConsignment || parcelIdDisplay || invoiceCode;
  const trackingDisplay =
    (order.trackingCode && String(order.trackingCode).trim()) ||
    `MRB${cleanRawId.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`;

  const resolvedWeight = resolveOrderWeightKg(order, products);

  return {
    storeName: settings?.storeName?.trim() || 'MR. BOOKS BD',
    merchantId: settings?.merchantId?.trim() || 'KUSXCIG',
    storePhone: settings?.phone?.trim() || '+880 1712-345678',
    storeAddress: settings?.address?.trim() || 'Nilkhet Book Market, Dhaka - 1205',
    invoiceCode,
    invoiceNoDisplay,
    parcelIdDisplay,
    barcodeValue,
    trackingDisplay,
    deliveryTypeLabel: order.courierDeliveryType === 1 ? 'Hub / Point' : 'Home',
    weightLabel: formatWeightDisplay(resolvedWeight),
    invoiceDateLabel: formatInvoiceDate(order.createdAt),
    printedAtLabel: formatPrintedTimestamp(nowTs),
    logisticsText: settings?.labelLogisticsText?.trim() || 'steadfast.com.bd',
  };
}
