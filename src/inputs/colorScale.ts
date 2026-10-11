// The rules of ColorScaleEditor's value: an ascending list of stops inside a scale, the first one at the
// bottom of it. Pure functions, unit-tested in colorScale.test.ts.
import type { Threshold, ThresholdTone } from '../utils/thresholds';

export interface Scale {
  min: number;
  max: number;
  step: number;
}

const decimals = (step: number) => `${step}`.split('.')[1]?.length ?? 0;

/** `value` on the nearest step of the scale. */
export const snap = (value: number, { min, step }: Scale) =>
  Number((min + Math.round((value - min) / step) * step).toFixed(decimals(step)));

/** The lowest and highest `from` stop `index` may take: one step clear of its neighbours, inside the scale. */
export function boundsOf(stops: readonly Threshold[], index: number, scale: Scale): [number, number] {
  if (index === 0) return [scale.min, scale.min];
  const low = stops[index - 1]!.from + scale.step;
  const high = (stops[index + 1]?.from ?? scale.max + scale.step) - scale.step;
  return [low, Math.max(low, high)];
}

/** Any list as a valid value: sorted, the first stop at the bottom, each a step above the one before. */
export function normalizeStops(stops: readonly Threshold[], scale: Scale): Threshold[] {
  const sorted = [...stops].sort((a, b) => a.from - b.from);
  const out: Threshold[] = [];
  sorted.forEach((stop, i) => {
    const low = i === 0 ? scale.min : out[i - 1]!.from + scale.step;
    const high = i === 0 ? scale.min : scale.max - (sorted.length - 1 - i) * scale.step;
    const from = Math.min(Math.max(snap(stop.from, scale), low), Math.max(low, high));
    out.push(from === stop.from ? stop : { ...stop, from });
  });
  return out;
}

/** The list with stop `index` moved to `from`, held between its neighbours. The first stop does not move. */
export function moveStop(stops: readonly Threshold[], index: number, from: number, scale: Scale) {
  if (index <= 0 || index >= stops.length || Number.isNaN(from)) return [...stops];
  const [low, high] = boundsOf(stops, index, scale);
  const next = Math.min(high, Math.max(low, snap(from, scale)));
  return stops.map((stop, i) => (i === index ? { ...stop, from: next } : stop));
}

const palette: ThresholdTone[] = [
  'ramp-1',
  'ramp-2',
  'ramp-3',
  'ramp-4',
  'ramp-5',
  'info',
  'success',
  'warning',
  'danger',
  'accent',
  'neutral',
];

/**
 * The list with one more stop, in the middle of its widest band, in a tone no other stop has. `null`
 * when no band has room for another boundary. Also returns where the new stop is.
 */
export function addStop(stops: readonly Threshold[], scale: Scale) {
  if (!stops.length) return { stops: [{ from: scale.min, tone: palette[0]! } as Threshold], index: 0 };
  let widest = 0;
  let width = -1;
  stops.forEach((stop, i) => {
    const size = (stops[i + 1]?.from ?? scale.max) - stop.from;
    if (size > width) [widest, width] = [i, size];
  });
  const after = stops[widest + 1];
  const low = stops[widest]!.from + scale.step;
  const high = after ? after.from - scale.step : scale.max;
  if (low > high) return null;
  const from = Math.min(high, Math.max(low, snap(stops[widest]!.from + width / 2, scale)));
  const tone = palette.find((t) => !stops.some((stop) => stop.tone === t)) ?? 'neutral';
  const next: Threshold[] = [...stops.slice(0, widest + 1), { from, tone }, ...stops.slice(widest + 1)];
  return { stops: next, index: widest + 1 };
}

/** The list without stop `index`. When the first goes, the next one becomes the bottom of the scale. */
export function removeStop(stops: readonly Threshold[], index: number, scale: Scale): Threshold[] {
  const rest = stops.filter((_, i) => i !== index);
  return rest.map((stop, i) => (i === 0 && stop.from !== scale.min ? { ...stop, from: scale.min } : stop));
}

export const sameStops = (a: readonly Threshold[] | undefined, b: readonly Threshold[] | undefined) =>
  JSON.stringify(a) === JSON.stringify(b);
