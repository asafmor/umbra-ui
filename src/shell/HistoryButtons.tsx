import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { IconButton } from '../basics/IconButton';
import { leaveDisabled } from '../internal/focus';
import { Menu } from '../overlays/Menu';
import { Icon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './HistoryButtons.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

/** One place the user was, for the menu of recent entries. */
export interface HistoryEntry {
  id: string;
  label: string;
  description?: ReactNode | undefined;
  icon?: ReactNode | undefined;
}

export interface HistoryButtonsProps extends RootAttributes {
  /** Router mode: whether there is somewhere to go. Leave both out to use the browser history. */
  canGoBack?: boolean | undefined;
  canGoForward?: boolean | undefined;
  /** Router mode: called in place of `history.back()` and `history.forward()`. */
  onBack?: (() => void) | undefined;
  onForward?: (() => void) | undefined;
  /** Recent places, newest first. They open from a caret, a long press or a right click on the buttons. */
  entries?: HistoryEntry[] | undefined;
  /** Called with the id of the entry the user chose. */
  onNavigate?: ((id: string) => void) | undefined;
  /** Ids of the shortcuts the buttons bind. `null` binds none. */
  backShortcut?: string | null | undefined;
  forwardShortcut?: string | null | undefined;
  /** Accessible names and tooltip texts. */
  backLabel?: string | undefined;
  forwardLabel?: string | undefined;
  /** Accessible name of the caret and of the menu of `entries`. */
  entriesLabel?: string | undefined;
  /** Accessible name of the group. */
  'aria-label'?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        backIcon?: Part | undefined;
        forwardIcon?: Part | undefined;
        entriesIcon?: Part | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The browser's Navigation API, where it exists (Chromium today). */
interface NavigationLike extends EventTarget {
  canGoBack: boolean;
  canGoForward: boolean;
}
const navigation = () =>
  typeof window === 'undefined'
    ? undefined
    : (window as { navigation?: NavigationLike | undefined }).navigation;
const subscribe = (notify: () => void) => {
  const nav = navigation();
  nav?.addEventListener('currententrychange', notify);
  return () => nav?.removeEventListener('currententrychange', notify);
};
// Without the API there is no way to know, so both stay enabled.
const browserCan = (key: 'canGoBack' | 'canGoForward') => () => navigation()?.[key] ?? true;
const always = () => true;

const longPressMs = 500;

/**
 * Back and forward. On their own they drive the browser history; with `onBack` and `onForward` they
 * drive the app's router.
 */
export function HistoryButtons({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  entries,
  onNavigate,
  backShortcut = 'umbra.history.back',
  forwardShortcut = 'umbra.history.forward',
  backLabel = 'Back',
  forwardLabel = 'Forward',
  entriesLabel = 'Recent',
  'aria-label': ariaLabel = 'History',
  parts,
  className,
  style,
  ...rest
}: HistoryButtonsProps) {
  const browserBack = useSyncExternalStore(subscribe, browserCan('canGoBack'), always);
  const browserForward = useSyncExternalStore(subscribe, browserCan('canGoForward'), always);
  const back = canGoBack ?? (onBack ? true : browserBack);
  const forward = canGoForward ?? (onForward ? true : browserForward);

  const hasEntries = !!entries && entries.length > 0;
  const [open, setOpen] = useState(false);
  // A long press opens the entries; the press that ends it must not also navigate.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);
  const startHold = () => {
    if (!hasEntries) return;
    held.current = false;
    timer.current = setTimeout(() => {
      held.current = true;
      setOpen(true);
    }, longPressMs);
  };
  const endHold = () => clearTimeout(timer.current);
  // "Back" at the first place and "Forward" at the last disable themselves under the focus, which
  // then goes to the other of the two (src/internal/focus.ts). With neither left, it stays put.
  const root = useRef<HTMLDivElement>(null);
  const pressed = useRef<Element | null>(null);
  useLayoutEffect(() => {
    const other = () => root.current?.querySelector<HTMLElement>('button:not(:disabled)');
    if (!leaveDisabled(pressed.current, other)) pressed.current = null;
  });
  const unlessHeld = (go: () => void) => () => {
    if (held.current) held.current = false;
    else {
      // Not when the shortcut did it, with the focus somewhere else.
      const active = document.activeElement;
      pressed.current = root.current?.contains(active) ? active : null;
      go();
    }
  };

  return (
    <div
      {...passThrough(rest)}
      ref={root}
      role="group"
      aria-label={ariaLabel}
      data-umbra="history-buttons"
      className={cx(styles.root, className)}
      style={style}
      // Capture: the buttons keep their pointer events to themselves.
      onPointerDownCapture={(event) => {
        if (event.button === 0 && !(event.target as Element).closest('[data-part="entriesTrigger"]'))
          startHold();
      }}
      onPointerUpCapture={endHold}
      onPointerCancelCapture={endHold}
      onPointerLeave={endHold}
      onContextMenu={(event) => {
        if (!hasEntries) return;
        event.preventDefault();
        setOpen(true);
      }}
    >
      <IconButton
        className={styles.button}
        icon={renderPart(parts?.backIcon, {}, () => (
          <Icon name="back" />
        ))}
        label={backLabel}
        shortcut={backShortcut ?? undefined}
        disabled={!back}
        onPress={unlessHeld(onBack ?? (() => window.history.back()))}
      />
      <IconButton
        className={styles.button}
        icon={renderPart(parts?.forwardIcon, {}, () => (
          <Icon name="forward" />
        ))}
        label={forwardLabel}
        shortcut={forwardShortcut ?? undefined}
        disabled={!forward}
        onPress={unlessHeld(onForward ?? (() => window.history.forward()))}
      />
      {hasEntries && (
        <Menu
          items={entries}
          aria-label={entriesLabel}
          open={open}
          onOpenChange={setOpen}
          onAction={onNavigate}
          trigger={
            <IconButton
              className={cx(styles.button, styles.caret)}
              icon={renderPart(parts?.entriesIcon, {}, () => (
                <Icon name="chevronDown" part="entriesTrigger" />
              ))}
              label={entriesLabel}
            />
          }
        />
      )}
    </div>
  );
}
