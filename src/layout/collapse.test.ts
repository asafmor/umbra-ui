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
  const items = [card('a'), { id: 'fixed', min: 100, header: null, priority: 0 }];
  expect(collapseToFit(50, 10, items)).toEqual(new Set(['a']));
});

test('reports whether the open items fit after collapsing', () => {
  expect(fit(319, 10, [card('a'), card('b'), card('c')]).fits).toBe(true);
  expect(fit(50, 10, [card('a'), card('b')]).fits).toBe(false);
});
