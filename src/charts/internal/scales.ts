// Pure maths shared by the charts: scales, ticks, formatting, the "show less" levels and label layout.
// Nothing here touches the DOM, so all of it is unit-tested (src/charts/scales.test.ts).
import { scaleBand, scaleLinear, scalePoint, scaleUtc } from 'd3-scale';

/**
 * Estimated width of a label, without measuring the DOM. The factor is on the wide side for the body
 * font, so a layout made from it leaves a little room instead of clipping.
 */
export const textWidth = (text: string, fontSize: number) => text.length * fontSize * 0.58;

/** Cuts a label to the room it has, ending in an ellipsis. SVG text cannot do this by itself. */
export function truncate(text: string, room: number, fontSize: number) {
  if (textWidth(text, fontSize) <= room) return text;
  const chars = Math.floor(room / (fontSize * 0.58)) - 1;
  return chars < 1 ? '' : text.slice(0, chars).trimEnd() + '…';
}

/** Keeps at most `max` items, evenly spread and always including the first. */
export function thin<T>(items: readonly T[], max: number): T[] {
  if (max <= 0) return [];
  const step = Math.ceil(items.length / Math.max(1, Math.floor(max)));
  return items.filter((_, i) => i % step === 0);
}

/**
 * The "show less" level of a slot: the number of thresholds its width or its height is below,
 * whichever is more. Thresholds are listed from the largest; level 0 shows everything.
 */
export function levelFor(
  width: number,
  height: number,
  widths: readonly number[],
  heights: readonly number[],
) {
  const below = (size: number, limits: readonly number[]) => limits.filter((limit) => size < limit).length;
  return Math.max(below(width, widths), below(height, heights));
}

/** A value domain widened to round numbers. `zero` makes it include 0. */
export function niceDomain(values: readonly number[], zero = false, count = 5): [number, number] {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (!values.length) [min, max] = [0, 1];
  if (zero) [min, max] = [Math.min(0, min), Math.max(0, max)];
  if (min === max) [min, max] = min === 0 ? [0, 1] : [Math.min(0, min), Math.max(0, max)];
  return scaleLinear().domain([min, max]).nice(count).domain() as [number, number];
}

export interface Scale<T> {
  (value: T): number;
  /** Tick values, about `count` of them, at round positions. */
  ticks: (count: number) => T[];
}

export function linear(domain: [number, number], range: [number, number]): Scale<number> {
  const scale = scaleLinear().domain(domain).range(range);
  return Object.assign((v: number) => scale(v), { ticks: (count: number) => scale.ticks(count) });
}

/** A time scale in UTC, so a chart draws the same in every time zone. */
export function time(domain: [Date, Date], range: [number, number]): Scale<Date> {
  const scale = scaleUtc().domain(domain).range(range);
  return Object.assign((v: Date) => scale(v), { ticks: (count: number) => scale.ticks(count) });
}

/** Evenly spaced positions for named values (categories, or the levels of an ordinal axis). */
export function points(domain: readonly string[], range: [number, number], padding = 0.5) {
  const scale = scalePoint<string>().domain(domain).range(range).padding(padding);
  return Object.assign((v: string) => scale(v) ?? NaN, { step: scale.step() });
}

/** Bands for bars: the start of each band, and the width they share. */
export function bands(domain: readonly string[], range: [number, number], inner = 0.25, outer = 0.15) {
  const scale = scaleBand<string>().domain(domain).range(range).paddingInner(inner).paddingOuter(outer);
  return Object.assign((v: string) => scale(v) ?? NaN, { width: scale.bandwidth() });
}

const formatters = new Map<string, Intl.NumberFormat>();
/** A number formatter for the locale, cached. */
export function numberFormat(locale: string | undefined, options: Intl.NumberFormatOptions = {}) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formatters.get(key);
  if (!format) formatters.set(key, (format = new Intl.NumberFormat(locale, options)));
  return (value: number) => format.format(value);
}

/** A date formatter for the locale, in UTC like the time scale. */
export function dateFormat(locale: string | undefined, options?: Intl.DateTimeFormatOptions) {
  const format = new Intl.DateTimeFormat(locale, {
    ...(options ?? { day: 'numeric', month: 'short' }),
    timeZone: 'UTC',
  });
  return (value: Date) => format.format(value);
}

/**
 * Where the tooltip sits relative to its point, so that it stays inside the plot: above the point
 * unless the point is in the top half, and aligned to the side of the plot the point is on. With the
 * tooltip no wider than two thirds of the plot, it cannot leave it sideways.
 */
export function placeTooltip(x: number, y: number, width: number, height: number) {
  return {
    align: x < width / 3 ? ('start' as const) : x > (2 * width) / 3 ? ('end' as const) : ('center' as const),
    side: y < height / 2 ? ('below' as const) : ('above' as const),
  };
}

/** A point on a circle. Angles are in degrees, clockwise from 12 o'clock. */
export function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [cx + radius * Math.sin(a), cy - radius * Math.cos(a)];
}

export interface PolarLabel {
  text: string;
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
}

/**
 * Fits a circle and the labels around it into a box: the radius is the largest that leaves every
 * label inside, but never less than a quarter of the box's short side; labels that still do not fit
 * are truncated. Labels are one line, placed just outside the circle at their angle.
 */
export function polarLayout(
  width: number,
  height: number,
  labels: readonly { text: string; angle: number }[],
  fontSize: number,
  gap = 8,
) {
  const cx = width / 2;
  const cy = height / 2;
  const line = fontSize * 1.25;
  const edge = 2;
  let radius = Math.min(width, height) / 2 - edge;
  const parts = labels.map(({ text, angle }) => {
    const a = (angle * Math.PI) / 180;
    const [sin, cos] = [Math.sin(a), Math.cos(a)];
    // A label near the top or bottom is centred on its point; others start or end at it.
    const centred = Math.abs(sin) < 0.2;
    return { text, sin, cos, centred };
  });
  for (const p of parts) {
    const w = textWidth(p.text, fontSize);
    if (!p.centred) radius = Math.min(radius, (cx - edge - w) / Math.abs(p.sin) - gap);
    // Labels above and below need a line of height; side labels need half a line.
    const room = cy - edge - (p.centred ? line : line / 2);
    if (Math.abs(p.cos) > 0.01) radius = Math.min(radius, room / Math.abs(p.cos) - (p.centred ? gap : 0));
  }
  radius = Math.max(radius, Math.min(width, height) / 4, 0);
  const placed: PolarLabel[] = parts.map((p) => {
    const x = cx + (radius + gap) * p.sin;
    // The text's baseline: above the circle for the top label, below for the bottom, else centred.
    const y = p.centred
      ? cy - (radius + gap) * p.cos + (p.cos > 0 ? -fontSize * 0.25 : fontSize * 0.85)
      : cy - (radius + gap) * p.cos + fontSize * 0.35;
    const room = p.centred ? width - 2 * edge : p.sin > 0 ? width - edge - x : x - edge;
    return {
      text: truncate(p.text, room, fontSize),
      x,
      y,
      anchor: p.centred ? 'middle' : p.sin > 0 ? 'start' : 'end',
    };
  });
  return { cx, cy, radius, labels: placed };
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * The margins around the plot of a chart with two axes, from what the level still shows:
 * level 2 drops the value labels, level 3 the axis titles, level 4 the axes.
 */
export function cartesianMargins(options: {
  level: number;
  fontSize: number;
  /** Width of the widest label on the left axis. */
  leftLabels: number;
  /** Extra room at the end of the plot, for labels drawn there. */
  endLabels?: number;
  /** Room above the plot for value labels. */
  topLabels?: boolean;
  leftTitle?: boolean;
  bottomTitle?: boolean;
}): Margins {
  const { level, fontSize, leftLabels, endLabels = 0 } = options;
  if (level >= 4) return { top: 3, right: 3, bottom: 3, left: 3 };
  const title = level < 3 ? fontSize + 8 : 0;
  const labels = level < 2;
  return {
    top: labels && options.topLabels ? fontSize + 8 : 8,
    right: (labels ? endLabels : 0) + 12,
    bottom: fontSize + 12 + (options.bottomTitle ? title : 0),
    left: leftLabels + 10 + (options.leftTitle ? title : 0),
  };
}

/** How many labels of a given size fit along an axis of `length` pixels. */
export const labelsThatFit = (length: number, labelSize: number, gap = 12) =>
  Math.max(1, Math.floor((length + gap) / (labelSize + gap)));

/**
 * Stacks the values of one category: positive values go up from zero and negative values down.
 * Returns the start and end of each value, in the order given; missing values take no room.
 */
export function stack(values: readonly (number | null)[]): ([number, number] | null)[] {
  let up = 0;
  let down = 0;
  return values.map((value) => {
    if (value == null) return null;
    if (value >= 0) return [up, (up += value)];
    return [down, (down += value)];
  });
}
