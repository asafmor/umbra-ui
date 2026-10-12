// The one rule for input a chart or a meter cannot draw (plan/decisions/03-charts.md, "Invalid input"):
// never a crash and never a blank chart. A value that is not a finite number is "no value", an item whose
// id is already taken is left out, and each case warns once in development.
import { warn } from './dev';

/** A value that can be drawn: a finite number. */
export const isValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const warned = new Set<string>();
/** Warns once per message: a chart is drawn again on every resize. */
export function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  warn(message);
}

/** The value, or `null` for "no value". A number that is not finite (`NaN`, `Infinity`) is no value, with a warning. */
export function valueOrNull(value: unknown, where: string): number | null {
  if (isValue(value)) return value;
  if (typeof value === 'number')
    warnOnce(`${where}: ${value} is not a value that can be drawn; it is shown as no value.`);
  return null;
}

/** The items without those whose id an earlier one already has, with a warning for each such id. */
export function uniqueIds<T extends { id: string }>(items: readonly T[], where: string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!seen.has(item.id)) return !!seen.add(item.id);
    warnOnce(`${where}: the id "${item.id}" is used twice; only the first is drawn.`);
    return false;
  });
}
