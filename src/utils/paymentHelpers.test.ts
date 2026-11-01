import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sortPaymentMethods,
  getPaymentMethodDisplayMeta,
  validatePaymentTransactionPopup,
  getActiveOnlinePaymentMethods,
} from './reviewHelpers';
import { PaymentMethodConfig } from '../types';

describe('Payment Methods & Bangla QR Helpers', () => {
  const sampleMethods: PaymentMethodConfig[] = [
    {
      id: 'cod-1',
      name: 'Cash on Delivery',
      type: 'cod',
      accountName: 'N/A',
      accountNumber: 'N/A',
      instructions: 'Pay cash',
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 'bkash-1',
      name: 'বিকাশ',
      type: 'bkash',
      accountName: 'MR. BOOKS',
      accountNumber: '01712345678',
      instructions: 'Send money',
      isActive: true,
      displayOrder: 2,
    },
    {
      id: 'nagad-1',
      name: 'নগদ',
      type: 'nagad',
      accountName: 'MR. BOOKS',
      accountNumber: '01812345678',
      instructions: 'Send money',
      isActive: true,
      displayOrder: 3,
    },
    {
      id: 'rocket-1',
      name: 'রকেট',
      type: 'rocket',
      accountName: 'MR. BOOKS',
      accountNumber: '019123456789',
      instructions: 'Send money',
      isActive: true,
      displayOrder: 4,
    },
    {
      id: 'upay-1',
      name: 'উপায়',
      type: 'upay',
      accountName: 'MR. BOOKS',
      accountNumber: '01712345678',
      instructions: 'Send money',
      isActive: true,
      displayOrder: 5,
    },
    {
      id: 'banglaqr-1',
      name: 'বাংলা কিউআর',
      type: 'bangla_qr',
      accountName: 'MR. BOOKS BD',
      accountNumber: '01712345678',
      instructions: 'Scan Bangla QR',
      isActive: true,
      displayOrder: 6,
    },
    {
      id: 'bank-1',
      name: 'ব্যাংক ট্রান্সফার',
      type: 'bank',
      accountName: 'MR. BOOKS LTD',
      accountNumber: '123456789',
      instructions: 'Transfer to account',
      isActive: true,
      displayOrder: 7,
    },
  ];

  it('correctly sorts payment methods by priority: cod, bkash, nagad, rocket, upay, bangla_qr, bank', () => {
    // Pass in reverse order
    const reversed = [...sampleMethods].reverse();
    const sorted = sortPaymentMethods(reversed);
    assert.strictEqual(sorted[0].type, 'cod');
    assert.strictEqual(sorted[1].type, 'bkash');
    assert.strictEqual(sorted[2].type, 'nagad');
    assert.strictEqual(sorted[3].type, 'rocket');
    assert.strictEqual(sorted[4].type, 'upay');
    assert.strictEqual(sorted[5].type, 'bangla_qr');
    assert.strictEqual(sorted[6].type, 'bank');
  });

  it('filters out COD for online popup payment methods', () => {
    const online = getActiveOnlinePaymentMethods(sampleMethods);
    assert.strictEqual(online.some(m => m.type === 'cod'), false);
    assert.strictEqual(online.length, 6);
  });

  it('returns valid display metadata for Bangla QR', () => {
    const banglaQrMethod: PaymentMethodConfig = {
      id: 'bqr',
      name: 'বাংলা কিউআর',
      englishName: 'Bangla QR',
      type: 'bangla_qr',
      accountName: 'MR. BOOKS BD',
      accountNumber: '01712345678',
      instructions: 'Scan to pay',
      isActive: true,
      displayOrder: 6,
    };
    const meta = getPaymentMethodDisplayMeta(banglaQrMethod);
    assert.strictEqual(meta.displayTitle, 'বাংলা কিউআর');
    assert.strictEqual(meta.englishName, 'Bangla QR');
    assert.strictEqual(meta.accountType, 'Merchant');
    assert.strictEqual(meta.requireTrxId, true);
  });

  it('validates transaction submission for Bangla QR with valid 11-digit phone', () => {
    const result = validatePaymentTransactionPopup('bangla_qr', '01712345678', '9X7D892K');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.cleanSender, '01712345678');
    assert.strictEqual(result.cleanTrxId, '9X7D892K');
  });

  it('validates transaction submission for Bangla QR with valid account/card ID', () => {
    const result = validatePaymentTransactionPopup('bangla_qr', 'ACC-99281', 'TRX12345');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.cleanSender, 'ACC99281');
    assert.strictEqual(result.cleanTrxId, 'TRX12345');
  });

  it('rejects empty transaction ID or empty sender for Bangla QR', () => {
    const resNoSender = validatePaymentTransactionPopup('bangla_qr', '', 'TRX12345');
    assert.strictEqual(resNoSender.valid, false);

    const resNoTrx = validatePaymentTransactionPopup('bangla_qr', '01712345678', '');
    assert.strictEqual(resNoTrx.valid, false);
  });

  it('always succeeds for COD validation without requiring TrxID', () => {
    const result = validatePaymentTransactionPopup('cod', '', '');
    assert.strictEqual(result.valid, true);
  });
});
