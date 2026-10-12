import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  addMonths,
  daysBetween,
  formatDay,
  formatDayMonth,
  formatDayMonthRange,
  formatFull,
  formatMonth,
  formatWeekday,
  isIsoDate,
  isIsoMonth,
  monthWeeks,
  shiftMonth,
  startOfWeek,
  todayIso,
  validDate,
  weekDays,
} from './dates';
import { itemsBetween, placeItems, type ScheduleItem } from './ScheduleSlot';

describe('date arithmetic', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('counts the days between two dates', () => {
    expect(daysBetween('2026-10-26', '2026-11-01')).toBe(6);
    expect(daysBetween('2026-11-01', '2026-10-26')).toBe(-6);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('knows leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2100-02-28', 1)).toBe('2100-03-01');
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29');
  });

  it('keeps the day of the month, or takes the last day the month has', () => {
    expect(addMonths('2026-10-11', 1)).toBe('2026-11-11');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });

  it('refuses text that is not a date', () => {
    expect(isIsoDate('2026-10-11')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('11/10/2026')).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(() => addDays('tomorrow', 1)).toThrow(/"tomorrow" is not a date/);
  });
});

describe('weeks', () => {
  it('start on the day the locale starts its week', () => {
    // 11 October 2026 is a Sunday.
    expect(startOfWeek('2026-10-11', 'en-US')).toBe('2026-10-11');
    expect(startOfWeek('2026-10-11', 'en-GB')).toBe('2026-10-05');
    expect(startOfWeek('2026-10-11', 'de-DE')).toBe('2026-10-05');
    expect(startOfWeek('2026-10-11', 'he-IL')).toBe('2026-10-11');
    // Saturday in Egypt.
    expect(startOfWeek('2026-10-11', 'ar-EG')).toBe('2026-10-10');
  });

  it('`weekStartsOn` overrides the locale', () => {
    expect(startOfWeek('2026-10-11', 'en-US', 1)).toBe('2026-10-05');
    expect(startOfWeek('2026-10-11', 'en-GB', 0)).toBe('2026-10-11');
    expect(startOfWeek('2026-10-11', 'en-US', 3)).toBe('2026-10-07');
    expect(startOfWeek('2026-10-11', 'en-US', 6)).toBe('2026-10-10');
  });

  it('have seven days', () => {
    expect(weekDays('2026-10-26')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });
});

describe('month grids', () => {
  it('reach into the months beside them', () => {
    const weeks = monthWeeks('2026-10', 'en-GB');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toBe('2026-09-28');
    expect(weeks[4]![6]).toBe('2026-11-01');
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('follow the first day of the week', () => {
    const sunday = monthWeeks('2026-10', 'en-US');
    expect(sunday[0]![0]).toBe('2026-09-27');
    expect(sunday[4]![6]).toBe('2026-10-31');
    expect(monthWeeks('2026-10', 'en-US', 1)).toEqual(monthWeeks('2026-10', 'en-GB'));
  });

  it('have four, five or six weeks', () => {
    // February 2026 starts on a Sunday and has 28 days.
    expect(monthWeeks('2026-02', 'en-US')).toHaveLength(4);
    expect(monthWeeks('2026-02', 'en-GB')).toHaveLength(5);
    // August 2026 starts on a Saturday and has 31 days.
    expect(monthWeeks('2026-08', 'en-US')).toHaveLength(6);
    expect(monthWeeks('2028-02', 'en-GB').flat()).toContain('2028-02-29');
  });

  it('cross a year end', () => {
    const weeks = monthWeeks('2026-12', 'en-GB');
    expect(weeks[0]![0]).toBe('2026-11-30');
    expect(weeks.at(-1)![6]).toBe('2027-01-03');
  });
});

describe('clock changes', () => {
  afterEach(() => vi.unstubAllEnvs());

  // In these zones a local midnight does not exist, or a day has 23 or 25 hours, on some date below.
  it.each(['America/Sao_Paulo', 'Europe/London', 'Pacific/Apia', 'America/New_York', 'Asia/Beirut'])(
    'never skip or repeat a day in %s',
    (zone) => {
      vi.stubEnv('TZ', zone);
      for (const month of ['2018-11', '2026-03', '2026-10', '2026-11', '2011-12']) {
        const days = monthWeeks(month, 'en-GB').flat();
        expect(new Set(days).size).toBe(days.length);
        days.forEach((day, i) => i && expect(addDays(days[i - 1]!, 1)).toBe(day));
        // The text is the same day too.
        expect(days.map((day) => formatDay(day, 'en-GB'))).toEqual(
          days.map((day) => String(Number(day.slice(8)))),
        );
      }
      expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    },
  );
});

describe('text', () => {
  it('comes from the locale', () => {
    expect(formatDayMonth('2026-11-01', 'en-GB')).toBe('1 Nov');
    expect(formatDayMonth('2026-11-01', 'en-US')).toBe('Nov 1');
    // The spaces around the dash of a range are thin ones.
    expect(formatDayMonthRange('2026-10-11', '2026-10-17', 'en-US')).toMatch(/^Oct 11\s–\s17$/);
    expect(formatDayMonthRange('2026-09-27', '2026-10-03', 'en-US')).toMatch(/^Sep 27\s–\sOct 3$/);
    expect(formatMonth('2026-10', 'en-GB')).toBe('October 2026');
    expect(formatMonth('2026-10', 'de-DE')).toBe('Oktober 2026');
    // The comma depends on the version of the locale data.
    expect(formatFull('2026-10-11', 'en-GB')).toMatch(/^Sunday,? 11 October 2026$/);
    expect(formatDay('2026-10-11', 'ar-EG')).toBe('١١');
  });

  it('has three widths of weekday name', () => {
    expect(formatWeekday('2026-10-11', 'en-GB', 'long')).toBe('Sunday');
    expect(formatWeekday('2026-10-11', 'en-GB', 'short')).toBe('Sun');
    expect(formatWeekday('2026-10-11', 'en-GB', 'narrow')).toBe('S');
    expect(formatWeekday('2026-10-11', 'de-DE', 'long')).toBe('Sonntag');
  });

  it('is Gregorian whatever calendar the locale prefers', () => {
    expect(formatMonth('2026-10', 'th-TH')).toContain('2026');
    expect(formatDay('2026-10-11', 'fa-IR-u-nu-latn')).toBe('11');
  });
});

describe('what is not a date', () => {
  it('is given back as undefined, with one warning, and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validDate('2026-10-11', 'today')).toBe('2026-10-11');
    expect(validDate(null, 'selectedDate')).toBe(null);
    expect(validDate(undefined, 'today')).toBe(undefined);
    expect(validDate('2026-02-30', 'unit today')).toBe(undefined);
    expect(validDate('yesterday', 'unit today')).toBe(undefined);
    expect(validDate('yesterday', 'unit today')).toBe(undefined);
    expect(warn.mock.calls.map(([message]) => message as string)).toEqual([
      expect.stringContaining('unit today: "2026-02-30" is not a date'),
      expect.stringContaining('unit today: "yesterday" is not a date'),
    ]);
    expect(validDate('2026-13', 'unit month', 'month')).toBe(undefined);
    expect(validDate('2026-10', 'unit month', 'month')).toBe('2026-10');
    expect(isIsoMonth('2026-10-11')).toBe(true);
    expect(isIsoMonth('October')).toBe(false);
    warn.mockRestore();
  });

  it('leaves out an item whose date is not one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const items = [
      { id: 'a', date: '2026-10-12', label: 'A' },
      { id: 'b', date: 'soon', label: 'B' },
      { id: 'c', date: '2026-10-20', label: 'C' },
    ];
    expect(itemsBetween(items, '2026-10-11', '2026-10-17').map((item) => item.id)).toEqual(['a']);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('placing items in the slots of a day', () => {
  const day = '2026-10-14';
  const item = (id: string, slot?: number): ScheduleItem => ({ id, date: day, slot, label: id });
  const ids = (placed: ReturnType<typeof placeItems>) => ({
    slots: placed.get(day)!.map((entry) => entry?.id ?? null),
    rest: (placed.rest.get(day) ?? []).map((entry) => entry.id),
  });

  it('gives a named slot to its item and fills the others in order', () => {
    expect(ids(placeItems([item('a'), item('b', 0), item('c')], [day], 3))).toEqual({
      slots: ['b', 'a', 'c'],
      rest: [],
    });
  });

  it('puts an item whose slot is past the last line, or not a whole number, in the first free slot', () => {
    expect(ids(placeItems([item('a', 0), item('b', 2)], [day], 2))).toEqual({ slots: ['a', 'b'], rest: [] });
    expect(ids(placeItems([item('a', 1.5), item('b', -1)], [day], 2))).toEqual({
      slots: ['a', 'b'],
      rest: [],
    });
    // A slot that is named and valid still wins over one that is not.
    expect(ids(placeItems([item('a', 7), item('b', 0)], [day], 2))).toEqual({ slots: ['b', 'a'], rest: [] });
  });

  it('keeps as the rest only what a full day has no slot for', () => {
    expect(ids(placeItems([item('a', 0), item('b', 0), item('c'), item('d', 1.5)], [day], 2))).toEqual({
      slots: ['a', 'b'],
      rest: ['c', 'd'],
    });
  });
});
