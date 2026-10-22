import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getInitialTheme,
  toggleTheme,
  getThemeDisplayInfo
} from './themeHelpers';

test('getInitialTheme defaults to light (Day mode permanent default)', () => {
  const theme = getInitialTheme();
  assert.equal(theme, 'light');
});

test('toggleTheme toggles false to true and true to false', () => {
  assert.equal(toggleTheme(false), true);
  assert.equal(toggleTheme(true), false);
});

test('getThemeDisplayInfo returns accurate localized labels and actions', () => {
  const lightInfo = getThemeDisplayInfo(false);
  assert.equal(lightInfo.mode, 'light');
  assert.equal(lightInfo.labelBn, 'ডে মোড');
  assert.equal(lightInfo.actionBn, 'ডার্ক মোড চালু করুন');
  assert.equal(lightInfo.tooltip.includes('Dark Mode'), true);

  const darkInfo = getThemeDisplayInfo(true);
  assert.equal(darkInfo.mode, 'dark');
  assert.equal(darkInfo.labelBn, 'ডার্ক মোড');
  assert.equal(darkInfo.actionBn, 'ডে মোডে ফিরুন');
  assert.equal(darkInfo.tooltip.includes('Light Mode'), true);
});
