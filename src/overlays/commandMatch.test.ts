import { expect, test } from 'vitest';
import { filterCommands, matchRank, rank } from './commandMatch';

const item = (label: string, keywords?: string[], description?: string) => ({ label, keywords, description });

test('ranks: prefix, then word start, then substring, then keywords, then letters in order', () => {
  expect(matchRank('ord', item('Orders'))).toBe(rank.prefix);
  expect(matchRank('ord', item('Open orders'))).toBe(rank.wordStart);
  expect(matchRank('ord', item('Records'))).toBe(rank.substring);
  expect(matchRank('ord', item('Purchases', ['order']))).toBe(rank.keyword);
  expect(matchRank('ord', item('Purchases', [], 'Every order placed'))).toBe(rank.keyword);
  expect(matchRank('ord', item('Open region data'))).toBe(rank.loose);
  expect(matchRank('ord', item('Settings'))).toBe(rank.none);
});

test('case, accents and separators do not matter', () => {
  expect(matchRank('ORD', item('orders'))).toBe(rank.prefix);
  expect(matchRank('resume', item('Résumé list'))).toBe(rank.prefix);
  expect(matchRank('list', item('price-list'))).toBe(rank.wordStart);
});

test('every word must match, and the weakest word gives the rank', () => {
  expect(matchRank('open ord', item('Open orders'))).toBe(rank.prefix);
  expect(matchRank('orders open', item('Open orders'))).toBe(rank.wordStart);
  expect(matchRank('open zzz', item('Open orders'))).toBe(rank.none);
});

test('a short text never matches loosely', () => {
  expect(matchRank('ost', item('Open settings'))).toBe(rank.loose);
  expect(matchRank('os', item('Open settings'))).toBe(rank.none);
});

test('filter: best first, the given order within a rank, and everything for empty text', () => {
  const items = [
    item('Records'),
    item('Open orders'),
    item('Settings'),
    item('Orders'),
    item('Order history'),
  ];
  expect(filterCommands(items, 'ord').map((i) => i.label)).toEqual([
    'Orders',
    'Order history',
    'Open orders',
    'Records',
  ]);
  expect(filterCommands(items, '  ')).toBe(items);
});
