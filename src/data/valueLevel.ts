export interface ValueLevelOptions {
  /** The bottom and top of the scale, split into five equal bands. */
  min?: number | undefined;
  max?: number | undefined;
  /** For a scale where low is good: the low end gets the top of the ramp. */
  lowerIsBetter?: boolean | undefined;
}

export const rampSteps = 5;

/**
 * The step of the value ramp (1 worst to 5 best) for a value on a scale split into five equal bands,
 * or `null` when there is no value. Explicit boundaries go through `resolveThreshold` instead.
 */
export function valueLevel(
  value: number | null | undefined,
  { min = 0, max = 100, lowerIsBetter = false }: ValueLevelOptions = {},
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const share = max > min ? (value - min) / (max - min) : 0;
  const level = 1 + Math.min(rampSteps - 1, Math.max(0, Math.floor(share * rampSteps)));
  return lowerIsBetter ? rampSteps + 1 - level : level;
}
