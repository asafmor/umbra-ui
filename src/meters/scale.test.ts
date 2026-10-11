import { expect, test } from 'vitest';
import { resolveThreshold, type Threshold } from '../utils/thresholds';
import {
  bandBoundaries,
  bandPattern,
  describe,
  outOfRange,
  segmentBounds,
  thirdsThresholds,
  tickFractions,
  tickShown,
  toFraction,
} from './scale';

test('a value maps to its share of the scale', () => {
  expect(toFraction(50, 0, 100)).toBe(0.5);
  expect(toFraction(15, 10, 20)).toBe(0.5);
  expect(toFraction(-5, -10, 10)).toBe(0.25);
  expect(toFraction(0, 0, 100)).toBe(0);
  expect(toFraction(100, 0, 100)).toBe(1);
});

test('values outside the scale clamp, and a bad scale or value gives 0', () => {
  expect(toFraction(140, 0, 100)).toBe(1);
  expect(toFraction(-20, 0, 100)).toBe(0);
  expect(toFraction(Infinity, 0, 100)).toBe(1);
  expect(toFraction(NaN, 0, 100)).toBe(0);
  expect(toFraction(5, 10, 10)).toBe(0);
  expect(toFraction(5, 10, 0)).toBe(0);
  expect(outOfRange(140, 0, 100)).toBe('over');
  expect(outOfRange(-1, 0, 100)).toBe('under');
  expect(outOfRange(100, 0, 100)).toBeUndefined();
});

const bands: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 30, color: '#f80', label: 'Medium' },
  { from: 60, tone: 'success', label: 'High' },
];
const pattern = (value: number, lowerIsBetter = false) =>
  bandPattern(resolveThreshold(value, bands, { lowerIsBetter })!);

test('each band has a pattern by its position, whatever its colour: the top one is solid', () => {
  expect([10, 30, 100].map((v) => pattern(v))).toEqual(['diagonal', 'vertical', 'none']);
  expect([10, 40, 90].map((v) => pattern(v, true))).toEqual(['none', 'vertical', 'diagonal']);
});

test('the default thresholds are thirds of the scale', () => {
  const thirds = thirdsThresholds(0, 90);
  expect(thirds.map((t) => t.from)).toEqual([0, 30, 60]);
  expect([29, 30, 60].map((v) => resolveThreshold(v, thirds)?.tone)).toEqual([
    'danger',
    'warning',
    'success',
  ]);
});

test('boundary ticks sit where a band starts inside the scale', () => {
  expect(bandBoundaries([{ from: 0 }, { from: 40 }, { from: 70 }], 0, 100)).toEqual([0.4, 0.7]);
  expect(bandBoundaries([40, 70], 0, 100)).toEqual([0.4, 0.7]);
  expect(bandBoundaries([{ from: 0, tone: 'info' }], 0, 100)).toEqual([]);
  expect(bandBoundaries(undefined, 0, 100)).toEqual([]);
});

test('ticks spread from end to end', () => {
  expect(tickFractions(5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  expect(tickFractions(1)).toEqual([0]);
  expect(tickFractions(0)).toEqual([]);
});

test('thinning keeps every n-th tick and the last one', () => {
  const shown = (stride: number) =>
    Array.from({ length: 11 }, (_, i) => i).filter((i) => tickShown(i, 11, stride));
  expect(shown(1)).toHaveLength(11);
  expect(shown(2)).toEqual([0, 2, 4, 6, 8, 10]);
  expect(shown(5)).toEqual([0, 5, 10]);
  expect(Array.from({ length: 10 }, (_, i) => i).filter((i) => tickShown(i, 10, 5))).toEqual([0, 5, 9]);
});

test('segments are equal parts or end at explicit stops', () => {
  expect(segmentBounds(undefined, 0, 100)).toEqual([{ from: 0, to: 100 }]);
  expect(segmentBounds(4, 0, 100).map((s) => s.to)).toEqual([25, 50, 75, 100]);
  expect(segmentBounds([50, 20, 20, 0, 400], 0, 100)).toEqual([
    { from: 0, to: 20 },
    { from: 20, to: 50 },
    { from: 50, to: 100 },
  ]);
  expect(segmentBounds(0, 0, 100)).toHaveLength(1);
});

test('the accessible text joins what is present', () => {
  expect(describe('72', 'Good', undefined, false, 'Previous: 65')).toBe('72, Good, Previous: 65');
});
