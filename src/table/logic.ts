// The pure rules of DataTable: which columns fit, which rows are in the window, what a Shift range
// selects, and which way a value moved. No React and no DOM, so each is unit-tested.

/** What the fit rule needs to know about one column. */
export interface ColumnSize {
  id: string;
  /** The narrowest the column may be, in pixels. */
  min: number;
  /** The widest it grows while another column can take the space. */
  max: number;
  /** Its share of the spare width. 0 keeps it at `min`. */
  flex: number;
  /** Higher stays longer. `always` never hides. */
  priority: number | 'always';
  /** A utility column (checkbox, disclosure): it takes no spare width. */
  utility?: boolean;
}

/** What a column width is measured in. Read from the table itself, so density and tokens are followed. */
export interface WidthMetrics {
  /** The cell font size in pixels. */
  fontSize: number;
  /** The width of the digit "0" in the cell font. */
  ch: number;
  /** The horizontal padding of a cell, both sides together. */
  padding: number;
}

/** The cell font size at the default density: pixel widths are written for it. */
export const BASE_FONT_SIZE = 13;
export const defaultWidthMetrics: WidthMetrics = { fontSize: BASE_FONT_SIZE, ch: 7.5, padding: 16 };

/**
 * A column's `width` as the fit rule needs it.
 *
 * - Pixels (a number, or `min` and `max`) are written for the default density and scale with the cell
 *   font size, so text that fits at one density fits at the others: 80 is 80px at the default density
 *   (13px font), 74px at compact (12px) and 86px at spacious (14px).
 * - `content` is as wide as `chars` characters of the cell font, plus the cell padding and `extra`
 *   (room for a sort arrow).
 */
export function resolveWidth(
  width: number | 'content' | { min?: number; max?: number; flex?: number } | undefined,
  metrics: WidthMetrics,
  chars = 0,
  extra = 0,
): Pick<ColumnSize, 'min' | 'max' | 'flex'> {
  const px = (value: number) => Math.round((value * metrics.fontSize) / BASE_FONT_SIZE);
  if (width === 'content') {
    const fixed = Math.ceil(chars * metrics.ch + metrics.padding + extra);
    return { min: fixed, max: fixed, flex: 0 };
  }
  if (typeof width === 'number') return { min: px(width), max: px(width), flex: 0 };
  const min = px(width?.min ?? 96);
  return {
    min,
    max: Math.max(min, width?.max === undefined ? Infinity : px(width.max)),
    flex: width?.flex ?? 1,
  };
}

export interface ColumnFit {
  /** Ids of the columns that do not fit, in source order. */
  hidden: string[];
  /** Width of every shown column, in whole pixels. */
  widths: Record<string, number>;
  /** Sum of the widths: at least `available`, more when the columns that never hide need more. */
  total: number;
}

/**
 * Decides which columns are shown in `available` pixels and how wide each is.
 *
 * Columns hide one at a time, lowest `priority` first (equal priorities from the end of the source
 * order), until the rest fit at their minimum widths. `reserve` is width that is only needed once a
 * column is hidden (the disclosure column of `expandableHidden`). The result depends on `available`
 * alone, never on what was shown before, so it cannot flicker at a threshold.
 */
export function fitColumns(columns: ColumnSize[], available: number | null, reserve = 0): ColumnFit {
  const shown = new Set(columns.map((c) => c.id));
  let needed = columns.reduce((sum, c) => sum + c.min, 0);
  if (available !== null) {
    const candidates = columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => column.priority !== 'always')
      .sort((a, b) => (a.column.priority as number) - (b.column.priority as number) || b.index - a.index);
    let hiddenCount = 0;
    for (const { column } of candidates) {
      if (needed + (hiddenCount ? reserve : 0) <= available) break;
      shown.delete(column.id);
      needed -= column.min;
      hiddenCount++;
    }
  }
  const visible = columns.filter((c) => shown.has(c.id));
  const hidden = columns.filter((c) => !shown.has(c.id)).map((c) => c.id);
  const size = new Map(visible.map((c) => [c.id, c.min]));
  let spare = available === null ? 0 : available - (hidden.length ? reserve : 0) - needed;

  // Spare width goes to the flexible columns by weight, as far as their `max` allows.
  let growing = visible.filter((c) => c.flex > 0 && c.max > c.min);
  while (spare > 0.5 && growing.length) {
    const weight = growing.reduce((sum, c) => sum + c.flex, 0);
    let used = 0;
    const next: ColumnSize[] = [];
    for (const c of growing) {
      const current = size.get(c.id)!;
      const grown = Math.min(c.max, current + (spare * c.flex) / weight);
      used += grown - current;
      size.set(c.id, grown);
      if (grown < c.max) next.push(c);
    }
    spare -= used;
    if (next.length === growing.length) break; // nobody hit a cap, so everything was handed out
    growing = next;
  }
  // What no flexible column could take is shared evenly, so the rows always span the full width.
  if (spare > 0.5) {
    const takers = visible.some((c) => !c.utility) ? visible.filter((c) => !c.utility) : visible;
    for (const c of takers) size.set(c.id, size.get(c.id)! + spare / takers.length);
  }

  // Whole pixels; the pixels lost to rounding go to the widest column.
  const widths: Record<string, number> = {};
  let total = 0;
  for (const c of visible) total += widths[c.id] = Math.floor(size.get(c.id)!);
  const target =
    available === null ? total : Math.max(total, Math.floor(available - (hidden.length ? reserve : 0)));
  if (target > total && visible.length) {
    const widest = visible.reduce((a, b) => (widths[b.id]! > widths[a.id]! ? b : a));
    widths[widest.id]! += target - total;
    total = target;
  }
  return { hidden, widths, total };
}

/** The top of every item, plus the total height as the last entry. */
export function offsetsOf(heights: number[]): number[] {
  const offsets = new Array<number>(heights.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < heights.length; i++) offsets[i + 1] = offsets[i]! + heights[i]!;
  return offsets;
}

/**
 * The items to render for a scroll position: those that touch `[top, top + height]`, plus `overscan`
 * items on each side. `end` is exclusive.
 */
export function windowRange(offsets: number[], top: number, height: number, overscan: number) {
  const count = offsets.length - 1;
  // First item whose bottom is below `position`.
  const find = (position: number) => {
    let low = 0;
    let high = count;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (offsets[middle + 1]! <= position) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  const first = find(Math.max(0, top));
  const last = find(Math.max(0, top) + Math.max(0, height));
  return { start: Math.max(0, first - overscan), end: Math.min(count, last + 1 + overscan) };
}

/** The ids from `anchor` to `target` in display order, both included. Only `target` when there is no anchor. */
export function rangeIds(order: string[], anchor: string | null, target: string): string[] {
  const to = order.indexOf(target);
  const from = anchor === null ? -1 : order.indexOf(anchor);
  if (to < 0) return [];
  if (from < 0) return [target];
  return order.slice(Math.min(from, to), Math.max(from, to) + 1);
}

/** Which way a value moved, for `highlightChanges`. Only numbers have a direction. */
export function changeDirection(previous: unknown, next: unknown): 'up' | 'down' | 'neutral' {
  if (typeof previous !== 'number' || typeof next !== 'number') return 'neutral';
  return next > previous ? 'up' : next < previous ? 'down' : 'neutral';
}

/** The order of the groups: the listed keys first, then the others as they first appear. */
export function orderGroups(listed: string[], found: string[]): string[] {
  return [...new Set([...listed, ...found])];
}
