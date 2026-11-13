import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePreChatForm,
  resolveLiveChatAutoHideMs,
  mergeLiveChatMessages,
  detectNewIncomingMessages,
  detectAdminNewCustomerActivity,
  normalizePhoneLast10,
  matchCustomerOrders,
  getLatestChatMessageText,
  filterAndOrganizeChatSessions,
} from './chatSoundAndValidation';
import { LiveChatMessage, LiveChatSession, Order } from '../types';

test('validatePreChatForm makes Name & Phone optional and allows instant messaging without Email', () => {
  // Missing message is still rejected
  const emptyMessage = validatePreChatForm({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    firstMessage: '   ',
  });
  assert.equal(emptyMessage.valid, false);
  assert.equal(emptyMessage.errors.name, undefined);
  assert.equal(emptyMessage.errors.phone, undefined);
  assert.equal(emptyMessage.errors.email, undefined);
  assert.ok(emptyMessage.errors.message);

  // Easy instant chat: message only, no name, no phone, no email
  const messageOnly = validatePreChatForm({
    firstMessage: 'অর্ডার স্ট্যাটাস জানতে চাই',
  });
  assert.equal(messageOnly.valid, true);
  assert.deepEqual(messageOnly.errors, {});
  assert.equal(messageOnly.cleaned.customerName, 'Guest Reader');
  assert.equal(messageOnly.cleaned.customerPhone, '');
  assert.equal(messageOnly.cleaned.customerEmail, '');

  // Optional name/phone provided passes cleanly
  const withContact = validatePreChatForm({
    customerName: '  Fazla Rabbi  ',
    customerPhone: '01712345678',
    firstMessage: 'বইটি স্টকে আছে?',
  });
  assert.equal(withContact.valid, true);
  assert.equal(withContact.cleaned.customerName, 'Fazla Rabbi');
  assert.equal(withContact.cleaned.customerPhone, '01712345678');

  // Strict mode (if Admin turns on Require Name & Phone) still works
  const strictFail = validatePreChatForm(
    { customerName: 'A', customerPhone: '123', firstMessage: 'Hi' },
    { requireContactInfo: true }
  );
  assert.equal(strictFail.valid, false);
  assert.ok(strictFail.errors.name);
  assert.ok(strictFail.errors.phone);
});

test('resolveLiveChatAutoHideMs resolves 3-5s defaults and disable state accurately', () => {
  assert.equal(resolveLiveChatAutoHideMs(undefined), 4000);
  assert.equal(resolveLiveChatAutoHideMs(3), 3000);
  assert.equal(resolveLiveChatAutoHideMs(5), 5000);
  assert.equal(resolveLiveChatAutoHideMs(0), 0);
  assert.equal(resolveLiveChatAutoHideMs(1), 2000);
});

test('mergeLiveChatMessages dedupes by id and preserves chronological order across concurrent customer & admin writes', () => {
  const existing: LiveChatMessage[] = [
    { id: 'm1', sender: 'customer', senderName: 'Fazla', text: 'Hello', createdAt: 1000 },
    { id: 'm2', sender: 'admin', senderName: 'Support', text: 'Ki jante chan sir', createdAt: 2000 },
  ];
  const incoming: LiveChatMessage[] = [
    { id: 'm2', sender: 'admin', senderName: 'Support', text: 'Ki jante chan sir', createdAt: 2000 },
    { id: 'm3', sender: 'customer', senderName: 'Fazla', text: 'Order #123', createdAt: 3000 },
  ];

  const merged = mergeLiveChatMessages(existing, incoming);
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map(m => m.id),
    ['m1', 'm2', 'm3']
  );
});

test('detectNewIncomingMessages only flags new messages from targetSender', () => {
  const prev: LiveChatMessage[] = [
    { id: 'm1', sender: 'customer', senderName: 'Fazla', text: 'Hi', createdAt: 1000 },
  ];
  const next: LiveChatMessage[] = [
    ...prev,
    { id: 'm2', sender: 'admin', senderName: 'Admin', text: 'Ki jante chan sir', createdAt: 2000 },
  ];

  const adminArrivals = detectNewIncomingMessages(prev, next, 'admin');
  assert.equal(adminArrivals.length, 1);
  assert.equal(adminArrivals[0].text, 'Ki jante chan sir');

  const customerArrivals = detectNewIncomingMessages(prev, next, 'customer');
  assert.equal(customerArrivals.length, 0);
});

test('detectAdminNewCustomerActivity triggers ringtone only on new incoming customer messages or new unread sessions', () => {
  const baseSession: LiveChatSession = {
    id: 'chat-1',
    visitorId: 'v1',
    customerName: 'Fazla',
    customerPhone: '01711111111',
    customerEmail: 'fazla@example.com',
    status: 'open',
    unreadByAdmin: 0,
    unreadByCustomer: 0,
    lastMessageText: 'Hi',
    lastMessageAt: 1000,
    createdAt: 1000,
    messages: [{ id: 'm1', sender: 'customer', senderName: 'Fazla', text: 'Hi', createdAt: 1000 }],
  };

  assert.equal(detectAdminNewCustomerActivity([baseSession], [baseSession]).hasNewCustomerMessage, false);

  const afterAdminReply: LiveChatSession = {
    ...baseSession,
    messages: [
      ...baseSession.messages,
      { id: 'm2', sender: 'admin', senderName: 'Admin', text: 'Hello sir', createdAt: 1500 },
    ],
  };
  assert.equal(detectAdminNewCustomerActivity([baseSession], [afterAdminReply]).hasNewCustomerMessage, false);

  const afterCustomerFollowup: LiveChatSession = {
    ...afterAdminReply,
    unreadByAdmin: 1,
    messages: [
      ...afterAdminReply.messages,
      { id: 'm3', sender: 'customer', senderName: 'Fazla', text: 'Where is my parcel?', createdAt: 2000 },
    ],
  };
  const res = detectAdminNewCustomerActivity([afterAdminReply], [afterCustomerFollowup]);
  assert.equal(res.hasNewCustomerMessage, true);
  assert.equal(res.latestText, 'Where is my parcel?');

  // Empty initial snapshot -> first unread customer chat MUST trigger ringtone
  const brandNew: LiveChatSession = {
    ...baseSession,
    id: 'chat-2',
    unreadByAdmin: 1,
  };
  assert.equal(detectAdminNewCustomerActivity([], [brandNew]).hasNewCustomerMessage, true);
});

test('matchCustomerOrders separates returning buyers from new visitors across BD phone formats', () => {
  assert.equal(normalizePhoneLast10('+880 1609-237584'), '1609237584');
  assert.equal(normalizePhoneLast10('01609237584'), '1609237584');

  const orders = [
    {
      id: 'MRB-101',
      customerName: 'Fazla Rabby',
      phone: '+8801609237584',
      total: 520,
      createdAt: 1000,
    },
    {
      id: 'MRB-102',
      customerName: 'Fazla Rabby',
      phone: '01609237584',
      total: 780,
      createdAt: 3000,
    },
  ] as unknown as Order[];

  const match = matchCustomerOrders(orders, '01609237584');
  assert.equal(match.isReturningBuyer, true);
  assert.equal(match.orderCount, 2);
  assert.equal(match.totalSpent, 1300);
  assert.equal(match.latestOrder?.id, 'MRB-102');

  const noMatch = matchCustomerOrders(orders, '01999999999');
  assert.equal(noMatch.isReturningBuyer, false);
  assert.equal(noMatch.orderCount, 0);
});

test('filterAndOrganizeChatSessions separates customers by status, segment, buyer type, search, and uses actual latest message', () => {
  const orders = [
    { id: 'ORD-1', phone: '01711111111', total: 400, createdAt: 1000 },
    { id: 'ORD-2', phone: '01711111111', total: 600, createdAt: 2000 },
  ] as unknown as Order[];

  const sessions: LiveChatSession[] = [
    {
      id: 'chat-a',
      visitorId: 'va',
      customerName: 'Fazla Rabby',
      customerPhone: '01609237584',
      customerSegment: 'order_issue',
      status: 'open',
      unreadByAdmin: 0,
      unreadByCustomer: 0,
      lastMessageText: 'stale-snippet',
      lastMessageAt: 5000,
      createdAt: 1000,
      messages: [
        { id: '1', sender: 'customer', senderName: 'Fazla Rabby', text: 'jana nai', createdAt: 4000 },
      ],
    },
    {
      id: 'chat-b',
      visitorId: 'vb',
      customerName: 'VIP Buyer',
      customerPhone: '01711111111',
      customerEmail: 'vip@books.bd',
      status: 'resolved',
      unreadByAdmin: 1,
      unreadByCustomer: 0,
      lastMessageText: 'Thanks',
      lastMessageAt: 3000,
      createdAt: 1000,
      messages: [
        { id: '2', sender: 'customer', senderName: 'VIP Buyer', text: 'New order query', createdAt: 3000 },
      ],
    },
  ];

  assert.equal(getLatestChatMessageText(sessions[0]), 'jana nai');

  const all = filterAndOrganizeChatSessions(sessions, orders, {});
  assert.equal(all.length, 2);
  // Unread chat-b floats to top
  assert.equal(all[0].session.id, 'chat-b');
  // Auto-promoted to vip segment because orderCount >= 2 when customerSegment omitted
  assert.equal(all[0].segment, 'vip');
  assert.equal(all[0].orderMatch.orderCount, 2);

  const returningOnly = filterAndOrganizeChatSessions(sessions, orders, { buyerFilter: 'returning' });
  assert.equal(returningOnly.length, 1);
  assert.equal(returningOnly[0].session.id, 'chat-b');

  const orderIssues = filterAndOrganizeChatSessions(sessions, orders, { segmentFilter: 'order_issue' });
  assert.equal(orderIssues.length, 1);
  assert.equal(orderIssues[0].session.id, 'chat-a');

  const searched = filterAndOrganizeChatSessions(sessions, orders, { searchQuery: '016092' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].session.id, 'chat-a');
});

