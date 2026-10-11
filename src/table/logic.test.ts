import { describe, expect, it } from 'vitest';
import {
  resolveWidth,
  changeDirection,
  applyColumnState,
  clampWidth,
  fitColumns,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  moveColumn,
  orderColumns,
  offsetsOf,
  orderGroups,
  rangeIds,
  selectStep,
  windowRange,
  type ColumnSize,
} from './logic';

const column = (id: string, min: number, extra: Partial<ColumnSize> = {}): ColumnSize => ({
  id,
  min,
  max: Infinity,
  flex: 1,
  priority: 0,
  ...extra,
});

describe('fitColumns', () => {
  const columns = [
    column('name', 200, { priority: 'always' }),
    column('a', 100, { priority: 3 }),
    column('b', 100, { priority: 1 }),
    column('c', 100, { priority: 2 }),
    column('d', 100, { priority: 1 }),
  ];

  it('shows everything when it fits, and hands out the spare width', () => {
    const fit = fitColumns(columns, 700);
    expect(fit.hidden).toEqual([]);
    expect(fit.total).toBe(700);
    expect(fit.widths).toEqual({ name: 220, a: 120, b: 120, c: 120, d: 120 });
  });

  it('hides the lowest priority first, and the later of two equal priorities', () => {
    expect(fitColumns(columns, 599).hidden).toEqual(['d']);
    expect(fitColumns(columns, 499).hidden).toEqual(['b', 'd']);
    expect(fitColumns(columns, 399).hidden).toEqual(['b', 'c', 'd']);
    expect(fitColumns(columns, 299).hidden).toEqual(['a', 'b', 'c', 'd']);
  });

  it('never hides an `always` column: the table is then wider than the space', () => {
    const fit = fitColumns(columns, 120);
    expect(fit.hidden).toEqual(['a', 'b', 'c', 'd']);
    expect(fit.widths).toEqual({ name: 200 });
    expect(fit.total).toBe(200);
  });

  it('depends on the width alone, so a threshold cannot oscillate and one big resize is right', () => {
    const at = (width: number) => fitColumns(columns, width).hidden.join();
    expect(at(600)).toBe('');
    expect(at(599.5)).toBe('d');
    // Back and forth around the threshold, and straight from very wide to very narrow and back.
    for (const width of [600, 599, 600, 599, 1600, 250, 1600, 599]) {
      expect(at(width)).toBe(width >= 600 ? '' : width >= 500 ? 'd' : 'a,b,c,d');
    }
  });

  it('reserves the disclosure column only once something is hidden', () => {
    expect(fitColumns(columns, 600, 32).hidden).toEqual([]);
    // 599: d hides (500 + 32 fits). 531: 500 + 32 does not fit any more, so b hides too.
    expect(fitColumns(columns, 599, 32).hidden).toEqual(['d']);
    expect(fitColumns(columns, 531, 32).hidden).toEqual(['b', 'd']);
    const fit = fitColumns(columns, 599, 32);
    expect(fit.total).toBe(567);
  });

  it('respects max, keeps fixed columns fixed, and fills the width', () => {
    const fit = fitColumns(
      [column('pos', 40, { flex: 0, max: 40 }), column('name', 100, { max: 150 }), column('rest', 100)],
      500,
    );
    expect(fit.widths).toEqual({ pos: 40, name: 150, rest: 310 });
  });

  it('shares the width evenly among fixed columns when nothing can grow, but not with utility columns', () => {
    const fixed = (id: string, utility = false) => column(id, 50, { flex: 0, max: 50, utility });
    const fit = fitColumns([fixed('select', true), fixed('a'), fixed('b')], 250);
    expect(fit.widths).toEqual({ select: 50, a: 100, b: 100 });
  });

  it('gives whole pixels that add up to the available width', () => {
    const fit = fitColumns([column('a', 10), column('b', 10), column('c', 10)], 100);
    expect(Object.values(fit.widths).reduce((a, b) => a + b, 0)).toBe(100);
    expect(fit.total).toBe(100);
  });

  it('shows every column at its minimum before the width is known', () => {
    const fit = fitColumns(columns, null);
    expect(fit.hidden).toEqual([]);
    expect(fit.total).toBe(600);
  });
});

describe('windowRange', () => {
  const offsets = offsetsOf(new Array<number>(1000).fill(20));

  it('returns the rows in view plus the overscan', () => {
    expect(offsets[1000]).toBe(20000);
    expect(windowRange(offsets, 0, 100, 2)).toEqual({ start: 0, end: 8 });
    expect(windowRange(offsets, 1000, 100, 2)).toEqual({ start: 48, end: 58 });
    // More rows in the direction of travel.
    expect(windowRange(offsets, 1000, 100, 2, 10)).toEqual({ start: 48, end: 66 });
    expect(windowRange(offsets, 1000, 100, 10, 2)).toEqual({ start: 40, end: 58 });
  });

  it('is clamped at both ends', () => {
    expect(windowRange(offsets, 19950, 100, 5)).toEqual({ start: 992, end: 1000 });
    expect(windowRange(offsets, -50, 100, 0)).toEqual({ start: 0, end: 6 });
    expect(windowRange(offsetsOf([]), 0, 100, 3)).toEqual({ start: 0, end: 0 });
  });

  it('follows rows of different heights', () => {
    // A group header of 30, two rows of 20, a detail row of 100, then rows of 20.
    const mixed = offsetsOf([30, 20, 20, 100, 20, 20, 20]);
    expect(windowRange(mixed, 75, 20, 0)).toEqual({ start: 3, end: 4 });
    expect(windowRange(mixed, 165, 30, 0)).toEqual({ start: 3, end: 6 });
  });
});

describe('rangeIds', () => {
  const order = ['a', 'b', 'c', 'd', 'e'];
  it('takes both ends, in either direction', () => {
    expect(rangeIds(order, 'b', 'd')).toEqual(['b', 'c', 'd']);
    expect(rangeIds(order, 'd', 'b')).toEqual(['b', 'c', 'd']);
    expect(rangeIds(order, 'c', 'c')).toEqual(['c']);
  });
  it('is only the target without an anchor, or when the anchor has gone', () => {
    expect(rangeIds(order, null, 'd')).toEqual(['d']);
    expect(rangeIds(order, 'x', 'd')).toEqual(['d']);
    expect(rangeIds(order, 'a', 'x')).toEqual([]);
  });
});

describe('changeDirection', () => {
  it('gives numbers a direction and everything else none', () => {
    expect(changeDirection(1, 2)).toBe('up');
    expect(changeDirection(2, 1)).toBe('down');
    expect(changeDirection(2, 2)).toBe('neutral');
    expect(changeDirection('a', 'b')).toBe('neutral');
    expect(changeDirection(undefined, 3)).toBe('neutral');
  });
});

describe('orderGroups', () => {
  it('puts the listed groups first and keeps the others as found', () => {
    expect(orderGroups(['open', 'done'], ['late', 'done', 'open'])).toEqual(['open', 'done', 'late']);
    expect(orderGroups([], ['b', 'a', 'b'])).toEqual(['b', 'a']);
  });
});

it('pixel widths are written for the default density and follow the cell font size', () => {
  const at = (fontSize: number) => ({ fontSize, ch: fontSize * 0.6, padding: 16 });
  expect(resolveWidth(80, at(13))).toEqual({ min: 80, max: 80, flex: 0 });
  expect(resolveWidth(80, at(12))).toEqual({ min: 74, max: 74, flex: 0 });
  expect(resolveWidth(80, at(14))).toEqual({ min: 86, max: 86, flex: 0 });
  expect(resolveWidth({ min: 104, max: 260, flex: 2 }, at(14))).toEqual({ min: 112, max: 280, flex: 2 });
  expect(resolveWidth(undefined, at(13))).toEqual({ min: 96, max: Infinity, flex: 1 });
  expect(resolveWidth({ min: 200, max: 100 }, at(13))).toMatchObject({ min: 200, max: 200 });
});

it('a content width is the character count in the cell font, plus the padding', () => {
  const metrics = { fontSize: 13, ch: 7.5, padding: 16 };
  expect(resolveWidth('content', metrics, 6)).toEqual({ min: 61, max: 61, flex: 0 });
  expect(resolveWidth('content', metrics, 6, 18)).toEqual({ min: 79, max: 79, flex: 0 });
  // The same six characters need more room in a larger font.
  expect(resolveWidth('content', { fontSize: 14, ch: 8.1, padding: 16 }, 6).min).toBe(65);
});

describe('selectStep', () => {
  const order = () => ['a', 'b', 'c', 'd', 'f', 'g']; // 'e' is disabled and not in the order
  it('a Shift+Arrow run starts where the focus is, not at the last row toggled (D3)', () => {
    // B and C are selected; A is toggled on and off, then the focus moves to F and Shift+Down is pressed.
    let state = { ids: ['b', 'c'], memo: { anchor: null as string | null, base: [] as string[] } };
    const step = (id: string, options: { range?: boolean; anchor?: boolean } = {}) => {
      state = selectStep('multiple', state.ids, state.memo, id, options, order);
    };
    step('a');
    step('a');
    expect(state.ids).toEqual(['b', 'c']);
    step('f', { range: true, anchor: true });
    step('g', { range: true });
    expect(state.ids).toEqual(['b', 'c', 'f', 'g']);
    // Coming back shrinks the range; it never drops what was selected before it.
    step('f', { range: true });
    expect(state.ids).toEqual(['b', 'c', 'f']);
    step('d', { range: true });
    expect(state.ids).toEqual(['b', 'c', 'd', 'f']);
  });
  it('a Shift+click runs from the last row toggled', () => {
    const toggled = selectStep('multiple', [], { anchor: null, base: [] }, 'b', {}, order);
    expect(selectStep('multiple', toggled.ids, toggled.memo, 'd', { range: true }, order).ids).toEqual([
      'b',
      'c',
      'd',
    ]);
  });
  it('single selection keeps one row, and a second press clears it', () => {
    const memo = { anchor: null, base: [] };
    expect(selectStep('single', ['a'], memo, 'b', {}, order).ids).toEqual(['b']);
    expect(selectStep('single', ['b'], memo, 'b', {}, order).ids).toEqual([]);
  });
});

describe('column state', () => {
  const defs = [
    { id: 'name', pin: 'start' as const, priority: 'always' as const },
    { id: 'a', priority: 3 },
    { id: 'b', priority: 1, width: { min: 100 } },
    { id: 'c', priority: 2, minWidth: 60, maxWidth: 200 },
    { id: 'actions', pin: 'end' as const, hideable: false },
  ];
  const ids = (list: { id: string }[]) => list.map((c) => c.id);

  it('orders by the saved list, drops ids it does not know and keeps new columns beside their neighbour', () => {
    expect(orderColumns(['a', 'b', 'c'], undefined)).toEqual(['a', 'b', 'c']);
    expect(orderColumns(['a', 'b', 'c'], ['c', 'gone', 'a', 'c'])).toEqual(['c', 'a', 'b']);
    expect(orderColumns(['new', 'a', 'b', 'newer', 'c'], ['c', 'b', 'a'])).toEqual([
      'new',
      'c',
      'b',
      'newer',
      'a',
    ]);
  });

  it('with no state the columns are the very objects of the app', () => {
    const result = applyColumnState(defs, {});
    expect(result.hidden).toEqual([]);
    result.columns.forEach((column, index) => expect(column).toBe(defs[index]));
  });

  it('draws pinned columns at their edge, whatever the order says', () => {
    const result = applyColumnState(defs, { order: ['c', 'actions', 'b', 'name', 'a'], pins: { b: 'start' } });
    expect(ids(result.columns)).toEqual(['b', 'name', 'c', 'a', 'actions']);
    expect(ids(applyColumnState(defs, { pins: { name: 'none', a: 'end' } }).columns)).toEqual([
      'name',
      'b',
      'c',
      'a',
      'actions',
    ]);
  });

  it('a column the user asked for never hides; one they hid is listed, unless it cannot be hidden', () => {
    const result = applyColumnState(defs, { visibility: { b: true, c: false, actions: false } });
    expect(result.hidden).toEqual(['c']);
    expect(result.columns.find((c) => c.id === 'b')!.priority).toBe('always');
    expect(result.columns.find((c) => c.id === 'a')).toBe(defs[1]);
  });

  it('a user width replaces the definition, inside the limits of the column', () => {
    const width = (state: Record<string, number>) =>
      Object.fromEntries(applyColumnState(defs, { widths: state }).columns.map((c) => [c.id, c.width]));
    expect(width({ b: 180.4, c: 500 })).toMatchObject({ b: 180, c: 200 });
    expect(width({ b: 10, c: 10 })).toMatchObject({ b: MIN_COLUMN_WIDTH, c: 60 });
    expect(clampWidth({ id: 'x' }, 5000)).toBe(MAX_COLUMN_WIDTH);
  });

  it('moves a column to a position, and stops at the end of its pin group', () => {
    const order = ['name', 'a', 'b', 'c', 'actions'];
    const group = (id: string) => defs.find((c) => c.id === id)!.pin;
    expect(moveColumn(order, 'c', 1, group)).toEqual(['name', 'c', 'a', 'b', 'actions']);
    expect(moveColumn(order, 'a', 2, group)).toEqual(['name', 'b', 'a', 'c', 'actions']);
    expect(moveColumn(order, 'a', 0, group)).toBe(order);
    expect(moveColumn(order, 'b', 9, group)).toEqual(['name', 'a', 'c', 'b', 'actions']);
    expect(moveColumn(order, 'name', 3, group)).toBe(order);
    expect(moveColumn(order, 'gone', 1, group)).toBe(order);
  });

  it('a width the user set takes no spare width, and the others share the rest', () => {
    const sized = [
      column('name', 120),
      column('wide', 180, { max: 180, flex: 0, utility: true }),
      column('rest', 96),
    ];
    const fit = fitColumns(sized, 601);
    expect(fit.widths.wide).toBe(180);
    expect(fit.total).toBe(601);
    // Too wide for the table: the columns that may hide go first, then the table is wider than its slot.
    expect(fitColumns(sized, 300)).toMatchObject({ hidden: ['rest'], widths: { name: 120, wide: 180 } });
    const kept = sized.map((c) => ({ ...c, priority: 'always' as const }));
    expect(fitColumns(kept, 300)).toMatchObject({ hidden: [], total: 396 });
  });
});
