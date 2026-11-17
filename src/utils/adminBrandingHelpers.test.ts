import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADMIN_BRAND_NAME,
  DEFAULT_ADMIN_SUBTITLE,
  normalizeHexColor,
  resolveAdminPanelBranding,
} from './adminBrandingHelpers';

test('normalizeHexColor handles 6-digit, 3-digit, missing #, and invalid colors', () => {
  assert.equal(normalizeHexColor('#d71920'), '#D71920');
  assert.equal(normalizeHexColor('fbbf24'), '#FBBF24');
  assert.equal(normalizeHexColor('#abc', '#111111'), '#AABBCC');
  assert.equal(normalizeHexColor('', '#FFFFFF'), '#FFFFFF');
  assert.equal(normalizeHexColor('not-a-color', '#D71920'), '#D71920');
});

test('resolveAdminPanelBranding returns exact backward-compatible defaults when fields are absent', () => {
  const resolved = resolveAdminPanelBranding({});

  assert.equal(resolved.hasCustomLogo, false);
  assert.equal(resolved.logoUrl, '');
  assert.equal(resolved.showIconBadge, true);
  assert.equal(resolved.iconBgColor, '#D71920');
  assert.equal(resolved.displayName, DEFAULT_ADMIN_BRAND_NAME);
  assert.equal(resolved.subtitle, DEFAULT_ADMIN_SUBTITLE);
  assert.equal(resolved.color1, '#FFFFFF');
  assert.equal(resolved.color2, '#FFFFFF');
  assert.equal(resolved.useTwoTone, false);
  assert.equal(resolved.firstPart, DEFAULT_ADMIN_BRAND_NAME);
  assert.equal(resolved.lastWord, '');
  assert.equal(resolved.isEmpty, false);
});

test('resolveAdminPanelBranding replaces default icon badge when a valid custom logo URL is provided', () => {
  const resolved = resolveAdminPanelBranding({
    adminLogoUrl: 'https://cdn.example.com/admin-logo.webp',
    showAdminIcon: true,
    adminBrandName: 'BOOK HAVEN ADMIN',
    adminNameColor1: '#38bdf8',
  });

  assert.equal(resolved.hasCustomLogo, true);
  assert.equal(resolved.logoUrl, 'https://cdn.example.com/admin-logo.webp');
  assert.equal(resolved.showIconBadge, false);
  assert.equal(resolved.displayName, 'BOOK HAVEN ADMIN');
  assert.equal(resolved.color1, '#38BDF8');
  assert.equal(resolved.color2, '#38BDF8');
});

test('resolveAdminPanelBranding supports logo-only mode when brand name and subtitle are cleared', () => {
  const resolved = resolveAdminPanelBranding({
    adminLogoUrl: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
    adminBrandName: '',
    adminPanelSubtitle: '',
  });

  assert.equal(resolved.hasCustomLogo, true);
  assert.equal(resolved.showIconBadge, false);
  assert.equal(resolved.displayName, '');
  assert.equal(resolved.subtitle, '');
  assert.equal(resolved.isEmpty, false);
});

test('resolveAdminPanelBranding sanitizes invalid logo URLs and keeps icon visible', () => {
  const resolved = resolveAdminPanelBranding({
    adminLogoUrl: 'data:,',
    showAdminIcon: true,
  });

  assert.equal(resolved.hasCustomLogo, false);
  assert.equal(resolved.logoUrl, '');
  assert.equal(resolved.showIconBadge, true);
});

test('resolveAdminPanelBranding supports single color vs two-tone last word coloring', () => {
  const solid = resolveAdminPanelBranding({
    adminBrandName: 'MR. BOOKS PRO',
    adminNameColor1: '#FBBF24',
    adminNameColor2: '#D71920',
    adminUseTwoToneName: false,
  });
  assert.equal(solid.firstPart, 'MR. BOOKS PRO');
  assert.equal(solid.lastWord, '');
  assert.equal(solid.color1, '#FBBF24');
  assert.equal(solid.color2, '#FBBF24');

  const twoTone = resolveAdminPanelBranding({
    adminBrandName: 'MR. BOOKS PRO',
    adminNameColor1: '#FFFFFF',
    adminNameColor2: '#D71920',
    adminUseTwoToneName: true,
  });
  assert.equal(twoTone.firstPart, 'MR. BOOKS');
  assert.equal(twoTone.lastWord, 'PRO');
  assert.equal(twoTone.color1, '#FFFFFF');
  assert.equal(twoTone.color2, '#D71920');
});
