import { StoreSettings } from '../types';
import { sanitizeImageUrl } from './imageCompressor';

export const DEFAULT_ADMIN_BRAND_NAME = 'MR. BOOKS BD';
export const DEFAULT_ADMIN_SUBTITLE = 'Store Admin Console';
export const DEFAULT_ADMIN_NAME_COLOR_1 = '#FFFFFF';
export const DEFAULT_ADMIN_NAME_COLOR_2 = '#D71920';
export const DEFAULT_ADMIN_ICON_BG_COLOR = '#D71920';

export const ADMIN_BRAND_COLOR_PRESETS = [
  { label: 'Pure White', hex: '#FFFFFF' },
  { label: 'Crimson Red', hex: '#D71920' },
  { label: 'Amber Gold', hex: '#FBBF24' },
  { label: 'Emerald Mint', hex: '#34D399' },
  { label: 'Sky Blue', hex: '#38BDF8' },
  { label: 'Coral Rose', hex: '#FB7185' },
] as const;

export interface ResolvedAdminPanelBranding {
  logoUrl: string;
  hasCustomLogo: boolean;
  showIconBadge: boolean;
  iconBgColor: string;
  displayName: string;
  firstPart: string;
  lastWord: string;
  subtitle: string;
  color1: string;
  color2: string;
  useTwoTone: boolean;
  isEmpty: boolean;
}

/**
 * Normalizes a 3-digit or 6-digit hex color into a valid uppercase #RRGGBB string
 * compatible with both CSS rendering and native `<input type="color">` elements.
 */
export function normalizeHexColor(value?: string | null, fallback = '#FFFFFF'): string {
  const safeFallback = /^#[0-9A-Fa-f]{6}$/.test(fallback) ? fallback.toUpperCase() : '#FFFFFF';
  if (!value || typeof value !== 'string') return safeFallback;

  let trimmed = value.trim();
  if (!trimmed) return safeFallback;
  if (!trimmed.startsWith('#')) {
    trimmed = `#${trimmed}`;
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return safeFallback;
}

/**
 * Resolves the Admin Console sidebar brand header configuration from StoreSettings
 * with exact backward-compatible defaults for existing Firestore documents.
 */
export function resolveAdminPanelBranding(
  settings?: Partial<StoreSettings> | null
): ResolvedAdminPanelBranding {
  const logoUrl = sanitizeImageUrl(settings?.adminLogoUrl);
  const hasCustomLogo = logoUrl.length > 0;

  const displayName =
    settings?.adminBrandName === undefined
      ? DEFAULT_ADMIN_BRAND_NAME
      : String(settings.adminBrandName ?? '').trim();

  const subtitle =
    settings?.adminPanelSubtitle === undefined
      ? DEFAULT_ADMIN_SUBTITLE
      : String(settings.adminPanelSubtitle ?? '').trim();

  const showIconBadge = !hasCustomLogo && settings?.showAdminIcon !== false;
  const iconBgColor = normalizeHexColor(
    settings?.adminIconBgColor,
    DEFAULT_ADMIN_ICON_BG_COLOR
  );

  const color1 = normalizeHexColor(
    settings?.adminNameColor1,
    DEFAULT_ADMIN_NAME_COLOR_1
  );
  const useTwoTone = Boolean(settings?.adminUseTwoToneName);
  const color2 = useTwoTone
    ? normalizeHexColor(settings?.adminNameColor2, DEFAULT_ADMIN_NAME_COLOR_2)
    : color1;

  let firstPart = displayName;
  let lastWord = '';

  if (displayName && useTwoTone) {
    const words = displayName.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      lastWord = words[words.length - 1];
      firstPart = words.slice(0, -1).join(' ');
    }
  }

  const isEmpty = !hasCustomLogo && !showIconBadge && !displayName && !subtitle;

  return {
    logoUrl,
    hasCustomLogo,
    showIconBadge,
    iconBgColor,
    displayName,
    firstPart,
    lastWord,
    subtitle,
    color1,
    color2,
    useTwoTone,
    isEmpty,
  };
}
