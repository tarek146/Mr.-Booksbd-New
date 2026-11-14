import type { SpecialOfferConfig, SpecialOfferItem } from '../types';

export type SpecialOfferItemStatus = 'active' | 'expired' | 'scheduled';

export interface SpecialOfferItemTimingSummary {
  status: SpecialOfferItemStatus;
  effectiveEndTime: number | null;
  remainingMs: number;
  usesCustomEndTime: boolean;
  usesCustomStartTime: boolean;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  expired: boolean;
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Resolves the effective expiry timestamp (epoch ms) for a Special Offer item.
 * Per-product `item.endTime` overrides the campaign-level `config.endTime`.
 */
export function resolveItemEndTime(
  item: Pick<SpecialOfferItem, 'endTime'>,
  config?: Partial<SpecialOfferConfig> | null
): number | null {
  if (isValidTimestamp(item.endTime)) {
    return item.endTime;
  }
  if (isValidTimestamp(config?.endTime)) {
    return config.endTime;
  }
  return null;
}

/**
 * Returns true if the item has a scheduled start time in the future.
 */
export function isSpecialOfferItemScheduledFuture(
  item: Pick<SpecialOfferItem, 'startTime'>,
  now: number = Date.now()
): boolean {
  return isValidTimestamp(item.startTime) && now < item.startTime;
}

/**
 * Returns true if auto-removal is active (default true) and the item's effective endTime has elapsed.
 */
export function isSpecialOfferItemExpired(
  item: Pick<SpecialOfferItem, 'endTime'>,
  config?: Partial<SpecialOfferConfig> | null,
  now: number = Date.now()
): boolean {
  if (config?.autoRemoveExpired === false) {
    return false;
  }
  const endTime = resolveItemEndTime(item, config);
  return isValidTimestamp(endTime) && now >= endTime;
}

/**
 * Filters Special Offer items so only active (already started & not expired) items remain visible.
 */
export function filterActiveSpecialOfferItems(
  config?: Partial<SpecialOfferConfig> | null,
  now: number = Date.now()
): SpecialOfferItem[] {
  const items = Array.isArray(config?.items) ? config.items : [];
  return items.filter(
    item =>
      !isSpecialOfferItemScheduledFuture(item, now) &&
      !isSpecialOfferItemExpired(item, config, now)
  );
}

/**
 * Computes full timing & visibility status for a single Special Offer item (used in Admin & Storefront).
 */
export function getSpecialOfferItemStatus(
  item: SpecialOfferItem,
  config?: Partial<SpecialOfferConfig> | null,
  now: number = Date.now()
): SpecialOfferItemTimingSummary {
  const usesCustomEndTime = isValidTimestamp(item.endTime);
  const usesCustomStartTime = isValidTimestamp(item.startTime);
  const effectiveEndTime = resolveItemEndTime(item, config);

  if (usesCustomStartTime && now < (item.startTime as number)) {
    return {
      status: 'scheduled',
      effectiveEndTime,
      remainingMs: Math.max(0, (item.startTime as number) - now),
      usesCustomEndTime,
      usesCustomStartTime,
    };
  }

  if (isValidTimestamp(effectiveEndTime) && now >= effectiveEndTime) {
    return {
      status: 'expired',
      effectiveEndTime,
      remainingMs: 0,
      usesCustomEndTime,
      usesCustomStartTime,
    };
  }

  return {
    status: 'active',
    effectiveEndTime,
    remainingMs: isValidTimestamp(effectiveEndTime)
      ? Math.max(0, effectiveEndTime - now)
      : 0,
    usesCustomEndTime,
    usesCustomStartTime,
  };
}

/**
 * Resolves which target timestamp the Special Offer banner countdown should track.
 */
export function resolveSectionTargetEndTime(
  config?: Partial<SpecialOfferConfig> | null,
  activeItems?: SpecialOfferItem[],
  now: number = Date.now()
): number | null {
  if (isValidTimestamp(config?.endTime) && config.endTime > now) {
    return config.endTime;
  }

  const items = activeItems ?? filterActiveSpecialOfferItems(config, now);
  const futureItemEndTimes = items
    .map(item => resolveItemEndTime(item, config))
    .filter((ts): ts is number => isValidTimestamp(ts) && ts > now);

  if (futureItemEndTimes.length > 0) {
    return Math.max(...futureItemEndTimes);
  }

  return isValidTimestamp(config?.endTime) ? config.endTime : null;
}

/**
 * Breaks a future target timestamp into padded countdown units.
 */
export function formatCountdownParts(
  targetEndTime: number | null,
  now: number = Date.now()
): CountdownParts {
  if (!isValidTimestamp(targetEndTime)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      expired: true,
    };
  }

  const diff = targetEndTime - now;
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      expired: true,
    };
  }

  const totalSecs = Math.floor(diff / 1000);
  const totalHours = Math.floor(totalSecs / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    expired: false,
  };
}

/**
 * Formats a remaining duration in ms into a compact card/admin badge string.
 */
export function formatCompactDuration(remainingMs: number): string {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return '00:00:00';
  }
  const totalSecs = Math.floor(remainingMs / 1000);
  const totalHours = Math.floor(totalSecs / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats an epoch timestamp (ms) into an HTML `<input type="datetime-local">` value in local time.
 */
export function toDateTimeLocalInputValue(timestamp?: number | null): string {
  if (!isValidTimestamp(timestamp)) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/**
 * Parses an HTML `<input type="datetime-local">` string back into epoch ms.
 */
export function fromDateTimeLocalInputValue(value: string): number | undefined {
  if (!value || !value.trim()) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Formats a human-readable local date/time label for Admin Panel previews.
 */
export function formatLocalDateTimeLabel(timestamp?: number | null): string {
  if (!isValidTimestamp(timestamp)) return 'Not set';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
