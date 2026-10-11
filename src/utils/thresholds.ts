// One `thresholds` shape for every component that colours by value (plan/decisions/07-customisation.md):
// the type, the two shorthands and the resolver. Pure functions, unit-tested in thresholds.test.ts.
import type { Tone } from '../data/tone';
import { warn } from './dev';

/** The colour of a band by meaning: a tone, or a step of the value ramp (`ramp-1` worst to `ramp-5` best). */
export type ThresholdTone = Tone | 'ramp-1' | 'ramp-2' | 'ramp-3' | 'ramp-4' | 'ramp-5';

/** One band of a value scale: from this value up, until the next entry of the list. */
export interface Threshold {
  /** The band starts at this value (included) and runs to the `from` of the next entry. */
  from: number;
  /** Colour by meaning. Without `tone` and `color` the band keeps the component's own colour. */
  tone?: ThresholdTone | undefined;
  /** Any CSS colour. Wins over `tone`. */
  color?: string | undefined;
  /** Names the band, for example "Low": shown or read with the value. */
  label?: string | undefined;
}

/**
 * What a `thresholds` prop takes: an ascending list of bands, or plain numbers as shorthand for
 * boundaries spread on the value ramp (`rampThresholds`). A component that adds members to `Threshold`
 * (`BarThreshold`) keeps them optional, so the same list fits every component.
 */
export type ThresholdList<T extends Threshold = Threshold> = readonly T[] | readonly number[];

/** The band a value falls in. */
export interface ThresholdBand<T extends Threshold = Threshold> {
  /** Position of the band in the ascending list, from 0. */
  index: number;
  /** How many bands the list has. */
  count: number;
  /**
   * The position whose look the band takes: `index`, or the mirrored one when lower is better.
   * Components pick the cue that is not colour (a pattern) by it, so a free colour has one too.
   */
  cue: number;
  /** Where the band starts. */
  from: number;
  label?: string | undefined;
  tone?: ThresholdTone | undefined;
  color?: string | undefined;
  /** The band as a step of the five-step value ramp, 1 to 5: its `ramp-` tone, else its position spread over the ramp. */
  level: number;
  /** The entry the look comes from, with any extra members a component adds to `Threshold`. */
  look: T;
}

const rampSteps = 5;
const spread = (position: number, last: number) =>
  last > 0 ? 1 + Math.round((position * (rampSteps - 1)) / last) : rampSteps;

let warned = false;
function ascending<T>(list: readonly T[], at: (item: T) => number): readonly T[] {
  if (list.every((item, i) => i === 0 || at(list[i - 1]!) <= at(item))) return list;
  if (!warned) warn('`thresholds` must be in ascending order of `from`. The list was sorted.');
  warned = true;
  return [...list].sort((a, b) => at(a) - at(b));
}

/**
 * Boundaries as bands of the value ramp: a value below the first boundary is `ramp-1`, a value at a
 * boundary belongs to the band above it. Four boundaries give the five steps; fewer spread over the
 * whole ramp (one gives `ramp-1` and `ramp-5`, two give 1, 3 and 5).
 */
export function rampThresholds(boundaries: readonly number[]): Threshold[] {
  const sorted = ascending(boundaries, (b) => b);
  return [-Infinity, ...sorted].map((from, band) => ({
    from,
    tone: `ramp-${spread(band, sorted.length)}` as ThresholdTone,
  }));
}

/** Internal: any `thresholds` value as an ascending list of bands. */
export function normalizeThresholds<T extends Threshold>(
  thresholds: ThresholdList<T> | undefined,
): readonly T[] {
  if (!thresholds?.length) return [];
  // A component's extra members are optional, so a plain `Threshold` is one of its own.
  return typeof thresholds[0] === 'number'
    ? (rampThresholds(thresholds as readonly number[]) as unknown as readonly T[])
    : ascending(thresholds as readonly T[], (t) => t.from);
}

/**
 * The band `value` falls in: the last entry whose `from` is not above it. `undefined` when there is no
 * value, no list, or the value is below the first `from`. `lowerIsBetter` mirrors the looks (tone,
 * colour, cue, level) over the bands, for a scale where low is good; `from` and `label` stay.
 */
export function resolveThreshold<T extends Threshold = Threshold>(
  value: number | null | undefined,
  thresholds: ThresholdList<T> | undefined,
  { lowerIsBetter = false }: { lowerIsBetter?: boolean | undefined } = {},
): ThresholdBand<T> | undefined {
  if (value === null || value === undefined || Number.isNaN(value)) return undefined;
  const bands = normalizeThresholds(thresholds);
  const index = bands.findLastIndex((band) => value >= band.from);
  if (index < 0) return undefined;
  const count = bands.length;
  const cue = lowerIsBetter ? count - 1 - index : index;
  const look = bands[cue]!;
  const step = /^ramp-(\d)$/.exec(look.tone ?? '');
  return {
    index,
    count,
    cue,
    from: bands[index]!.from,
    label: bands[index]!.label,
    tone: look.tone,
    color: look.color,
    level: step ? Number(step[1]) : spread(cue, count - 1),
    look,
  };
}
