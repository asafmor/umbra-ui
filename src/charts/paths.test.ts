import { expect, test } from 'vitest';
import { annotationMarks, fitTicks } from './internal/cartesian';
import { dash, fillKind, lineCues, pointShape, seriesColour } from './internal/cues';
import { donutArcs, donutThickness, ringArc, toneFor } from './internal/donut';
import { areaPath, isIsolated, linePath, spread } from './internal/line';
import { polygonPath, radarAngles, radarPoints, radarRing } from './internal/radar';

test('donut arcs share the ring in proportion to their values', () => {
  const arcs = donutArcs([50, 25, 25], { total: 100, outer: 50, inner: 40 });
  expect(arcs.map((a) => [a.start, a.end])).toEqual([
    [0, 180],
    [180, 270],
    [270, 360],
  ]);
  // The first half of the ring is on the right: its middle points to 3 o'clock.
  expect(arcs[0]!.centroid.map((v) => Math.round(v) || 0)).toEqual([45, 0]);
  expect(arcs.every((a) => a.d.startsWith('M'))).toBe(true);
});

test('a single value is clamped to the total, and nothing draws nothing', () => {
  const [over] = donutArcs([150], { total: 100, outer: 50, inner: 40 });
  expect(over!.end).toBe(360);
  const [none] = donutArcs([0], { total: 100, outer: 50, inner: 40 });
  expect(none!.d).toBe('');
  const [negative] = donutArcs([-5], { total: 100, outer: 50, inner: 40 });
  expect(negative!.d).toBe('');
  expect(donutArcs([10], { total: 0, outer: 50, inner: 40 })[0]!.d).toBe('');
});

test('start angle and sweep move and shorten the ring', () => {
  const [arc] = donutArcs([50], { total: 100, outer: 50, inner: 40, startAngle: -120, sweep: 240 });
  expect([arc!.start, arc!.end]).toEqual([-120, 0]);
});

test('a gap shortens segments, and rounded caps change the path', () => {
  const options = { total: 100, outer: 50, inner: 40 };
  const plain = donutArcs([50, 50], options);
  const gapped = donutArcs([50, 50], { ...options, gap: 4 });
  expect(gapped[0]!.d).not.toBe(plain[0]!.d);
  // The angles the segment stands for do not change; only what is drawn does.
  expect(gapped[0]!.end).toBe(180);
  // One segment has no neighbour to keep a gap from.
  expect(donutArcs([100], { ...options, gap: 4 })[0]!.d).toBe(donutArcs([100], options)[0]!.d);
  expect(ringArc(0, 90, 50, 40, true)).not.toBe(ringArc(0, 90, 50, 40, false));
});

test('thickness follows the radius within limits, and thresholds pick a tone', () => {
  expect(donutThickness(40)).toBe(8);
  expect(donutThickness(5)).toBe(3);
  expect(donutThickness(400)).toBe(28);
  const thresholds = [
    { from: 80, tone: 'good' },
    { from: 0, tone: 'bad' },
    { from: 50, tone: 'fair' },
  ];
  expect(toneFor(34, thresholds)).toBe('bad');
  expect(toneFor(50, thresholds)).toBe('fair');
  expect(toneFor(92, thresholds)).toBe('good');
  expect(toneFor(-1, thresholds)).toBeUndefined();
  expect(toneFor(10, undefined)).toBeUndefined();
});

test('radar points sit along their axes at the share of the maximum', () => {
  const angles = radarAngles(4);
  expect(angles).toEqual([0, 90, 180, 270]);
  expect(radarAngles(3, 60)).toEqual([60, 180, 300]);
  const points = radarPoints([10, 5, null, 40], [10, 10, 10, 20], 100, 100, 50, angles);
  expect(points.map(([x, y]) => [Math.round(x), Math.round(y)])).toEqual([
    [100, 50],
    [125, 100],
    // A missing value sits at the centre, and a value above the maximum at the outer ring.
    [100, 100],
    [50, 100],
  ]);
  expect(polygonPath(points)).toBe('M100 50L125 100L100 100L50 100Z');
  expect(polygonPath([])).toBe('');
});

test('radar rings are polygons through the axes, or circles', () => {
  expect(radarRing('polygon', 100, 100, 50, [0, 90, 180, 270])).toBe('M100 50L150 100L100 150L50 100Z');
  expect(radarRing('circle', 100, 100, 50, [0, 90])).toBe('M50 100a50 50 0 1 0 100 0a50 50 0 1 0 -100 0Z');
});

test('a missing value breaks the line into pieces', () => {
  const points = [
    [0, 10],
    [10, 20],
    [20, null],
    [30, 5],
    [40, 15],
  ] as const;
  expect(linePath(points)).toBe('M0,10L10,20M30,5L40,15');
  expect(linePath(points, 'step')).toBe('M0,10L10,10L10,20M30,5L40,5L40,15');
  // A smooth line still passes through every point.
  const smooth = linePath(points.slice(0, 2), 'smooth');
  expect(smooth.startsWith('M0,10')).toBe(true);
  expect(smooth.endsWith('10,20')).toBe(true);
  expect(areaPath(points.slice(0, 2), 100)).toBe('M0,10L10,20L10,100L0,100Z');
  expect(linePath([])).toBe('');
});

test('a value with no neighbours is isolated', () => {
  const points = [
    [0, 1],
    [1, null],
    [2, 3],
    [3, null],
    [4, 5],
    [5, 6],
  ] as const;
  expect(points.map((_, i) => isIsolated(points, i))).toEqual([true, false, true, false, false, false]);
});

test('end labels are moved apart and kept inside the plot', () => {
  expect(spread([10, 12, 50], 10, 0, 100)).toEqual([10, 20, 50]);
  // Order is by position, not by input order.
  expect(spread([50, 10, 12], 10, 0, 100)).toEqual([50, 10, 20]);
  expect(spread([95, 96], 10, 0, 100)).toEqual([90, 100]);
});

test('annotations become pixel spans, and unknown values are dropped', () => {
  const position = (axis: 'x' | 'y', value: unknown) =>
    typeof value === 'number' ? (axis === 'y' ? 200 - value : value) : NaN;
  expect(
    annotationMarks(
      [
        { type: 'line', value: 75, label: 'Target' },
        { type: 'band', axis: 'x', from: 40, to: 10 },
        { type: 'line', value: 'not on this axis' },
      ],
      position,
    ),
  ).toEqual([
    { kind: 'line', vertical: false, from: 125, to: 125, label: 'Target', color: undefined },
    { kind: 'band', vertical: true, from: 10, to: 40, label: undefined, color: undefined },
  ]);
});

test('tick labels thin out as the axis gets shorter', () => {
  const ticks = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label, i) => ({ at: i * 10, label }));
  expect(fitTicks(ticks, 400, 12, true)).toHaveLength(6);
  expect(fitTicks(ticks, 120, 12, true).map((t) => t.label)).toEqual(['Jan', 'Mar', 'May']);
  expect(fitTicks(ticks, 40, 12, true).map((t) => t.label)).toEqual(['Jan']);
  // Across the text, a label needs a line of height.
  expect(fitTicks(ticks, 50, 12, false).map((t) => t.label)).toEqual(['Jan', 'Apr']);
});

test('neighbouring series never share a cue', () => {
  const lines = Array.from({ length: 12 }, (_, i) => `${pointShape(i)}/${dash(i)}`);
  expect(new Set(lines).size).toBe(12);
  for (let i = 0; i < 23; i++) expect(fillKind(i)).not.toBe(fillKind(i + 1));
  expect([0, 1, 2, 3].map(fillKind)).toEqual(['square', 'stripes', 'dots', 'square']);
});

test('twelve line series differ by shape and dash alone, and 24 by colour and cue (C5)', () => {
  const cue = (i: number) => `${pointShape(i)}/${dash(i) ?? 'solid'}`;
  const twelve = Array.from({ length: lineCues }, (_, i) => cue(i));
  expect(lineCues).toBe(12);
  expect(new Set(twelve).size).toBe(12);
  // The thirteenth series looks like the first, apart from its colour.
  expect(cue(12)).toBe(cue(0));
  const coloured = Array.from({ length: 24 }, (_, i) => `${seriesColour(i)}/${cue(i)}`);
  expect(new Set(coloured).size).toBe(24);
  expect(`${seriesColour(24)}/${cue(24)}`).toBe(coloured[0]);
});
