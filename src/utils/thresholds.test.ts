import { afterEach, expect, test, vi } from 'vitest';
import { rampThresholds, resolveThreshold, type Threshold } from './thresholds';

const bands: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 30, tone: 'warning', label: 'Medium' },
  { from: 60, color: '#0a7', label: 'High' },
];

afterEach(() => vi.restoreAllMocks());

test('a value takes the last band whose start is not above it', () => {
  expect(resolveThreshold(10, bands)).toMatchObject({ index: 0, cue: 0, count: 3, tone: 'danger' });
  expect(resolveThreshold(10, bands)?.label).toBe('Low');
  expect(resolveThreshold(30, bands)).toMatchObject({ index: 1, from: 30, tone: 'warning' });
  expect(resolveThreshold(59.9, bands)?.index).toBe(1);
  expect(resolveThreshold(60, bands)).toMatchObject({ index: 2, cue: 2, color: '#0a7', label: 'High' });
  expect(resolveThreshold(Infinity, bands)?.index).toBe(2);
});

test('no band: below the first start, no value, no list', () => {
  expect(resolveThreshold(-1, bands)).toBeUndefined();
  expect(resolveThreshold(null, bands)).toBeUndefined();
  expect(resolveThreshold(undefined, bands)).toBeUndefined();
  expect(resolveThreshold(NaN, bands)).toBeUndefined();
  expect(resolveThreshold(5, [])).toBeUndefined();
  expect(resolveThreshold(5, undefined)).toBeUndefined();
});

test('an unsorted list is sorted, with one warning in development', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const unsorted = [bands[2]!, bands[0]!, bands[1]!];
  expect(resolveThreshold(40, unsorted)).toMatchObject({ index: 1, label: 'Medium' });
  expect(resolveThreshold(90, unsorted)?.label).toBe('High');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]![0]).toContain('ascending');
  // The app's list is left as it was.
  expect(unsorted[0]!.from).toBe(60);
});

test('lower is better mirrors the looks and keeps the labels', () => {
  const low = { lowerIsBetter: true };
  expect(resolveThreshold(10, bands, low)).toMatchObject({ index: 0, cue: 2, color: '#0a7', label: 'Low' });
  expect(resolveThreshold(40, bands, low)).toMatchObject({ index: 1, cue: 1, tone: 'warning' });
  expect(resolveThreshold(90, bands, low)).toMatchObject({ index: 2, cue: 0, tone: 'danger', label: 'High' });
  expect(resolveThreshold(90, bands, low)?.color).toBeUndefined();
});

test('the look carries the extra members of an extended threshold', () => {
  const list: (Threshold & { marker?: string })[] = [{ from: 0, marker: 'stripes' }, { from: 5 }];
  expect(resolveThreshold(1, list)?.look.marker).toBe('stripes');
});

test('numbers are boundaries on the value ramp: a value at one belongs to the band above', () => {
  const tones = (list: number[], values: number[]) => values.map((v) => resolveThreshold(v, list)?.tone);
  expect(tones([6, 6.5, 7, 8], [5.9, 6, 6.7, 7, 9])).toEqual([
    'ramp-1',
    'ramp-2',
    'ramp-3',
    'ramp-4',
    'ramp-5',
  ]);
  expect(tones([7], [6.9, 7])).toEqual(['ramp-1', 'ramp-5']);
  expect(tones([4, 8], [1, 5, 9])).toEqual(['ramp-1', 'ramp-3', 'ramp-5']);
  expect(resolveThreshold(9, [4, 8], { lowerIsBetter: true })).toMatchObject({ tone: 'ramp-1', level: 1 });
  expect(rampThresholds([7])).toEqual([
    { from: -Infinity, tone: 'ramp-1' },
    { from: 7, tone: 'ramp-5' },
  ]);
});

test('every band has a step of the value ramp: its ramp tone, else its position', () => {
  expect([10, 40, 90].map((v) => resolveThreshold(v, bands)?.level)).toEqual([1, 3, 5]);
  expect(resolveThreshold(1, [{ from: 0, tone: 'ramp-4' }, { from: 5 }])?.level).toBe(4);
  expect(resolveThreshold(1, [{ from: 0 }])?.level).toBe(5);
});
