/** One key binding in the app's shortcut registry. */
export interface Shortcut {
  /** Stable id, used by the `shortcut` prop of buttons. */
  id: string;
  /** The key combination, for example `Mod+K`, `Shift+S`, `?`. `Mod` is Command on macOS and Ctrl elsewhere. */
  keys: string;
  /** Human-readable name, shown in the shortcuts sheet. */
  label: string;
  /** Called when the keys are pressed, unless a mounted component has bound the id. */
  action?: (() => void) | undefined;
  /**
   * Whether the keys work while the user types in a field. By default a combination with Ctrl, Command
   * or Alt does, and a bare key does not.
   */
  whenTyping?: boolean | undefined;
  /** Heading the shortcut is listed under in the shortcuts sheet. Without one it is listed with the ungrouped. */
  group?: string | undefined;
}

/** Keys the library reserves (plan/specs/UmbraProvider.md). */
export const reservedShortcuts: Shortcut[] = [
  { id: 'umbra.commandPalette', keys: 'Mod+K', label: 'Open command palette' },
  { id: 'umbra.shortcutsSheet', keys: '?', label: 'Show keyboard shortcuts' },
  { id: 'umbra.history.back', keys: 'Alt+ArrowLeft', label: 'Go back', whenTyping: false },
  { id: 'umbra.history.forward', keys: 'Alt+ArrowRight', label: 'Go forward', whenTyping: false },
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

/** Two shortcuts on one key combination: `winner` keeps the keys, `loser` is left without any. */
export interface ShortcutConflict {
  keys: string;
  winner: string;
  loser: string;
  /** The loser is a library default that the app replaced. */
  reserved: boolean;
}

export interface ShortcutRegistry {
  /** Every shortcut by id. An app shortcut with the id of a reserved one replaces it (new keys, no conflict). */
  shortcuts: Map<string, Shortcut>;
  /** Normalised keys to the id that owns them. */
  owners: Map<string, string>;
  conflicts: ShortcutConflict[];
}

/**
 * Decides who owns each key combination. An app shortcut takes the keys of a library default, and of
 * two app shortcuts on the same keys the one registered last wins. The loser keeps its id and label
 * but has no keys: it shows no hint and never runs from the keyboard.
 */
export function resolveShortcuts(
  app: Shortcut[] = [],
  reserved: Shortcut[] = reservedShortcuts,
  mac = isMac(),
): ShortcutRegistry {
  const shortcuts = new Map<string, Shortcut>();
  for (const s of [...reserved, ...app]) shortcuts.set(s.id, s);
  const appIds = new Set(app.map((s) => s.id));
  const owners = new Map<string, string>();
  const conflicts: ShortcutConflict[] = [];
  // Reserved shortcuts come first in the map, so an app shortcut always meets them as the later one.
  for (const s of shortcuts.values()) {
    const keys = normaliseKeys(s.keys, mac);
    const loser = owners.get(keys);
    if (loser !== undefined)
      conflicts.push({ keys: s.keys, winner: s.id, loser, reserved: !appIds.has(loser) });
    owners.set(keys, s.id);
  }
  return { shortcuts, owners, conflicts };
}

/** The shortcut when it owns its keys; undefined for an unknown id or one that lost its keys. */
export function ownedShortcut(registry: ShortcutRegistry, id: string | undefined, mac = isMac()) {
  const shortcut = id === undefined ? undefined : registry.shortcuts.get(id);
  return shortcut && registry.owners.get(normaliseKeys(shortcut.keys, mac)) === id ? shortcut : undefined;
}

/** The warning for one conflict, naming both shortcuts. */
export const conflictMessage = (c: ShortcutConflict) =>
  c.reserved
    ? `shortcut "${c.winner}" takes ${c.keys} from the library default "${c.loser}", which now has no keys.`
    : `shortcuts "${c.loser}" and "${c.winner}" both use ${c.keys}; "${c.winner}" was registered last and wins.`;

/** The warnings not given yet. `reported` remembers them, so each conflict is reported once. */
export function unreportedConflicts(registry: ShortcutRegistry, reported: Set<string>) {
  const messages = registry.conflicts.map(conflictMessage).filter((message) => !reported.has(message));
  for (const message of messages) reported.add(message);
  return messages;
}

/**
 * The shortcut a key press belongs to. A repeated key (held down) and an event something else already
 * handled belong to none.
 */
export function shortcutForEvent(
  event: KeyEventLike & Partial<Pick<KeyboardEvent, 'repeat' | 'defaultPrevented'>>,
  registry: ShortcutRegistry,
  mac = isMac(),
) {
  if (event.repeat || event.defaultPrevented) return undefined;
  for (const id of registry.owners.values()) {
    const shortcut = registry.shortcuts.get(id)!;
    if (matchesKeys(event, shortcut.keys, mac)) return shortcut;
  }
  return undefined;
}

const arrows: Record<string, string> = { arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓' };

/** The keys of a combination one by one, as they are written for the platform: `['Ctrl', 'K']` or `['⌘', 'K']`. */
export function keyCaps(keys: string, mac = isMac()) {
  const p = parse(keys, mac);
  const raw = keys.split('+').pop()!.trim();
  const key = raw.length === 1 ? raw.toUpperCase() : (arrows[raw.toLowerCase()] ?? raw);
  const mods = mac
    ? [p.ctrl && '⌃', p.alt && '⌥', p.shift && '⇧', p.meta && '⌘']
    : [p.ctrl && 'Ctrl', p.alt && 'Alt', p.shift && 'Shift', p.meta && 'Meta'];
  return [...mods.filter((m): m is string => !!m), key];
}

/** The key hint shown in tooltips and menus, for example "Ctrl+K" or "⌘K". */
export const formatKeys = (keys: string, mac = isMac()) => keyCaps(keys, mac).join(mac ? '' : '+');

/** One shortcut as the shortcuts sheet and the command palette list it. */
export interface ShortcutEntry {
  id: string;
  label: string;
  /** The combination as it was registered, for example `Mod+K`. */
  keys: string;
  /** The heading it is listed under; undefined for an app shortcut without a `group`. */
  group: string | undefined;
  /** One of the library's own shortcuts (by id, so also one the app gave new keys). */
  reserved: boolean;
  action: (() => void) | undefined;
}

/**
 * What a list of shortcuts shows: every shortcut that has a label and owns its keys, so of two on the
 * same keys only the winner (`resolveShortcuts`). In the order of registration, the library's own first.
 */
export function listShortcuts(registry: ShortcutRegistry, reserved: Shortcut[] = reservedShortcuts) {
  const reservedIds = new Set(reserved.map((s) => s.id));
  return [...registry.owners.values()]
    .map((id) => registry.shortcuts.get(id)!)
    .filter((s) => s.label)
    .map((s): ShortcutEntry => ({
      id: s.id,
      label: s.label,
      keys: s.keys,
      group: s.group,
      reserved: reservedIds.has(s.id),
      action: s.action,
    }));
}

/** True while the user is typing, when a bare key must not trigger a shortcut. */
export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
