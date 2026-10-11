// Keyboard navigation of the grid (plan/specs/DataTable.md, "Interaction and accessibility").
//
// The table is one tab stop. Which cell is active is remembered as a row key and a column id, not as
// an element or an index, so it survives sorting, column hiding and virtualised scrolling. Columns are
// read from the DOM (so spanning cells need no model); rows come from the DOM too, unless the
// virtualised table supplies its own list, because most of its rows are not in the DOM.
import { createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react';

export const CELL = '[data-cell]';
const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
const WIDGET =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]';
/** Widgets that have no use for the arrow keys: from them, the arrows still move through the grid. */
const SIMPLE_WIDGET = 'a, button, input[type="checkbox"], input[type="radio"]';
/** A click on one of these is the control's own, not the row's. */
export const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [contenteditable]';

/**
 * The controls of a cell. What is hidden from assistive technology is not one: a `Select` keeps a
 * native `<select>` there for forms and autofill.
 */
export const widgetsOf = (cell: Element) =>
  [...cell.querySelectorAll<HTMLElement>(WIDGET)].filter(
    (el) => !el.matches(CELL) && !el.closest('[aria-hidden="true"]'),
  );

/** What a row does when it is activated or selected from the keyboard. Set by `DataTable.Row`. */
export interface RowHandlers {
  onAction?: () => void;
  onSelect?: (options: { range: boolean; anchor?: boolean }) => void;
}
export const rowHandlers = new WeakMap<Element, RowHandlers>();
/** What Ctrl or Cmd+A does in a table, by its `<table>` element. Set by `DataTable.Root`. */
export const selectAllHandlers = new WeakMap<Element, () => void>();

/** Supplied by the virtualised table, whose rows are mostly not in the DOM. */
export interface GridAdapter {
  /** The key of every row, in display order, header and footer rows included. */
  keys: string[];
  /** Scrolls so that the row is rendered. Synchronous. */
  ensure: (key: string) => void;
  /** The row that must stay rendered because it holds the tab stop. */
  onActiveRow: (key: string) => void;
}
export const GridAdapterContext = createContext<GridAdapter | null>(null);

const colStart = (cell: Element) => {
  let start = 0;
  for (let c = cell.previousElementSibling; c; c = c.previousElementSibling) {
    start += (c as HTMLTableCellElement).colSpan || 1;
  }
  return start;
};

/** The focusable cell of a row that covers a column, or the nearest one. */
function cellAt(row: Element, column: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let distance = Infinity;
  let start = 0;
  for (const cell of row.children) {
    const end = start + ((cell as HTMLTableCellElement).colSpan || 1);
    if (cell.matches(CELL)) {
      const d = column < start ? start - column : column >= end ? column - end + 1 : 0;
      if (d < distance) [best, distance] = [cell as HTMLElement, d];
    }
    start = end;
  }
  return best;
}

/** Scrolls a cell into view, clear of the sticky header, group row, footer and pinned columns. */
function reveal(cell: HTMLElement) {
  const view = cell.closest<HTMLElement>('[data-part="viewport"]');
  const table = cell.closest('table');
  const row = cell.parentElement;
  if (!view || !table || !row) return;
  const v = view.getBoundingClientRect();
  const c = cell.getBoundingClientRect();
  if (row.parentElement?.tagName === 'TBODY') {
    const group = row.dataset.kind === 'group' ? null : table.querySelector<HTMLElement>('tr[data-sticky]');
    const top = v.top + (table.tHead?.offsetHeight ?? 0) + (group?.offsetHeight ?? 0);
    const bottom = v.top + view.clientHeight - (table.tFoot?.offsetHeight ?? 0);
    if (c.top < top) view.scrollTop -= top - c.top;
    else if (c.bottom > bottom) view.scrollTop += c.bottom - bottom;
  }
  if (!cell.dataset.pin && (cell as HTMLTableCellElement).colSpan === 1) {
    const inset = (side: string) =>
      [...row.querySelectorAll<HTMLElement>(`:scope > [data-pin="${side}"]`)].reduce(
        (sum, pinned) => sum + pinned.offsetWidth,
        0,
      );
    const rtl = getComputedStyle(table).direction === 'rtl';
    const left = v.left + inset(rtl ? 'end' : 'start');
    const right = v.left + view.clientWidth - inset(rtl ? 'start' : 'end');
    if (c.left < left) view.scrollLeft -= left - c.left;
    else if (c.right > right) view.scrollLeft += c.right - right;
  }
}

/** The grid behaviour of one table element: roving tab stop, arrow keys, and focus that is not lost. */
export function useGrid() {
  const adapter = useContext(GridAdapterContext);
  const latest = useRef(adapter);
  const table = useRef<HTMLTableElement>(null);
  const active = useRef<{ row: string; col: string } | null>(null);
  /** The column the user is in; kept while moving up and down through cells that span columns. */
  const cursor = useRef(0);
  const tabStop = useRef<HTMLElement | null>(null);
  /** Focus is believed to be in the grid: if the focused element is removed, it is taken back. */
  const hasFocus = useRef(false);
  /** The last input was a pointer: a cell focused by a click is not scrolled to. */
  const pointer = useRef(false);
  /** The row a Shift+Arrow last moved to: the next one from that row continues the same range. */
  const shiftRun = useRef<Element | null>(null);

  const rowOf = (key: string) =>
    table.current?.querySelector<HTMLTableRowElement>(`tr[data-row-key="${CSS.escape(key)}"]`) ?? null;

  const activeCell = (): HTMLElement | null => {
    const row = active.current && rowOf(active.current.row);
    const col = active.current?.col;
    const cell =
      row &&
      ((col ? row.querySelector<HTMLElement>(`:scope > [data-col="${CSS.escape(col)}"]`) : null) ??
        cellAt(row, cursor.current));
    return cell ?? table.current?.querySelector<HTMLElement>(CELL) ?? null;
  };

  const setTabStop = (cell: HTMLElement | null) => {
    if (tabStop.current && tabStop.current !== cell) tabStop.current.tabIndex = -1;
    if (cell) cell.tabIndex = 0;
    tabStop.current = cell;
  };

  const setActive = (cell: HTMLElement) => {
    const key = cell.parentElement?.dataset.rowKey;
    if (!key) return;
    active.current = { row: key, col: cell.dataset.col ?? '' };
    setTabStop(cell);
    latest.current?.onActiveRow(key);
  };

  const focusCell = (cell: HTMLElement | null) => {
    if (!cell) return;
    setActive(cell);
    cell.focus({ preventScroll: true });
    reveal(cell);
  };

  // After every render: controls inside cells leave the tab order, exactly one cell is the tab stop,
  // and focus that was on something this render removed goes back to the active cell.
  // ponytail: a control that mounts later without the table rendering stays tabbable until the next render.
  useLayoutEffect(() => {
    latest.current = adapter;
    const el = table.current;
    if (!el) return;
    for (const widget of el.querySelectorAll<HTMLElement>(TABBABLE)) {
      if (!widget.matches(CELL)) widget.tabIndex = -1;
    }
    const cell = activeCell();
    setTabStop(cell);
    // Only when focus is nowhere: focus that moved to a menu or a dialog opened from the table is left alone.
    const lost = !document.activeElement || document.activeElement === document.body;
    if (hasFocus.current && cell && lost) cell.focus({ preventScroll: true });
  });

  useEffect(() => {
    const down = (event: PointerEvent) => {
      pointer.current = true;
      if (!table.current?.contains(event.target as Node)) hasFocus.current = false;
    };
    // Escape (or F2) on a control inside a cell returns to the cell. Heard on the window, on the way
    // down: a tooltip that is open on the control takes Escape for itself at the document.
    const key = (event: KeyboardEvent) => {
      pointer.current = false;
      if (event.key !== 'Escape' && event.key !== 'F2') return;
      const target = event.target as HTMLElement;
      const cell = target.closest?.<HTMLElement>(CELL);
      if (!cell || cell === target || !table.current?.contains(cell)) return;
      // A control that has something of its own open (a menu, a list) closes that first.
      if (target.getAttribute('aria-expanded') === 'true') return;
      cell.focus({ preventScroll: true });
      event.preventDefault();
    };
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key, true);
    };
  }, []);

  const keys = () =>
    latest.current?.keys ??
    [...(table.current?.querySelectorAll<HTMLElement>('tr[data-row-key]') ?? [])].map(
      (row) => row.dataset.rowKey!,
    );

  /** Moves to another row: by `delta` rows, or to the first or last row. Returns the row moved to. */
  const moveRow = (to: number | 'first' | 'last', column?: 'first' | 'last') => {
    const list = keys();
    const from = active.current ? list.indexOf(active.current.row) : -1;
    const index = to === 'first' ? 0 : to === 'last' ? list.length - 1 : from + to;
    const key = list[Math.max(0, Math.min(list.length - 1, index))];
    if (key === undefined) return null;
    latest.current?.ensure(key);
    const row = rowOf(key);
    if (!row) return null;
    const cells = row.querySelectorAll<HTMLElement>(`:scope > ${CELL}`);
    const cell =
      column === 'first'
        ? cells[0]
        : column === 'last'
          ? cells[cells.length - 1]
          : cellAt(row, cursor.current);
    if (!cell) return null;
    if (column) cursor.current = colStart(cell);
    focusCell(cell);
    return row;
  };

  const moveColumn = (cell: HTMLElement, step: number | 'first' | 'last') => {
    const cells = [...cell.parentElement!.querySelectorAll<HTMLElement>(`:scope > ${CELL}`)];
    const index = step === 'first' ? 0 : step === 'last' ? cells.length - 1 : cells.indexOf(cell) + step;
    const next = cells[Math.max(0, Math.min(cells.length - 1, index))];
    if (!next) return;
    cursor.current = colStart(next);
    focusCell(next);
  };

  const activate = (widget: HTMLElement, shift: boolean) => {
    if (shift)
      widget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }));
    else widget.click();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>(CELL);
    if (!cell || !table.current?.contains(cell) || event.defaultPrevented || event.altKey) return;
    const done = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    const inside = target !== cell;
    if (inside) {
      // Focus is on a control inside the cell: Tab stays among the cell's controls.
      if (event.key === 'Tab') {
        const widgets = widgetsOf(cell);
        const next = widgets.indexOf(target) + (event.shiftKey ? -1 : 1);
        widgets[(next + widgets.length) % widgets.length]?.focus();
        return done();
      }
      // A control that has a list or a menu of its own open keeps every key.
      if (target.hasAttribute('aria-haspopup') && target.getAttribute('aria-expanded') === 'true') return;
      if (!target.matches(SIMPLE_WIDGET) || !event.key.startsWith('Arrow')) return;
    }
    const row = cell.parentElement!;
    const rtl = getComputedStyle(cell).direction === 'rtl';
    const mod = event.ctrlKey || event.metaKey;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        const origin = event.shiftKey ? rowHandlers.get(row) : undefined;
        const started = shiftRun.current === row;
        const next = moveRow(event.key === 'ArrowUp' ? -1 : 1);
        // Shift extends the selection from the row the user was on when the run began to the row moved to.
        if (origin?.onSelect && next && next !== row) {
          if (!started) origin.onSelect({ range: true, anchor: true });
          shiftRun.current = next;
          rowHandlers.get(next)?.onSelect?.({ range: true });
        }
        return done();
      }
      case 'ArrowLeft':
      case 'ArrowRight':
        moveColumn(cell, (event.key === 'ArrowLeft') === rtl ? 1 : -1);
        return done();
      case 'Home':
      case 'End': {
        const edge = event.key === 'Home' ? 'first' : 'last';
        if (mod) {
          moveRow(edge, edge);
          // The first and last cells are in the sticky header and footer: the body follows to its own end.
          const view = cell.closest<HTMLElement>('[data-part="viewport"]');
          if (view) view.scrollTop = edge === 'first' ? 0 : view.scrollHeight;
        } else moveColumn(cell, edge);
        return done();
      }
      case 'PageUp':
      case 'PageDown': {
        const view = cell.closest<HTMLElement>('[data-part="viewport"]');
        const room =
          (view?.clientHeight ?? 0) -
          (table.current.tHead?.offsetHeight ?? 0) -
          (table.current.tFoot?.offsetHeight ?? 0);
        const page = Math.max(1, Math.floor(room / (cell.offsetHeight || 1)) - 1);
        moveRow(event.key === 'PageUp' ? -page : page);
        return done();
      }
      case 'a':
      case 'A': {
        // Ctrl or Cmd+A selects every row where several can be selected; elsewhere the key is the browser's.
        const selectAll = selectAllHandlers.get(table.current);
        if (!mod || !selectAll) return;
        selectAll();
        return done();
      }
      case 'Tab':
        // Leaving: focus is not taken back by the next render.
        hasFocus.current = false;
        return;
      case 'Enter':
      case 'F2':
      case ' ': {
        const widgets = widgetsOf(cell);
        const handlers = rowHandlers.get(row);
        if (event.key === ' ' && handlers?.onSelect) handlers.onSelect({ range: event.shiftKey });
        else if (event.key === 'F2' || widgets.length > 1) {
          if (event.key === ' ' || !widgets[0]) return;
          widgets[0].focus();
        } else if (widgets[0]) activate(widgets[0], event.shiftKey);
        else if (event.key === 'Enter' && handlers?.onAction) handlers.onAction();
        else return;
        return done();
      }
    }
  };

  const onFocus = (event: React.FocusEvent) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(CELL);
    if (!cell || !table.current?.contains(cell)) return;
    const arriving = !hasFocus.current;
    hasFocus.current = true;
    if (
      active.current?.row !== cell.parentElement?.dataset.rowKey ||
      active.current?.col !== cell.dataset.col
    ) {
      // Focused by a click, or by a screen reader: the column cursor follows.
      if (pointer.current || arriving) cursor.current = colStart(cell);
      setActive(cell);
    }
    // Arriving with Tab: the active row of a virtualised table may be parked outside the window.
    if (arriving && !pointer.current && event.target === cell) {
      if (cell.parentElement?.hasAttribute('data-parked') && active.current) {
        latest.current?.ensure(active.current.row);
        return focusCell(activeCell());
      }
      reveal(cell);
    }
  };

  const onBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && !table.current?.contains(next)) hasFocus.current = false;
  };

  return [table, { onKeyDown, onFocus, onBlur }] as const;
}
