import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sha256Hash,
  normalizePhoneForMeta,
  splitCustomerName,
  generateDeterministicEventId,
  buildHashedUserData,
  buildFacebookCapiPayload,
  buildProductCustomData,
  buildCartCustomData,
  buildOrderPurchaseCustomData,
  calculateCapiHealthMetrics,
} from './facebookCapiHelpers';
import { Product } from '../types';

test('normalizePhoneForMeta converts Bangladesh phone numbers to Meta E.164 digits without plus', () => {
  assert.equal(normalizePhoneForMeta('01712-345678'), '8801712345678');
  assert.equal(normalizePhoneForMeta('+880 1811 223344'), '8801811223344');
  assert.equal(normalizePhoneForMeta('1911223344'), '8801911223344');
  assert.equal(normalizePhoneForMeta(''), '');
});

test('sha256Hash produces standard lowercase 64-character hex digest', async () => {
  const hash = await sha256Hash('test@example.com');
  assert.equal(hash.length, 64);
  assert.equal(hash, '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b');
});

test('splitCustomerName separates first and last name cleanly in lowercase', () => {
  assert.deepEqual(splitCustomerName('Tanvir Ahmed Khan'), {
    firstName: 'tanvir',
    lastName: 'ahmed khan',
  });
  assert.deepEqual(splitCustomerName('Arif'), {
    firstName: 'arif',
    lastName: 'arif',
  });
});

test('buildHashedUserData includes hashed em, ph, fn, ln, ct, st, zp, country, external_id and unhashed fbp, fbc, ip, ua', async () => {
  const { userData, matchedKeys } = await buildHashedUserData({
    email: 'reader@mrbooks.bd',
    phone: '01712345678',
    fullName: 'Tanvir Ahmed',
    city: 'Dhaka',
    state: 'Dhaka',
    zipCode: '1207',
    country: 'bd',
    externalId: 'vis-12345',
    fbp: 'fb.1.1700000000000.1234567890',
    fbc: 'fb.1.1700000000000.IwAR123456',
    clientIpAddress: '103.112.204.10',
    clientUserAgent: 'Mozilla/5.0 TestAgent',
  });

  assert.ok(userData.em?.[0]?.length === 64);
  assert.ok(userData.ph?.[0]?.length === 64);
  assert.ok(userData.fn?.[0]?.length === 64);
  assert.ok(userData.ln?.[0]?.length === 64);
  assert.ok(userData.ct?.[0]?.length === 64);
  assert.ok(userData.st?.[0]?.length === 64);
  assert.ok(userData.zp?.[0]?.length === 64);
  assert.ok(userData.country?.[0]?.length === 64);
  assert.ok(userData.external_id?.[0]?.length === 64);
  assert.equal(userData.fbp, 'fb.1.1700000000000.1234567890');
  assert.equal(userData.fbc, 'fb.1.1700000000000.IwAR123456');
  assert.equal(userData.client_ip_address, '103.112.204.10');
  assert.equal(userData.client_user_agent, 'Mozilla/5.0 TestAgent');
  assert.ok(matchedKeys.length >= 12);
});

test('buildFacebookCapiPayload builds compliant ViewContent, InitiateCheckout, and Purchase payloads with >9.0/10 EMQ', async () => {
  const sampleBook: Product = {
    id: 'prod-book-1',
    type: 'book',
    title: 'Paradoxical Sajid 2',
    slug: 'paradoxical-sajid-2',
    description: 'Bestselling Islamic book',
    category: 'Islamic Books',
    author: 'Arif Azad',
    publisher: 'Guardian Publications',
    images: ['https://example.com/book.jpg'],
    price: 350,
    stock: 25,
    sku: 'BK-PS2',
    variants: [{ id: 'v1', name: 'Hardcover', price: 350, stock: 25, sku: 'BK-PS2-HC' }],
    rating: 5,
    reviewCount: 10,
    createdAt: 1700000000000,
  };

  // 1. Single Product Page ViewContent
  const viewCustomData = buildProductCustomData(sampleBook, 1, 'v1');
  const viewResult = await buildFacebookCapiPayload({
    eventName: 'ViewContent',
    customData: viewCustomData,
    eventSourceUrl: 'https://mrbooks.bd/product/paradoxical-sajid-2',
    testEventCode: 'TEST9988',
  });

  assert.equal(viewResult.payload.data[0].event_name, 'ViewContent');
  assert.equal(viewResult.payload.data[0].action_source, 'website');
  assert.equal(viewResult.payload.data[0].custom_data?.value, 350);
  assert.equal(viewResult.payload.data[0].custom_data?.currency, 'BDT');
  assert.deepEqual(viewResult.payload.data[0].custom_data?.content_ids, ['prod-book-1']);
  assert.equal(viewResult.payload.test_event_code, 'TEST9988');
  assert.ok(viewResult.emqScore > 9.0, `Expected ViewContent EMQ > 9.0, got ${viewResult.emqScore}`);

  // 2. Checkout Page InitiateCheckout
  const cartCustomData = buildCartCustomData([
    {
      productId: sampleBook.id,
      variantId: 'v1',
      title: sampleBook.title,
      variantName: 'Hardcover',
      price: 350,
      image: sampleBook.images[0],
      quantity: 2,
      stock: 25,
      type: 'book',
    },
  ], { shipping: 60 });
  const checkoutResult = await buildFacebookCapiPayload({
    eventName: 'InitiateCheckout',
    customData: cartCustomData,
    customerProfile: {
      fullName: 'Nusrat Jahan',
      phone: '01812345678',
      city: 'Dhaka',
      state: 'Dhaka',
    },
  });
  assert.equal(checkoutResult.payload.data[0].event_name, 'InitiateCheckout');
  assert.equal(checkoutResult.payload.data[0].custom_data?.value, 760);
  assert.equal(checkoutResult.payload.data[0].custom_data?.num_items, 2);
  assert.ok(checkoutResult.emqScore > 9.0, `Expected InitiateCheckout EMQ > 9.0, got ${checkoutResult.emqScore}`);

  // 3. Purchase Event
  const purchaseCustomData = buildOrderPurchaseCustomData({
    id: 'ORD-778899',
    items: [
      {
        productId: sampleBook.id,
        variantId: 'v1',
        title: sampleBook.title,
        variantName: 'Hardcover',
        price: 350,
        image: sampleBook.images[0],
        quantity: 2,
        stock: 25,
        type: 'book',
      },
    ],
    totalAmount: 760,
    deliveryFee: 60,
    paymentMethodName: 'bKash',
  });
  const purchaseResult = await buildFacebookCapiPayload({
    eventName: 'Purchase',
    customData: purchaseCustomData,
    customerProfile: {
      fullName: 'Nusrat Jahan',
      phone: '01812345678',
      email: 'nusrat@example.com',
      city: 'Dhaka',
      state: 'Dhaka',
    },
  });
  assert.equal(purchaseResult.payload.data[0].event_name, 'Purchase');
  assert.equal(purchaseResult.payload.data[0].custom_data?.order_id, 'ORD-778899');
  assert.ok(purchaseResult.emqScore >= 9.9);
});

test('calculateCapiHealthMetrics reports > 9.0 / 10 scores for Single Product Page, Checkout Page, Purchase, and Data Transfer Ratio', () => {
  const metrics = calculateCapiHealthMetrics({
    facebookPixelId: '123456789012345',
    facebookCapiToken: 'EAABsbCS1iHgBO1234567890abcdef',
    facebookCapiEnabled: true,
  });

  assert.equal(metrics.isPixelConfigured, true);
  assert.equal(metrics.isCapiTokenConfigured, true);
  assert.equal(metrics.isDualChannelActive, true);
  assert.ok(metrics.singleProductPageScore > 9.0);
  assert.ok(metrics.checkoutPageScore > 9.0);
  assert.ok(metrics.purchasePageScore > 9.0);
  assert.ok(metrics.overallEmqScore > 9.0);
  assert.ok(metrics.dataTransferRatio > 9.0);

  const eventId1 = generateDeterministicEventId('Purchase', 'ORD-100', 1700000000000);
  const eventId2 = generateDeterministicEventId('Purchase', 'ORD-100', 1700000000000);
  assert.equal(eventId1, eventId2);
});
