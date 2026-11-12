import { Order, PaymentSubmission, Product } from '../types';
import { toNumericTimestamp } from './adminOrderAndPaymentHelpers';

export type BookkeepingDateRange = 'all' | 'today' | '7days' | '30days' | 'this_month';
export type BookkeepingStatusFilter = 'all' | 'delivered' | 'pending_processing' | 'cancelled';

export function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '').replace(/"/g, '""');
  return `"${raw}"`;
}

export function formatIsoDateOnly(ts: unknown): string {
  const ms = toNumericTimestamp(ts, Date.now());
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatIsoDateTime(ts: unknown): string {
  const ms = toNumericTimestamp(ts, Date.now());
  const d = new Date(ms);
  const datePart = formatIsoDateOnly(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${min}`;
}

export function filterOrdersByBookkeepingRange(
  orders: Order[],
  range: BookkeepingDateRange = 'all',
  statusFilter: BookkeepingStatusFilter = 'all',
  nowMs: number = Date.now()
): Order[] {
  const activeOrders = (orders || []).filter(o => o && !o.isTrashed);
  const nowDate = new Date(nowMs);
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();

  return activeOrders.filter(o => {
    const createdMs = toNumericTimestamp(o.createdAt, nowMs);
    if (range === 'today' && createdMs < startOfToday) return false;
    if (range === '7days' && createdMs < nowMs - 7 * 24 * 60 * 60 * 1000) return false;
    if (range === '30days' && createdMs < nowMs - 30 * 24 * 60 * 60 * 1000) return false;
    if (range === 'this_month' && createdMs < startOfMonth) return false;

    if (statusFilter === 'delivered' && o.orderStatus !== 'delivered') return false;
    if (
      statusFilter === 'pending_processing' &&
      !['pending', 'awaiting_payment', 'awaiting_payment_verification', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(
        o.orderStatus
      )
    ) {
      return false;
    }
    if (statusFilter === 'cancelled' && o.orderStatus !== 'cancelled') return false;

    return true;
  });
}

export function buildOrderSummaryCsv(
  orders: Order[],
  paymentSubmissions: PaymentSubmission[] = [],
  dateStamp: string = formatIsoDateOnly(Date.now())
): {
  csv: string;
  filename: string;
  rowCount: number;
  totalSubtotal: number;
  totalDelivery: number;
  totalDiscount: number;
  totalRevenue: number;
} {
  const subMap = new Map<string, PaymentSubmission>();
  for (const sub of paymentSubmissions || []) {
    if (sub && sub.orderId) {
      subMap.set(sub.orderId, sub);
    }
  }

  const headers = [
    'SL',
    'Order ID',
    'Order Date',
    'Customer Name',
    'Phone',
    'Email',
    'District',
    'City',
    'Address',
    'Total Qty',
    'Items Summary',
    'Subtotal (BDT)',
    'Delivery Charge (BDT)',
    'Discount (BDT)',
    'Total Amount (BDT)',
    'Coupon Code',
    'Payment Method',
    'Payment Status',
    'Transaction ID (TrxID)',
    'Order Status',
    'Courier',
    'Tracking Code',
  ];

  let totalSubtotal = 0;
  let totalDelivery = 0;
  let totalDiscount = 0;
  let totalRevenue = 0;
  let totalQtyAll = 0;

  const sortedOrders = [...(orders || [])].sort(
    (a, b) => toNumericTimestamp(b.createdAt) - toNumericTimestamp(a.createdAt)
  );

  const rows = sortedOrders.map((o, idx) => {
    const items = o.items || [];
    const itemQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
    const itemsText = items.map(i => `${i.quantity}x ${i.title}${i.variantName ? ` (${i.variantName})` : ''}`).join('; ');
    const sub = subMap.get(o.id);
    const subtotal = Number(o.subtotal) || 0;
    const delivery = Number(o.deliveryCharge) || 0;
    const discount = Number(o.discount) || 0;
    const total = Number(o.total) || 0;

    if (o.orderStatus !== 'cancelled') {
      totalSubtotal += subtotal;
      totalDelivery += delivery;
      totalDiscount += discount;
      totalRevenue += total;
      totalQtyAll += itemQty;
    }

    return [
      idx + 1,
      o.id,
      formatIsoDateTime(o.createdAt),
      o.customerName || '',
      o.phone || '',
      o.email || '',
      o.district || '',
      o.city || '',
      o.address || '',
      itemQty,
      itemsText,
      subtotal,
      delivery,
      discount,
      total,
      o.couponCode || '',
      o.paymentMethodName || '',
      o.paymentStatus || '',
      sub?.transactionReference || '',
      o.orderStatus || '',
      o.courierName || '',
      o.trackingCode || '',
    ];
  });

  const summaryFooter = [
    'TOTAL',
    `${sortedOrders.length} Orders`,
    dateStamp,
    '',
    '',
    '',
    '',
    '',
    'Active (Excl. Cancelled)',
    totalQtyAll,
    '',
    totalSubtotal,
    totalDelivery,
    totalDiscount,
    totalRevenue,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(r => r.map(escapeCsvCell).join(',')),
    summaryFooter.map(escapeCsvCell).join(','),
  ];

  return {
    csv: '\uFEFF' + lines.join('\n'),
    filename: `mr-books-order-summary-${dateStamp}.csv`,
    rowCount: sortedOrders.length,
    totalSubtotal,
    totalDelivery,
    totalDiscount,
    totalRevenue,
  };
}

export interface DailySalesReportRow {
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingProcessingOrders: number;
  cancelledOrders: number;
  unitsSold: number;
  grossSubtotal: number;
  deliveryChargeTotal: number;
  discountTotal: number;
  netSalesRevenue: number;
  codRevenue: number;
  digitalRevenue: number;
}

export function buildSalesReportCsv(
  orders: Order[],
  dateStamp: string = formatIsoDateOnly(Date.now())
): {
  csv: string;
  filename: string;
  dayCount: number;
  totalOrders: number;
  netRevenue: number;
  dailyRows: DailySalesReportRow[];
} {
  const byDate = new Map<string, DailySalesReportRow>();

  for (const o of orders || []) {
    if (!o || o.isTrashed) continue;
    const dateKey = formatIsoDateOnly(o.createdAt);
    let bucket = byDate.get(dateKey);
    if (!bucket) {
      bucket = {
        date: dateKey,
        totalOrders: 0,
        deliveredOrders: 0,
        pendingProcessingOrders: 0,
        cancelledOrders: 0,
        unitsSold: 0,
        grossSubtotal: 0,
        deliveryChargeTotal: 0,
        discountTotal: 0,
        netSalesRevenue: 0,
        codRevenue: 0,
        digitalRevenue: 0,
      };
      byDate.set(dateKey, bucket);
    }

    bucket.totalOrders += 1;
    const isCancelled = o.orderStatus === 'cancelled';
    if (isCancelled) {
      bucket.cancelledOrders += 1;
      continue;
    }

    if (o.orderStatus === 'delivered') {
      bucket.deliveredOrders += 1;
    } else {
      bucket.pendingProcessingOrders += 1;
    }

    const units = (o.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
    const subtotal = Number(o.subtotal) || 0;
    const delivery = Number(o.deliveryCharge) || 0;
    const discount = Number(o.discount) || 0;
    const total = Number(o.total) || 0;

    bucket.unitsSold += units;
    bucket.grossSubtotal += subtotal;
    bucket.deliveryChargeTotal += delivery;
    bucket.discountTotal += discount;
    bucket.netSalesRevenue += total;

    const pmLower = `${o.paymentMethodId || ''} ${o.paymentMethodName || ''}`.toLowerCase();
    if (pmLower.includes('cod') || pmLower.includes('cash') || pmLower.includes('ক্যাশ')) {
      bucket.codRevenue += total;
    } else {
      bucket.digitalRevenue += total;
    }
  }

  const dailyRows = Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));

  const headers = [
    'Date',
    'Total Orders',
    'Delivered Orders',
    'Active / Processing Orders',
    'Cancelled Orders',
    'Units Sold',
    'Gross Merchandise Subtotal (BDT)',
    'Delivery Collected (BDT)',
    'Discounts Given (BDT)',
    'Net Sales Revenue (BDT)',
    'COD Revenue (BDT)',
    'Digital MFS / Bank Revenue (BDT)',
  ];

  const grandTotals = dailyRows.reduce(
    (acc, r) => {
      acc.totalOrders += r.totalOrders;
      acc.deliveredOrders += r.deliveredOrders;
      acc.pendingProcessingOrders += r.pendingProcessingOrders;
      acc.cancelledOrders += r.cancelledOrders;
      acc.unitsSold += r.unitsSold;
      acc.grossSubtotal += r.grossSubtotal;
      acc.deliveryChargeTotal += r.deliveryChargeTotal;
      acc.discountTotal += r.discountTotal;
      acc.netSalesRevenue += r.netSalesRevenue;
      acc.codRevenue += r.codRevenue;
      acc.digitalRevenue += r.digitalRevenue;
      return acc;
    },
    {
      totalOrders: 0,
      deliveredOrders: 0,
      pendingProcessingOrders: 0,
      cancelledOrders: 0,
      unitsSold: 0,
      grossSubtotal: 0,
      deliveryChargeTotal: 0,
      discountTotal: 0,
      netSalesRevenue: 0,
      codRevenue: 0,
      digitalRevenue: 0,
    }
  );

  const csvRows = dailyRows.map(r => [
    r.date,
    r.totalOrders,
    r.deliveredOrders,
    r.pendingProcessingOrders,
    r.cancelledOrders,
    r.unitsSold,
    r.grossSubtotal,
    r.deliveryChargeTotal,
    r.discountTotal,
    r.netSalesRevenue,
    r.codRevenue,
    r.digitalRevenue,
  ]);

  const footerRow = [
    'GRAND TOTAL',
    grandTotals.totalOrders,
    grandTotals.deliveredOrders,
    grandTotals.pendingProcessingOrders,
    grandTotals.cancelledOrders,
    grandTotals.unitsSold,
    grandTotals.grossSubtotal,
    grandTotals.deliveryChargeTotal,
    grandTotals.discountTotal,
    grandTotals.netSalesRevenue,
    grandTotals.codRevenue,
    grandTotals.digitalRevenue,
  ];

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...csvRows.map(r => r.map(escapeCsvCell).join(',')),
    footerRow.map(escapeCsvCell).join(','),
  ];

  return {
    csv: '\uFEFF' + lines.join('\n'),
    filename: `mr-books-sales-report-${dateStamp}.csv`,
    dayCount: dailyRows.length,
    totalOrders: grandTotals.totalOrders,
    netRevenue: grandTotals.netSalesRevenue,
    dailyRows,
  };
}

export function buildProductSalesReportCsv(
  orders: Order[],
  products: Product[],
  dateStamp: string = formatIsoDateOnly(Date.now())
): {
  csv: string;
  filename: string;
  productCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
} {
  const productLookup = new Map<string, Product>();
  for (const p of products || []) {
    if (p && p.id) productLookup.set(p.id, p);
  }

  interface ProdAgg {
    productId: string;
    sku: string;
    title: string;
    category: string;
    authorOrBrand: string;
    unitPrice: number;
    unitsSold: number;
    orderCount: number;
    grossRevenue: number;
  }

  const aggMap = new Map<string, ProdAgg>();

  for (const p of products || []) {
    if (!p) continue;
    aggMap.set(p.id, {
      productId: p.id,
      sku: p.sku || p.id,
      title: p.title,
      category: p.category || '',
      authorOrBrand: p.author || p.brand || '',
      unitPrice: Number(p.price) || 0,
      unitsSold: 0,
      orderCount: 0,
      grossRevenue: 0,
    });
  }

  for (const o of orders || []) {
    if (!o || o.isTrashed || o.orderStatus === 'cancelled') continue;
    for (const item of o.items || []) {
      const pid = item.productId || item.title;
      const prod = productLookup.get(pid);
      let entry = aggMap.get(pid);
      if (!entry) {
        entry = {
          productId: pid,
          sku: prod?.sku || pid,
          title: item.title || prod?.title || 'Item',
          category: prod?.category || '',
          authorOrBrand: prod?.author || prod?.brand || '',
          unitPrice: Number(item.price) || Number(prod?.price) || 0,
          unitsSold: 0,
          orderCount: 0,
          grossRevenue: 0,
        };
        aggMap.set(pid, entry);
      }
      const qty = Math.max(1, Number(item.quantity) || 1);
      const lineTotal = qty * (Number(item.price) || entry.unitPrice);
      entry.unitsSold += qty;
      entry.orderCount += 1;
      entry.grossRevenue += lineTotal;
    }
  }

  const rowsSorted = Array.from(aggMap.values()).sort(
    (a, b) => b.grossRevenue - a.grossRevenue || b.unitsSold - a.unitsSold
  );

  const headers = [
    'SKU',
    'Product Title',
    'Category',
    'Author / Brand',
    'Current Price (BDT)',
    'Orders Count',
    'Units Sold',
    'Gross Product Revenue (BDT)',
  ];

  let totalUnitsSold = 0;
  let totalRevenue = 0;

  const csvRows = rowsSorted.map(r => {
    totalUnitsSold += r.unitsSold;
    totalRevenue += r.grossRevenue;
    return [
      r.sku,
      r.title,
      r.category,
      r.authorOrBrand,
      r.unitPrice,
      r.orderCount,
      r.unitsSold,
      r.grossRevenue,
    ];
  });

  const footerRow = [
    'TOTAL',
    `${rowsSorted.length} Catalog Items`,
    '',
    '',
    '',
    '',
    totalUnitsSold,
    totalRevenue,
  ];

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...csvRows.map(r => r.map(escapeCsvCell).join(',')),
    footerRow.map(escapeCsvCell).join(','),
  ];

  return {
    csv: '\uFEFF' + lines.join('\n'),
    filename: `mr-books-product-sales-${dateStamp}.csv`,
    productCount: rowsSorted.length,
    totalUnitsSold,
    totalRevenue,
  };
}

export function triggerCsvDownload(csvContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
