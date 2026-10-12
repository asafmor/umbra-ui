import { afterEach, expect, test, vi } from 'vitest';
import { isValue, uniqueIds, valueOrNull } from './finite';

afterEach(() => vi.restoreAllMocks());

test('only a finite number is a value', () => {
  expect([0, -1.5, NaN, Infinity, -Infinity, null, undefined, '3'].map(isValue)).toEqual([
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
});

test('a number that is not finite is no value, and warns once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(valueOrNull(4, 'Test')).toBe(4);
  expect(valueOrNull(null, 'Test')).toBeNull();
  expect(warn).not.toHaveBeenCalled();
  expect(valueOrNull(NaN, 'Test')).toBeNull();
  expect(valueOrNull(NaN, 'Test')).toBeNull();
  expect(valueOrNull(Infinity, 'Test')).toBeNull();
  expect(warn.mock.calls.map((c) => c[0])).toEqual([
    '[umbra-ui] Test: NaN is not a value that can be drawn; it is shown as no value.',
    '[umbra-ui] Test: Infinity is not a value that can be drawn; it is shown as no value.',
  ]);
});

test('the first item of an id is kept, with a warning for the others', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const items = [
    { id: 'a', n: 1 },
    { id: 'b', n: 2 },
    { id: 'a', n: 3 },
  ];
  expect(uniqueIds(items, 'Test')).toEqual(items.slice(0, 2));
  expect(warn).toHaveBeenCalledTimes(1);
});
