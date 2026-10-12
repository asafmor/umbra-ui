import { expect, test } from 'vitest';
import {
  conflictMessage,
  formatKeys,
  keyCaps,
  listShortcuts,
  matchesKeys,
  ownedShortcut,
  resolveShortcuts,
  shortcutForEvent,
  takesText,
  unreportedConflicts,
} from './shortcuts';

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

const reserved = [{ id: 'lib.palette', keys: 'Mod+K', label: 'Palette' }];

test('an app shortcut on a reserved key replaces the library default, and the conflict names both', () => {
  const registry = resolveShortcuts([{ id: 'app.find', keys: 'ctrl+k', label: 'Find' }], reserved, false);
  expect(registry.conflicts).toEqual([
    { keys: 'ctrl+k', winner: 'app.find', loser: 'lib.palette', reserved: true },
  ]);
  expect(conflictMessage(registry.conflicts[0]!)).toContain('"app.find"');
  expect(conflictMessage(registry.conflicts[0]!)).toContain('"lib.palette"');
  expect(shortcutForEvent(event('k', { ctrlKey: true }), registry, false)?.id).toBe('app.find');
  // The loser keeps its id and label, without keys.
  expect(ownedShortcut(registry, 'lib.palette', false)).toBeUndefined();
  expect(ownedShortcut(registry, 'app.find', false)?.id).toBe('app.find');
  expect(registry.shortcuts.get('lib.palette')?.label).toBe('Palette');
});

test('of two app shortcuts on the same keys, the one registered last wins', () => {
  const registry = resolveShortcuts(
    [
      { id: 'a', keys: 'Mod+J', label: 'A' },
      { id: 'b', keys: 'ctrl+j', label: 'B' },
      { id: 'c', keys: 'Alt+J', label: 'C' },
    ],
    reserved,
    false,
  );
  expect(registry.conflicts).toEqual([{ keys: 'ctrl+j', winner: 'b', loser: 'a', reserved: false }]);
  expect(conflictMessage(registry.conflicts[0]!)).toMatch(/"a" and "b".*"b" was registered last/);
  expect(shortcutForEvent(event('j', { ctrlKey: true }), registry, false)?.id).toBe('b');
  expect(shortcutForEvent(event('j', { altKey: true }), registry, false)?.id).toBe('c');
});

test('an app shortcut with a reserved id rebinds it without a conflict, and frees the old keys', () => {
  const registry = resolveShortcuts(
    [
      { id: 'lib.palette', keys: 'Mod+P', label: 'Palette' },
      { id: 'app.kill', keys: 'Mod+K', label: 'Kill line' },
    ],
    reserved,
    false,
  );
  expect(registry.conflicts).toEqual([]);
  expect(shortcutForEvent(event('p', { ctrlKey: true }), registry, false)?.id).toBe('lib.palette');
  expect(shortcutForEvent(event('k', { ctrlKey: true }), registry, false)?.id).toBe('app.kill');
});

test('each conflict is reported once, however often the same list is registered', () => {
  const app = () => [
    { id: 'app.find', keys: 'Mod+K', label: 'Find' },
    { id: 'a', keys: 'G', label: 'A' },
    { id: 'b', keys: 'g', label: 'B' },
  ];
  const reported = new Set<string>();
  expect(unreportedConflicts(resolveShortcuts(app(), reserved, false), reported)).toHaveLength(2);
  expect(unreportedConflicts(resolveShortcuts(app(), reserved, false), reported)).toEqual([]);
  // A new conflict is still reported.
  const more = [...app(), { id: 'c', keys: 'G', label: 'C' }];
  expect(unreportedConflicts(resolveShortcuts(more, reserved, false), reported)).toEqual([
    expect.stringContaining('"b" and "c"'),
  ]);
});

test('a held key and an event that is already handled belong to no shortcut', () => {
  const registry = resolveShortcuts([], reserved, false);
  const press = event('k', { ctrlKey: true });
  expect(shortcutForEvent(press, registry, false)?.id).toBe('lib.palette');
  expect(shortcutForEvent({ ...press, repeat: true }, registry, false)).toBeUndefined();
  expect(shortcutForEvent({ ...press, defaultPrevented: true }, registry, false)).toBeUndefined();
  expect(shortcutForEvent(event('x'), registry, false)).toBeUndefined();
});

test('formats key hints per platform', () => {
  expect(formatKeys('Mod+K', false)).toBe('Ctrl+K');
  expect(formatKeys('Mod+Shift+K', true)).toBe('⇧⌘K');
  expect(formatKeys('Alt+ArrowLeft', false)).toBe('Alt+←');
  expect(formatKeys('Alt+ArrowRight', true)).toBe('⌥→');
});

test('the keys one by one, for key caps', () => {
  expect(keyCaps('Mod+Shift+K', false)).toEqual(['Ctrl', 'Shift', 'K']);
  expect(keyCaps('Mod+K', true)).toEqual(['⌘', 'K']);
  expect(keyCaps('?', false)).toEqual(['?']);
  expect(keyCaps('ArrowUp', false)).toEqual(['↑']);
});

test('a list of shortcuts holds the labelled ones that own their keys, with group and origin', () => {
  const library = [...reserved, { id: 'lib.sheet', keys: '?', label: 'Help' }];
  const registry = resolveShortcuts(
    [
      { id: 'app.find', keys: 'Mod+K', label: 'Find', group: 'Search' },
      { id: 'a', keys: 'G', label: 'A' },
      { id: 'b', keys: 'g', label: 'B' },
      { id: 'hidden', keys: 'H', label: '' },
      { id: 'lib.sheet', keys: 'Mod+/', label: 'Help' },
    ],
    library,
    false,
  );
  const listed = listShortcuts(registry, library);
  // The palette lost its keys to "Find", "a" lost to "b", and a shortcut without a label is not listed.
  expect(listed.map((s) => s.id).sort()).toEqual(['app.find', 'b', 'lib.sheet']);
  expect(listed.find((s) => s.id === 'lib.sheet')).toMatchObject({ keys: 'Mod+/', reserved: true });
  expect(listed.find((s) => s.id === 'app.find')).toMatchObject({ reserved: false, group: 'Search' });
});

// Every type of the HTML standard: a bare-key shortcut is held back only where a key types something.
test('a bare key is typing only in a control that takes text', () => {
  const types = {
    text: true,
    search: true,
    url: true,
    tel: true,
    email: true,
    password: true,
    number: true,
    date: true,
    'datetime-local': true,
    month: true,
    week: true,
    time: true,
    checkbox: false,
    radio: false,
    range: false,
    color: false,
    file: false,
    button: false,
    submit: false,
    reset: false,
    image: false,
    hidden: false,
  };
  for (const [type, typing] of Object.entries(types))
    expect(takesText({ tagName: 'INPUT', type }), type).toBe(typing);
  // No type, an empty one and an unknown one are text fields to the browser; the case does not matter.
  for (const type of [undefined, null, '', 'unknown'])
    expect(takesText({ tagName: 'INPUT', type })).toBe(true);
  expect(takesText({ tagName: 'input', type: 'CHECKBOX' })).toBe(false);
  expect(takesText({ tagName: 'TEXTAREA' })).toBe(true);
  expect(takesText({ tagName: 'SELECT' })).toBe(true);
  for (const tagName of ['BUTTON', 'A', 'DIV', 'TD']) expect(takesText({ tagName })).toBe(false);
  expect(takesText({ tagName: 'DIV', editable: true })).toBe(true);
  for (const role of ['textbox', 'searchbox', 'combobox', 'spinbutton'])
    expect(takesText({ tagName: 'DIV', role }), role).toBe(true);
  for (const role of ['button', 'checkbox', 'slider', 'switch', 'radio', 'menuitem', 'gridcell'])
    expect(takesText({ tagName: 'DIV', role }), role).toBe(false);
  // A role says what the element is, whatever its tag.
  expect(takesText({ tagName: 'BUTTON', role: 'combobox' })).toBe(true);
});
