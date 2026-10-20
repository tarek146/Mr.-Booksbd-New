import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncTracker, normalizeAssetUrl } from './syncManager.ts';

test('SyncTracker: initial state is not complete', () => {
  const tracker = new SyncTracker();
  assert.equal(tracker.isInitialSyncComplete(), false);
});

test('SyncTracker: ignores cached snapshots during initial sync', () => {
  const tracker = new SyncTracker();
  
  // Cache snapshot for products arrives first
  const shouldApply = tracker.shouldApplySnapshot('products', true);
  assert.equal(shouldApply, false, 'Should not apply stale cache during initial online sync');
  
  tracker.recordSnapshot('products', true);
  assert.equal(tracker.isInitialSyncComplete(), false);
});

test('SyncTracker: marks complete only when all required collections receive server data', () => {
  const tracker = new SyncTracker();
  
  tracker.recordSnapshot('products', false);
  assert.equal(tracker.isInitialSyncComplete(), false);
  
  tracker.recordSnapshot('categories', false);
  tracker.recordSnapshot('authors', false);
  tracker.recordSnapshot('banners', false);
  tracker.recordSnapshot('payment_methods', false);
  assert.equal(tracker.isInitialSyncComplete(), false);
  
  // Last one: settings
  tracker.recordSnapshot('settings', false);
  assert.equal(tracker.isInitialSyncComplete(), true);
});

test('SyncTracker: offline mode allows cached snapshots and marks complete', () => {
  const tracker = new SyncTracker();
  tracker.setOffline(true);
  
  assert.equal(tracker.shouldApplySnapshot('products', true), true);
  assert.equal(tracker.isInitialSyncComplete(), true);
});

test('normalizeAssetUrl: handles data URLs, versions, and empty values', () => {
  assert.equal(normalizeAssetUrl(''), '');
  assert.equal(normalizeAssetUrl(null), '');
  assert.equal(normalizeAssetUrl('data:image/jpeg;base64,abc123'), 'data:image/jpeg;base64,abc123');
  assert.equal(normalizeAssetUrl('https://example.com/banner.jpg', 123), 'https://example.com/banner.jpg?v=123');
  assert.equal(normalizeAssetUrl('https://example.com/banner.jpg?v=999', 123), 'https://example.com/banner.jpg?v=999');
  assert.equal(normalizeAssetUrl('https://example.com/banner.jpg'), 'https://example.com/banner.jpg');
});
