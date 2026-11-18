import { StoreSettings } from '../types';
import { normalizeHexColor } from './adminBrandingHelpers';

export type HeaderBrandColorMode = 'two_tone' | 'word' | 'letter';

export interface HeaderBrandSegment {
  text: string;
  color: string;
  isWhitespace: boolean;
  wordIndex: number;
  letterIndex: number;
}

export interface HeaderBrandCharToken {
  char: string;
  isWhitespace: boolean;
  wordIndex: number;
  letterIndex: number;
}

export interface ResolvedHeaderBrand {
  segments: HeaderBrandSegment[];
  iconColor: string;
  mode: HeaderBrandColorMode;
}

export const DEFAULT_HEADER_COLOR_1 = '#171717';
export const DEFAULT_HEADER_COLOR_2 = '#D71920';

export const HEADER_COLOR_QUICK_PALETTE = [
  '#171717',
  '#D71920',
  '#0F172A',
  '#2563EB',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
] as const;

export function isValidHexColor(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(withHash);
}

/**
 * Splits text into visual grapheme clusters so English letters, punctuation,
 * and Bengali/Unicode vowel signs remain intact as single characters.
 */
export function splitGraphemes(text: string): string[] {
  if (!text) return [];
  try {
    const IntlWithSegmenter = Intl as typeof Intl & {
      Segmenter?: new (
        locales?: string | string[],
        options?: { granularity: 'grapheme' | 'word' | 'sentence' }
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    };
    if (typeof IntlWithSegmenter.Segmenter === 'function') {
      const segmenter = new IntlWithSegmenter.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), item => item.segment);
    }
  } catch {
    // Fallback below if Intl.Segmenter is unavailable
  }
  return Array.from(text);
}

export function extractHeaderWords(storeName: string): string[] {
  const trimmed = (storeName || '').trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

export function extractHeaderCharTokens(storeName: string): HeaderBrandCharToken[] {
  const trimmed = (storeName || '').trim();
  if (!trimmed) return [];

  const tokens: HeaderBrandCharToken[] = [];
  const rawParts = trimmed.split(/(\s+)/);
  let wordIndex = -1;
  let letterIndex = 0;

  for (const part of rawParts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({
        char: ' ',
        isWhitespace: true,
        wordIndex: -1,
        letterIndex: -1,
      });
    } else {
      wordIndex += 1;
      const graphemes = splitGraphemes(part);
      for (const ch of graphemes) {
        tokens.push({
          char: ch,
          isWhitespace: false,
          wordIndex,
          letterIndex,
        });
        letterIndex += 1;
      }
    }
  }

  return tokens;
}

export function isVeryDarkHex(hex: string): boolean {
  const normalized = normalizeHexColor(hex, DEFAULT_HEADER_COLOR_1);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = r * 0.299 + g * 0.587 + b * 0.114;
  return luminance < 45;
}

export function resolveColorForTheme(hex: string, darkMode: boolean): string {
  const normalized = normalizeHexColor(hex, DEFAULT_HEADER_COLOR_1);
  if (darkMode && isVeryDarkHex(normalized)) {
    return '#FFFFFF';
  }
  return normalized;
}

export function getWordFallbackColor(
  wordIndex: number,
  totalWords: number,
  c1: string,
  c2: string
): string {
  if (totalWords <= 1) return c1;
  return wordIndex === totalWords - 1 ? c2 : c1;
}

export function buildWordColorsList(
  storeName: string,
  existingColors: string[] | undefined,
  color1?: string,
  color2?: string
): string[] {
  const words = extractHeaderWords(storeName);
  const c1 = normalizeHexColor(color1, DEFAULT_HEADER_COLOR_1);
  const c2 = normalizeHexColor(color2, DEFAULT_HEADER_COLOR_2);
  const safeExisting = Array.isArray(existingColors) ? existingColors : [];

  return words.map((_, idx) => {
    const candidate = safeExisting[idx];
    if (isValidHexColor(candidate)) {
      return normalizeHexColor(candidate, c1);
    }
    return getWordFallbackColor(idx, words.length, c1, c2);
  });
}

export function buildLetterColorsList(
  storeName: string,
  existingColors: string[] | undefined,
  color1?: string,
  color2?: string
): string[] {
  const tokens = extractHeaderCharTokens(storeName).filter(t => !t.isWhitespace);
  const totalWords = extractHeaderWords(storeName).length;
  const c1 = normalizeHexColor(color1, DEFAULT_HEADER_COLOR_1);
  const c2 = normalizeHexColor(color2, DEFAULT_HEADER_COLOR_2);
  const safeExisting = Array.isArray(existingColors) ? existingColors : [];

  return tokens.map((token, idx) => {
    const candidate = safeExisting[idx];
    if (isValidHexColor(candidate)) {
      return normalizeHexColor(candidate, c1);
    }
    return getWordFallbackColor(token.wordIndex, totalWords, c1, c2);
  });
}

export function applyColorToWordInLetterList(
  storeName: string,
  existingColors: string[] | undefined,
  targetWordIndex: number,
  hexColor: string,
  color1?: string,
  color2?: string
): string[] {
  const base = buildLetterColorsList(storeName, existingColors, color1, color2);
  const tokens = extractHeaderCharTokens(storeName).filter(t => !t.isWhitespace);
  const nextHex = normalizeHexColor(hexColor, DEFAULT_HEADER_COLOR_1);

  return base.map((color, idx) => {
    const token = tokens[idx];
    if (token && token.wordIndex === targetWordIndex) {
      return nextHex;
    }
    return color;
  });
}

export function normalizeHeaderBrandColorMode(mode?: string | null): HeaderBrandColorMode {
  if (mode === 'word' || mode === 'letter' || mode === 'two_tone') {
    return mode;
  }
  return 'two_tone';
}

export function sanitizeHexColorArray(values: unknown, maxLength = 120): string[] {
  if (!Array.isArray(values)) return [];
  const cleaned: string[] = [];
  for (const item of values) {
    if (cleaned.length >= maxLength) break;
    if (typeof item === 'string' && isValidHexColor(item)) {
      cleaned.push(normalizeHexColor(item, DEFAULT_HEADER_COLOR_1));
    }
  }
  return cleaned;
}

/**
 * Resolves the header store name into renderable segments with exact per-word,
 * per-letter, or backward-compatible two-tone colors.
 */
export function resolveHeaderBrandSegments(
  storeName: string,
  settings?: Partial<StoreSettings> | null,
  darkMode = false
): ResolvedHeaderBrand {
  const c1 = normalizeHexColor(settings?.headerNameColor1, DEFAULT_HEADER_COLOR_1);
  const c2 = normalizeHexColor(settings?.headerNameColor2, DEFAULT_HEADER_COLOR_2);
  const mode = normalizeHeaderBrandColorMode(settings?.headerBrandColorMode);

  const trimmed = (storeName || '').trim();
  if (!trimmed) {
    return {
      segments: [],
      iconColor: c2,
      mode,
    };
  }

  const words = extractHeaderWords(trimmed);
  const totalWords = words.length;

  if (mode === 'letter') {
    const charTokens = extractHeaderCharTokens(trimmed);
    const letterColors = Array.isArray(settings?.headerLetterColors)
      ? settings.headerLetterColors
      : [];

    const segments: HeaderBrandSegment[] = charTokens.map(token => {
      if (token.isWhitespace) {
        return {
          text: ' ',
          color: c1,
          isWhitespace: true,
          wordIndex: -1,
          letterIndex: -1,
        };
      }

      const rawCustom = letterColors[token.letterIndex];
      const fallback = getWordFallbackColor(token.wordIndex, totalWords, c1, c2);
      const baseColor = isValidHexColor(rawCustom)
        ? normalizeHexColor(rawCustom, fallback)
        : fallback;

      return {
        text: token.char,
        color: resolveColorForTheme(baseColor, darkMode),
        isWhitespace: false,
        wordIndex: token.wordIndex,
        letterIndex: token.letterIndex,
      };
    });

    return {
      segments,
      iconColor: c2,
      mode,
    };
  }

  if (mode === 'word') {
    const rawParts = trimmed.split(/(\s+)/);
    const wordColors = Array.isArray(settings?.headerWordColors)
      ? settings.headerWordColors
      : [];
    const segments: HeaderBrandSegment[] = [];
    let wordIdx = -1;

    for (const part of rawParts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        segments.push({
          text: ' ',
          color: c1,
          isWhitespace: true,
          wordIndex: -1,
          letterIndex: -1,
        });
      } else {
        wordIdx += 1;
        const fallback = getWordFallbackColor(wordIdx, totalWords, c1, c2);
        const rawCustom = wordColors[wordIdx];
        const baseColor = isValidHexColor(rawCustom)
          ? normalizeHexColor(rawCustom, fallback)
          : fallback;

        segments.push({
          text: part,
          color: resolveColorForTheme(baseColor, darkMode),
          isWhitespace: false,
          wordIndex: wordIdx,
          letterIndex: -1,
        });
      }
    }

    return {
      segments,
      iconColor: c2,
      mode,
    };
  }

  // Default backward-compatible 'two_tone' mode
  if (totalWords <= 1) {
    return {
      segments: [
        {
          text: trimmed,
          color: resolveColorForTheme(c1, darkMode),
          isWhitespace: false,
          wordIndex: 0,
          letterIndex: -1,
        },
      ],
      iconColor: c2,
      mode: 'two_tone',
    };
  }

  const lastWord = words[totalWords - 1];
  const firstPart = words.slice(0, -1).join(' ');

  return {
    segments: [
      {
        text: firstPart,
        color: resolveColorForTheme(c1, darkMode),
        isWhitespace: false,
        wordIndex: 0,
        letterIndex: -1,
      },
      {
        text: ' ',
        color: c1,
        isWhitespace: true,
        wordIndex: -1,
        letterIndex: -1,
      },
      {
        text: lastWord,
        color: resolveColorForTheme(c2, darkMode),
        isWhitespace: false,
        wordIndex: totalWords - 1,
        letterIndex: -1,
      },
    ],
    iconColor: c2,
    mode: 'two_tone',
  };
}
