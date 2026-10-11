import { useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { dataState, type DataStateProps } from '../internal/dataState';
import { cx, renderPart, type Part } from '../utils/parts';
import { Cell, Row, WeekLines, type ScheduleParts } from './cells';
import {
  addDays,
  startOfWeek,
  todayIso,
  weekDays,
  type IsoDate,
  type WeekdayFormat,
  type WeekStart,
} from './dates';
import { useDateGrid } from './grid';
import { placeItems, type ScheduleItem } from './ScheduleSlot';
import styles from './WeekStrip.module.css';

export interface WeekStripRootProps {
  /** An empty or error state, shown in place of the grid by the same element. */
  state?: ReactNode | undefined;
  /** The day that holds the tab stop until the user moves: today, or the chosen day. */
  initialDate?: IsoDate | undefined;
  /** Marks the strip busy while its slots load. */
  loading?: boolean | undefined;
  /** Accessible name of the grid. */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root({
  state,
  initialDate,
  loading = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  style,
  children,
}: WeekStripRootProps) {
  const [ref, handlers] = useDateGrid<HTMLDivElement>({ initial: initialDate });
  // The same element holds the empty or error state, so the focus has somewhere to go when it leaves.
  if (state) {
    return (
      <div data-umbra="week-strip" className={cx(styles.state, className)} style={style}>
        {state}
      </div>
    );
  }
  return (
    <div
      {...handlers}
      ref={ref}
      role="grid"
      data-umbra="week-strip"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-busy={loading || undefined}
      className={cx(styles.strip, className)}
      style={style}
    >
      {children}
    </div>
  );
}

/** Controlled or uncontrolled choice of a day; `undefined` when days cannot be chosen. */
export function useSelectedDate(props: {
  selectedDate?: IsoDate | null | undefined;
  defaultSelectedDate?: IsoDate | null | undefined;
  onSelectedDateChange?: ((date: IsoDate) => void) | undefined;
}) {
  const [own, setOwn] = useState(props.defaultSelectedDate ?? null);
  const enabled =
    props.selectedDate !== undefined ||
    props.defaultSelectedDate !== undefined ||
    !!props.onSelectedDateChange;
  const selected = !enabled ? undefined : props.selectedDate !== undefined ? props.selectedDate : own;
  const select = (date: IsoDate) => {
    setOwn(date);
    props.onSelectedDateChange?.(date);
  };
  return [selected, enabled ? select : undefined] as const;
}

export interface WeekStripProps
  extends DataStateProps, Omit<WeekStripRootProps, 'children' | 'initialDate' | 'state'> {
  /** The entries. Those outside the seven days are left out. */
  items?: readonly ScheduleItem[] | undefined;
  /** The first of the seven days, as `'2026-10-05'`. Wins over `date`. */
  startDate?: IsoDate | undefined;
  /** A day of the week to show: the strip starts on the first day of its week. Defaults to `today`. */
  date?: IsoDate | undefined;
  /** The current day. Defaults to the day it is where the user is. */
  today?: IsoDate | undefined;
  /** The first day of the week, 0 (Sunday) to 6, where the provider's locale should not decide. */
  weekStartsOn?: WeekStart | undefined;
  /** The number of slots of each day. Defaults to the most any of the days has, and at least one. */
  slotsPerDay?: number | undefined;
  /** What heads each day: the weekday and the number, or one of them. */
  dayHeader?: 'both' | 'weekday' | 'date' | undefined;
  /** `auto`: the long name where it fits, then the short and the narrow one as the strip narrows. */
  weekdayFormat?: WeekdayFormat | 'auto' | undefined;
  slotSize?: 'default' | 'small' | undefined;
  /** `auto` hides the labels of the slots, leaving their icons, when a day is too narrow for them. */
  slotDisplay?: 'auto' | 'full' | 'icon' | undefined;
  /** The chosen day. Controlled; `null` is none. */
  selectedDate?: IsoDate | null | undefined;
  defaultSelectedDate?: IsoDate | null | undefined;
  onSelectedDateChange?: ((date: IsoDate) => void) | undefined;
  /** Called with the id of an item when it is activated: a click, Enter or Space. */
  onAction?: ((id: string) => void) | undefined;
  /** Called with the day when its header or one of its free slots is activated. */
  onDayAction?: ((date: IsoDate) => void) | undefined;
  /** What assistive technology reads for a free slot. */
  freeLabel?: string | undefined;
  /** Names the mark of a day with more items than `slotsPerDay`: "+2" beside its date, read as "2 more" and the items. */
  hiddenItemsLabel?: ((count: number) => string) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | (ScheduleParts & {
        /** The empty or error state. */
        state?: Part<{ children: ReactNode }> | undefined;
      })
    | undefined;
}

/** Seven days side by side, each with its slots: a week at a glance, small enough for a card. */
export function WeekStrip({
  items = [],
  startDate,
  date,
  today = todayIso(),
  weekStartsOn,
  slotsPerDay,
  dayHeader = 'both',
  weekdayFormat = 'auto',
  slotSize = 'small',
  slotDisplay = 'auto',
  selectedDate,
  defaultSelectedDate,
  onSelectedDateChange,
  onAction,
  onDayAction,
  freeLabel = 'Free',
  hiddenItemsLabel = (count) => `${count} more`,
  loading = false,
  empty,
  error,
  onRetry,
  retryLabel,
  parts,
  ...root
}: WeekStripProps) {
  const { locale } = useLocale();
  const baseId = useId();
  const start = startDate ?? startOfWeek(date ?? today, locale, weekStartsOn);
  const days = useMemo(() => weekDays(start), [start]);
  const shown = items.filter((item) => item.date >= start && item.date <= addDays(start, 6));
  const most = Math.max(1, ...days.map((day) => shown.filter((item) => item.date === day).length));
  const lines = slotsPerDay ?? (loading ? 2 : most);
  const [selected, select] = useSelectedDate({ selectedDate, defaultSelectedDate, onSelectedDateChange });
  const dayPress =
    select || onDayAction
      ? (day: IsoDate) => {
          select?.(day);
          onDayAction?.(day);
        }
      : undefined;
  // The grid is always there to move through; "empty" replaces it only when the app gives the text.
  const state = dataState(
    { loading, empty, error, onRetry, retryLabel },
    { part: true, variant: 'inline', isEmpty: empty !== undefined && shown.length === 0 },
  );
  return (
    <Root
      {...root}
      state={state && renderPart(parts?.state, { children: state }, (p) => p.children)}
      loading={loading}
      initialDate={selected ?? (days.includes(today) ? today : start)}
    >
      <WeekLines
        days={days}
        placed={placeItems(shown, days, lines)}
        slotsPerDay={lines}
        baseId={baseId}
        today={today}
        selectedDate={selected}
        onDayPress={dayPress}
        onAction={onAction}
        loading={loading}
        chip={() => ({
          size: slotSize,
          weekday: dayHeader === 'date' ? undefined : weekdayFormat,
          day: dayHeader !== 'weekday',
        })}
        slot={{ size: slotSize, display: slotDisplay }}
        freeLabel={freeLabel}
        hiddenItemsLabel={hiddenItemsLabel}
        parts={parts}
        columnHeaders
      />
    </Root>
  );
}

WeekStrip.Root = Root;
WeekStrip.Row = Row;
WeekStrip.Cell = Cell;
