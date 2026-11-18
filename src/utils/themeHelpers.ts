/**
 * Theme & Dark Mode Helpers for MR. BOOKS
 * Strict Requirement:
 * - Default theme is ALWAYS Day/Light theme ("অলওয়েজ পার্মানেন্ট থাকবে ডে থিম")
 * - When toggled, all white surfaces transition smoothly to high-standard dark slate
 * - All red elements (#D71920) strictly remain vibrant brand red
 */

export type ThemeMode = 'light' | 'dark';

export const THEME_SESSION_KEY = 'mrb_theme_choice';

/**
 * Returns the initial theme mode.
 * Defaults to 'light' (Day theme) unless the user explicitly selected dark in the active session.
 */
export function getInitialTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(THEME_SESSION_KEY);
      if (stored === 'dark') return 'dark';
    } catch {
      return 'light';
    }
  }
  return 'light';
}

/**
 * Persists the user's explicit theme choice for the current browser session.
 */
export function persistThemeChoice(theme: ThemeMode): void {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(THEME_SESSION_KEY, theme);
    } catch {
      // Ignore sessionStorage errors
    }
  }
}

/**
 * Applies the theme to the DOM (<html> tag).
 * Sets or removes the 'dark' CSS class, updates the data-theme attribute,
 * and configures the native color-scheme.
 */
export function applyThemeToDom(isDark: boolean): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

/**
 * Returns the toggled theme boolean.
 */
export function toggleTheme(currentDark: boolean): boolean {
  return !currentDark;
}

/**
 * Returns localized Bengali & English labels and tooltips for the theme switcher.
 */
export function getThemeDisplayInfo(isDark: boolean) {
  if (isDark) {
    return {
      mode: 'dark' as ThemeMode,
      labelBn: 'রাত (Moon)',
      labelEn: 'Moon',
      actionBn: 'দিনে ফিরুন (Sun)',
      actionEn: 'Switch to Sun',
      tooltip: 'Moon · Switch to Sun (Light Mode)'
    };
  }
  return {
    mode: 'light' as ThemeMode,
    labelBn: 'দিন (Sun)',
    labelEn: 'Sun',
    actionBn: 'রাতে যান (Moon)',
    actionEn: 'Switch to Moon',
    tooltip: 'Sun · Switch to Moon (Dark Mode)'
  };
}
