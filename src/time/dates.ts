// The one date model of the time components (plan/specs/Planner.md, "Dates").
//
// Public values are plain text: a day is `'2026-10-11'`, a month is `'2026-10'`. Inside, the arithmetic
// is `@internationalized/date` on calendar dates, which have no time and no time zone, so a clock change
// can never move a day. Text comes from `Intl`, formatted in UTC from a UTC instant for the same reason.
// Nothing here goes through a local-time `Date`.
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
  startOfWeek as startOfWeekOf,
  today as todayIn,
} from '@internationalized/date';

/** A day as text: `'2026-10-11'`. */
export type IsoDate = string;
/** A month as text: `'2026-10'`. */
export type IsoMonth = string;
/** The first day of the week: 0 is Sunday, 1 Monday, up to 6, Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WeekdayFormat = 'long' | 'short' | 'narrow';

const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Parses a day; an invalid text is an error that names the value, not a wrong date. */
const parse = (date: IsoDate): CalendarDate => {
  try {
    return parseDate(date);
  } catch {
    throw new Error(`[umbra-ui] "${date}" is not a date: expected the form 2026-10-11.`);
  }
};

export const isIsoDate = (value: unknown): value is IsoDate => {
  if (typeof value !== 'string') return false;
  try {
    parseDate(value);
    return true;
  } catch {
    return false;
  }
};

/** The current day where the user is. */
export const todayIso = (): IsoDate => todayIn(getLocalTimeZone()).toString();

export const addDays = (date: IsoDate, days: number): IsoDate => parse(date).add({ days }).toString();

/** How many days `date` is after `from`; negative when it is before. */
export const daysBetween = (from: IsoDate, date: IsoDate): number => parse(date).compare(parse(from));

/** The same day of another month; a day the month does not have becomes its last day (31 Jan + 1 = 28 Feb). */
export const addMonths = (date: IsoDate, months: number): IsoDate => parse(date).add({ months }).toString();

export const monthOf = (date: IsoDate): IsoMonth => date.slice(0, 7);
export const firstOfMonth = (month: IsoMonth): IsoDate => `${monthOf(month)}-01`;
export const shiftMonth = (month: IsoMonth, months: number): IsoMonth =>
  monthOf(addMonths(firstOfMonth(month), months));

/** The first day of the week a day is in: by the locale, or by `weekStartsOn` when given. */
export const startOfWeek = (date: IsoDate, locale: string, weekStartsOn?: WeekStart): IsoDate =>
  startOfWeekOf(
    parse(date),
    locale,
    weekStartsOn === undefined ? undefined : dayNames[weekStartsOn],
  ).toString();

/** Seven days from `start`. */
export const weekDays = (start: IsoDate): IsoDate[] => Array.from({ length: 7 }, (_, i) => addDays(start, i));

/** The weeks that hold a month, each of seven days: the first and the last reach into the months beside it. */
export function monthWeeks(month: IsoMonth, locale: string, weekStartsOn?: WeekStart): IsoDate[][] {
  const weeks: IsoDate[][] = [];
  let start = startOfWeek(firstOfMonth(month), locale, weekStartsOn);
  // A week belongs to the month while its first day is not past the month's end; ISO text sorts by date.
  do {
    weeks.push(weekDays(start));
    start = addDays(start, 7);
  } while (monthOf(start) === monthOf(month));
  return weeks;
}

// `Intl` objects are slow to make and the grids ask for the same few over and over.
const formats = new Map<string, Intl.DateTimeFormat>();
function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let made = formats.get(key);
  if (!made) {
    // The dates are Gregorian, so the text is too, whatever calendar the locale prefers.
    made = new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory', timeZone: 'UTC' });
    formats.set(key, made);
  }
  return made;
}
/** The day as an instant at midnight UTC, which is formatted in UTC: no clock change can move it. */
const instant = (date: IsoDate) => {
  const { year, month, day } = parse(date);
  return new Date(Date.UTC(year, month - 1, day));
};
const format = (date: IsoDate, locale: string, options: Intl.DateTimeFormatOptions) =>
  formatter(locale, options).format(instant(date));

/** The day number, in the locale's digits. */
export const formatDay = (date: IsoDate, locale: string) => format(date, locale, { day: 'numeric' });
/** The day and the short month, in the locale's order: "1 Nov". */
export const formatDayMonth = (date: IsoDate, locale: string) =>
  format(date, locale, { day: 'numeric', month: 'short' });
/** Two days as one range, the way the locale writes it: "Oct 11 – 17", "Sep 27 – Oct 3". */
export const formatDayMonthRange = (from: IsoDate, to: IsoDate, locale: string) =>
  formatter(locale, { day: 'numeric', month: 'short' }).formatRange(instant(from), instant(to));
export const formatWeekday = (date: IsoDate, locale: string, width: WeekdayFormat = 'short') =>
  format(date, locale, { weekday: width });
/** "October 2026". */
export const formatMonth = (month: IsoMonth, locale: string) =>
  format(firstOfMonth(month), locale, { month: 'long', year: 'numeric' });
/** The whole date in words, for assistive technology: "Sunday, 11 October 2026". */
export const formatFull = (date: IsoDate, locale: string) =>
  format(date, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
