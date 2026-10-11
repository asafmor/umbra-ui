import { expect, test } from 'vitest';
import { defined } from './defined';

test('defined drops the undefined keys and nothing else', () => {
  const label: string | undefined = undefined;
  const out: { id: string; label?: string; count: number | null; on: boolean } = defined({
    id: 'a',
    label,
    count: null,
    on: false,
  });
  expect(out).toEqual({ id: 'a', count: null, on: false });
  expect('label' in out).toBe(false);
});
