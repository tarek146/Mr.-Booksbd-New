import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAddressPreview, sanitizeSavedAddress } from './addressHelpers';

test('formatAddressPreview formats name, city and district nicely', () => {
  const preview = formatAddressPreview({
    name: 'Abdullah Al Mamun',
    city: 'Mirpur-10',
    district: 'Dhaka'
  });
  assert.equal(preview, 'Abdullah Al Mamun, Mirpur-10, Dhaka');
});

test('formatAddressPreview handles partial or empty fields', () => {
  assert.equal(formatAddressPreview(null), '');
  assert.equal(formatAddressPreview({ name: 'Tanvir' }), 'Tanvir');
});

test('sanitizeSavedAddress returns null for invalid input', () => {
  assert.equal(sanitizeSavedAddress(null), null);
  assert.equal(sanitizeSavedAddress({}), null);
});

test('sanitizeSavedAddress parses and cleans valid delivery address', () => {
  const result = sanitizeSavedAddress({
    name: '  Kazi Nazrul  ',
    phone: '01712345678',
    optionalPhone: ' 01812345678 ',
    district: 'Chittagong',
    city: 'Pahartali',
    address: 'Road 5, House 12',
    customerNote: 'Call before delivery'
  });

  assert.notEqual(result, null);
  assert.equal(result?.name, 'Kazi Nazrul');
  assert.equal(result?.optionalPhone, '01812345678');
  assert.equal(result?.district, 'Chittagong');
  assert.equal(result?.city, 'Pahartali');
});
