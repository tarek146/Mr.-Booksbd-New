import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveItemEndTime,
  isSpecialOfferItemExpired,
  isSpecialOfferItemScheduledFuture,
  filterActiveSpecialOfferItems,
  getSpecialOfferItemStatus,
  resolveSectionTargetEndTime,
  formatCountdownParts,
  formatCompactDuration,
  toDateTimeLocalInputValue,
  fromDateTimeLocalInputValue,
} from './specialOfferHelpers';
import type { SpecialOfferConfig, SpecialOfferItem } from '../types';

const NOW = 1_760_000_000_000;

test('removes all items using expired global endTime when autoRemoveExpired is enabled or default', () => {
  const config: SpecialOfferConfig = {
    enabled: true,
    title: 'Special Offer',
    endTime: NOW - 1000, // ended 1 second ago
    items: [
      { productId: 'p1', discountPercentage: 23, soldPercentage: 64 },
      { productId: 'p2', discountPercentage: 15, soldPercentage: 89 },
    ],
  };

  assert.equal(isSpecialOfferItemExpired(config.items[0], config, NOW), true);
  assert.deepEqual(filterActiveSpecialOfferItems(config, NOW), []);
});

test('removes only expired per-product items while preserving products with active future timings', () => {
  const config: SpecialOfferConfig = {
    enabled: true,
    title: 'Special Offer',
    endTime: NOW + 3600_000, // global +1h
    items: [
      { productId: 'p-expired', discountPercentage: 20, soldPercentage: 70, endTime: NOW - 5000 },
      { productId: 'p-custom-active', discountPercentage: 25, soldPercentage: 40, endTime: NOW + 600_000 },
      { productId: 'p-global-active', discountPercentage: 15, soldPercentage: 30 },
    ],
  };

  const active = filterActiveSpecialOfferItems(config, NOW);
  assert.deepEqual(
    active.map(i => i.productId),
    ['p-custom-active', 'p-global-active']
  );
});

test('keeps custom future-timed products alive even after global endTime passes and updates section targetEndTime', () => {
  const futureTs = NOW + 7_200_000;
  const config: SpecialOfferConfig = {
    enabled: true,
    title: 'Special Offer',
    endTime: NOW - 10_000, // global already ended
    items: [
      { productId: 'p1', discountPercentage: 20, soldPercentage: 50 }, // inherits global -> expired
      { productId: 'p2', discountPercentage: 30, soldPercentage: 80, endTime: futureTs }, // still active!
    ],
  };

  const active = filterActiveSpecialOfferItems(config, NOW);
  assert.deepEqual(active.map(i => i.productId), ['p2']);
  assert.equal(resolveSectionTargetEndTime(config, active, NOW), futureTs);
});

test('hides scheduled items until their startTime arrives and exposes accurate Admin statuses', () => {
  const itemScheduled: SpecialOfferItem = {
    productId: 'p-sched',
    discountPercentage: 20,
    soldPercentage: 10,
    startTime: NOW + 60_000,
    endTime: NOW + 3_600_000,
  };
  const itemExpired: SpecialOfferItem = {
    productId: 'p-exp',
    discountPercentage: 15,
    soldPercentage: 90,
    endTime: NOW - 1,
  };

  const config: SpecialOfferConfig = {
    enabled: true,
    title: 'Special Offer',
    endTime: NOW + 3_600_000,
    items: [itemScheduled, itemExpired],
  };

  assert.equal(isSpecialOfferItemScheduledFuture(itemScheduled, NOW), true);
  assert.equal(getSpecialOfferItemStatus(itemScheduled, config, NOW).status, 'scheduled');
  assert.equal(getSpecialOfferItemStatus(itemExpired, config, NOW).status, 'expired');
  assert.equal(filterActiveSpecialOfferItems(config, NOW).length, 0);
  // Once NOW moves past startTime, itemScheduled becomes active
  assert.deepEqual(
    filterActiveSpecialOfferItems(config, NOW + 65_000).map(i => i.productId),
    ['p-sched']
  );
});

test('respects admin opt-out autoRemoveExpired=false when explicitly disabled', () => {
  const config: SpecialOfferConfig = {
    enabled: true,
    title: 'Special Offer',
    endTime: NOW - 60_000,
    autoRemoveExpired: false,
    items: [{ productId: 'p1', discountPercentage: 10, soldPercentage: 50 }],
  };

  assert.equal(filterActiveSpecialOfferItems(config, NOW).length, 1);
  assert.equal(resolveItemEndTime(config.items[0], config), NOW - 60_000);
});

test('formats countdown parts, compact duration, and roundtrips datetime-local input values cleanly', () => {
  const parts = formatCountdownParts(NOW + (2 * 3600 + 5 * 60 + 9) * 1000, NOW);
  assert.equal(parts.totalHours, 2);
  assert.equal(parts.minutes, 5);
  assert.equal(parts.seconds, 9);
  assert.equal(parts.expired, false);

  assert.equal(formatCountdownParts(NOW - 1, NOW).expired, true);
  assert.equal(formatCompactDuration(3_661_000), '01:01:01');
  assert.equal(formatCompactDuration(90_061_000), '1d 01h 01m');
  assert.equal(formatCompactDuration(0), '00:00:00');

  // Minute precision roundtrip for <input type="datetime-local">
  const sampleMs = new Date(2026, 10, 15, 18, 45, 0, 0).getTime();
  const formatted = toDateTimeLocalInputValue(sampleMs);
  assert.equal(formatted, '2026-11-15T18:45');
  assert.equal(fromDateTimeLocalInputValue(formatted), sampleMs);
  assert.equal(fromDateTimeLocalInputValue(''), undefined);
});
