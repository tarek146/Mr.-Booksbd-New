import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSteadfastText,
  sanitizeSteadfastInvoice,
  normalizeBdPhone11,
  isValidBdPhone11,
  calculateOrderCodAmount,
  detectCourierDeliveryType,
  buildSteadfastOrderPayload,
  mapSteadfastStatusToOrderStatus,
  evaluateFraudRiskSignal,
  computeCourierDashboardMetrics,
} from './steadfastCourierService';
import type { Order } from '../types';

const baseOrder: Order = {
  id: 'MRB-900101',
  userId: 'u1',
  customerName: 'John {Doe} <Test>; $100',
  phone: '+880 1712-345678',
  email: 'john@example.com',
  district: 'Dhaka',
  city: 'Mirpur',
  address: 'House 12; Road <5>, {Block B}',
  notes: 'Deliver before $5pm',
  items: [
    {
      productId: 'p1',
      variantId: 'v1',
      title: 'Paradoxical Sajid 2',
      variantName: 'Hardcover',
      price: 350,
      quantity: 1,
      image: '',
      stock: 10,
      type: 'book',
    },
  ],
  subtotal: 350,
  discount: 0,
  deliveryCharge: 60,
  total: 410,
  paymentMethodId: 'cod',
  paymentMethodName: 'Cash on Delivery',
  paymentStatus: 'unpaid',
  orderStatus: 'pending',
  createdAt: 1710000000000,
  updatedAt: 1710000000000,
};

test('Steadfast field sanitizers strip forbidden characters { } ; < > $ and normalize phone to 11 digits', () => {
  const cleanName = sanitizeSteadfastText(baseOrder.customerName, 100);
  assert.equal(cleanName.includes('{'), false);
  assert.equal(cleanName.includes('}'), false);
  assert.equal(cleanName.includes(';'), false);
  assert.equal(cleanName.includes('<'), false);
  assert.equal(cleanName.includes('>'), false);
  assert.equal(cleanName.includes('$'), false);

  const phone = normalizeBdPhone11('+880 1712-345678');
  assert.equal(phone, '01712345678');
  assert.equal(isValidBdPhone11(phone), true);

  const inv = sanitizeSteadfastInvoice('#MRB-900101 / Test');
  assert.equal(inv, 'MRB-900101-Test');
});

test('calculateOrderCodAmount returns 0 for paid orders and order.total for unpaid COD orders', () => {
  assert.equal(calculateOrderCodAmount(baseOrder), 410);
  assert.equal(
    calculateOrderCodAmount({ ...baseOrder, paymentStatus: 'approved' }),
    0
  );
  assert.equal(calculateOrderCodAmount(baseOrder, 250), 250);
});

test('detectCourierDeliveryType detects 0 for Home Delivery and 1 for Hub / Point Delivery', () => {
  assert.equal(detectCourierDeliveryType(baseOrder), 0);
  assert.equal(
    detectCourierDeliveryType({
      ...baseOrder,
      notes: 'Standard Hub Delivery / Point Delivery',
    }),
    1
  );
});

test('buildSteadfastOrderPayload constructs valid Steadfast Packzy API v1 payload', () => {
  const payload = buildSteadfastOrderPayload(baseOrder);
  assert.equal(payload.invoice, 'MRB-900101');
  assert.equal(payload.recipient_phone, '01712345678');
  assert.equal(payload.cod_amount, 410);
  assert.equal(payload.delivery_type, 0);
  assert.equal(payload.exchange, false);
});

test('mapSteadfastStatusToOrderStatus distinguishes _approval_pending from final delivered/cancelled', () => {
  const rev = mapSteadfastStatusToOrderStatus('in_review', baseOrder);
  assert.equal(rev.orderStatus, 'shipped');
  assert.equal(rev.paymentStatus, 'unpaid');

  const appPend = mapSteadfastStatusToOrderStatus('delivered_approval_pending', baseOrder);
  assert.equal(appPend.orderStatus, 'out_for_delivery');
  assert.equal(appPend.paymentStatus, 'unpaid');

  const finalDel = mapSteadfastStatusToOrderStatus('delivered', baseOrder);
  assert.equal(finalDel.orderStatus, 'delivered');
  assert.equal(finalDel.paymentStatus, 'approved');

  const finalCan = mapSteadfastStatusToOrderStatus('cancelled', baseOrder);
  assert.equal(finalCan.orderStatus, 'cancelled');
});

test('evaluateFraudRiskSignal treats null ratios as new customer and flags high cancellation ratio', () => {
  const newCust = evaluateFraudRiskSignal(null, null, 0);
  assert.equal(newCust.riskSignal, 'unknown_new');

  const safeCust = evaluateFraudRiskSignal(92, 8, 0);
  assert.equal(safeCust.riskSignal, 'trusted');

  const highRisk = evaluateFraudRiskSignal(40, 60, 2);
  assert.equal(highRisk.riskSignal, 'high_risk');
});

test('computeCourierDashboardMetrics aggregates Total Sent, Delivered, Cancelled, Pending, and COD amounts', () => {
  const orders: Order[] = [
    baseOrder, // unsent
    {
      ...baseOrder,
      id: 'MRB-2',
      courierName: 'Steadfast Courier',
      trackingCode: 'SF200',
      courierDeliveryStatus: 'delivered',
      courierCodAmount: 410,
      orderStatus: 'delivered',
    },
    {
      ...baseOrder,
      id: 'MRB-3',
      courierName: 'Steadfast Courier',
      trackingCode: 'SF300',
      courierDeliveryStatus: 'in_review',
      courierCodAmount: 550,
      orderStatus: 'shipped',
    },
    {
      ...baseOrder,
      id: 'MRB-4',
      courierName: 'Pathao Courier',
      trackingCode: 'PT400',
      courierDeliveryStatus: 'cancelled',
      courierCodAmount: 300,
      orderStatus: 'cancelled',
    },
  ];

  const metrics = computeCourierDashboardMetrics(orders);
  assert.equal(metrics.totalSent, 3);
  assert.equal(metrics.unsentReadyCount, 1);
  assert.equal(metrics.deliveredCount, 1);
  assert.equal(metrics.cancelledCount, 1);
  assert.equal(metrics.inReviewCount, 1);
  assert.equal(metrics.deliveredCod, 410);
  assert.equal(metrics.inReviewCod, 550);
  const sf = metrics.byCourier.find(c => c.courierName === 'Steadfast Courier');
  assert.equal(sf?.total, 2);
});
