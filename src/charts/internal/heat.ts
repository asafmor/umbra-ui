// The maths of the heatmap: binning points into a grid, and the step of a value on the colour scale.
// Pure, and unit-tested in src/charts/heat.test.ts.

export interface HeatPoint {
  x: number;
  y: number;
  /** What the point adds to its cell. Defaults to 1, so a cell counts its points. */
  value?: number | undefined;
}

const extent = (values: readonly number[]): [number, number] => {
  const [min, max] = [Math.min(...values), Math.max(...values)];
  if (!values.length) return [0, 1];
  return min === max ? [min, min + 1] : [min, max];
};

const edges = ([from, to]: [number, number], count: number) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);

/**
 * Sums points into a grid of `bins` columns by rows. Rows run from the top down, so the first row holds
 * the highest `y`, as a chart draws it. A cell no point fell in is `null`: there is nothing there, which
 * is not the same as a low value. Points outside the domains, and points whose position or value is
 * not a finite number, are left out; one on the upper edge belongs
 * to the last cell.
 */
export function binPoints(
  points: readonly HeatPoint[],
  options: {
    bins?: number | [number, number] | undefined;
    xDomain?: [number, number] | undefined;
    yDomain?: [number, number] | undefined;
  } = {},
) {
  const { bins = 8 } = options;
  const [nx, ny] = (typeof bins === 'number' ? [bins, bins] : bins).map((n) =>
    Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 8,
  );
  const xDomain = options.xDomain ?? extent(points.map((p) => p.x).filter(Number.isFinite));
  const yDomain = options.yDomain ?? extent(points.map((p) => p.y).filter(Number.isFinite));
  const values: (number | null)[][] = Array.from({ length: ny! }, () => Array<number | null>(nx!).fill(null));
  const cell = (v: number, [from, to]: [number, number], count: number) => {
    if (!(v >= from && v <= to)) return -1;
    return Math.min(count - 1, Math.floor(((v - from) / (to - from)) * count));
  };
  for (const p of points) {
    const [c, r] = [cell(p.x, xDomain, nx!), cell(p.y, yDomain, ny!)];
    // A point that is not at a position, or adds something that is not a number, adds nothing.
    if (c < 0 || r < 0 || !Number.isFinite(p.value ?? 1)) continue;
    const row = values[ny! - 1 - r]!;
    row[c] = (row[c] ?? 0) + (p.value ?? 1);
  }
  return { xEdges: edges(xDomain, nx!), yEdges: edges(yDomain, ny!), values };
}

/** The step of `value` on a scale cut into `count` equal steps, from 0. Values outside the domain clamp. */
export function stepIndex(value: number, [from, to]: [number, number], count: number) {
  if (!(to > from)) return count - 1;
  return Math.min(count - 1, Math.max(0, Math.floor(((value - from) / (to - from)) * count)));
}

/** How much of the scale's high colour step `position` of `count` takes, in percent: 15 to 100. */
export const stepShare = (position: number, count: number) =>
  count > 1 ? Math.round(15 + (85 * position) / (count - 1)) : 100;

/** The side of a cell's mark as a share of its cell, when size stands in for the printed value: 0.45 to 1. */
export const stepSize = (position: number, count: number) =>
  count > 1 ? 0.45 + (0.55 * position) / (count - 1) : 1;
