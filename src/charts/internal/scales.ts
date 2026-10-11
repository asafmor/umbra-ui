// Pure maths shared by the charts: scales, ticks, formatting, the "show less" levels and label layout.
// Nothing here touches the DOM (label widths come in as a measurer), so all of it is unit-tested (src/charts/scales.test.ts).
import { scaleBand, scaleLinear, scalePoint, scaleUtc } from 'd3-scale';

/** The width of a label in pixels, in the chart's font. */
export type Measure = (text: string) => number;

/**
 * The width of a label. With a measurer it is the real width (`measurer` in useChartSize.ts measures
 * the text in the chart's font). With a font size it is an estimate, for where there is no DOM: the
 * factor is on the wide side for the body font.
 */
export const textWidth = (text: string, font: number | Measure) =>
  typeof font === 'number' ? text.length * font * 0.58 : font(text);

/** Cuts a label to the room it has, ending in an ellipsis. SVG text cannot do this by itself. */
export function truncate(text: string, room: number, font: number | Measure) {
  if (textWidth(text, font) <= room) return text;
  const cut = (chars: number) => text.slice(0, chars).trimEnd() + '…';
  // The longest cut that fits: widths grow with the number of characters, so search by halves.
  let [low, high] = [0, text.length - 1];
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (textWidth(cut(middle), font) <= room) low = middle;
    else high = middle - 1;
  }
  return low < 1 ? '' : cut(low);
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
 * Where the tooltip would like to sit relative to its point: above the point unless the point is in
 * the top half, and aligned to the side of the plot the point is on.
 */
export function placeTooltip(x: number, y: number, width: number, height: number) {
  return {
    align: x < width / 3 ? ('start' as const) : x > (2 * width) / 3 ? ('end' as const) : ('center' as const),
    side: y < height / 2 ? ('below' as const) : ('above' as const),
  };
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The top left corner of the tooltip, so that it is never cut. It keeps the wanted side and alignment
 * and stays inside the chart when it fits there. A tooltip larger than the room the chart has leaves
 * the chart on that side (it is drawn above everything), and one that would leave the window takes
 * the other side or is moved back in.
 */
export function fitTooltip(input: {
  /** The point, in window pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  align: 'start' | 'center' | 'end';
  side: 'above' | 'below';
  chart: Rect;
  window: Rect;
  /** Distance from the point. */
  offset?: number | undefined;
}) {
  const { x, y, width, height, align, chart, window: w, offset = 10 } = input;
  const into = (value: number, size: number, from: number, to: number) =>
    Math.max(Math.min(value, to - size), from);
  let left = align === 'start' ? x : align === 'end' ? x - width : x - width / 2;
  // Sideways the tooltip is simply moved back in: into the chart when it is narrower, and into the window.
  if (width <= chart.right - chart.left) left = into(left, width, chart.left, chart.right);
  left = into(left, width, w.left, w.right);

  type Side = 'above' | 'below';
  const at = (side: Side) => (side === 'above' ? y - offset - height : y + offset);
  const fits = (side: Side, box: Rect) =>
    side === 'above' ? at(side) >= box.top : at(side) + height <= box.bottom;
  const sides: Side[] = [input.side, input.side === 'above' ? 'below' : 'above'];
  // Up and down it must not cover the point: a side inside the chart, or else a side inside the window.
  const side = sides.find((s) => fits(s, chart)) ?? sides.find((s) => fits(s, w)) ?? input.side;
  return { left, top: into(at(side), height, w.top, w.bottom), side };
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
  measure: Measure | number = fontSize,
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
    const w = textWidth(p.text, measure);
    if (!p.centred) radius = Math.min(radius, (cx - edge - w) / Math.abs(p.sin) - gap);
    // Labels above and below need a line of height; side labels need half a line.
    const room = cy - edge - (p.centred ? line : line / 2);
    // The gap counts for every label: a side label close to the top is pushed up by it as well.
    if (Math.abs(p.cos) > 0.01) radius = Math.min(radius, room / Math.abs(p.cos) - gap);
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
      text: truncate(p.text, room, measure),
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
  endLabels?: number | undefined;
  /** Width of the last label under the plot, which is centred on the plot's end. */
  endTick?: number | undefined;
  /** Room above the plot for value labels. */
  topLabels?: boolean | undefined;
  leftTitle?: boolean | undefined;
  bottomTitle?: boolean | undefined;
}): Margins {
  const { level, fontSize, leftLabels, endLabels = 0 } = options;
  if (level >= 4) return { top: 3, right: 3, bottom: 3, left: 3 };
  const title = level < 3 ? fontSize + 8 : 0;
  const labels = level < 2;
  return {
    top: labels && options.topLabels ? fontSize + 8 : 8,
    right: Math.max((labels ? endLabels : 0) + 12, (options.endTick ?? 0) / 2 + 2),
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
