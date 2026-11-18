import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyColorToWordInLetterList,
  buildLetterColorsList,
  buildWordColorsList,
  extractHeaderCharTokens,
  extractHeaderWords,
  normalizeHeaderBrandColorMode,
  resolveHeaderBrandSegments,
  sanitizeHexColorArray,
  splitGraphemes,
} from './headerBrandColorHelpers';

test('backward-compatible two_tone mode splits first words and last word identically to legacy behavior', () => {
  const res = resolveHeaderBrandSegments(
    'MR. BOOKS BD',
    {
      headerNameColor1: '#050000',
      headerNameColor2: '#4D4D4D',
    },
    false
  );

  assert.equal(res.mode, 'two_tone');
  assert.equal(res.iconColor, '#4D4D4D');
  assert.deepEqual(
    res.segments.map(s => ({ text: s.text, color: s.color, ws: s.isWhitespace })),
    [
      { text: 'MR. BOOKS', color: '#050000', ws: false },
      { text: ' ', color: '#050000', ws: true },
      { text: 'BD', color: '#4D4D4D', ws: false },
    ]
  );
});

test('per-word mode assigns distinct custom colors to each word and protects dark text in dark mode', () => {
  const light = resolveHeaderBrandSegments(
    'M BOOKS READING',
    {
      headerBrandColorMode: 'word',
      headerNameColor1: '#171717',
      headerNameColor2: '#D71920',
      headerWordColors: ['#171717', '#2563EB', '#059669'],
    },
    false
  );

  assert.deepEqual(
    light.segments.filter(s => !s.isWhitespace).map(s => [s.text, s.color]),
    [
      ['M', '#171717'],
      ['BOOKS', '#2563EB'],
      ['READING', '#059669'],
    ]
  );

  const dark = resolveHeaderBrandSegments(
    'M BOOKS READING',
    {
      headerBrandColorMode: 'word',
      headerNameColor1: '#171717',
      headerNameColor2: '#D71920',
      headerWordColors: ['#171717', '#2563EB', '#059669'],
    },
    true
  );

  assert.deepEqual(
    dark.segments.filter(s => !s.isWhitespace).map(s => [s.text, s.color]),
    [
      ['M', '#FFFFFF'],
      ['BOOKS', '#2563EB'],
      ['READING', '#059669'],
    ]
  );
});

test('per-letter mode assigns individual colors to every single character while preserving spaces', () => {
  const res = resolveHeaderBrandSegments(
    'MR. BD',
    {
      headerBrandColorMode: 'letter',
      headerNameColor1: '#171717',
      headerNameColor2: '#D71920',
      headerLetterColors: ['#D71920', '#2563EB', '#059669', '#D97706', '#7C3AED'],
    },
    false
  );

  assert.deepEqual(
    res.segments.map(s => [s.text, s.color, s.isWhitespace]),
    [
      ['M', '#D71920', false],
      ['R', '#2563EB', false],
      ['.', '#059669', false],
      [' ', '#171717', true],
      ['B', '#D97706', false],
      ['D', '#7C3AED', false],
    ]
  );
});

test('splitGraphemes keeps Bengali conjunct/kar characters together cleanly', () => {
  const graphemes = splitGraphemes('বুকস');
  assert.deepEqual(graphemes, ['বু', 'ক', 'স']);

  const tokens = extractHeaderCharTokens('এম বুকস');
  const nonWs = tokens.filter(t => !t.isWhitespace);
  assert.deepEqual(
    nonWs.map(t => t.char),
    ['এ', 'ম', 'বু', 'ক', 'স']
  );
  assert.deepEqual(
    nonWs.map(t => t.wordIndex),
    [0, 0, 1, 1, 1]
  );
});

test('buildWordColorsList, buildLetterColorsList, and applyColorToWordInLetterList preserve edits safely', () => {
  assert.deepEqual(extractHeaderWords('  MR.   BOOKS   BD '), ['MR.', 'BOOKS', 'BD']);

  const words = buildWordColorsList('MR. BOOKS BD', ['#112233'], '#050000', '#D71920');
  assert.deepEqual(words, ['#112233', '#050000', '#D71920']);

  const letters = buildLetterColorsList('AB CD', ['#FF0000'], '#111111', '#222222');
  assert.deepEqual(letters, ['#FF0000', '#111111', '#222222', '#222222']);

  const wordPainted = applyColorToWordInLetterList('AB CD', letters, 1, '#059669', '#111111', '#222222');
  assert.deepEqual(wordPainted, ['#FF0000', '#111111', '#059669', '#059669']);
});

test('normalizeHeaderBrandColorMode and sanitizeHexColorArray validate bad inputs', () => {
  assert.equal(normalizeHeaderBrandColorMode('letter'), 'letter');
  assert.equal(normalizeHeaderBrandColorMode('word'), 'word');
  assert.equal(normalizeHeaderBrandColorMode('invalid'), 'two_tone');
  assert.deepEqual(sanitizeHexColorArray(['#abc', 'd71920', 'bad-hex', 123]), [
    '#AABBCC',
    '#D71920',
  ]);
});
