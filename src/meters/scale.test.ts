import { expect, test } from 'vitest';
import {
  defaultThresholds,
  describe,
  outOfRange,
  segmentBounds,
  thresholdFor,
  tickFractions,
  tickShown,
  toFraction,
  zoneBoundaries,
  zoneFor,
  type Threshold,
  type Zone,
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
  { from: 60, tone: 'success', label: 'High' },
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 30, tone: 'warning', label: 'Medium' },
];

test('a value takes the highest threshold that is not above it, in any order of the list', () => {
  expect(thresholdFor(10, bands)).toMatchObject({ tone: 'danger', label: 'Low', pattern: 'diagonal' });
  expect(thresholdFor(30, bands)).toMatchObject({ tone: 'warning', label: 'Medium', pattern: 'vertical' });
  expect(thresholdFor(59.9, bands)?.tone).toBe('warning');
  expect(thresholdFor(100, bands)).toMatchObject({ tone: 'success', pattern: 'none' });
  expect(thresholdFor(500, bands)?.tone).toBe('success');
});

test('a value below every threshold has none', () => {
  expect(thresholdFor(-1, bands)).toBeUndefined();
  expect(thresholdFor(5, [])).toBeUndefined();
});

test('invert swaps the tones and patterns of the bands and keeps their labels', () => {
  expect(thresholdFor(10, bands, true)).toMatchObject({ tone: 'success', label: 'Low', pattern: 'none' });
  expect(thresholdFor(40, bands, true)).toMatchObject({ tone: 'warning', label: 'Medium' });
  expect(thresholdFor(90, bands, true)).toMatchObject({ tone: 'danger', label: 'High', pattern: 'diagonal' });
});

test('the default thresholds are thirds of the scale', () => {
  const thirds = defaultThresholds(0, 90);
  expect(thirds.map((t) => t.from)).toEqual([0, 30, 60]);
  expect(thresholdFor(29, thirds)?.tone).toBe('danger');
  expect(thresholdFor(30, thirds)?.tone).toBe('warning');
  expect(thresholdFor(60, thirds)?.tone).toBe('success');
});

const zones: Zone[] = [
  { from: 0, to: 40, tone: 'danger', label: 'Poor' },
  { from: 40, to: 70, tone: 'warning', label: 'Fair' },
  { from: 70, to: 100, tone: 'success', label: 'Good' },
];

test('a value belongs to the zone that holds it; a shared edge goes to the later zone', () => {
  expect(zoneFor(10, zones)?.label).toBe('Poor');
  expect(zoneFor(40, zones)?.label).toBe('Fair');
  expect(zoneFor(100, zones)?.label).toBe('Good');
  expect(zoneFor(120, zones)).toBeUndefined();
});

test('boundary ticks sit on the inner zone edges only', () => {
  expect(zoneBoundaries(zones, 0, 100)).toEqual([0.4, 0.7]);
  expect(zoneBoundaries([{ from: 0, to: 100, tone: 'info' }], 0, 100)).toEqual([]);
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
