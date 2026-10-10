/** One key binding in the app's shortcut registry. */
export interface Shortcut {
  /** Stable id, used by the `shortcut` prop of buttons. */
  id: string;
  /** The key combination, for example `Mod+K`, `Shift+S`, `?`. `Mod` is Command on macOS and Ctrl elsewhere. */
  keys: string;
  /** Human-readable name, shown in the shortcuts sheet. */
  label: string;
  /** Called when the keys are pressed, unless a mounted component has bound the id. */
  action?: () => void;
}

/** Keys the library reserves (plan/specs/UmbraProvider.md). */
export const reservedShortcuts: Shortcut[] = [
  { id: 'umbra.commandPalette', keys: 'Mod+K', label: 'Open command palette' },
  { id: 'umbra.shortcutsSheet', keys: '?', label: 'Show keyboard shortcuts' },
];

const modifiers = ['mod', 'ctrl', 'meta', 'alt', 'shift'];
const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>;

function parse(keys: string, mac: boolean) {
  const parts = keys.split('+').map((p) => p.trim().toLowerCase());
  const key = parts.filter((p) => !modifiers.includes(p)).pop() ?? '';
  const has = (m: string) => parts.includes(m);
  return {
    key,
    ctrl: has('ctrl') || (has('mod') && !mac),
    meta: has('meta') || (has('mod') && mac),
    alt: has('alt'),
    shift: has('shift'),
  };
}

/** The same combination written two ways gives the same string, so conflicts can be found. */
export function normaliseKeys(keys: string, mac = isMac()) {
  const p = parse(keys, mac);
  return [p.ctrl && 'ctrl', p.meta && 'meta', p.alt && 'alt', p.shift && 'shift', p.key]
    .filter(Boolean)
    .join('+');
}

export function matchesKeys(event: KeyEventLike, keys: string, mac = isMac()) {
  const p = parse(keys, mac);
  // A symbol such as "?" already implies Shift on most keyboards, so Shift is not compared for symbols.
  const symbol = p.key.length === 1 && !/[a-z0-9]/.test(p.key);
  return (
    event.key.toLowerCase() === p.key &&
    event.ctrlKey === p.ctrl &&
    event.metaKey === p.meta &&
    event.altKey === p.alt &&
    (symbol || event.shiftKey === p.shift)
  );
}

/** Ids that share a key combination, as groups of two or more. */
export function findConflicts(shortcuts: Shortcut[], mac = isMac()) {
  const byKeys = new Map<string, string[]>();
  for (const s of shortcuts) {
    const k = normaliseKeys(s.keys, mac);
    byKeys.set(k, [...(byKeys.get(k) ?? []), s.id]);
  }
  return [...byKeys.values()].filter((ids) => ids.length > 1);
}

/** The key hint shown in tooltips and menus, for example "Ctrl+K" or "⌘K". */
export function formatKeys(keys: string, mac = isMac()) {
  const p = parse(keys, mac);
  const raw = keys.split('+').pop()!.trim();
  const key = raw.length === 1 ? raw.toUpperCase() : raw;
  const mods = mac
    ? [p.ctrl && '⌃', p.alt && '⌥', p.shift && '⇧', p.meta && '⌘']
    : [p.ctrl && 'Ctrl', p.alt && 'Alt', p.shift && 'Shift', p.meta && 'Meta'];
  return [...mods.filter(Boolean), key].join(mac ? '' : '+');
}

/** True while the user is typing, when a bare key must not trigger a shortcut. */
export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
