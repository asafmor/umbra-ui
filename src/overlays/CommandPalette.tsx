import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { dataState } from '../internal/dataState';
import { Icon, IconSlot } from '../provider/icons';
import { useScopeAttributes, useShortcut, useShortcutList } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import { filterCommands } from './commandMatch';
import styles from './CommandPalette.module.css';
import { Hint } from './Menu';
import { useOpenState, useReturnFocusOnClose } from './shared';

/** One entry of the palette: a page to go to, a thing to open, or an action. */
export interface Command {
  id: string;
  label: string;
  /** A second, quieter line. It is searched too. */
  description?: string;
  icon?: ReactNode;
  /** Heading of the group the command is listed under. */
  section?: string;
  /** More words the command is found by. */
  keywords?: string[];
  /** Id of a shortcut in the provider's list: its keys are shown at the end of the row. */
  shortcut?: string;
  /** Where the command goes. The palette calls `navigate` with it. */
  href?: string;
  onRun?: () => void;
  disabled?: boolean;
  /** Leaves the palette open after the command ran. */
  keepOpen?: boolean;
  /** Makes the command a page: choosing it lists these in place of the current list. */
  children?: Command[];
}

/** What the `item` part receives. */
export interface CommandItemPartProps {
  command: Command;
  /** The row the arrow keys are on. */
  active: boolean;
  /** The default content of the row. */
  children: ReactNode;
}

export interface CommandPaletteProps {
  /** A fixed list. The palette filters and ranks it as the user types. */
  commands?: Command[];
  /**
   * Called with the text (after `debounce`) and the open page, for results the app looks up. They are
   * listed after the matches from `commands`, as given. An answer that arrives late is dropped.
   */
  onQuery?: (text: string, page: Command | undefined) => Command[] | Promise<Command[]>;
  /** Milliseconds to wait after the last key before `onQuery` is called. */
  debounce?: number;
  /** Shows the loading rows, in addition to the time `onQuery` takes. */
  loading?: boolean;
  /** Shows the error state: text, a node, or `true` for the default text. A failed `onQuery` shows it too. */
  error?: ReactNode;
  /** Ids of recently used commands, newest first. Listed first while the input is empty. */
  recent?: string[];
  /** Lists every shortcut of the provider's registry that has a label, with its keys. */
  includeShortcuts?: boolean;
  /** Controlled state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called with every command the user runs, after its own `onRun`. */
  onRun?: (command: Command) => void;
  /** Called with the `href` of a command that has one. Defaults to a full page navigation. */
  navigate?: (href: string) => void;
  /** Id of the shortcut that opens and closes the palette. `null` binds none. */
  shortcut?: string | null;
  /** Accessible name of the dialog and of the input. */
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  loadingLabel?: string;
  recentLabel?: string;
  shortcutsLabel?: string;
  /** Accessible name of the list of results. */
  resultsLabel?: string;
  /** Accessible name of the breadcrumb button that leaves the open page. */
  backLabel?: string;
  /** The key hints in the footer. */
  moveHint?: string;
  runHint?: string;
  backHint?: string;
  closeHint?: string;
  /** Replace or hide named pieces. */
  parts?: {
    /** The icon before the input. */
    searchIcon?: Part;
    /** The content of a row. */
    item?: Part<CommandItemPartProps>;
    sectionHeader?: Part<{ children: ReactNode }>;
    /** Shown when nothing matches. */
    empty?: Part<{ query: string }>;
    footer?: Part<{ children: ReactNode }>;
  };
  /** On the palette's panel. */
  className?: string;
  style?: CSSProperties;
}

interface Row {
  command: Command;
  section: string | undefined;
  /** A key hint to show as it is, for a row that comes from the shortcut registry. */
  keys?: string;
}

/** Rows in the order they are shown: grouped by section, sections in order of first appearance. */
function grouped(rows: Row[]) {
  const groups = new Map<string | undefined, Row[]>();
  for (const row of rows) groups.set(row.section, [...(groups.get(row.section) ?? []), row]);
  return [...groups.entries()];
}

type PanelProps = Omit<
  CommandPaletteProps,
  'open' | 'defaultOpen' | 'onOpenChange' | 'className' | 'style'
> & {
  close: () => void;
};

// Mounted while the palette is open, so every opening starts from an empty input on the first page.
function Panel({
  commands = [],
  onQuery,
  debounce = 150,
  loading = false,
  error,
  recent,
  includeShortcuts = false,
  onRun,
  navigate = (href) => window.location.assign(href),
  shortcut,
  label = 'Command palette',
  placeholder = 'Type a command or search',
  emptyLabel = 'No results',
  errorLabel = 'Something went wrong',
  retryLabel = 'Try again',
  loadingLabel = 'Searching',
  recentLabel = 'Recent',
  shortcutsLabel = 'Keyboard shortcuts',
  resultsLabel = 'Results',
  backLabel = 'Back',
  moveHint = 'Move',
  runHint = 'Run',
  backHint = 'Back',
  closeHint = 'Close',
  parts,
  close,
}: PanelProps) {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<Command[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const page = pages.at(-1);

  // Results the app looks up. `request` changes whenever a new lookup is due.
  const [found, setFound] = useState<{ status: 'idle' | 'loading' | 'error'; results: Command[] }>({
    status: onQuery ? 'loading' : 'idle',
    results: [],
  });
  const [attempt, setAttempt] = useState(0);
  const lookup = useRef(onQuery);
  useEffect(() => {
    lookup.current = onQuery;
  });
  const hasLookup = !!onQuery;
  const opened = useRef(false);
  useEffect(() => {
    if (!hasLookup) return;
    // An answer to an earlier text, or one that arrives after closing, is dropped.
    let stale = false;
    // The lookup on opening is not typing: it starts at once.
    const wait = opened.current ? debounce : 0;
    opened.current = true;
    const timer = setTimeout(
      () =>
        // Inside the chain, so a lookup that throws at once is an error like one that rejects.
        Promise.resolve()
          .then(() => lookup.current?.(query, page) ?? [])
          .then(
            (results) => stale || setFound({ status: 'idle', results }),
            () => stale || setFound({ status: 'error', results: [] }),
          ),
      wait,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [hasLookup, query, page, attempt, debounce]);
  /** A change of text or page: back to the first row, and a new lookup is on its way. */
  const restart = () => {
    setActiveIndex(0);
    if (hasLookup) setFound((f) => ({ status: 'loading', results: f.results }));
  };

  const shortcuts = useShortcutList();
  const source = page ? (page.children ?? []) : commands;
  const rows: Row[] = [];
  if (!page && !query.trim() && recent) {
    for (const recentId of recent) {
      const command = commands.find((c) => c.id === recentId);
      if (command) rows.push({ command, section: recentLabel });
    }
  }
  for (const command of filterCommands(source, query)) rows.push({ command, section: command.section });
  for (const command of found.results) rows.push({ command, section: command.section });
  if (includeShortcuts && !page) {
    const listed = shortcuts
      .filter((s) => s.id !== shortcut && s.canRun())
      .map((s) => ({ id: `shortcut:${s.id}`, label: s.label, keys: s.keys, onRun: s.run }));
    for (const { keys, ...command } of filterCommands(listed, query))
      rows.push({ command, keys, section: shortcutsLabel });
  }
  const groups = grouped(rows);
  const ordered = groups.flatMap(([, group]) => group);
  const enabled = ordered.flatMap((row, index) => (row.command.disabled ? [] : [index]));
  const active = enabled.includes(activeIndex) ? activeIndex : (enabled[0] ?? -1);
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [id, active]);

  const openPage = (next: Command[]) => {
    setPages(next);
    setQuery('');
    restart();
  };
  const run = (row: Row | undefined) => {
    const command = row?.command;
    if (!command || command.disabled) return;
    if (command.children) return openPage([...pages, command]);
    command.onRun?.();
    onRun?.(command);
    if (command.href) navigate(command.href);
    if (!command.keepOpen) close();
  };

  const step = (by: number, wrap: boolean) => {
    if (enabled.length === 0) return;
    const at = Math.max(0, enabled.indexOf(active)) + by;
    const last = enabled.length - 1;
    const next = wrap ? (at + enabled.length) % enabled.length : Math.min(last, Math.max(0, at));
    setActiveIndex(enabled[next]!);
  };
  /** How many rows one PageUp or PageDown moves: what fits in the list, less one. */
  const pageSize = () => {
    const row = list.current?.querySelector<HTMLElement>('[role="option"]');
    return row && list.current
      ? Math.max(1, Math.floor(list.current.clientHeight / row.offsetHeight) - 1)
      : 8;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const keys: Record<string, () => void> = {
      ArrowDown: () => step(1, true),
      ArrowUp: () => step(-1, true),
      PageDown: () => step(pageSize(), false),
      PageUp: () => step(-pageSize(), false),
      Home: () => step(-enabled.length, false),
      End: () => step(enabled.length, false),
      Enter: () => run(ordered[active]),
    };
    const key = keys[event.key];
    if (key) {
      event.preventDefault();
      return key();
    }
    // Escape and Backspace on an empty input leave the open page first.
    const leaves = event.key === 'Escape' || (event.key === 'Backspace' && query === '');
    if (leaves && pages.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      openPage(pages.slice(0, -1));
    }
  };

  const busy = loading || found.status === 'loading';
  const failed = error || found.status === 'error';
  const errorState = dataState(
    {
      error: failed ? (error === true || !error ? errorLabel : error) : undefined,
      onRetry: found.status === 'error' ? () => (setAttempt((a) => a + 1), restart()) : undefined,
      retryLabel,
    },
    { isEmpty: false, variant: 'inline' },
  );
  const hint = (keys: string, text: string) => (
    <span className={styles.hint}>
      <kbd>{keys}</kbd> {text}
    </span>
  );
  let index = -1;
  return (
    <>
      <div data-part="search" className={styles.search}>
        {renderPart(parts?.searchIcon, {}, () => (
          <Icon name="search" part="searchIcon" />
        ))}
        {pages.map((crumb, depth) => (
          <button
            key={crumb.id}
            type="button"
            data-part="breadcrumb"
            className={styles.crumb}
            aria-label={`${backLabel}: ${crumb.label}`}
            // The input keeps the focus; a crumb leaves its page and the pages after it.
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => openPage(pages.slice(0, depth))}
          >
            {crumb.label}
          </button>
        ))}
        <input
          autoFocus
          role="combobox"
          aria-label={label}
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          data-part="input"
          className={styles.input}
          placeholder={page ? page.label : placeholder}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            restart();
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {/* A press on a row must not take the focus from the input. */}
      <div
        ref={list}
        id={`${id}-list`}
        role="listbox"
        aria-label={resultsLabel}
        aria-busy={busy || undefined}
        data-part="list"
        className={styles.list}
        onMouseDown={(event) => event.preventDefault()}
      >
        {groups.map(([section, group]) => (
          <div
            key={section ?? ''}
            role="group"
            aria-label={section}
            data-part="section"
            className={styles.section}
          >
            {section !== undefined &&
              renderPart(parts?.sectionHeader, { children: section }, (p) => (
                <div role="presentation" data-part="sectionHeader" className={styles.sectionHeader}>
                  {p.children}
                </div>
              ))}
            {group.map((row) => {
              const at = ++index;
              const { command } = row;
              const isActive = at === active;
              return (
                <div
                  key={at}
                  id={optionId(at)}
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={command.disabled || undefined}
                  data-part="item"
                  data-active={isActive || undefined}
                  data-disabled={command.disabled || undefined}
                  className={styles.item}
                  onPointerMove={() => !command.disabled && at !== active && setActiveIndex(at)}
                  onClick={() => run(row)}
                >
                  {renderPart(
                    parts?.item,
                    {
                      command,
                      active: isActive,
                      children: (
                        <>
                          <IconSlot part="icon">{command.icon}</IconSlot>
                          <span className={styles.text}>
                            <span data-part="label" className={styles.label}>
                              {command.label}
                            </span>
                            {command.description && (
                              <span data-part="description" className={styles.description}>
                                {command.description}
                              </span>
                            )}
                          </span>
                          {row.keys && (
                            <kbd data-part="hint" className={styles.keys}>
                              {row.keys}
                            </kbd>
                          )}
                          {command.shortcut && <Hint id={command.shortcut} />}
                          {command.children && <Icon name="chevronRight" part="pageIndicator" />}
                        </>
                      ),
                    },
                    (p) => p.children,
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {busy && (
        // Rows of the final height, under the results that are already there.
        <div role="status" aria-label={loadingLabel} data-part="loading" className={styles.loading}>
          {[70, 50, 60].map((width) => (
            <div key={width} className={styles.item}>
              <Skeleton shape="circle" width="1.25em" height="1.25em" />
              <Skeleton width={`${width}%`} />
            </div>
          ))}
        </div>
      )}
      {errorState && <div className={styles.state}>{errorState}</div>}
      {!busy &&
        !errorState &&
        ordered.length === 0 &&
        renderPart(parts?.empty, { query }, () => (
          <div role="status" data-part="empty" className={styles.state}>
            {emptyLabel}
          </div>
        ))}
      {renderPart(
        parts?.footer,
        {
          children: (
            <>
              {hint('↑↓', moveHint)}
              {hint('Enter', runHint)}
              {pages.length > 0 && hint('Backspace', backHint)}
              {hint('Esc', pages.length > 0 ? backHint : closeHint)}
            </>
          ),
        },
        (p) => (
          <div data-part="footer" className={styles.footer}>
            {p.children}
          </div>
        ),
      )}
    </>
  );
}

/**
 * A search over everything the app can do or open, in a dialog near the top of the window. Opened by
 * the `TopBar` search and by `Mod+K`. Focus stays in the input; the arrow keys move through the results.
 */
export function CommandPalette({
  open,
  defaultOpen,
  onOpenChange,
  shortcut = 'umbra.commandPalette',
  label = 'Command palette',
  className,
  style,
  ...panel
}: CommandPaletteProps) {
  const scope = useScopeAttributes();
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  useShortcut(shortcut ?? undefined, shortcut ? () => setOpen(!isOpen) : undefined);
  const dialog = useRef<HTMLElement>(null);
  useReturnFocusOnClose(isOpen, dialog);
  return (
    <ModalOverlay
      {...scope}
      isOpen={isOpen}
      onOpenChange={setOpen}
      isDismissable
      data-umbra-overlay=""
      className={styles.overlay}
      style={scope.style}
    >
      <Modal data-umbra="command-palette" className={cx(styles.root, className)} style={style}>
        <Dialog ref={dialog} aria-label={label} className={styles.dialog}>
          <Panel {...panel} shortcut={shortcut} label={label} close={() => setOpen(false)} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
