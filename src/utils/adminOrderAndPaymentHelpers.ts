import {
  HomeConfig,
  LiveChatMessage,
  LiveChatSession,
  Order,
  PaymentMethodConfig,
  PaymentSubmission,
  Product,
  SiteSettings,
} from '../types';
import { normalizePhoneLast10 } from './chatSoundAndValidation';
import { sortPaymentMethods, getPaymentMethodDisplayMeta } from './reviewHelpers';

export function toNumericTimestamp(val: unknown, fallback = Date.now()): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val && typeof val === 'object') {
    const maybe = val as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') {
      try {
        const ms = maybe.toMillis();
        if (typeof ms === 'number' && Number.isFinite(ms)) return ms;
      } catch {
        // ignore
      }
    }
    if (typeof maybe.seconds === 'number' && Number.isFinite(maybe.seconds)) {
      return maybe.seconds * 1000;
    }
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function normalizeLiveChatSession(raw: unknown, fallbackId = ''): LiveChatSession {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const now = Date.now();
  const createdAt = toNumericTimestamp(data.createdAt, now);
  const rawMessages = Array.isArray(data.messages) ? data.messages : [];

  const messages: LiveChatMessage[] = rawMessages
    .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
    .map((m, idx) => ({
      id: typeof m.id === 'string' && m.id.trim() ? m.id : `msg-fallback-${createdAt}-${idx}`,
      sender:
        m.sender === 'admin' || m.sender === 'customer' || m.sender === 'system'
          ? m.sender
          : 'customer',
      senderName:
        typeof m.senderName === 'string' && m.senderName.trim()
          ? m.senderName
          : m.sender === 'admin'
          ? 'MR. BOOKS Support'
          : 'Customer',
      text: typeof m.text === 'string' ? m.text : String(m.text ?? ''),
      createdAt: toNumericTimestamp(m.createdAt, createdAt + idx),
    }));

  const lastMsg = messages[messages.length - 1];
  const lastMessageAt = toNumericTimestamp(
    data.lastMessageAt,
    lastMsg ? lastMsg.createdAt : createdAt
  );
  const resolvedName =
    typeof data.customerName === 'string' && data.customerName.trim()
      ? data.customerName.trim()
      : 'Guest Customer';

  const id = typeof data.id === 'string' && data.id.trim() ? data.id : fallbackId || `chat-${createdAt}`;

  return {
    id,
    visitorId:
      typeof data.visitorId === 'string' && data.visitorId.trim()
        ? data.visitorId
        : id.replace(/^chat-/, '') || 'guest',
    customerName: resolvedName,
    customerPhone: typeof data.customerPhone === 'string' ? data.customerPhone : '',
    customerEmail: typeof data.customerEmail === 'string' ? data.customerEmail : '',
    topic: typeof data.topic === 'string' ? data.topic : 'General Inquiry',
    ...(typeof data.customerSegment === 'string'
      ? { customerSegment: data.customerSegment as LiveChatSession['customerSegment'] }
      : {}),
    ...(typeof data.adminNote === 'string' ? { adminNote: data.adminNote } : {}),
    status: data.status === 'resolved' ? 'resolved' : 'open',
    unreadByAdmin:
      typeof data.unreadByAdmin === 'number' && Number.isFinite(data.unreadByAdmin)
        ? Math.max(0, data.unreadByAdmin)
        : 0,
    unreadByCustomer:
      typeof data.unreadByCustomer === 'number' && Number.isFinite(data.unreadByCustomer)
        ? Math.max(0, data.unreadByCustomer)
        : 0,
    lastMessageText:
      (lastMsg?.text && lastMsg.text.trim()) ||
      (typeof data.lastMessageText === 'string' ? data.lastMessageText : ''),
    lastMessageAt,
    createdAt,
    messages,
  };
}

export type OrderChannelFilter = 'all' | 'cod' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'banking';
export type OrderStatusTab =
  | 'all'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'trash';
export type OrderDateFilter = 'all' | 'today' | '7d' | '30d';
export type OrderZoneFilter = 'all' | 'inside_dhaka' | 'outside_dhaka';
export type OrderVerificationFilter = 'all' | 'paid' | 'pending_verification' | 'unpaid' | 'rejected';

export function getOrderChannelKey(order: Order): Exclude<OrderChannelFilter, 'all'> {
  const haystack = `${order.paymentMethodId || ''} ${order.paymentMethodName || ''}`.toLowerCase();
  if (haystack.includes('bkash') || haystack.includes('বিকাশ')) return 'bkash';
  if (haystack.includes('nagad') || haystack.includes('নগদ')) return 'nagad';
  if (haystack.includes('rocket') || haystack.includes('রকেট')) return 'rocket';
  if (haystack.includes('upay') || haystack.includes('উপায়') || haystack.includes('উপায়')) return 'upay';
  if (
    haystack.includes('bank') ||
    haystack.includes('card') ||
    haystack.includes('qr') ||
    haystack.includes('কিউআর') ||
    haystack.includes('ব্যাংক')
  ) {
    return 'banking';
  }
  return 'cod';
}

export interface CustomerPhoneOrderStats {
  totalOrders: number;
  cancelledCount: number;
  deliveredCount: number;
  orderedIdsChronological: string[];
}

export function computeCustomerPhoneOrderStats(
  orders: Order[]
): Map<string, CustomerPhoneOrderStats> {
  const map = new Map<string, CustomerPhoneOrderStats>();
  const activeOrders = orders
    .filter(o => !o.isTrashed)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  for (const order of activeOrders) {
    const key = normalizePhoneLast10(order.phone) || (order.phone || '').trim();
    if (!key) continue;
    const prev = map.get(key) || {
      totalOrders: 0,
      cancelledCount: 0,
      deliveredCount: 0,
      orderedIdsChronological: [],
    };
    prev.totalOrders += 1;
    if (order.orderStatus === 'cancelled') prev.cancelledCount += 1;
    if (order.orderStatus === 'delivered') prev.deliveredCount += 1;
    prev.orderedIdsChronological.push(order.id);
    map.set(key, prev);
  }

  return map;
}

export function getOrderRepeatRankLabel(
  order: Order,
  statsMap: Map<string, CustomerPhoneOrderStats>
): {
  label: string;
  isRepeat: boolean;
  cancelledCount: number;
  totalOrders: number;
} {
  const key = normalizePhoneLast10(order.phone) || (order.phone || '').trim();
  const stats = key ? statsMap.get(key) : undefined;
  if (!stats || stats.totalOrders <= 1) {
    return {
      label: '1st Order',
      isRepeat: false,
      cancelledCount: stats?.cancelledCount || 0,
      totalOrders: stats?.totalOrders || 1,
    };
  }
  const index = stats.orderedIdsChronological.indexOf(order.id);
  const ordinalNum = index >= 0 ? index + 1 : stats.totalOrders;
  const suffix =
    ordinalNum === 1
      ? '1st Order'
      : ordinalNum === 2
      ? '2nd Order (Repeat)'
      : ordinalNum === 3
      ? '3rd Order (Repeat)'
      : `${ordinalNum}th Order (Repeat)`;
  return {
    label: suffix,
    isRepeat: ordinalNum > 1 || stats.totalOrders > 1,
    cancelledCount: stats.cancelledCount,
    totalOrders: stats.totalOrders,
  };
}

export interface CustomerOrderHistoryEntry {
  id: string;
  createdAt: number;
  total: number;
  orderStatus: Order['orderStatus'];
  paymentStatus: Order['paymentStatus'];
  paymentMethodName: string;
  itemsCount: number;
  addressLine: string;
  trackingCode?: string;
}

export interface CustomerOrderHistorySummary {
  normalizedPhone: string;
  totalOrders: number;
  deliveredCount: number;
  cancelledCount: number;
  inFlightCount: number;
  totalSpent: number;
  successRatePercent: number | null;
  cancellationRatePercent: number | null;
  isFirstTimeCustomer: boolean;
  customerRankLabel: string;
  orders: CustomerOrderHistoryEntry[];
}

export function buildCustomerOrderHistorySummary(
  phone: string,
  allOrders: Order[]
): CustomerOrderHistorySummary {
  const key = normalizePhoneLast10(phone) || (phone || '').trim();
  const matching = (allOrders || [])
    .filter(o => {
      if (o.isTrashed) return false;
      const oKey = normalizePhoneLast10(o.phone) || (o.phone || '').trim();
      return Boolean(key && oKey && oKey === key);
    })
    .sort((a, b) => toNumericTimestamp(b.createdAt, 0) - toNumericTimestamp(a.createdAt, 0));

  const deliveredCount = matching.filter(o => o.orderStatus === 'delivered').length;
  const cancelledCount = matching.filter(o => o.orderStatus === 'cancelled').length;
  const inFlightCount = matching.filter(
    o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  ).length;
  const finishedCount = deliveredCount + cancelledCount;
  const totalSpent = matching
    .filter(o => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const successRatePercent =
    finishedCount > 0 ? Math.round((deliveredCount / finishedCount) * 100) : null;
  const cancellationRatePercent =
    finishedCount > 0 ? Math.round((cancelledCount / finishedCount) * 100) : null;

  const totalOrders = matching.length;
  const isFirstTimeCustomer = totalOrders <= 1;
  const customerRankLabel =
    totalOrders === 0
      ? 'No Prior Store Orders'
      : totalOrders === 1
      ? '1st Order (New Customer)'
      : `Repeat Customer · ${totalOrders} Orders`;

  const orders: CustomerOrderHistoryEntry[] = matching.map(o => ({
    id: o.id,
    createdAt: toNumericTimestamp(o.createdAt, Date.now()),
    total: Number(o.total) || 0,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    paymentMethodName: o.paymentMethodName || 'Cash on Delivery',
    itemsCount: Array.isArray(o.items)
      ? o.items.reduce((sum, it) => sum + Math.max(1, Number(it.quantity) || 1), 0)
      : 0,
    addressLine: [o.address, o.city, o.district].filter(Boolean).join(', '),
    trackingCode: o.trackingCode,
  }));

  return {
    normalizedPhone: key,
    totalOrders,
    deliveredCount,
    cancelledCount,
    inFlightCount,
    totalSpent,
    successRatePercent,
    cancellationRatePercent,
    isFirstTimeCustomer,
    customerRankLabel,
    orders,
  };
}

export function isOrderCompletedStatus(status: Order['orderStatus']): boolean {
  return status === 'delivered';
}

export function isOrderProcessingGroup(status: Order['orderStatus']): boolean {
  return status === 'confirmed' || status === 'processing';
}

export function isOrderPendingGroup(status: Order['orderStatus']): boolean {
  return (
    status === 'pending' ||
    status === 'awaiting_payment' ||
    status === 'awaiting_payment_verification'
  );
}

export function isOrderShippedGroup(status: Order['orderStatus']): boolean {
  return status === 'shipped' || status === 'out_for_delivery';
}

export function filterAdminOrders(
  orders: Order[],
  submissions: PaymentSubmission[],
  filters: {
    searchQuery?: string;
    statusTab?: OrderStatusTab;
    dateFilter?: OrderDateFilter;
    channelFilter?: OrderChannelFilter;
    zoneFilter?: OrderZoneFilter;
    verificationFilter?: OrderVerificationFilter;
    now?: number;
  } = {}
): Order[] {
  const {
    searchQuery = '',
    statusTab = 'all',
    dateFilter = 'all',
    channelFilter = 'all',
    zoneFilter = 'all',
    verificationFilter = 'all',
    now = Date.now(),
  } = filters;

  const q = searchQuery.trim().toLowerCase();
  const subByOrderId = new Map<string, PaymentSubmission>();
  for (const s of submissions) {
    subByOrderId.set(s.orderId, s);
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  return orders
    .filter(order => {
      const isTrashed = Boolean(order.isTrashed);
      if (statusTab === 'trash') {
        if (!isTrashed) return false;
      } else {
        if (isTrashed) return false;
        if (statusTab === 'pending' && !isOrderPendingGroup(order.orderStatus)) return false;
        if (statusTab === 'processing' && !isOrderProcessingGroup(order.orderStatus)) return false;
        if (statusTab === 'shipped' && !isOrderShippedGroup(order.orderStatus)) return false;
        if (statusTab === 'completed' && !isOrderCompletedStatus(order.orderStatus)) return false;
        if (statusTab === 'cancelled' && order.orderStatus !== 'cancelled') return false;
      }

      if (channelFilter !== 'all' && getOrderChannelKey(order) !== channelFilter) {
        return false;
      }

      const isInsideDhaka = (order.district || '').toLowerCase().includes('dhaka');
      if (zoneFilter === 'inside_dhaka' && !isInsideDhaka) return false;
      if (zoneFilter === 'outside_dhaka' && isInsideDhaka) return false;

      if (verificationFilter === 'paid' && order.paymentStatus !== 'approved') return false;
      if (
        verificationFilter === 'pending_verification' &&
        order.paymentStatus !== 'pending_verification'
      ) {
        return false;
      }
      if (verificationFilter === 'unpaid' && order.paymentStatus !== 'unpaid') return false;
      if (verificationFilter === 'rejected' && order.paymentStatus !== 'rejected') return false;

      if (dateFilter !== 'all') {
        const created = order.createdAt || 0;
        if (dateFilter === 'today' && created < todayMs) return false;
        if (dateFilter === '7d' && created < now - 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '30d' && created < now - 30 * 24 * 60 * 60 * 1000) return false;
      }

      if (q) {
        const linkedSub = subByOrderId.get(order.id);
        const hay = [
          order.id,
          order.customerName,
          order.phone,
          order.optionalPhone,
          order.email,
          order.address,
          order.city,
          order.district,
          order.trackingCode,
          order.paymentMethodName,
          linkedSub?.transactionReference,
          linkedSub?.senderIdentifier,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// =========================================================================
// Payment Transactions Dashboard Helpers
// =========================================================================

export type PaymentGatewayTab = 'all' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'cod';
export type PaymentStatusTab = 'all' | 'pending' | 'done' | 'failed' | 'flagged';

export interface UnifiedPaymentRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  gatewayKey: Exclude<PaymentGatewayTab, 'all'>;
  providerName: string;
  transactionReference: string;
  senderIdentifier: string;
  amount: number;
  status: 'pending_verification' | 'approved' | 'rejected';
  timestamp: number;
  rejectionReason?: string;
  source: 'submission' | 'cod_order';
}

export function detectPaymentGatewayKey(providerNameOrId?: string): Exclude<PaymentGatewayTab, 'all'> {
  const s = (providerNameOrId || '').toLowerCase();
  if (s.includes('bkash') || s.includes('বিকাশ')) return 'bkash';
  if (s.includes('nagad') || s.includes('নগদ')) return 'nagad';
  if (s.includes('rocket') || s.includes('রকেট')) return 'rocket';
  if (s.includes('upay') || s.includes('উপায়') || s.includes('উপায়')) return 'upay';
  if (s.includes('cod') || s.includes('cash') || s.includes('ক্যাশ')) return 'cod';
  return 'card';
}

export function buildUnifiedPaymentRecords(
  submissions: PaymentSubmission[],
  orders: Order[]
): UnifiedPaymentRecord[] {
  const subRecords: UnifiedPaymentRecord[] = submissions.map(s => ({
    id: s.id,
    orderId: s.orderId,
    customerName: s.customerName || 'Customer',
    customerPhone: s.customerPhone || '',
    gatewayKey: detectPaymentGatewayKey(s.providerName || s.providerId),
    providerName: s.providerName || 'Online MFS',
    transactionReference: s.transactionReference || '',
    senderIdentifier: s.senderIdentifier || '',
    amount: Number(s.claimedAmount) || 0,
    status: s.status,
    timestamp: toNumericTimestamp(s.submittedAt, Date.now()),
    rejectionReason: s.rejectionReason,
    source: 'submission',
  }));

  const subOrderIds = new Set(submissions.map(s => s.orderId));
  const codRecords: UnifiedPaymentRecord[] = orders
    .filter(
      o =>
        !o.isTrashed &&
        getOrderChannelKey(o) === 'cod' &&
        !subOrderIds.has(o.id)
    )
    .map(o => ({
      id: `COD-${o.id}`,
      orderId: o.id,
      customerName: o.customerName || 'Customer',
      customerPhone: o.phone || '',
      gatewayKey: 'cod',
      providerName: o.paymentMethodName || 'Cash on Delivery',
      transactionReference: o.trackingCode || `COD-${o.id}`,
      senderIdentifier: o.phone || '',
      amount: Number(o.total) || 0,
      status:
        o.paymentStatus === 'approved' || o.orderStatus === 'delivered'
          ? 'approved'
          : o.orderStatus === 'cancelled' || o.paymentStatus === 'rejected'
          ? 'rejected'
          : 'pending_verification',
      timestamp: toNumericTimestamp(o.createdAt, Date.now()),
      source: 'cod_order',
    }));

  return [...subRecords, ...codRecords].sort((a, b) => b.timestamp - a.timestamp);
}

export function computePaymentDashboardMetrics(
  submissions: PaymentSubmission[],
  orders: Order[],
  now = Date.now()
) {
  const records = buildUnifiedPaymentRecords(submissions, orders);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  const approvedSubs = submissions.filter(s => s.status === 'approved');
  const pendingSubs = submissions.filter(s => s.status === 'pending_verification');
  const failedSubs = submissions.filter(s => s.status === 'rejected');

  const totalCollected = approvedSubs.reduce((sum, s) => sum + (Number(s.claimedAmount) || 0), 0);
  const todayCollected = approvedSubs
    .filter(s => toNumericTimestamp(s.reviewedAt || s.submittedAt, 0) >= todayMs)
    .reduce((sum, s) => sum + (Number(s.claimedAmount) || 0), 0);

  const pendingAmount = pendingSubs.reduce((sum, s) => sum + (Number(s.claimedAmount) || 0), 0);

  const bkashTotal = approvedSubs
    .filter(s => detectPaymentGatewayKey(s.providerName) === 'bkash')
    .reduce((sum, s) => sum + (Number(s.claimedAmount) || 0), 0);

  const nagadTotal = approvedSubs
    .filter(s => detectPaymentGatewayKey(s.providerName) === 'nagad')
    .reduce((sum, s) => sum + (Number(s.claimedAmount) || 0), 0);

  const digitalTotal = approvedSubs
    .filter(s => detectPaymentGatewayKey(s.providerName) !== 'cod')
    .reduce((sum, s) => sum + (Number(s.claimedAmount) || 0), 0);

  return {
    totalCollected,
    todayCollected,
    completedCount: approvedSubs.length,
    pendingCount: pendingSubs.length,
    pendingAmount,
    failedCount: failedSubs.length,
    flaggedCount: submissions.filter(
      s => s.status === 'rejected' || Boolean(s.rejectionReason && s.rejectionReason.trim())
    ).length,
    bkashTotal,
    nagadTotal,
    digitalTotal,
    gatewayCounts: {
      all: submissions.length,
      bkash: records.filter(r => r.source === 'submission' && r.gatewayKey === 'bkash').length,
      nagad: records.filter(r => r.source === 'submission' && r.gatewayKey === 'nagad').length,
      rocket: records.filter(r => r.source === 'submission' && r.gatewayKey === 'rocket').length,
      upay: records.filter(r => r.source === 'submission' && r.gatewayKey === 'upay').length,
      card: records.filter(r => r.source === 'submission' && r.gatewayKey === 'card').length,
      cod: records.filter(r => r.gatewayKey === 'cod').length,
    },
  };
}

export function filterPaymentRecords(
  submissions: PaymentSubmission[],
  orders: Order[],
  filters: {
    gatewayTab?: PaymentGatewayTab;
    statusTab?: PaymentStatusTab;
    searchQuery?: string;
  } = {}
): UnifiedPaymentRecord[] {
  const { gatewayTab = 'all', statusTab = 'all', searchQuery = '' } = filters;
  const allRecords = buildUnifiedPaymentRecords(submissions, orders);
  const q = searchQuery.trim().toLowerCase();

  return allRecords.filter(rec => {
    // Unless user explicitly picks Cash on Delivery pill, show online/digital submissions primarily (matching MFS dashboard)
    if (gatewayTab === 'all') {
      if (rec.source !== 'submission') return false;
    } else if (gatewayTab === 'cod') {
      if (rec.gatewayKey !== 'cod') return false;
    } else {
      if (rec.source !== 'submission' || rec.gatewayKey !== gatewayTab) return false;
    }

    if (statusTab === 'pending' && rec.status !== 'pending_verification') return false;
    if (statusTab === 'done' && rec.status !== 'approved') return false;
    if (statusTab === 'failed' && rec.status !== 'rejected') return false;
    if (
      statusTab === 'flagged' &&
      rec.status !== 'rejected' &&
      !(rec.rejectionReason && rec.rejectionReason.trim())
    ) {
      return false;
    }

    if (q) {
      const hay = [
        rec.orderId,
        rec.customerName,
        rec.customerPhone,
        rec.transactionReference,
        rec.senderIdentifier,
        rec.providerName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  reviewDisplay: true,
  authorInfo: true,
  deliveryTimingDisplay: true,
};

export function resolveSiteSettings(
  raw?: Partial<SiteSettings> | null,
  homeConfig?: Partial<HomeConfig> | null
): SiteSettings {
  return {
    reviewDisplay:
      raw?.reviewDisplay !== undefined
        ? Boolean(raw.reviewDisplay)
        : homeConfig?.showReviews !== undefined
        ? Boolean(homeConfig.showReviews)
        : true,
    authorInfo:
      raw?.authorInfo !== undefined
        ? Boolean(raw.authorInfo)
        : homeConfig?.showAuthors !== undefined
        ? Boolean(homeConfig.showAuthors)
        : true,
    deliveryTimingDisplay:
      raw?.deliveryTimingDisplay !== undefined
        ? Boolean(raw.deliveryTimingDisplay)
        : true,
    updatedAt: raw?.updatedAt || homeConfig?.updatedAt,
  };
}

export interface PaymentChannelDistributionItem {
  id: string;
  type: PaymentMethodConfig['type'];
  label: string;
  count: number;
  revenue: number;
  percentage: number;
  barColor: string;
  textColor: string;
}

export interface PaymentChannelDistributionSummary {
  channels: PaymentChannelDistributionItem[];
  totalOrdersCount: number;
  primaryChannel: {
    label: string;
    percentage: number;
    textColor: string;
  };
}

function getPaymentMethodStyleMeta(method: PaymentMethodConfig): {
  label: string;
  barColor: string;
  textColor: string;
} {
  const meta = getPaymentMethodDisplayMeta(method);
  const cleanEnglish = (method.englishName || meta.englishName || '').trim();
  const cleanName = (method.name || meta.displayTitle || '').trim();

  let label = cleanEnglish || cleanName || 'Payment Method';
  if (method.type === 'cod' && (!cleanEnglish || cleanEnglish === 'Cash on Delivery')) {
    label = 'Cash on Delivery';
  }

  switch (method.type) {
    case 'cod':
      return { label, barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
    case 'bkash':
      return { label, barColor: 'bg-[#E2136E]', textColor: 'text-[#E2136E]' };
    case 'nagad':
      return { label, barColor: 'bg-[#F15A24]', textColor: 'text-[#F15A24]' };
    case 'rocket':
      return { label, barColor: 'bg-[#8C3494]', textColor: 'text-[#8C3494]' };
    case 'upay':
      return { label, barColor: 'bg-[#0054A6]', textColor: 'text-[#0054A6]' };
    case 'bangla_qr':
      return { label, barColor: 'bg-teal-600', textColor: 'text-teal-600' };
    case 'bank':
    default:
      return { label, barColor: 'bg-blue-600', textColor: 'text-blue-600' };
  }
}

export function detectOrderPaymentType(order: Order): PaymentMethodConfig['type'] {
  const haystack = `${order.paymentMethodId || ''} ${order.paymentMethodName || ''}`.toLowerCase();
  if (haystack.includes('bkash') || haystack.includes('বিকাশ')) return 'bkash';
  if (haystack.includes('nagad') || haystack.includes('নগদ')) return 'nagad';
  if (haystack.includes('rocket') || haystack.includes('রকেট')) return 'rocket';
  if (haystack.includes('upay') || haystack.includes('উপায়') || haystack.includes('উপায়')) return 'upay';
  if (
    haystack.includes('bangla_qr') ||
    haystack.includes('bangla-qr') ||
    haystack.includes('bangla qr') ||
    haystack.includes('কিউআর') ||
    haystack.includes('qr')
  ) {
    return 'bangla_qr';
  }
  if (haystack.includes('bank') || haystack.includes('ব্যাংক') || haystack.includes('card')) {
    return 'bank';
  }
  return 'cod';
}

/**
 * Dynamically computes payment channel distribution for all active payment methods
 * configured in the Admin Panel. Hidden/disabled (`isActive: false`) or removed methods
 * are excluded from the displayed list.
 */
export function computePaymentChannelDistribution(
  orders: Order[],
  paymentMethods: PaymentMethodConfig[],
  enableBanglaQr = true,
  paymentSubmissions: PaymentSubmission[] = []
): PaymentChannelDistributionSummary {
  const activeMethods = sortPaymentMethods(paymentMethods || []).filter(m => {
    if (!m || m.isActive === false) return false;
    if (m.type === 'bangla_qr' && enableBanglaQr === false) return false;
    return true;
  });

  const statsMap = new Map<string, { count: number; revenue: number }>();
  for (const m of activeMethods) {
    statsMap.set(m.id, { count: 0, revenue: 0 });
  }

  const subByOrderId = new Map<string, PaymentSubmission>();
  for (const sub of paymentSubmissions || []) {
    if (sub && sub.orderId) {
      subByOrderId.set(sub.orderId, sub);
    }
  }

  const validOrders = (orders || []).filter(o => !o.isTrashed);

  for (const order of validOrders) {
    const orderTotal = Number(order.total) || 0;
    const linkedSub = subByOrderId.get(order.id);
    const rawId = ((linkedSub?.providerId || order.paymentMethodId) || '').trim();
    const rawName = `${linkedSub?.providerName || ''} ${order.paymentMethodName || ''}`.trim().toLowerCase();

    // 1. Direct ID match against active payment methods
    let matchedMethod = activeMethods.find(m => m.id === rawId);

    // 2. Match by payment type (bkash, nagad, rocket, upay, bangla_qr, bank, cod)
    if (!matchedMethod) {
      const syntheticOrder: Order = {
        ...order,
        paymentMethodId: rawId || order.paymentMethodId,
        paymentMethodName: rawName || order.paymentMethodName,
      };
      const detectedType = detectOrderPaymentType(syntheticOrder);
      matchedMethod = activeMethods.find(m => m.type === detectedType);
    }

    // 3. Match by custom method name / English name if not matched by ID or type
    if (!matchedMethod && rawName) {
      matchedMethod = activeMethods.find(m => {
        const mName = (m.name || '').trim().toLowerCase();
        const mEng = (m.englishName || '').trim().toLowerCase();
        return (
          (mName && rawName.includes(mName)) ||
          (mEng && rawName.includes(mEng))
        );
      });
    }

    if (matchedMethod) {
      const prev = statsMap.get(matchedMethod.id) || { count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += orderTotal;
      statsMap.set(matchedMethod.id, prev);
    }
  }

  const totalMatchedOrders = Array.from(statsMap.values()).reduce((sum, s) => sum + s.count, 0);
  const denom = Math.max(totalMatchedOrders, 1);

  const channels: PaymentChannelDistributionItem[] = activeMethods.map(m => {
    const stat = statsMap.get(m.id) || { count: 0, revenue: 0 };
    const style = getPaymentMethodStyleMeta(m);
    const percentage = totalMatchedOrders > 0 ? Math.round((stat.count / denom) * 100) : 0;
    return {
      id: m.id,
      type: m.type,
      label: style.label,
      count: stat.count,
      revenue: stat.revenue,
      percentage,
      barColor: style.barColor,
      textColor: style.textColor,
    };
  });

  if (totalMatchedOrders === 0) {
    const first = channels[0];
    return {
      channels,
      totalOrdersCount: 0,
      primaryChannel: {
        label: first ? first.label : 'None',
        percentage: 0,
        textColor: first ? first.textColor : 'text-neutral-500',
      },
    };
  }

  const sortedByVolume = [...channels].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.revenue - a.revenue;
  });
  const top = sortedByVolume[0];

  return {
    channels,
    totalOrdersCount: totalMatchedOrders,
    primaryChannel: {
      label: top.label,
      percentage: top.percentage,
      textColor: top.textColor,
    },
  };
}

export type TopProductsTimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'all';

export interface TopSellingProductRow {
  productId: string;
  title: string;
  author?: string;
  category: string;
  thumbnail: string;
  currentPrice: number;
  currentStock: number;
  unitsSold: number;
  ordersCount: number;
  revenue: number;
  variantsSummary: string;
  isBook: boolean;
}

export function filterActiveNonTrashedOrders(orders: Order[]): Order[] {
  return (orders || []).filter(o => Boolean(o) && !o.isTrashed);
}

/**
 * Computes real best-selling products from active (non-trashed, non-cancelled, non-refunded) orders.
 * - Matches strictly against the live `products` catalog by `productId` so deleted products never linger.
 * - Aggregates multiple variants (e.g., Paperback + Hardcover) and repeated line items for the same product
 *   into a single canonical row so no book appears duplicated.
 */
export function computeTopSellingProducts(
  orders: Order[],
  products: Product[],
  options: {
    range?: TopProductsTimeRange;
    limit?: number;
    now?: number;
    includeDeletedCatalog?: boolean;
  } = {}
): TopSellingProductRow[] {
  const {
    range = 'all',
    limit = 5,
    now = Date.now(),
    includeDeletedCatalog = false,
  } = options;

  const catalogById = new Map<string, Product>();
  for (const prod of products || []) {
    if (prod && prod.id && !catalogById.has(prod.id)) {
      catalogById.set(prod.id, prod);
    }
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;

  const isInRange = (ts: number): boolean => {
    if (range === 'all') return true;
    if (range === 'today') return ts >= todayMs;
    if (range === 'yesterday') return ts >= yesterdayMs && ts < todayMs;
    if (range === '7days') return ts >= now - 7 * 24 * 60 * 60 * 1000;
    if (range === '30days') return ts >= now - 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  interface Accumulator {
    productId: string;
    title: string;
    author?: string;
    category: string;
    thumbnail: string;
    currentPrice: number;
    currentStock: number;
    unitsSold: number;
    ordersCount: number;
    revenue: number;
    variants: Set<string>;
    isBook: boolean;
  }

  const aggregated = new Map<string, Accumulator>();

  for (const order of orders || []) {
    if (!order || order.isTrashed) continue;
    if (order.orderStatus === 'cancelled') continue;
    if (order.paymentStatus === 'refunded') continue;

    const createdMs = toNumericTimestamp(order.createdAt, 0);
    if (!isInRange(createdMs)) continue;

    const seenInThisOrder = new Set<string>();

    for (const item of order.items || []) {
      if (!item) continue;
      const prodId = (item.productId || '').trim();
      const catalogProd = prodId ? catalogById.get(prodId) : undefined;

      if (!includeDeletedCatalog && !catalogProd) {
        continue;
      }

      const canonicalId = catalogProd ? catalogProd.id : prodId;
      if (!canonicalId) continue;

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const unitPrice = Math.max(0, Number(item.price) || Number(catalogProd?.price) || 0);
      const lineRevenue = unitPrice * qty;

      const existing = aggregated.get(canonicalId);
      const variantLabel = (item.variantName || '').trim();

      if (existing) {
        existing.unitsSold += qty;
        existing.revenue += lineRevenue;
        if (!seenInThisOrder.has(canonicalId)) {
          existing.ordersCount += 1;
          seenInThisOrder.add(canonicalId);
        }
        if (variantLabel) {
          existing.variants.add(variantLabel);
        }
      } else {
        const variants = new Set<string>();
        if (variantLabel) {
          variants.add(variantLabel);
        }
        const liveThumbnail =
          (catalogProd?.images && catalogProd.images[0]) ||
          (typeof item.image === 'string' ? item.image : '') ||
          '';

        const catalogStock = catalogProd
          ? Math.max(0, Number(catalogProd.stock) || 0)
          : Math.max(0, Number(item.stock) || 0);

        aggregated.set(canonicalId, {
          productId: canonicalId,
          title: catalogProd?.title || item.title || 'Untitled Product',
          author: catalogProd?.author || catalogProd?.brand,
          category: catalogProd?.category || (item.type === 'stationery' ? 'Stationery' : 'Book'),
          thumbnail: liveThumbnail,
          currentPrice: Number(catalogProd?.price ?? unitPrice) || 0,
          currentStock: catalogStock,
          unitsSold: qty,
          ordersCount: 1,
          revenue: lineRevenue,
          variants,
          isBook: (catalogProd?.type || item.type) !== 'stationery',
        });
        seenInThisOrder.add(canonicalId);
      }
    }
  }

  return Array.from(aggregated.values())
    .map(entry => ({
      productId: entry.productId,
      title: entry.title,
      author: entry.author,
      category: entry.category,
      thumbnail: entry.thumbnail,
      currentPrice: entry.currentPrice,
      currentStock: entry.currentStock,
      unitsSold: entry.unitsSold,
      ordersCount: entry.ordersCount,
      revenue: entry.revenue,
      variantsSummary: Array.from(entry.variants).join(', '),
      isBook: entry.isBook,
    }))
    .sort((a, b) => {
      if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      if (b.ordersCount !== a.ordersCount) return b.ordersCount - a.ordersCount;
      return a.title.localeCompare(b.title);
    })
    .slice(0, Math.max(1, limit));
}


