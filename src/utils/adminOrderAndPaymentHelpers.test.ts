import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLiveChatSession,
  computeCustomerPhoneOrderStats,
  getOrderRepeatRankLabel,
  filterAdminOrders,
  computePaymentDashboardMetrics,
  filterPaymentRecords,
  resolveSiteSettings,
  computePaymentChannelDistribution,
  buildCustomerOrderHistorySummary,
} from './adminOrderAndPaymentHelpers';
import type { Order, PaymentSubmission, PaymentMethodConfig } from '../types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: overrides.id || 'MRB-1001',
    userId: 'u1',
    customerName: 'Mahir Chowdhury',
    phone: '01538005764',
    email: 'mahir@example.com',
    district: 'Dhaka',
    city: 'Dhanmondi',
    address: 'House 12, Road 4',
    items: [
      {
        productId: 'p1',
        variantId: 'v1',
        title: 'Himu Somogro',
        variantName: 'Hardcover',
        price: 590,
        image: '',
        quantity: 1,
        stock: 10,
        type: 'book',
      },
    ],
    subtotal: 590,
    deliveryCharge: 60,
    discount: 0,
    total: 650,
    paymentMethodId: 'cod',
    paymentMethodName: 'Cash on Delivery',
    paymentStatus: 'unpaid',
    orderStatus: 'pending',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  };
}

function makeSubmission(overrides: Partial<PaymentSubmission> = {}): PaymentSubmission {
  return {
    id: overrides.id || 'SUB-1001',
    orderId: overrides.orderId || 'MRB-1001',
    userId: 'u1',
    customerName: 'Ayesha',
    customerPhone: '01711223344',
    providerId: 'bkash',
    providerName: 'bKash',
    transactionReference: 'TRX998877',
    senderIdentifier: '01711223344',
    claimedAmount: 750,
    status: 'pending_verification',
    submittedAt: 1_700_000_000_000,
    ...overrides,
  };
}

test('normalizeLiveChatSession safely handles missing messages, Firestore Timestamp objects, and blank customerName', () => {
  const firestoreTs = { seconds: 1730000000, nanoseconds: 0 };
  const methodTs = { toMillis: () => 1730001234000 };

  const normalized = normalizeLiveChatSession(
    {
      customerName: '   ',
      messages: 'corrupt-non-array',
      createdAt: firestoreTs,
      lastMessageAt: methodTs,
      unreadByAdmin: 'invalid',
      status: 'unknown',
    },
    'chat-broken-1'
  );

  assert.equal(normalized.id, 'chat-broken-1');
  assert.equal(normalized.customerName, 'Guest Customer');
  assert.deepEqual(normalized.messages, []);
  assert.equal(normalized.createdAt, 1730000000000);
  assert.equal(normalized.lastMessageAt, 1730001234000);
  assert.equal(normalized.unreadByAdmin, 0);
  assert.equal(normalized.status, 'open');
});

test('normalizeLiveChatSession preserves valid messages and converts nested Timestamp', () => {
  const normalized = normalizeLiveChatSession(
    {
      id: 'chat-2',
      customerName: 'Fazla Rabby',
      messages: [
        {
          id: 'm1',
          sender: 'customer',
          senderName: 'Fazla Rabby',
          text: 'Hello',
          createdAt: { seconds: 1730000100, nanoseconds: 0 },
        },
        null,
      ],
    },
    'chat-2'
  );

  assert.equal(normalized.messages.length, 1);
  assert.equal(normalized.messages[0].text, 'Hello');
  assert.equal(normalized.messages[0].createdAt, 1730000100000);
});

test('computeCustomerPhoneOrderStats and getOrderRepeatRankLabel identify repeat orders and fraud cancellations', () => {
  const orders: Order[] = [
    makeOrder({ id: 'MRB-1', phone: '+8801717717771', orderStatus: 'cancelled', createdAt: 1000 }),
    makeOrder({ id: 'MRB-2', phone: '01717717771', orderStatus: 'delivered', createdAt: 2000 }),
    makeOrder({ id: 'MRB-3', phone: '01538005764', orderStatus: 'delivered', createdAt: 3000 }),
    makeOrder({ id: 'MRB-4', phone: '01717717771', orderStatus: 'cancelled', isTrashed: true, createdAt: 4000 }),
  ];

  const stats = computeCustomerPhoneOrderStats(orders);
  const repeatRank = getOrderRepeatRankLabel(orders[1], stats);
  const firstRank = getOrderRepeatRankLabel(orders[2], stats);

  assert.equal(repeatRank.label, '2nd Order (Repeat)');
  assert.equal(repeatRank.isRepeat, true);
  assert.equal(repeatRank.cancelledCount, 1);
  assert.equal(repeatRank.totalOrders, 2);

  assert.equal(firstRank.label, '1st Order');
  assert.equal(firstRank.isRepeat, false);
  assert.equal(firstRank.cancelledCount, 0);
});

test('filterAdminOrders separates Trash Bin, filters by channel, zone, status, and linked TrxID', () => {
  const now = 1_700_010_000_000;
  const orders: Order[] = [
    makeOrder({
      id: 'MRB-A',
      paymentMethodId: 'bkash',
      paymentMethodName: 'bKash',
      paymentStatus: 'pending_verification',
      orderStatus: 'awaiting_payment_verification',
      district: 'Dhaka',
      createdAt: now - 1000,
    }),
    makeOrder({
      id: 'MRB-B',
      paymentMethodId: 'cod',
      paymentMethodName: 'Cash on Delivery',
      paymentStatus: 'approved',
      orderStatus: 'delivered',
      district: 'Chattogram',
      createdAt: now - 2000,
    }),
    makeOrder({
      id: 'MRB-TRASH',
      isTrashed: true,
      orderStatus: 'cancelled',
      createdAt: now - 500,
    }),
  ];
  const subs = [makeSubmission({ orderId: 'MRB-A', transactionReference: 'BKASH887766' })];

  // Active all excludes trashed
  assert.deepEqual(
    filterAdminOrders(orders, subs, { statusTab: 'all', now }).map(o => o.id),
    ['MRB-A', 'MRB-B']
  );

  // Trash Bin returns only trashed
  assert.deepEqual(
    filterAdminOrders(orders, subs, { statusTab: 'trash', now }).map(o => o.id),
    ['MRB-TRASH']
  );

  // Search by linked TrxID finds MRB-A
  assert.deepEqual(
    filterAdminOrders(orders, subs, { searchQuery: 'BKASH887766', now }).map(o => o.id),
    ['MRB-A']
  );

  // Zone + channel filtering
  assert.deepEqual(
    filterAdminOrders(orders, subs, { zoneFilter: 'outside_dhaka', channelFilter: 'cod', now }).map(o => o.id),
    ['MRB-B']
  );
});

test('computePaymentDashboardMetrics & filterPaymentRecords calculate KPIs and gateway filters accurately', () => {
  const now = new Date('2026-11-12T12:00:00Z').getTime();
  const subs: PaymentSubmission[] = [
    makeSubmission({
      id: 'S1',
      orderId: 'MRB-1',
      providerName: 'bKash',
      claimedAmount: 1000,
      status: 'approved',
      submittedAt: now - 1000,
      reviewedAt: now - 500,
    }),
    makeSubmission({
      id: 'S2',
      orderId: 'MRB-2',
      providerName: 'Nagad',
      claimedAmount: 500,
      status: 'approved',
      submittedAt: now - 10 * 24 * 60 * 60 * 1000,
      reviewedAt: now - 10 * 24 * 60 * 60 * 1000,
    }),
    makeSubmission({
      id: 'S3',
      orderId: 'MRB-3',
      providerName: 'Rocket',
      claimedAmount: 400,
      status: 'pending_verification',
      submittedAt: now - 2000,
    }),
    makeSubmission({
      id: 'S4',
      orderId: 'MRB-4',
      providerName: 'Upay',
      claimedAmount: 300,
      status: 'rejected',
      rejectionReason: 'Invalid TrxID',
      submittedAt: now - 3000,
    }),
  ];

  const orders: Order[] = [
    makeOrder({ id: 'MRB-COD', paymentMethodId: 'cod', paymentMethodName: 'Cash on Delivery', total: 800 }),
  ];

  const metrics = computePaymentDashboardMetrics(subs, orders, now);
  assert.equal(metrics.totalCollected, 1500);
  assert.equal(metrics.todayCollected, 1000);
  assert.equal(metrics.completedCount, 2);
  assert.equal(metrics.pendingCount, 1);
  assert.equal(metrics.pendingAmount, 400);
  assert.equal(metrics.failedCount, 1);
  assert.equal(metrics.flaggedCount, 1);
  assert.equal(metrics.bkashTotal, 1000);
  assert.equal(metrics.nagadTotal, 500);
  assert.equal(metrics.gatewayCounts.cod, 1);

  assert.equal(filterPaymentRecords(subs, orders, { gatewayTab: 'bkash' }).length, 1);
  assert.equal(filterPaymentRecords(subs, orders, { gatewayTab: 'cod' }).length, 1);
  assert.equal(filterPaymentRecords(subs, orders, { statusTab: 'flagged' }).length, 1);
});

test('resolveSiteSettings resolves defaults and overrides properly', () => {
  assert.deepEqual(resolveSiteSettings(undefined, undefined), {
    reviewDisplay: true,
    authorInfo: true,
    deliveryTimingDisplay: true,
    updatedAt: undefined,
  });

  assert.deepEqual(
    resolveSiteSettings({ reviewDisplay: false, deliveryTimingDisplay: false }, { showAuthors: false }),
    {
      reviewDisplay: false,
      authorInfo: false,
      deliveryTimingDisplay: false,
      updatedAt: undefined,
    }
  );
});

test('computePaymentChannelDistribution accurately attributes Bengali bKash orders and filters out inactive methods', () => {
  const methods: PaymentMethodConfig[] = [
    {
      id: 'cod',
      name: 'ক্যাশ অন ডেলিভারি',
      englishName: 'Cash on Delivery',
      type: 'cod',
      accountName: 'COD',
      accountNumber: 'N/A',
      instructions: '',
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 'bkash-personal',
      name: 'বিকাশ',
      englishName: 'bKash',
      type: 'bkash',
      accountName: 'MR. BOOKS',
      accountNumber: '01712345678',
      instructions: '',
      isActive: true,
      displayOrder: 2,
    },
    {
      id: 'nagad-personal',
      name: 'নগদ',
      englishName: 'Nagad',
      type: 'nagad',
      accountName: 'MR. BOOKS',
      accountNumber: '01812345678',
      instructions: '',
      isActive: true,
      displayOrder: 3,
    },
    {
      id: 'rocket-personal',
      name: 'রকেট',
      englishName: 'Rocket',
      type: 'rocket',
      accountName: 'MR. BOOKS',
      accountNumber: '01912345678',
      instructions: '',
      isActive: true,
      displayOrder: 4,
    },
    {
      id: 'upay-personal',
      name: 'উপায়',
      englishName: 'Upay',
      type: 'upay',
      accountName: 'MR. BOOKS',
      accountNumber: '01612345678',
      instructions: '',
      isActive: false, // hidden/off in Admin Panel
      displayOrder: 5,
    },
  ];

  const orders: Order[] = [
    makeOrder({
      id: 'MRB-BKASH-TEST',
      paymentMethodId: 'bkash-personal',
      paymentMethodName: 'বিকাশ (সেন্ড মানি)',
      total: 380,
    }),
  ];

  const dist = computePaymentChannelDistribution(orders, methods, true, []);
  // Upay (isActive: false) must be excluded; COD, bKash, Nagad, Rocket must be shown
  assert.deepEqual(
    dist.channels.map(c => c.label),
    ['Cash on Delivery', 'bKash', 'Nagad', 'Rocket']
  );

  const codRow = dist.channels.find(c => c.type === 'cod')!;
  const bkashRow = dist.channels.find(c => c.type === 'bkash')!;

  assert.equal(codRow.count, 0);
  assert.equal(codRow.revenue, 0);
  assert.equal(bkashRow.count, 1);
  assert.equal(bkashRow.revenue, 380);
  assert.equal(dist.primaryChannel.label, 'bKash');
  assert.equal(dist.primaryChannel.percentage, 100);
});

test('buildCustomerOrderHistorySummary computes total orders, ratios, and excludes trashed orders', () => {
  const orders: Order[] = [
    makeOrder({ id: 'MRB-10', phone: '01609237584', orderStatus: 'delivered', total: 450, createdAt: 1000 }),
    makeOrder({ id: 'MRB-11', phone: '+8801609237584', orderStatus: 'cancelled', total: 300, createdAt: 2000 }),
    makeOrder({ id: 'MRB-12', phone: '01609237584', orderStatus: 'confirmed', total: 700, createdAt: 3000 }),
    makeOrder({ id: 'MRB-TRASH', phone: '01609237584', orderStatus: 'cancelled', isTrashed: true, total: 999, createdAt: 4000 }),
    makeOrder({ id: 'MRB-OTHER', phone: '01799999999', orderStatus: 'delivered', total: 200, createdAt: 5000 }),
  ];

  const summary = buildCustomerOrderHistorySummary('01609237584', orders);
  assert.equal(summary.totalOrders, 3);
  assert.equal(summary.deliveredCount, 1);
  assert.equal(summary.cancelledCount, 1);
  assert.equal(summary.inFlightCount, 1);
  assert.equal(summary.totalSpent, 1150);
  assert.equal(summary.successRatePercent, 50);
  assert.equal(summary.cancellationRatePercent, 50);
  assert.equal(summary.isFirstTimeCustomer, false);
  assert.equal(summary.customerRankLabel, 'Repeat Customer · 3 Orders');
  assert.deepEqual(summary.orders.map(o => o.id), ['MRB-12', 'MRB-11', 'MRB-10']);

  const firstTimeSummary = buildCustomerOrderHistorySummary('01799999999', orders);
  assert.equal(firstTimeSummary.totalOrders, 1);
  assert.equal(firstTimeSummary.isFirstTimeCustomer, true);
  assert.equal(firstTimeSummary.customerRankLabel, '1st Order (New Customer)');
});


