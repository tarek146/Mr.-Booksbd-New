import {
  HomeConfig,
  LiveChatMessage,
  LiveChatSession,
  Order,
  PaymentSubmission,
  SiteSettings,
} from '../types';
import { normalizePhoneLast10 } from './chatSoundAndValidation';

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
  if (haystack.includes('bkash')) return 'bkash';
  if (haystack.includes('nagad')) return 'nagad';
  if (haystack.includes('rocket')) return 'rocket';
  if (haystack.includes('upay')) return 'upay';
  if (haystack.includes('bank') || haystack.includes('card') || haystack.includes('qr')) return 'banking';
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
  if (s.includes('bkash')) return 'bkash';
  if (s.includes('nagad')) return 'nagad';
  if (s.includes('rocket')) return 'rocket';
  if (s.includes('upay')) return 'upay';
  if (s.includes('cod') || s.includes('cash')) return 'cod';
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
