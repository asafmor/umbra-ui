// The end user's column controls (plan/specs/DataTable.md): the resize handle of a header and the list
// of the column menu. Both only report what the user asked for; the table (or the app) keeps the state.
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Checkbox } from '../inputs/Checkbox';
import { SearchField } from '../inputs/SearchField';
import { Menu, type MenuEntry } from '../overlays/Menu';
import { Icon } from '../provider/icons';
import { cx } from '../utils/parts';
import styles from './DataTable.module.css';

/** How far one arrow key moves a resize handle, in pixels. */
const RESIZE_STEP = 8;

export interface DataTableResizeHandleProps {
  /** Accessible name: "Resize Amount". */
  label: string;
  /** The column's width now and its limits, in the pixels drawn. */
  value: number;
  min: number;
  max: number;
  /**
   * `move` while the handle is dragged or an arrow key is pressed, then `commit` (release, Enter, or
   * the focus leaving) or `cancel` (Escape): put the old width back.
   */
  onResize: (width: number, phase: 'move' | 'commit' | 'cancel') => void;
  /** A double click: fit the column to its content. */
  onAutosize?: (() => void) | undefined;
  /**
   * `start`: the half of the pointer target that lies in the next header cell. It resizes the same
   * column, and is hidden from assistive technology and from the keyboard, which have the `end` one.
   */
  side?: 'end' | 'start' | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * The handle on the edge of a column header: a separator that a pointer drags, and that takes the
 * arrow keys once it has the focus. It keeps no width: it reports each one.
 */
export function ResizeHandle({
  label,
  value,
  min,
  max,
  onResize,
  onAutosize,
  side = 'end',
  className,
  style,
}: DataTableResizeHandleProps) {
  // The width while a resize is under way; `null` otherwise.
  const [draft, setDraft] = useState<number | null>(null);
  const live = useRef<number | null>(null);
  const report = (width: number | null, phase: 'move' | 'commit' | 'cancel') => {
    live.current = phase === 'move' ? width : null;
    setDraft(live.current);
    if (width !== null) onResize(Math.max(min, Math.min(max, Math.round(width))), phase);
  };
  const rtl = (el: Element) => getComputedStyle(el).direction === 'rtl';
  return (
    <span
      {...(side === 'end'
        ? {
            role: 'separator',
            'aria-orientation': 'vertical',
            'aria-label': label,
            'aria-valuenow': Math.round(draft ?? value),
            'aria-valuemin': min,
            'aria-valuemax': max,
            tabIndex: -1,
          }
        : { 'aria-hidden': true })}
      data-part="resizeHandle"
      data-side={side}
      data-grid-ignore=""
      data-resizing={draft !== null || undefined}
      className={cx(styles.resizeHandle, className)}
      style={style}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // No text selection, and the focus stays where it is.
        event.preventDefault();
        const el = event.currentTarget;
        const sign = rtl(el) ? -1 : 1;
        const start = event.clientX;
        el.setPointerCapture(event.pointerId);
        const width = (e: PointerEvent) => Math.max(min, Math.min(max, value + (e.clientX - start) * sign));
        const move = (e: PointerEvent) => report(width(e), 'move');
        const end = (e: PointerEvent) => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', end);
          el.removeEventListener('pointercancel', end);
          // A press without a move is not a resize: a double click is two of them.
          if (live.current !== null)
            report(e.type === 'pointerup' ? width(e) : value, e.type === 'pointerup' ? 'commit' : 'cancel');
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
      }}
      // No text is selected by the drag, nor by the two presses of a double click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onAutosize?.();
      }}
      onKeyDown={(event) => {
        const now = live.current ?? value;
        const grow = (event.key === 'ArrowRight') !== rtl(event.currentTarget) ? RESIZE_STEP : -RESIZE_STEP;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') report(now + grow, 'move');
        else if (event.key === 'Home') report(min, 'move');
        else if (event.key === 'End') report(max, 'move');
        else if (event.key === 'Enter') report(now, 'commit');
        else if (event.key === 'Escape') report(value, 'cancel');
        else return;
        event.preventDefault();
        event.stopPropagation();
      }}
      // The focus leaving keeps the width, as Enter does.
      onBlur={() => live.current !== null && report(live.current, 'commit')}
    />
  );
}

/** One row of the column menu. */
export interface DataTableColumnMenuItem {
  id: string;
  label: string;
  /** The column is drawn in the table. */
  visible: boolean;
  /** The table hid it for lack of room; the user did not. */
  noRoom?: boolean | undefined;
  pin?: 'start' | 'end' | undefined;
  /** `false`: the box is checked and disabled. */
  hideable?: boolean | undefined;
  /** `false`: no handle. */
  reorderable?: boolean | undefined;
}

export interface DataTableColumnMenuProps {
  /** Every column, in the order it is drawn. */
  items: DataTableColumnMenuItem[];
  onVisibleChange: (id: string, visible: boolean) => void;
  /** The column's new position in `items`, from 0. Without it there are no handles. */
  onMove?: ((id: string, to: number) => void) | undefined;
  /** Without it the handle's menu has no pin rows. */
  onPinChange?: ((id: string, pin: 'start' | 'end' | 'none') => void) | undefined;
  onShowAll?: (() => void) | undefined;
  onReset?: (() => void) | undefined;
  /** The search field shows from this many columns up. Default 10. */
  searchFrom?: number | undefined;
  showAllLabel?: string | undefined;
  resetLabel?: string | undefined;
  searchLabel?: string | undefined;
  /** Shown when the search matches no column. */
  emptyLabel?: string | undefined;
  noRoomLabel?: string | undefined;
  /** Accessible name of a handle; the column's label is added: "Move Region". */
  moveLabel?: string | undefined;
  moveUpLabel?: string | undefined;
  moveDownLabel?: string | undefined;
  pinStartLabel?: string | undefined;
  pinEndLabel?: string | undefined;
  unpinLabel?: string | undefined;
  /** Wraps or replaces one row. `children` is the default row. */
  renderItem?: ((item: DataTableColumnMenuItem, children: ReactNode) => ReactNode) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * The list of the column menu, without its popover: a handle to move each column (drag it, Alt or
 * Ctrl + Arrow Up / Down, or the actions it opens), a checkbox to show it, and what the table did to it.
 */
export function ColumnMenu({
  items,
  onVisibleChange,
  onMove,
  onPinChange,
  onShowAll,
  onReset,
  searchFrom = 10,
  showAllLabel = 'Show all',
  resetLabel = 'Reset',
  searchLabel = 'Search columns',
  emptyLabel = 'No columns match',
  noRoomLabel = 'No room',
  moveLabel = 'Move',
  moveUpLabel = 'Move up',
  moveDownLabel = 'Move down',
  pinStartLabel = 'Pin to start',
  pinEndLabel = 'Pin to end',
  unpinLabel = 'Unpin',
  renderItem,
  className,
  style,
}: DataTableColumnMenuProps) {
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  /** The column whose handle has its actions open, and the handle they open against. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const openItem = items.find((item) => item.id === openMenu);
  /** Where a dragged column would land: its new position, and the line that shows it. */
  const [drop, setDrop] = useState<{ id: string; top: number } | null>(null);
  const dragged = useRef(false);
  // A moved row is the same element in a new place, which the browser may have blurred on the way.
  const refocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = refocus.current;
    refocus.current = null;
    if (id === null) return;
    const row = [...(list.current?.children ?? [])].find((el) => (el as HTMLElement).dataset.col === id);
    row?.querySelector<HTMLElement>('button')?.focus();
  });

  const text = query.trim().toLowerCase();
  const shown = text ? items.filter((item) => item.label.toLowerCase().includes(text)) : items;
  const visibleCount = items.filter((item) => item.visible).length;
  /** The positions a column may move to: those of its own pin group. */
  const range = (item: DataTableColumnMenuItem) => {
    const mine = items.flatMap((other, index) => (other.pin === item.pin ? [index] : []));
    return [mine[0]!, mine[mine.length - 1]!] as const;
  };
  const move = (item: DataTableColumnMenuItem, to: number) => {
    refocus.current = item.id;
    onMove?.(item.id, to);
  };

  const startDrag = (item: DataTableColumnMenuItem, index: number) => (event: React.PointerEvent) => {
    dragged.current = false;
    const el = list.current;
    if (event.button !== 0 || !el) return;
    const startY = event.clientY;
    const [first, last] = range(item);
    let to = index;
    const onMoveEvent = (e: PointerEvent) => {
      if (!dragged.current && Math.abs(e.clientY - startY) < 4) return;
      dragged.current = true;
      // Near the top or bottom edge the list scrolls under the pointer.
      const box = el.getBoundingClientRect();
      if (e.clientY < box.top + 24) el.scrollTop -= 12;
      else if (e.clientY > box.bottom - 24) el.scrollTop += 12;
      const rows = [...el.querySelectorAll<HTMLElement>(':scope > li[data-col]')];
      // The gap the pointer is nearest to, counted in rows above it.
      const gap = rows.filter((row) => {
        const b = row.getBoundingClientRect();
        return e.clientY > b.top + b.height / 2;
      }).length;
      to = Math.max(first, Math.min(last, gap > index ? gap - 1 : gap));
      const line = to > index ? to + 1 : to;
      const top =
        rows[line]?.offsetTop ?? rows[rows.length - 1]!.offsetTop + rows[rows.length - 1]!.offsetHeight;
      setDrop({ id: item.id, top });
    };
    const end = (e: PointerEvent) => {
      document.removeEventListener('pointermove', onMoveEvent);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', end);
      setDrop(null);
      if (dragged.current && e.type === 'pointerup' && to !== index) move(item, to);
    };
    document.addEventListener('pointermove', onMoveEvent);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  };

  const actionsOf = (item: DataTableColumnMenuItem): MenuEntry[] => {
    const index = items.indexOf(item);
    const [first, last] = range(item);
    const canMove = !!onMove && item.reorderable !== false && !text;
    return [
      ...(canMove
        ? [
            { id: 'up', label: moveUpLabel, disabled: index <= first },
            { id: 'down', label: moveDownLabel, disabled: index >= last },
          ]
        : []),
      ...(onPinChange
        ? [
            ...(canMove ? [{ type: 'separator' as const }] : []),
            ...(item.pin !== 'start' ? [{ id: 'start', label: pinStartLabel }] : []),
            ...(item.pin !== 'end' ? [{ id: 'end', label: pinEndLabel }] : []),
            ...(item.pin ? [{ id: 'none', label: unpinLabel }] : []),
          ]
        : []),
    ];
  };

  const row = (item: DataTableColumnMenuItem) => {
    const index = items.indexOf(item);
    const [first, last] = range(item);
    const canMove = !!onMove && item.reorderable !== false && !text;
    const actions = actionsOf(item);
    const content = (
      <li
        key={item.id}
        data-part="columnMenuItem"
        data-col={item.id}
        data-visible={item.visible || undefined}
        data-no-room={item.noRoom || undefined}
        data-pin={item.pin}
        data-dragging={drop?.id === item.id || undefined}
        className={styles.columnMenuItem}
      >
        {actions.length > 0 ? (
          // A plain button, not a menu trigger: a menu opens on the press itself, which a drag begins with.
          <button
            type="button"
            className={styles.columnHandle}
            aria-label={`${moveLabel} ${item.label}`}
            aria-haspopup="menu"
            aria-expanded={openMenu === item.id}
            aria-keyshortcuts={canMove ? 'Alt+ArrowUp Alt+ArrowDown' : undefined}
            onPointerDown={canMove ? startDrag(item, index) : undefined}
            // A press that ended a drag is not a press of the button.
            onClick={(event) => {
              if (dragged.current) return;
              anchor.current = event.currentTarget;
              setOpenMenu(item.id);
            }}
            onKeyDown={(event) => {
              if (!canMove || !(event.altKey || event.ctrlKey)) return;
              if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
              event.preventDefault();
              const to = Math.max(first, Math.min(last, index + (event.key === 'ArrowUp' ? -1 : 1)));
              if (to !== index) move(item, to);
            }}
          >
            <Icon name="dragHandle" />
          </button>
        ) : (
          <span className={styles.columnHandle} />
        )}
        <Checkbox
          size="small"
          checked={item.visible}
          // A column that cannot be hidden, and the last one shown.
          disabled={item.hideable === false || (item.visible && visibleCount <= 1)}
          onChange={(checked) => onVisibleChange(item.id, checked)}
          className={styles.columnCheck}
        >
          <span className={styles.columnLabel}>{item.label}</span>
          {item.noRoom && (
            <span data-part="noRoom" className={styles.columnNote}>
              {noRoomLabel}
            </span>
          )}
          {item.pin && (
            <span data-part="pinMark" className={styles.columnNote}>
              <Icon name="pin" />
              <span className={styles.srOnly}>{item.pin === 'start' ? pinStartLabel : pinEndLabel}</span>
            </span>
          )}
        </Checkbox>
      </li>
    );
    return renderItem ? renderItem(item, content) : content;
  };

  return (
    <div data-part="columnMenu" className={cx(styles.columnMenu, className)} style={style}>
      <div className={styles.columnMenuBar}>
        {items.length >= searchFrom && (
          <SearchField
            size="small"
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={query}
            onChange={setQuery}
          />
        )}
        <span className={styles.columnMenuActions}>
          {onShowAll && (
            <Button size="small" variant="ghost" onPress={onShowAll}>
              {showAllLabel}
            </Button>
          )}
          {onReset && (
            <Button size="small" variant="ghost" onPress={onReset}>
              {resetLabel}
            </Button>
          )}
        </span>
      </div>
      <ul ref={list} className={styles.columnList} data-dragging={drop ? '' : undefined}>
        {shown.map(row)}
        {drop && (
          <li
            aria-hidden="true"
            data-part="dropIndicator"
            className={styles.dropIndicator}
            style={{ top: drop.top }}
          />
        )}
      </ul>
      {openItem && (
        <Menu
          aria-label={`${moveLabel} ${openItem.label}`}
          anchorRef={anchor}
          open
          onOpenChange={(open) => !open && setOpenMenu(null)}
          items={actionsOf(openItem)}
          onAction={(id) => {
            const index = items.indexOf(openItem);
            if (id === 'up') move(openItem, index - 1);
            else if (id === 'down') move(openItem, index + 1);
            else {
              refocus.current = openItem.id;
              onPinChange?.(openItem.id, id as 'start' | 'end' | 'none');
            }
          }}
        />
      )}
      {shown.length === 0 && (
        <p data-part="empty" className={styles.columnMenuEmpty}>
          {emptyLabel}
        </p>
      )}
    </div>
  );
}
