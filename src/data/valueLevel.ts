export interface ValueLevelOptions {
  /** The bottom and top of the scale, split into five equal bands. */
  min?: number;
  max?: number;
  /** Ascending boundaries, at most four. A value at a boundary belongs to the band above it. */
  thresholds?: readonly number[];
  /** Which end of the scale gets the top of the ramp. */
  ramp?: 'higher-is-better' | 'lower-is-better';
}

export const rampSteps = 5;

/** The step of the value ramp (1 worst to 5 best) for a value, or `null` when there is no value. */
export function valueLevel(
  value: number | null | undefined,
  { min = 0, max = 100, thresholds, ramp = 'higher-is-better' }: ValueLevelOptions = {},
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  let level: number;
  if (thresholds?.length) {
    // Fewer than four boundaries spread their bands over the whole ramp: two bands are steps 1 and 5.
    const bounds = thresholds.slice(0, rampSteps - 1);
    const band = bounds.filter((t) => value >= t).length;
    level = 1 + Math.round((band * (rampSteps - 1)) / bounds.length);
  } else {
    const share = max > min ? (value - min) / (max - min) : 0;
    level = 1 + Math.min(rampSteps - 1, Math.max(0, Math.floor(share * rampSteps)));
  }
  return ramp === 'lower-is-better' ? rampSteps + 1 - level : level;
}
