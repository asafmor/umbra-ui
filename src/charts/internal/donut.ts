// The geometry of a donut: pure, and unit-tested in src/charts/paths.test.ts.
import { arc } from 'd3-shape';
import { polar } from './scales';

export interface DonutArc {
  /** Path centred on 0,0; empty when the value takes no room. */
  d: string;
  /** Start, end and middle angle in degrees, clockwise from `startAngle`'s zero at 12 o'clock. */
  start: number;
  end: number;
  mid: number;
  /** The middle of the band, relative to the centre: where the tooltip points. */
  centroid: [number, number];
}

export interface DonutOptions {
  /** What a full ring stands for. */
  total: number;
  outer: number;
  inner: number;
  startAngle?: number;
  /** Degrees the ring covers; 360 is a full ring. */
  sweep?: number;
  /** Degrees left empty between two segments. */
  gap?: number;
  rounded?: boolean;
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** One arc of the ring, between two angles in degrees. */
export function ringArc(start: number, end: number, outer: number, inner: number, rounded = false) {
  return (
    arc().cornerRadius(rounded ? (outer - inner) / 2 : 0)({
      innerRadius: inner,
      outerRadius: outer,
      startAngle: radians(start),
      endAngle: radians(end),
    }) ?? ''
  );
}

/** The arcs of the values, one after the other. Negative values count as zero. */
export function donutArcs(values: readonly number[], options: DonutOptions): DonutArc[] {
  const { total, outer, inner, startAngle = 0, sweep = 360, rounded = false } = options;
  const drawn = values.filter((v) => v > 0).length;
  // A gap only between segments: one segment that is the whole ring has none.
  const gap = drawn > 1 ? (options.gap ?? 0) : 0;
  let at = startAngle;
  return values.map((value) => {
    const size = total > 0 ? (Math.min(Math.max(value, 0), total) / total) * sweep : 0;
    const [start, end] = [at, at + size];
    at = end;
    const mid = (start + end) / 2;
    const [x, y] = polar(0, 0, (outer + inner) / 2, mid);
    // The gap is taken from both ends, but never more than the segment has.
    const pad = Math.min(gap / 2, size / 4);
    return {
      d: size > 0 ? ringArc(start + pad, end - pad, outer, inner, rounded) : '',
      start,
      end,
      mid,
      centroid: [x, y],
    };
  });
}

/** The ring's default thickness: a fifth of its radius, as in the source's KPI rings. */
export const donutThickness = (outer: number) => Math.min(Math.max(outer * 0.2, 3), 28);

/** The tone of a value: the last threshold it reaches. */
export function toneFor<T>(value: number, thresholds: readonly { from: number; tone: T }[] | undefined) {
  let tone: T | undefined;
  for (const t of [...(thresholds ?? [])].sort((a, b) => a.from - b.from)) if (value >= t.from) tone = t.tone;
  return tone;
}
