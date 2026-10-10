// Line and area paths: pure, and unit-tested in src/charts/paths.test.ts.
import { area, curveLinear, curveMonotoneX, curveStepAfter, line } from 'd3-shape';

export type LineCurve = 'linear' | 'step' | 'smooth';
/** A point in pixels; a missing value has no `y` and breaks the line. */
export type LinePixel = readonly [x: number, y: number | null];

const curves = { linear: curveLinear, step: curveStepAfter, smooth: curveMonotoneX };
const defined = (p: LinePixel) => p[1] != null;

export const linePath = (points: readonly LinePixel[], curve: LineCurve = 'linear') =>
  line<LinePixel>()
    .defined(defined)
    .x((p) => p[0])
    .y((p) => p[1]!)
    .curve(curves[curve])(points as LinePixel[]) ?? '';

/** The area between the line and `base` (a y position). */
export const areaPath = (points: readonly LinePixel[], base: number, curve: LineCurve = 'linear') =>
  area<LinePixel>()
    .defined(defined)
    .x((p) => p[0])
    .y0(base)
    .y1((p) => p[1]!)
    .curve(curves[curve])(points as LinePixel[]) ?? '';

/** True for a value with no neighbour to draw a line to: it needs a point to be seen at all. */
export const isIsolated = (points: readonly LinePixel[], index: number) =>
  points[index]?.[1] != null && points[index - 1]?.[1] == null && points[index + 1]?.[1] == null;

/** Moves label positions apart so that no two are closer than `gap`, keeping their order. */
export function spread(positions: readonly number[], gap: number, min: number, max: number): number[] {
  const order = positions.map((p, i) => [p, i] as const).sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  let last = -Infinity;
  for (const [p, i] of order) out[i] = last = Math.max(p, last + gap, min);
  // If the last ones were pushed past the end, push back from the end.
  let next = Infinity;
  for (const [, i] of order.reverse()) out[i] = next = Math.min(out[i]!, next - gap, max);
  return out;
}
