// The maths shared by ProgressBar and LevelMeter: value to position, thresholds, zones, tick thinning
// and the text read by assistive technology. Pure functions, unit-tested in scale.test.ts.

/** Colour of a fill or marker. `ramp-1` to `ramp-5` are the five steps of the value ramp, low to high. */
export type MeterTone =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ramp-1'
  | 'ramp-2'
  | 'ramp-3'
  | 'ramp-4'
  | 'ramp-5';

/** A fill pattern: the cue that does not depend on colour. */
export type MeterPattern = 'none' | 'diagonal' | 'vertical' | 'reverse';

/** Where `value` sits between `min` and `max`, from 0 to 1. Out-of-range values clamp; a bad scale gives 0. */
export function toFraction(value: number, min: number, max: number) {
  if (!(max > min) || !Number.isFinite(value)) return value === Infinity && max > min ? 1 : 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** `under` or `over` when the value is outside the scale. */
export function outOfRange(value: number, min: number, max: number) {
  return value < min ? 'under' : value > max ? 'over' : undefined;
}

export interface Threshold {
  /** The band starts at this value and runs to the next threshold. */
  from: number;
  tone: MeterTone;
  /** Shown beside the value and read by assistive technology, for example "Low". */
  label?: string;
}

export interface ResolvedThreshold extends Threshold {
  pattern: MeterPattern;
}

/** Thirds of the scale: danger, warning, success. */
export function defaultThresholds(min: number, max: number): Threshold[] {
  const third = (max - min) / 3;
  return [
    { from: min, tone: 'danger' },
    { from: min + third, tone: 'warning' },
    { from: min + 2 * third, tone: 'success' },
  ];
}

const bandPatterns: MeterPattern[] = ['diagonal', 'vertical', 'reverse'];

/**
 * The band `value` falls in: the highest threshold whose `from` is not above it. Each band also gets a
 * pattern, so bands differ without colour: the last one is solid, the others are hatched. `invert`
 * reverses which tone and pattern each band gets (the labels stay), for a scale where low is good.
 */
export function thresholdFor(
  value: number,
  thresholds: Threshold[],
  invert = false,
): ResolvedThreshold | undefined {
  const bands = [...thresholds].sort((a, b) => a.from - b.from);
  const last = bands.length - 1;
  let index = -1;
  bands.forEach((band, i) => {
    if (value >= band.from) index = i;
  });
  if (index < 0) return undefined;
  const look = invert ? last - index : index;
  return {
    ...bands[index]!,
    tone: bands[look]!.tone,
    pattern: look === last ? 'none' : bandPatterns[look % bandPatterns.length]!,
  };
}

export interface Zone {
  from: number;
  to: number;
  tone: MeterTone;
  label?: string;
}

/** The zone that holds `value`. A value on a shared boundary belongs to the later zone. */
export function zoneFor(value: number, zones: Zone[]) {
  return [...zones].reverse().find((z) => value >= z.from && value <= z.to);
}

/** The inner zone edges, as fractions of the scale: where the taller boundary ticks are drawn. */
export function zoneBoundaries(zones: Zone[], min: number, max: number) {
  const edges = zones.flatMap((z) => [z.from, z.to]).filter((v) => v > min && v < max);
  return [...new Set(edges)].sort((a, b) => a - b).map((v) => toFraction(v, min, max));
}

/** The position of each of `count` ticks spread from one end to the other, as fractions. */
export function tickFractions(count: number) {
  if (count <= 1) return count === 1 ? [0] : [];
  return Array.from({ length: count }, (_, i) => i / (count - 1));
}

/** Whether tick `index` is drawn when only every `stride`-th tick is. The last tick always is. */
export function tickShown(index: number, count: number, stride: number) {
  return stride <= 1 || index % stride === 0 || index === count - 1;
}

/** Splits a scale into segments: `segments` is how many equal ones, or the values where one ends. */
export function segmentBounds(segments: number | number[] | undefined, min: number, max: number) {
  const stops =
    typeof segments === 'number'
      ? Array.from({ length: Math.max(1, Math.floor(segments)) - 1 }, (_, i) => {
          return min + ((i + 1) * (max - min)) / Math.max(1, Math.floor(segments));
        })
      : [...new Set(segments ?? [])].filter((s) => s > min && s < max).sort((a, b) => a - b);
  const edges = [min, ...stops, max];
  return edges.slice(0, -1).map((from, i) => ({ from, to: edges[i + 1]! }));
}

/** Joins the pieces of an accessible value text, skipping the missing ones. */
export function describe(...pieces: (string | false | null | undefined)[]) {
  return pieces.filter(Boolean).join(', ');
}
