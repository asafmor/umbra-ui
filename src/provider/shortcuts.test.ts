import { expect, test } from 'vitest';
import { findConflicts, formatKeys, matchesKeys } from './shortcuts';

const event = (
  key: string,
  mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>> = {},
) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

test('Mod is Ctrl on other platforms and Command on macOS', () => {
  expect(matchesKeys(event('k', { ctrlKey: true }), 'Mod+K', false)).toBe(true);
  expect(matchesKeys(event('k', { metaKey: true }), 'Mod+K', false)).toBe(false);
  expect(matchesKeys(event('k', { metaKey: true }), 'Mod+K', true)).toBe(true);
  expect(matchesKeys(event('k'), 'Mod+K', false)).toBe(false);
});

test('a symbol key matches with or without Shift; a letter does not', () => {
  expect(matchesKeys(event('?', { shiftKey: true }), '?', false)).toBe(true);
  expect(matchesKeys(event('s', { shiftKey: true }), 'S', false)).toBe(false);
  expect(matchesKeys(event('S', { shiftKey: true }), 'Shift+S', false)).toBe(true);
});

test('finds shortcuts that share keys, however they are written', () => {
  const list = [
    { id: 'a', keys: 'Mod+K', label: 'A' },
    { id: 'b', keys: 'ctrl+k', label: 'B' },
    { id: 'c', keys: 'Alt+K', label: 'C' },
  ];
  expect(findConflicts(list, false)).toEqual([['a', 'b']]);
});

test('formats key hints per platform', () => {
  expect(formatKeys('Mod+K', false)).toBe('Ctrl+K');
  expect(formatKeys('Mod+Shift+K', true)).toBe('⇧⌘K');
  expect(formatKeys('Alt+ArrowLeft', false)).toBe('Alt+ArrowLeft');
});
