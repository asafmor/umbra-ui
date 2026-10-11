// The maths shared by ProgressBar and LevelMeter: value to position, the look of a threshold band, tick
// thinning and the text read by assistive technology. Pure functions, unit-tested in scale.test.ts.
import {
  normalizeThresholds,
  type Threshold,
  type ThresholdList,
  type ThresholdTone,
} from '../utils/thresholds';

/**
 * Colour of a fill or marker: `default`, or any tone a threshold can have. `ramp-1` to `ramp-5` are the
 * five steps of the value ramp, low to high.
 */
export type MeterTone = 'default' | ThresholdTone;

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

/** `thresholds={true}`: thirds of the scale, danger, warning, success. */
export function thirdsThresholds(min: number, max: number): Threshold[] {
  const third = (max - min) / 3;
  return [
    { from: min, tone: 'danger' },
    { from: min + third, tone: 'warning' },
    { from: min + 2 * third, tone: 'success' },
  ];
}

const bandPatterns: MeterPattern[] = ['diagonal', 'vertical', 'reverse'];

/**
 * The pattern of a band, so bands differ without colour, whatever their colours are: the top one is
 * solid, the others are hatched, by position.
 */
export const bandPattern = ({ cue, count }: { cue: number; count: number }): MeterPattern =>
  cue === count - 1 ? 'none' : bandPatterns[cue % bandPatterns.length]!;

/** Where the bands start inside the scale, as fractions: where the taller boundary ticks are drawn. */
export function bandBoundaries(thresholds: ThresholdList | undefined, min: number, max: number) {
  const edges = normalizeThresholds(thresholds)
    .map((t) => t.from)
    .filter((v) => v > min && v < max);
  return [...new Set(edges)].map((v) => toFraction(v, min, max));
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
