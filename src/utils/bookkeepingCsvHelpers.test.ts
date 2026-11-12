import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrderSummaryCsv,
  buildSalesReportCsv,
  buildProductSalesReportCsv,
  filterOrdersByBookkeepingRange,
} from './bookkeepingCsvHelpers';
import { Order, Product } from '../types';

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'MRB-1001',
    userId: 'u1',
    customerName: 'Arif Rahman',
    phone: '01711111111',
    email: 'arif@example.com',
    district: 'Dhaka',
    city: 'Dhaka',
    address: 'Dhanmondi 27',
    items: [
      {
        productId: 'p1',
        variantId: 'v1',
        title: 'Paradoxical Sajid 2',
        variantName: 'Hardcover',
        price: 350,
        image: '',
        quantity: 2,
        stock: 50,
        type: 'book',
      },
    ],
    subtotal: 700,
    deliveryCharge: 60,
    discount: 50,
    total: 710,
    paymentMethodId: 'cod',
    paymentMethodName: 'Cash on Delivery',
    paymentStatus: 'approved',
    orderStatus: 'delivered',
    createdAt: Date.parse('2026-11-12T10:00:00Z'),
    updatedAt: Date.parse('2026-11-12T12:00:00Z'),
  },
  {
    id: 'MRB-1002',
    userId: 'u2',
    customerName: 'Nusrat Jahan',
    phone: '01822222222',
    email: 'nusrat@example.com',
    district: 'Chattogram',
    city: 'Chattogram',
    address: 'Agrabad',
    items: [
      {
        productId: 'p2',
        variantId: 'v1',
        title: 'Himu Omnibus',
        variantName: 'Paperback',
        price: 650,
        image: '',
        quantity: 1,
        stock: 30,
        type: 'book',
      },
    ],
    subtotal: 650,
    deliveryCharge: 120,
    discount: 0,
    total: 770,
    paymentMethodId: 'bkash',
    paymentMethodName: 'bKash',
    paymentStatus: 'pending_verification',
    orderStatus: 'pending',
    createdAt: Date.parse('2026-11-11T09:30:00Z'),
    updatedAt: Date.parse('2026-11-11T09:30:00Z'),
  },
  {
    id: 'MRB-1003',
    userId: 'u3',
    customerName: 'Cancelled User',
    phone: '01933333333',
    email: '',
    district: 'Dhaka',
    city: 'Dhaka',
    address: 'Mirpur',
    items: [
      {
        productId: 'p1',
        variantId: 'v1',
        title: 'Paradoxical Sajid 2',
        variantName: 'Hardcover',
        price: 350,
        image: '',
        quantity: 1,
        stock: 50,
        type: 'book',
      },
    ],
    subtotal: 350,
    deliveryCharge: 60,
    discount: 0,
    total: 410,
    paymentMethodId: 'cod',
    paymentMethodName: 'Cash on Delivery',
    paymentStatus: 'unpaid',
    orderStatus: 'cancelled',
    createdAt: Date.parse('2026-11-10T08:00:00Z'),
    updatedAt: Date.parse('2026-11-10T09:00:00Z'),
  },
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    type: 'book',
    title: 'Paradoxical Sajid 2',
    slug: 'paradoxical-sajid-2',
    description: '',
    category: 'Islamic Books',
    author: 'Arif Azad',
    images: [],
    price: 350,
    stock: 50,
    sku: 'BK-101',
    variants: [],
    rating: 5,
    reviewCount: 10,
    createdAt: 1000,
  },
  {
    id: 'p2',
    type: 'book',
    title: 'Himu Omnibus',
    slug: 'himu-omnibus',
    description: '',
    category: 'Fiction',
    author: 'Humayun Ahmed',
    images: [],
    price: 650,
    stock: 30,
    sku: 'BK-102',
    variants: [],
    rating: 5,
    reviewCount: 5,
    createdAt: 1000,
  },
];

test('buildOrderSummaryCsv generates valid UTF-8 BOM CSV and excludes cancelled orders from revenue totals', () => {
  const res = buildOrderSummaryCsv(SAMPLE_ORDERS, [], '2026-11-12');
  assert.equal(res.rowCount, 3);
  assert.equal(res.totalSubtotal, 1350);
  assert.equal(res.totalDelivery, 180);
  assert.equal(res.totalDiscount, 50);
  assert.equal(res.totalRevenue, 1480);
  assert.equal(res.filename, 'mr-books-order-summary-2026-11-12.csv');
  assert.ok(res.csv.startsWith('\uFEFF'));
  assert.ok(res.csv.includes('"MRB-1001"'));
  assert.ok(res.csv.includes('"2x Paradoxical Sajid 2 (Hardcover)"'));
  assert.ok(res.csv.includes('"TOTAL"'));
});

test('buildSalesReportCsv aggregates daily revenue, COD vs Digital MFS split, and grand totals accurately', () => {
  const res = buildSalesReportCsv(SAMPLE_ORDERS, '2026-11-12');
  assert.equal(res.dayCount, 3);
  assert.equal(res.totalOrders, 3);
  assert.equal(res.netRevenue, 1480);
  assert.ok(res.csv.includes('"GRAND TOTAL"'));
  assert.ok(res.csv.includes('"710"'));
  assert.ok(res.csv.includes('"770"'));
});

test('buildProductSalesReportCsv aggregates product unit sales and gross revenue accurately', () => {
  const res = buildProductSalesReportCsv(SAMPLE_ORDERS, SAMPLE_PRODUCTS, '2026-11-12');
  assert.equal(res.productCount, 2);
  assert.equal(res.totalUnitsSold, 3);
  assert.equal(res.totalRevenue, 1350);
  assert.ok(res.csv.includes('"BK-101"'));
  assert.ok(res.csv.includes('"Paradoxical Sajid 2"'));
});

test('filterOrdersByBookkeepingRange filters by status and date range properly', () => {
  const nowMs = Date.parse('2026-11-12T15:00:00Z');
  const deliveredOnly = filterOrdersByBookkeepingRange(SAMPLE_ORDERS, 'all', 'delivered', nowMs);
  assert.equal(deliveredOnly.length, 1);
  assert.equal(deliveredOnly[0].id, 'MRB-1001');
});
