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

test('getThemeDisplayInfo returns accurate Sun/Moon labels and actions', () => {
  const lightInfo = getThemeDisplayInfo(false);
  assert.equal(lightInfo.mode, 'light');
  assert.equal(lightInfo.labelEn, 'Sun');
  assert.equal(lightInfo.actionEn, 'Switch to Moon');
  assert.equal(lightInfo.tooltip.includes('Sun'), true);

  const darkInfo = getThemeDisplayInfo(true);
  assert.equal(darkInfo.mode, 'dark');
  assert.equal(darkInfo.labelEn, 'Moon');
  assert.equal(darkInfo.actionEn, 'Switch to Sun');
  assert.equal(darkInfo.tooltip.includes('Moon'), true);
});
