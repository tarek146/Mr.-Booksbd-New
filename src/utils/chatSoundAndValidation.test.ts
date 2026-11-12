import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePreChatForm,
  mergeLiveChatMessages,
  detectNewIncomingMessages,
  detectAdminNewCustomerActivity,
} from './chatSoundAndValidation';
import { LiveChatMessage, LiveChatSession } from '../types';

test('validatePreChatForm requires Name, Phone, Email, and Message Note', () => {
  const invalid = validatePreChatForm({
    customerName: 'A',
    customerPhone: '123',
    customerEmail: 'bad-email',
    firstMessage: '   ',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.message);

  const valid = validatePreChatForm({
    customerName: '  Fazla Rabbi  ',
    customerPhone: '01712345678',
    customerEmail: 'fazla@example.com',
    firstMessage: 'অর্ডার স্ট্যাটাস জানতে চাই',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.cleaned.customerName, 'Fazla Rabbi');
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

  // Same snapshot -> no alert
  assert.equal(detectAdminNewCustomerActivity([baseSession], [baseSession]).hasNewCustomerMessage, false);

  // Admin replies -> no customer ringtone trigger
  const afterAdminReply: LiveChatSession = {
    ...baseSession,
    messages: [
      ...baseSession.messages,
      { id: 'm2', sender: 'admin', senderName: 'Admin', text: 'Hello sir', createdAt: 1500 },
    ],
  };
  assert.equal(detectAdminNewCustomerActivity([baseSession], [afterAdminReply]).hasNewCustomerMessage, false);

  // New customer message -> triggers alert
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

  // Brand new unread chat session -> triggers alert
  const brandNew: LiveChatSession = {
    ...baseSession,
    id: 'chat-2',
    unreadByAdmin: 1,
  };
  assert.equal(detectAdminNewCustomerActivity([baseSession], [brandNew, baseSession]).hasNewCustomerMessage, true);
});
