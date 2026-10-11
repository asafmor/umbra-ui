import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import shared from '../data/shared.module.css';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './DateChip.module.css';
import {
  formatDay,
  formatDayMonth,
  formatFull,
  formatWeekday,
  type IsoDate,
  type WeekdayFormat,
} from './dates';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const widths: WeekdayFormat[] = ['long', 'short', 'narrow'];

/**
 * Internal: the name of a weekday. `auto` draws the long name and gives way to the short and then the
 * narrow one as the cell around it (a day of a `WeekStrip` or a `Planner`) gets narrower. Decorative:
 * whatever holds it says the long name to assistive technology.
 */
export function WeekdayName({ date, format }: { date: IsoDate; format: WeekdayFormat | 'auto' }) {
  const { locale } = useLocale();
  if (format !== 'auto') return formatWeekday(date, locale, format);
  return widths.map((width) => (
    <span key={width} data-weekday={width} className={styles.auto}>
      {formatWeekday(date, locale, width)}
    </span>
  ));
}

const DateContext = createContext<IsoDate | null>(null);
function useDate() {
  const date = useContext(DateContext);
  if (!date) throw new Error('DateChip blocks must be rendered inside <DateChip.Root>.');
  return date;
}

export interface DateChipRootProps extends BlockProps, RootAttributes {
  /** The day, as `'2026-10-11'`. */
  date: IsoDate;
  /** Marks the current day: the primary fill, a heavier weight and a bar under the text. */
  today?: boolean | undefined;
  /** Marks the chosen day: the violet fill and a ring. */
  selected?: boolean | undefined;
  /** A day of another month than the one shown: dimmed. */
  outside?: boolean | undefined;
  /** `small` is for dense strips and table cells. Otherwise the height follows the density level. */
  size?: 'default' | 'small' | undefined;
  /** What a screen reader hears after the date of the current day. Empty when the holder says it. */
  todayLabel?: string | undefined;
  /** What a screen reader hears after the date of the chosen day. Empty when the holder says it. */
  selectedLabel?: string | undefined;
  children?: ReactNode | undefined;
}

function Root({
  date,
  today = false,
  selected = false,
  outside = false,
  size = 'default',
  todayLabel = 'Today',
  selectedLabel = 'Selected',
  className,
  style,
  children,
  ...rest
}: DateChipRootProps) {
  const { locale } = useLocale();
  const spoken = [formatFull(date, locale), today && todayLabel, selected && selectedLabel].filter(Boolean);
  return (
    <time
      {...passThrough(rest)}
      dateTime={date}
      data-umbra="date-chip"
      data-today={today || undefined}
      data-selected={selected || undefined}
      data-outside={outside || undefined}
      data-size={size}
      className={cx(styles.chip, className)}
      style={style}
    >
      {/* What is drawn is short ("5", "1 Nov"); the whole date is said in its place. */}
      <span aria-hidden="true" className={styles.text}>
        <DateContext value={date}>{children}</DateContext>
      </span>
      <span className={shared.srOnly}>{spoken.join(', ')}</span>
    </time>
  );
}

export interface DateChipWeekdayProps extends BlockProps {
  /** `auto`: the long name, then the short and the narrow one as the day of a strip or planner narrows. */
  format?: WeekdayFormat | 'auto' | undefined;
}

function Weekday({ format = 'short', className, style }: DateChipWeekdayProps) {
  return (
    <span data-part="weekday" className={cx(styles.weekday, className)} style={style}>
      <WeekdayName date={useDate()} format={format} />
    </span>
  );
}

export interface DateChipDayProps extends BlockProps {
  /** Adds the short month, in the locale's order: "1 Nov". */
  month?: boolean | undefined;
}

function Day({ month = false, className, style }: DateChipDayProps) {
  const { locale } = useLocale();
  const date = useDate();
  return (
    <span data-part="day" className={cx(styles.day, className)} style={style}>
      {month ? (
        // In a day too narrow for "28 Sep", the number alone: the whole date is still said.
        <>
          <span data-month="" className={styles.month}>
            {formatDayMonth(date, locale)}
          </span>
          <span className={styles.alone}>{formatDay(date, locale)}</span>
        </>
      ) : (
        formatDay(date, locale)
      )}
    </span>
  );
}

export interface DateChipProps extends Omit<DateChipRootProps, 'children'> {
  /** Shows the name of the weekday before the number. */
  weekday?: WeekdayFormat | 'auto' | undefined;
  /** Shows the day number. Off leaves the weekday alone ("Mon"). */
  day?: boolean | undefined;
  /** Adds the short month to the number ("1 Nov"). `auto`: on the first day of a month. */
  showMonth?: boolean | 'auto' | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        weekday?: Part<DateChipWeekdayProps> | undefined;
        day?: Part<DateChipDayProps> | undefined;
      }
    | undefined;
}

/** A pill with the number of a day: the header of a day in a `WeekStrip` or a `Planner`. */
export function DateChip({ weekday, day = true, showMonth = 'auto', parts, ...root }: DateChipProps) {
  const month = showMonth === 'auto' ? root.date.endsWith('-01') : showMonth;
  return (
    <Root {...root}>
      {weekday && renderPart(parts?.weekday, { format: weekday }, (p) => <Weekday {...p} />)}
      {day && renderPart(parts?.day, { month }, (p) => <Day {...p} />)}
    </Root>
  );
}

DateChip.Root = Root;
DateChip.Weekday = Weekday;
DateChip.Day = Day;
