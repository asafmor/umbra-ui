// The geometry of a radar chart: pure, and unit-tested in src/charts/paths.test.ts.
import { polar } from './scales';

/** The angle of each axis in degrees, clockwise from `start` (0 is 12 o'clock). */
export const radarAngles = (count: number, start = 0) =>
  Array.from({ length: count }, (_, i) => start + (i * 360) / count);

/** A closed path through the points. */
export const polygonPath = (points: readonly (readonly [number, number])[]) =>
  points.length ? points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)} ${round(y)}`).join('') + 'Z' : '';

const round = (v: number) => Math.round(v * 100) / 100;

/**
 * Where each value of a series sits: along its axis, at its share of the axis maximum. Values are
 * clamped to the axis, and a missing value sits at the centre.
 */
export function radarPoints(
  values: readonly (number | null | undefined)[],
  maxes: readonly number[],
  cx: number,
  cy: number,
  radius: number,
  angles: readonly number[],
): [number, number][] {
  return angles.map((angle, i) => {
    const max = maxes[i] ?? 0;
    const share = max > 0 ? Math.min(Math.max((values[i] ?? 0) / max, 0), 1) : 0;
    return polar(cx, cy, radius * share, angle);
  });
}

/** One ring of the grid at a share of the radius: a polygon through the axes, or a circle. */
export function radarRing(
  shape: 'polygon' | 'circle',
  cx: number,
  cy: number,
  radius: number,
  angles: readonly number[],
) {
  if (shape === 'polygon') return polygonPath(angles.map((a) => polar(cx, cy, radius, a)));
  const r = round(radius);
  return `M${round(cx - radius)} ${round(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}
