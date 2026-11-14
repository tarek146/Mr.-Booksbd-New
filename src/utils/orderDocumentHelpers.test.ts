import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeCode128B,
  buildQrMatrix,
  parseProductWeightKg,
  resolveOrderWeightKg,
  computeOrderDocumentFinancials,
  calculateEditedOrderFinancials,
  resolveOrderDocumentMeta,
  formatOrderAddressLine,
} from './orderDocumentHelpers';
import { Order, Product } from '../types';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    type: 'book',
    title: 'Amar Bondhu Rashed',
    slug: 'amar-bondhu-rashed',
    description: '',
    category: 'Novels',
    images: ['https://example.com/rashed.jpg'],
    price: 220,
    previousPrice: 320,
    stock: 20,
    sku: 'ABR-01',
    variants: [{ id: 'v1', name: 'Paperback', price: 220, previousPrice: 320, stock: 20, sku: 'ABR-PB' }],
    rating: 5,
    reviewCount: 4,
    weightNote: '350g per copy',
    createdAt: 1700000000000,
  },
];

const BASE_ORDER: Order = {
  id: '743736430',
  userId: 'u1',
  customerName: 'ZANEY ALAM',
  phone: '01609237584',
  email: '',
  district: 'Dhaka',
  city: 'Dhaka',
  address: 'Azimpur',
  notes: 'Delivery Method: Standard Home Delivery',
  items: [
    {
      productId: 'p1',
      variantId: 'v1',
      title: 'Amar Bondhu Rashed',
      variantName: 'Paperback',
      price: 220,
      image: '',
      quantity: 1,
      stock: 20,
      type: 'book',
    },
  ],
  subtotal: 220,
  deliveryCharge: 60,
  discount: 0,
  total: 280,
  paymentMethodId: 'cod',
  paymentMethodName: 'Cash on Delivery',
  paymentStatus: 'unpaid',
  orderStatus: 'pending',
  consignmentId: '320473137',
  trackingCode: 'SFR261114ST9C16CB0BD',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

test('encodeCode128B generates non-empty valid bars with start, data, checksum, and stop patterns', () => {
  const res = encodeCode128B('320473137');
  assert.equal(res.encodedText, '320473137');
  assert.ok(res.bars.length > 25);
  // Start + 9 data + 1 checksum + 1 stop = 12 symbols => ~37 bars
  assert.equal(res.bars.length, 11 * 3 + 4);
  assert.ok(res.totalWidth > 120);
});

test('buildQrMatrix builds a square QR matrix with module coordinates', () => {
  const qr = buildQrMatrix('INV:#MRB-743736430|PID:320473137|COD:280');
  assert.ok(qr.size >= 21);
  assert.ok(qr.rects.length > 50);
  for (const r of qr.rects) {
    assert.ok(r.x >= 0 && r.x < qr.size);
    assert.ok(r.y >= 0 && r.y < qr.size);
  }
});

test('parseProductWeightKg and resolveOrderWeightKg compute accurate weights and honor explicit order edits', () => {
  assert.equal(parseProductWeightKg('350g per copy'), 0.35);
  assert.equal(parseProductWeightKg('1.5 kg'), 1.5);
  assert.equal(parseProductWeightKg('N/A'), 0);

  // Derived from catalog weightNote when order.weightKg is absent
  assert.equal(resolveOrderWeightKg(BASE_ORDER, SAMPLE_PRODUCTS), 0.35);
  // Explicit admin weight override takes precedence
  assert.equal(resolveOrderWeightKg({ ...BASE_ORDER, weightKg: 1.25 }, SAMPLE_PRODUCTS), 1.25);
});

test('computeOrderDocumentFinancials resolves product fallback image, regular/offer savings, delivery, COD fee, and approved online payment', () => {
  const fin = computeOrderDocumentFinancials(BASE_ORDER, SAMPLE_PRODUCTS);
  assert.equal(fin.items[0].image, 'https://example.com/rashed.jpg');
  assert.equal(fin.items[0].regularUnitPrice, 320);
  assert.equal(fin.items[0].itemDiscountTotal, 100);
  assert.equal(fin.subtotal, 220);
  assert.equal(fin.deliveryCharge, 60);
  assert.equal(fin.grandTotal, 280);
  assert.equal(fin.amountToCollect, 280);
  assert.equal(fin.isPaidOnline, false);

  // Paid online order must collect 0
  const paidFin = computeOrderDocumentFinancials({ ...BASE_ORDER, paymentStatus: 'approved' }, SAMPLE_PRODUCTS);
  assert.equal(paidFin.isPaidOnline, true);
  assert.equal(paidFin.amountToCollect, 0);
  assert.equal(paidFin.paidAmount, 280);
});

test('calculateEditedOrderFinancials updates subtotal, grandTotal, and courierCodAmount atomically on order edits', () => {
  const edited = calculateEditedOrderFinancials({
    items: [
      { ...BASE_ORDER.items[0], quantity: 2, price: 250 },
    ],
    deliveryCharge: 80,
    discount: 50,
    codCharge: 10,
    paymentStatus: 'unpaid',
  });
  assert.equal(edited.subtotal, 500);
  assert.equal(edited.total, 540);
  assert.equal(edited.courierCodAmount, 540);

  const paidEdited = calculateEditedOrderFinancials({
    items: [{ ...BASE_ORDER.items[0], quantity: 2, price: 250 }],
    deliveryCharge: 80,
    discount: 50,
    codCharge: 0,
    paymentStatus: 'approved',
  });
  assert.equal(paidEdited.total, 530);
  assert.equal(paidEdited.courierCodAmount, 0);
});

test('resolveOrderDocumentMeta formats Merchant ID, Invoice No, Parcel ID, and Tracking consistently', () => {
  const meta = resolveOrderDocumentMeta(BASE_ORDER, SAMPLE_PRODUCTS, {
    storeName: 'MR. BOOKS BD',
    merchantId: 'KUSXCIG',
    phone: '01410904888',
    address: 'Nilkhet, Dhaka',
  });
  assert.equal(meta.storeName, 'MR. BOOKS BD');
  assert.equal(meta.merchantId, 'KUSXCIG');
  assert.equal(meta.invoiceCode, 'MRB-743736430');
  assert.equal(meta.invoiceNoDisplay, '#MRB-743736430');
  assert.equal(meta.parcelIdDisplay, '320473137');
  assert.equal(meta.trackingDisplay, 'SFR261114ST9C16CB0BD');
});

test('formatOrderAddressLine deduplicates repeated city/district tokens gracefully', () => {
  assert.equal(
    formatOrderAddressLine({ address: 'Azimpur, Dhaka', city: 'Dhaka', district: 'Dhaka' }),
    'Azimpur, Dhaka'
  );
  assert.equal(
    formatOrderAddressLine({ address: 'House 12, Road 3', city: 'Uttara', district: 'Dhaka' }),
    'House 12, Road 3, Uttara, Dhaka'
  );
});

