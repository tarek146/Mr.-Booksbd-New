import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADMIN_SIDEBAR_CONFIG,
  ALL_ADMIN_SIDEBAR_TAB_IDS,
  formatSerialIndex,
  normalizeAdminSidebarConfig,
  moveSidebarSection,
  moveSidebarItem,
  reorderSidebarItemByDrop,
  getFlatOrderedItemIds,
  isCustomSidebarConfig,
} from './adminSidebarOrderHelpers';

test('formatSerialIndex returns two-digit serial strings', () => {
  assert.equal(formatSerialIndex(1), '01');
  assert.equal(formatSerialIndex(9), '09');
  assert.equal(formatSerialIndex(10), '10');
  assert.equal(formatSerialIndex(19), '19');
});

test('normalizeAdminSidebarConfig returns default serial structure when input is empty', () => {
  const normalized = normalizeAdminSidebarConfig(null);
  assert.equal(normalized.sections.length, 6);
  assert.deepEqual(getFlatOrderedItemIds(normalized), ALL_ADMIN_SIDEBAR_TAB_IDS);
  assert.equal(isCustomSidebarConfig(normalized), false);
});

test('normalizeAdminSidebarConfig preserves custom ordering and restores any missing tab IDs', () => {
  const partial = {
    sections: [
      {
        id: 'commerce_orders' as const,
        title: 'ORDERS & PAYMENTS',
        itemIds: ['verifications', 'orders'],
      },
    ],
  };
  const normalized = normalizeAdminSidebarConfig(partial);
  assert.equal(normalized.sections[0].id, 'commerce_orders');
  assert.deepEqual(normalized.sections[0].itemIds.slice(0, 2), ['verifications', 'orders']);
  // All 19 tabs must still exist exactly once
  const allFlat = getFlatOrderedItemIds(normalized);
  assert.equal(allFlat.length, ALL_ADMIN_SIDEBAR_TAB_IDS.length);
  assert.equal(new Set(allFlat).size, ALL_ADMIN_SIDEBAR_TAB_IDS.length);
  assert.equal(isCustomSidebarConfig(normalized), true);
});

test('moveSidebarSection moves a section up and down cleanly', () => {
  const movedUp = moveSidebarSection(DEFAULT_ADMIN_SIDEBAR_CONFIG, 'commerce_orders', 'up');
  assert.equal(movedUp.sections[0].id, 'commerce_orders');
  assert.equal(movedUp.sections[1].id, 'analytics_core');
  assert.equal(isCustomSidebarConfig(movedUp), true);

  const movedBackDown = moveSidebarSection(movedUp, 'commerce_orders', 'down');
  assert.equal(movedBackDown.sections[0].id, 'analytics_core');
  assert.equal(movedBackDown.sections[1].id, 'commerce_orders');
  assert.equal(isCustomSidebarConfig(movedBackDown), false);
});

test('moveSidebarItem moves an item up and down within its section and across section boundaries', () => {
  // Move 'verifications' up inside 'commerce_orders' (swaps with 'orders')
  const step1 = moveSidebarItem(DEFAULT_ADMIN_SIDEBAR_CONFIG, 'verifications', 'up');
  const commerceSec1 = step1.sections.find(s => s.id === 'commerce_orders')!;
  assert.deepEqual(commerceSec1.itemIds, ['verifications', 'orders', 'payment-methods']);

  // Move 'verifications' up again (from index 0 of commerce_orders into the end of analytics_core)
  const step2 = moveSidebarItem(step1, 'verifications', 'up');
  const coreSec2 = step2.sections.find(s => s.id === 'analytics_core')!;
  const commerceSec2 = step2.sections.find(s => s.id === 'commerce_orders')!;
  assert.deepEqual(coreSec2.itemIds, ['overview', 'verifications']);
  assert.deepEqual(commerceSec2.itemIds, ['orders', 'payment-methods']);

  // Move 'verifications' down (back to index 0 of commerce_orders)
  const step3 = moveSidebarItem(step2, 'verifications', 'down');
  const commerceSec3 = step3.sections.find(s => s.id === 'commerce_orders')!;
  assert.deepEqual(commerceSec3.itemIds, ['verifications', 'orders', 'payment-methods']);
});

test('reorderSidebarItemByDrop moves a dragged item before target item', () => {
  const updated = reorderSidebarItemByDrop(DEFAULT_ADMIN_SIDEBAR_CONFIG, 'payment-methods', 'orders');
  const commerceSec = updated.sections.find(s => s.id === 'commerce_orders')!;
  assert.deepEqual(commerceSec.itemIds, ['payment-methods', 'orders', 'verifications']);
});
