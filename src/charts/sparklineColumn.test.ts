import { expect, test } from 'vitest';
import { sparklineColumn } from './Sparkline';

// Review 2, MC-8: a `NaN` in a run was taken as its last value, and a `NaN` breaks a sort.
test('a sparkline column sorts by the last finite value of each run', () => {
  const column = sparklineColumn<{ run: (number | null)[] }>({
    id: 'run',
    header: 'Run',
    values: (r) => r.run,
  });
  const accessor = column.accessor as (row: { run: (number | null)[] }) => unknown;
  const last = (run: (number | null)[]) => accessor({ run });
  expect(last([1, 2, 3])).toBe(3);
  expect(last([1, 2, NaN])).toBe(2);
  expect(last([4, Infinity, null])).toBe(4);
  expect(last([NaN, null])).toBeNull();
  const rows = [[5, NaN], [1], [3, NaN, NaN]].map((run) => ({ run }));
  expect(rows.map(accessor).sort()).toEqual([1, 3, 5]);
});
