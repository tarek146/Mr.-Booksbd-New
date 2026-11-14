import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCheckoutCompletion } from './checkoutProgressHelpers';

test('computeCheckoutCompletion returns 0% when all fields are empty', () => {
  const res = computeCheckoutCompletion({
    name: '',
    phone: '',
    district: '',
    city: '',
    address: '',
  });
  assert.equal(res.percentage, 0);
  assert.equal(res.completedFields, 0);
  assert.equal(res.isComplete, false);
  assert.equal(res.statusLabel, 'Next: Enter full name');
});

test('computeCheckoutCompletion increases incrementally as fields are completed', () => {
  // Default district selected
  const step0 = computeCheckoutCompletion({
    name: '',
    phone: '',
    district: 'Dhaka',
    city: '',
    address: '',
  });
  assert.equal(step0.percentage, 10);
  assert.equal(step0.statusLabel, 'Next: Enter full name');

  // Name entered
  const step1 = computeCheckoutCompletion({
    name: 'Abdullah Al Mamun',
    phone: '',
    district: 'Dhaka',
    city: '',
    address: '',
  });
  assert.equal(step1.percentage, 30);
  assert.equal(step1.statusLabel, 'Next: Enter mobile number');

  // Valid BD Phone entered
  const step2 = computeCheckoutCompletion({
    name: 'Abdullah Al Mamun',
    phone: '01712345678',
    district: 'Dhaka',
    city: '',
    address: '',
  });
  assert.equal(step2.percentage, 55);
  assert.equal(step2.statusLabel, 'Next: Enter thana or area');

  // City / Area entered
  const step3 = computeCheckoutCompletion({
    name: 'Abdullah Al Mamun',
    phone: '01712345678',
    district: 'Dhaka',
    city: 'Mirpur',
    address: '',
  });
  assert.equal(step3.percentage, 75);
  assert.equal(step3.statusLabel, 'Next: Enter street address');

  // Complete address entered
  const step4 = computeCheckoutCompletion({
    name: 'Abdullah Al Mamun',
    phone: '01712345678',
    district: 'Dhaka',
    city: 'Mirpur',
    address: 'House 12, Road 4, Mirpur 10',
  });
  assert.equal(step4.percentage, 100);
  assert.equal(step4.completedFields, 5);
  assert.equal(step4.isComplete, true);
  assert.equal(step4.statusLabel, 'Ready to confirm order');
});

test('computeCheckoutCompletion rejects too-short phone or address values', () => {
  const res = computeCheckoutCompletion({
    name: 'Ali',
    phone: '01712',
    district: 'Dhaka',
    city: 'Dhanmondi',
    address: '123',
  });
  assert.equal(res.percentage, 50); // Name (20) + District (10) + City (20)
  assert.equal(res.isComplete, false);
});
