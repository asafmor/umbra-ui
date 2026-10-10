import { expect, test } from 'vitest';
import { collapseToFit as fit, type CollapseItem } from './collapse';

const collapseToFit = (...args: Parameters<typeof fit>) => fit(...args).collapsed;

const card = (id: string, priority = 0, min = 100): CollapseItem => ({ id, min, header: 40, priority });

test('nothing collapses when everything fits', () => {
  expect(collapseToFit(320, 10, [card('a'), card('b'), card('c')])).toEqual(new Set());
});

test('with equal priority, the last cards collapse first, only as many as needed', () => {
  const cards = [card('a'), card('b'), card('c')];
  expect(collapseToFit(319, 10, cards)).toEqual(new Set(['c'])); // 100 + 100 + 40 + 20 = 260
  expect(collapseToFit(259, 10, cards)).toEqual(new Set(['c', 'b']));
});

test('a higher priority stays open longer, wherever it is in the source', () => {
  expect(collapseToFit(300, 10, [card('a'), card('b'), card('c', 2)])).toEqual(new Set(['b']));
  expect(collapseToFit(300, 10, [card('a', -1), card('b'), card('c')])).toEqual(new Set(['a']));
});

test('items without a header never collapse, even when space runs out', () => {
  const items = [card('a'), card('b'), { id: 'fixed', min: 100, header: null, priority: 0 }];
  expect(collapseToFit(50, 10, items)).toEqual(new Set(['b', 'a']));
  expect(collapseToFit(250, 10, items)).toEqual(new Set(['b']));
});

test('the highest-priority card stays open when not even it can keep its minimum', () => {
  // Two cards of 170 in a stack of 240: the second collapses, the first keeps the rest (190) and fits.
  const two = [card('a', 0, 170), card('b', 0, 170)];
  expect(fit(240, 10, two)).toEqual({ collapsed: new Set(['b']), fits: true });
  // In 200 the first cannot reach 170 (200 - 40 - 10 = 150): it stays open and the minimums are dropped.
  expect(fit(200, 10, two)).toEqual({ collapsed: new Set(['b']), fits: false });
  expect(fit(200, 10, [card('a', 0, 170), card('b', 1, 170), card('c', 0, 170)])).toEqual({
    collapsed: new Set(['c', 'a']),
    fits: false,
  });
  // It needs room for content: one and a half times its header (40), so 60 here.
  expect(fit(110, 10, two).collapsed).toEqual(new Set(['b']));
  expect(fit(109, 10, two)).toEqual({ collapsed: new Set(['b', 'a']), fits: true });
  // A card alone in its stack stays open down to the same height.
  expect(fit(60, 10, [card('a')])).toEqual({ collapsed: new Set(), fits: false });
  expect(fit(59, 10, [card('a')])).toEqual({ collapsed: new Set(['a']), fits: true });
});

test('reports whether the open items fit after collapsing', () => {
  expect(fit(319, 10, [card('a'), card('b'), card('c')]).fits).toBe(true);
  expect(fit(50, 10, [card('a'), card('b')]).fits).toBe(false);
});
