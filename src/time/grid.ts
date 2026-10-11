// Keyboard navigation of a grid of days (plan/specs/Planner.md, "Interaction and accessibility").
//
// The rules are those of the table's grid (src/table/grid.ts): one tab stop, the active cell remembered
// by what it is and not by its element, controls inside a cell out of the tab order and reached with
// Enter, focus taken back when a render removes the focused element. The code is not shared: the table
// walks `<tr>` rows and spanning columns, this walks days, where "up" from the first line of a week is the
// last line of the week before and a move past the last day asks for another month.
//
// A cell is an element with `data-cell`, and:
// - a day cell: `data-date`, `data-week` (the first day of its week), `data-col` (0 to 6) and
//   `data-line` (0 is the day's header, 1 and up its slots);
// - the side cell of a week: `data-week` and `data-col="aside"`.
import { useEffect, useLayoutEffect, useRef } from 'react';
import { addDays, type IsoDate } from './dates';

const CELL = '[data-cell]';
const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
const WIDGET =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]';
/** Widgets that have no use for the arrow keys: from them, the arrows still move through the grid. */
const SIMPLE_WIDGET = 'a, button, input[type="checkbox"], input[type="radio"]';

const widgetsOf = (cell: Element) =>
  [...cell.querySelectorAll<HTMLElement>(WIDGET)].filter(
    (el) =>
      !el.matches(`${CELL}, [aria-disabled="true"], [data-disabled]`) && !el.closest('[aria-hidden="true"]'),
  );

/** Where a move lands when it is not on a rendered cell: a day, and its header (0), a slot or its last line. */
export interface GridTarget {
  date: IsoDate;
  line: number | 'last';
}

export interface DateGridOptions {
  /** The day that holds the tab stop until the user has moved: today or the selected day. */
  initial?: IsoDate | undefined;
  /**
   * A move went to a day that is not rendered. Return true when the grid is about to render it (another
   * month): the focus then goes to it after that render. Otherwise the focus stays where it is.
   */
  onLeave?: ((target: GridTarget) => boolean) | undefined;
  /**
   * PageUp and PageDown (with Shift: a year). The grid changes its month and returns the day the focus
   * goes to once that month is rendered, or nothing when it stays.
   */
  onPage?: ((date: IsoDate, months: number) => IsoDate | undefined) | undefined;
}

/** Scrolls a cell into view inside its scroll area only, clear of a sticky header row. */
function reveal(cell: HTMLElement) {
  const view = cell.closest<HTMLElement>('[data-part="viewport"]');
  if (!view) return;
  const v = view.getBoundingClientRect();
  const c = cell.getBoundingClientRect();
  const top = v.top + (view.querySelector<HTMLElement>('[data-sticky]')?.offsetHeight ?? 0);
  if (c.top < top) view.scrollTop -= top - c.top;
  else if (c.bottom > v.top + view.clientHeight) view.scrollTop += c.bottom - (v.top + view.clientHeight);
}

/** The grid behaviour of one element: roving tab stop, arrow keys, and focus that is not lost. */
export function useDateGrid<E extends HTMLElement>(options: DateGridOptions = {}) {
  const root = useRef<E>(null);
  const latest = useRef(options);
  /** The active cell: a day and a line, or the side cell of a week. */
  const active = useRef<{ date?: IsoDate | undefined; line: number; week?: string | undefined } | null>(null);
  /** Where to put the focus once the grid has rendered the day a move asked for. */
  const pending = useRef<GridTarget | null>(null);
  const tabStop = useRef<HTMLElement | null>(null);
  const hasFocus = useRef(false);
  const pointer = useRef(false);

  const all = (selector: string) => [...(root.current?.querySelectorAll<HTMLElement>(selector) ?? [])];
  const dayCells = (date: IsoDate) => all(`${CELL}[data-date="${date}"]`);
  const find = ({ date, line }: GridTarget): HTMLElement | undefined => {
    const cells = dayCells(date);
    // A week without slots has only the headers of its days.
    return line === 'last' ? cells.at(-1) : (cells.find((c) => c.dataset.line === String(line)) ?? cells[0]);
  };
  const activeCell = (): HTMLElement | undefined => {
    const a = active.current;
    const initial = latest.current.initial;
    return (
      (a?.date ? find({ date: a.date, line: a.line }) : undefined) ??
      (a?.week ? all(`${CELL}[data-week="${a.week}"][data-col="aside"]`)[0] : undefined) ??
      (initial ? find({ date: initial, line: 0 }) : undefined) ??
      all(`${CELL}[data-date]:not([data-outside])`)[0] ??
      all(CELL)[0]
    );
  };

  const setTabStop = (cell: HTMLElement | undefined) => {
    if (tabStop.current && tabStop.current !== cell) tabStop.current.tabIndex = -1;
    if (cell) cell.tabIndex = 0;
    tabStop.current = cell ?? null;
  };
  const setActive = (cell: HTMLElement) => {
    const { date, week, line } = cell.dataset;
    // The line is kept while on the side cell, so leaving it returns to the line the user came from.
    active.current = date ? { date, line: Number(line) } : { week, line: active.current?.line ?? 0 };
    setTabStop(cell);
  };
  const focusCell = (cell: HTMLElement | undefined) => {
    if (!cell) return false;
    setActive(cell);
    cell.focus({ preventScroll: true });
    reveal(cell);
    return true;
  };
  /** Moves to a day and line: at once when it is rendered, else after the render the grid promises. */
  const go = (target: GridTarget) => {
    if (focusCell(find(target))) return;
    if (latest.current.onLeave?.(target)) pending.current = target;
  };

  // After every render: controls inside cells leave the tab order, exactly one cell is the tab stop, a
  // move that waited for this render lands, and focus that was on something the render removed returns.
  // ponytail: a control that mounts later without the grid rendering stays tabbable until the next render.
  useLayoutEffect(() => {
    latest.current = options;
    const el = root.current;
    if (!el) return;
    for (const widget of el.querySelectorAll<HTMLElement>(TABBABLE)) {
      if (!widget.matches(CELL)) widget.tabIndex = -1;
    }
    for (const cell of el.querySelectorAll<HTMLElement>(`${CELL}[tabindex="0"]`)) cell.tabIndex = -1;
    const target = pending.current && find(pending.current);
    if (target) {
      pending.current = null;
      if (hasFocus.current) return void focusCell(target);
      setActive(target);
    }
    const cell = activeCell();
    setTabStop(cell);
    const lost = !document.activeElement || document.activeElement === document.body;
    if (hasFocus.current && cell && lost) cell.focus({ preventScroll: true });
  });

  useEffect(() => {
    const down = (event: PointerEvent) => {
      pointer.current = true;
      if (!root.current?.contains(event.target as Node)) hasFocus.current = false;
    };
    // Escape (or F2) on a control inside a cell returns to the cell. Heard on the window, on the way
    // down: a tooltip that is open on the control takes Escape for itself at the document.
    const key = (event: KeyboardEvent) => {
      pointer.current = false;
      if (event.key !== 'Escape' && event.key !== 'F2') return;
      const target = event.target as HTMLElement;
      const cell = target.closest?.<HTMLElement>(CELL);
      if (!cell || cell === target || !root.current?.contains(cell)) return;
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

  /** Along the line: the days of the week, with the side cell before the first. */
  const moveInline = (cell: HTMLElement, step: -1 | 1) => {
    const { date, week, col } = cell.dataset;
    const line = active.current?.line ?? 0;
    const aside = all(`${CELL}[data-week="${week}"][data-col="aside"]`)[0];
    if (!date) {
      // From the side cell, towards the days: the first day of its week, on the line the user was on.
      if (step === 1 && week) go({ date: week, line });
      return;
    }
    if (step === -1 && col === '0' && aside) return void focusCell(aside);
    go({ date: addDays(date, step), line });
  };

  /** Across the lines: the cells of one weekday, top to bottom, through every week. */
  const moveBlock = (cell: HTMLElement, step: -1 | 1) => {
    const { date, col, week } = cell.dataset;
    if (!date) {
      // The side cells form a column of their own.
      const asides = all(`${CELL}[data-col="aside"]`);
      const next = asides[asides.indexOf(cell) + step];
      if (next) focusCell(next);
      else if (week) go({ date: addDays(week, step * 7), line: step === 1 ? 0 : 'last' });
      return;
    }
    const column = all(`${CELL}[data-col="${col}"]`);
    const next = column[column.indexOf(cell) + step];
    if (next) focusCell(next);
    else go({ date: addDays(date, step * 7), line: step === 1 ? 0 : 'last' });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>(CELL);
    if (!cell || !root.current?.contains(cell) || event.defaultPrevented || event.altKey) return;
    const done = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    if (target !== cell) {
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
    const rtl = getComputedStyle(cell).direction === 'rtl';
    const mod = event.ctrlKey || event.metaKey;
    const { date, week } = cell.dataset;
    const line = active.current?.line ?? 0;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        moveBlock(cell, event.key === 'ArrowUp' ? -1 : 1);
        return done();
      case 'ArrowLeft':
      case 'ArrowRight':
        // What is drawn: in a right-to-left grid the next day is to the left.
        moveInline(cell, (event.key === 'ArrowLeft') === rtl ? 1 : -1);
        return done();
      case 'Home':
      case 'End': {
        const first = event.key === 'Home';
        if (mod) {
          // The first and the last day of what is shown that is not another month's.
          const days = all(`${CELL}[data-date][data-line="0"]:not([data-outside])`);
          focusCell(first ? days[0] : dayCells(days.at(-1)?.dataset.date ?? '').at(-1));
        } else if (week) go({ date: first ? week : addDays(week, 6), line });
        return done();
      }
      case 'PageUp':
      case 'PageDown': {
        const months = (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1);
        // The grid changes its month; the focus lands on the day once that month is rendered.
        const to = date && latest.current.onPage?.(date, months);
        if (to) pending.current = { date: to, line };
        return done();
      }
      case 'Tab':
        // Leaving: focus is not taken back by the next render.
        hasFocus.current = false;
        return;
      case 'Enter':
      case 'F2':
      case ' ': {
        if (target !== cell) return;
        const widgets = widgetsOf(cell);
        if (event.key === 'F2' || widgets.length > 1) {
          if (event.key === ' ' || !widgets[0]) return;
          widgets[0].focus();
        } else if (widgets[0]) {
          // The one control of a cell is pressed from the cell. It takes the focus first: what it opens
          // (the popover of a collapsed side cell) then closes back to it, as after a press on it.
          // Without scrolling: an anchored overlay closes when what is around its anchor scrolls.
          widgets[0].focus({ preventScroll: true });
          widgets[0].click();
        } else cell.click();
        return done();
      }
    }
  };

  const onFocus = (event: React.FocusEvent) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(CELL);
    if (!cell || !root.current?.contains(cell)) return;
    const arriving = !hasFocus.current;
    hasFocus.current = true;
    setActive(cell);
    if (arriving && !pointer.current && event.target === cell) reveal(cell);
  };

  const onBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && !root.current?.contains(next)) hasFocus.current = false;
  };

  /** Makes a day the tab stop and scrolls it into view, without moving the focus. */
  const show = (date: IsoDate) => {
    const cell = find({ date, line: 0 });
    if (!cell) return;
    setActive(cell);
    // The whole day where it fits: its last line first, then its header, which wins where it does not.
    const lines = dayCells(date);
    reveal(lines.at(-1) ?? cell);
    reveal(cell);
  };

  return [root, { onKeyDown, onFocus, onBlur }, show] as const;
}
