import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { contrastRatio, parseColour } from '../provider/contrast';
import {
  bands,
  cartesianMargins,
  dateFormat,
  labelsThatFit,
  levelFor,
  linear,
  niceDomain,
  numberFormat,
  placeTooltip,
  points,
  polar,
  polarLayout,
  stack,
  textWidth,
  thin,
  time,
  truncate,
} from './internal/scales';

test('a nice domain is round, and can be made to include zero', () => {
  expect(niceDomain([42, 90])).toEqual([40, 90]);
  expect(niceDomain([42, 90], true)).toEqual([0, 100]);
  expect(niceDomain([-9, 12], true)).toEqual([-10, 15]);
  expect(niceDomain([])).toEqual([0, 1]);
  // One value still gives a range to draw in.
  expect(niceDomain([7])).toEqual([0, 7]);
  expect(niceDomain([0])).toEqual([0, 1]);
});

test('a linear scale maps the domain to pixels and gives round ticks', () => {
  const scale = linear([0, 100], [200, 0]);
  expect(scale(0)).toBe(200);
  expect(scale(50)).toBe(100);
  expect(scale.ticks(5)).toEqual([0, 20, 40, 60, 80, 100]);
  // Fewer ticks are asked for as the axis gets shorter.
  expect(scale.ticks(2)).toEqual([0, 50, 100]);
});

test('a time scale ticks in UTC', () => {
  const scale = time([new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2026, 3, 1))], [0, 300]);
  expect(scale.ticks(3).map((d) => d.toISOString().slice(0, 10))).toEqual([
    '2026-01-01',
    '2026-02-01',
    '2026-03-01',
    '2026-04-01',
  ]);
  expect(dateFormat('en-GB')(new Date(Date.UTC(2026, 1, 1)))).toBe('1 Feb');
});

test('point and band scales spread names evenly inside the range', () => {
  const p = points(['a', 'b', 'c'], [0, 300]);
  expect([p('a'), p('b'), p('c')]).toEqual([50, 150, 250]);
  expect(p('missing')).toBeNaN();
  const b = bands(['a', 'b'], [0, 200], 0, 0);
  expect([b('a'), b('b'), b.width]).toEqual([0, 100, 100]);
  const padded = bands(['a', 'b'], [0, 200]);
  expect(padded.width).toBeLessThan(100);
  expect(padded('a')).toBeGreaterThan(0);
  expect(padded('b') + padded.width).toBeLessThan(200);
});

test('numbers are formatted for the locale', () => {
  expect(numberFormat('en-US')(1234.5)).toBe('1,234.5');
  expect(numberFormat('de-DE')(1234.5)).toBe('1.234,5');
  expect(numberFormat('en-US', { style: 'percent' })(0.81)).toBe('81%');
});

test('thinning keeps the first label and spreads the rest', () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  expect(thin(months, 12)).toEqual(months);
  expect(thin(months, 6)).toEqual(['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']);
  expect(thin(months, 5)).toEqual(['Jan', 'Apr', 'Jul', 'Oct']);
  expect(thin(months, 1)).toEqual(['Jan']);
  expect(thin(months, 0)).toEqual([]);
  expect(labelsThatFit(300, 30)).toBe(7);
  expect(labelsThatFit(10, 30)).toBe(1);
});

test('labels are truncated to their room', () => {
  expect(truncate('Region 1', 200, 12)).toBe('Region 1');
  const cut = truncate('Customer satisfaction', 60, 12);
  expect(cut.endsWith('…')).toBe(true);
  expect(textWidth(cut, 12)).toBeLessThanOrEqual(60);
  expect(truncate('Anything', 5, 12)).toBe('');
});

test('the level rises as the width or the height falls below each threshold', () => {
  const widths = [360, 280, 220, 150];
  const heights = [240, 190, 150, 100];
  expect(levelFor(400, 300, widths, heights)).toBe(0);
  expect(levelFor(359, 300, widths, heights)).toBe(1);
  expect(levelFor(400, 189, widths, heights)).toBe(2);
  expect(levelFor(219, 300, widths, heights)).toBe(3);
  expect(levelFor(400, 99, widths, heights)).toBe(4);
  // The smaller of the two decides.
  expect(levelFor(300, 120, widths, heights)).toBe(3);
});

test('margins give up the labels, then the titles, then the axes', () => {
  const at = (level: number) =>
    cartesianMargins({
      level,
      fontSize: 12,
      leftLabels: 20,
      endLabels: 40,
      topLabels: true,
      leftTitle: true,
      bottomTitle: true,
    });
  expect(at(0)).toEqual({ top: 20, right: 52, bottom: 44, left: 50 });
  expect(at(2)).toEqual({ top: 8, right: 12, bottom: 44, left: 50 });
  expect(at(3)).toEqual({ top: 8, right: 12, bottom: 24, left: 30 });
  expect(at(4)).toEqual({ top: 3, right: 3, bottom: 3, left: 3 });
});

test('the tooltip flips at the edges of the plot', () => {
  expect(placeTooltip(10, 150, 300, 200)).toEqual({ align: 'start', side: 'above' });
  expect(placeTooltip(150, 150, 300, 200)).toEqual({ align: 'center', side: 'above' });
  expect(placeTooltip(290, 20, 300, 200)).toEqual({ align: 'end', side: 'below' });
});

test('polar coordinates start at 12 o’clock and go clockwise', () => {
  const near = ([x, y]: [number, number]) => [Math.round(x), Math.round(y)];
  expect(near(polar(100, 100, 50, 0))).toEqual([100, 50]);
  expect(near(polar(100, 100, 50, 90))).toEqual([150, 100]);
  expect(near(polar(100, 100, 50, 180))).toEqual([100, 150]);
  expect(near(polar(100, 100, 50, 270))).toEqual([50, 100]);
});

test('labels around a circle stay inside the box', () => {
  const names = ['Speed', 'Quality', 'Cost', 'Reach', 'Support', 'Safety', 'Growth', 'Reliability'];
  for (const [width, height] of [
    [400, 300],
    [240, 200],
    [160, 160],
  ] as const) {
    const fontSize = 13;
    const layout = polarLayout(
      width,
      height,
      names.map((text, i) => ({ text, angle: i * 45 })),
      fontSize,
    );
    expect(layout.radius).toBeGreaterThanOrEqual(Math.min(width, height) / 4);
    for (const label of layout.labels) {
      const w = textWidth(label.text, fontSize);
      const left =
        label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - w : label.x - w / 2;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left + w).toBeLessThanOrEqual(width);
      expect(label.y - fontSize).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeLessThanOrEqual(height);
    }
  }
  // Without labels the circle takes the whole short side.
  expect(polarLayout(200, 100, [], 13).radius).toBe(48);
});

test('stacking sends positive values up and negative values down', () => {
  expect(stack([10, 5, null, 20])).toEqual([[0, 10], [10, 15], null, [15, 35]]);
  expect(stack([10, -4, 6, -2])).toEqual([
    [0, 10],
    [0, -4],
    [10, 16],
    [-4, -6],
  ]);
});

test('axis and grid lines have 3:1 and axis text 4.5:1 against the card surfaces', () => {
  const base = JSON.parse(readFileSync('plan/tokens.json', 'utf8')).color.base;
  // The darkest and the lightest surface a chart sits on; the tinted cards lie between them.
  for (const surface of [base.surface1, base.surfaceNeutral, base.surface2]) {
    const on = parseColour(surface)!;
    expect(contrastRatio(parseColour(base.borderControl)!, on)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(parseColour(base.textSecondary)!, on)).toBeGreaterThanOrEqual(4.5);
  }
});
