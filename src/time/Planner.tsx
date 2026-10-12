import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { useLocale } from 'react-aria-components';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import shared from '../data/shared.module.css';
import { Select } from '../inputs/Select';
import { ActionsRow } from '../internal/ActionsRow';
import { dataState, type DataStateProps } from '../internal/dataState';
import { heightProps, type FillHeight } from '../internal/height';
import layout from '../layout/layout.module.css';
import { ScrollArea } from '../layout/ScrollArea';
import { useSlot, type SlotProps } from '../layout/useSlot';
import { Popover } from '../overlays/Popover';
import { Icon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { Cell, Row, WeekLines, type ScheduleParts } from './cells';
import { WeekdayName } from './DateChip';
import {
  addMonths,
  firstOfMonth,
  formatDayMonthRange,
  formatMonth,
  formatWeekday,
  monthOf,
  monthWeeks,
  shiftMonth,
  todayIso,
  type IsoDate,
  type IsoMonth,
  type WeekdayFormat,
  type WeekStart,
} from './dates';
import { useDateGrid } from './grid';
import styles from './Planner.module.css';
import { placeItems, type ScheduleItem } from './ScheduleSlot';
import strip from './WeekStrip.module.css';
import { useSelectedDate } from './WeekStrip';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface PlannerContextValue {
  month: IsoMonth;
  /** Shows another month; false when it is outside `minMonth` and `maxMonth`, or already shown. */
  setMonth: (month: IsoMonth) => boolean;
  today: IsoDate;
  weekStartsOn: WeekStart | undefined;
  minMonth: IsoMonth | undefined;
  maxMonth: IsoMonth | undefined;
  /** "October 2026". */
  title: string;
  label: string | undefined;
  /** Asks the grid to bring today into view: counts the presses of "Today". */
  todayPresses: number;
  showToday: () => void;
}
const PlannerContext = createContext<PlannerContextValue | null>(null);
function usePlanner() {
  const planner = useContext(PlannerContext);
  if (!planner) throw new Error('Planner blocks must be rendered inside <Planner.Root>.');
  return planner;
}

export interface PlannerRootProps extends SlotProps, RootAttributes {
  /** The month shown, as `'2026-10'`. Controlled. */
  month?: IsoMonth | undefined;
  /** The month shown at first. Defaults to the month of `today`. */
  defaultMonth?: IsoMonth | undefined;
  onMonthChange?: ((month: IsoMonth) => void) | undefined;
  /** The first and the last month the user can go to. */
  minMonth?: IsoMonth | undefined;
  maxMonth?: IsoMonth | undefined;
  /** The current day, as `'2026-10-11'`. Defaults to the day it is where the user is. */
  today?: IsoDate | undefined;
  /** The first day of the week, 0 (Sunday) to 6, where the provider's locale should not decide. */
  weekStartsOn?: WeekStart | undefined;
  /**
   * `fill` (default) takes the height of the parent, and falls back to the content's height in a parent
   * that has none. `content` is always as tall as the weeks. A number is a height in pixels.
   */
  height?: FillHeight | undefined;
  /** Names the grid, before the month: "Schedule, October 2026". */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root({
  month: controlled,
  defaultMonth,
  onMonthChange,
  minMonth,
  maxMonth,
  today = todayIso(),
  weekStartsOn,
  height,
  'aria-label': label,
  className,
  style,
  children,
  ...slotProps
}: PlannerRootProps) {
  const { locale } = useLocale();
  const { ref, props } = useSlot<HTMLDivElement>(slotProps);
  const [own, setOwn] = useState(defaultMonth ?? monthOf(today));
  const [todayPresses, setTodayPresses] = useState(0);
  const month = monthOf(controlled ?? own);
  const title = formatMonth(month, locale);
  const planner = useMemo<PlannerContextValue>(
    () => ({
      month,
      setMonth: (next) => {
        if (next === month || (minMonth && next < minMonth) || (maxMonth && next > maxMonth)) return false;
        setOwn(next);
        onMonthChange?.(next);
        return true;
      },
      today,
      weekStartsOn,
      minMonth,
      maxMonth,
      title,
      label,
      todayPresses,
      showToday: () => setTodayPresses((n) => n + 1),
    }),
    [month, minMonth, maxMonth, onMonthChange, today, weekStartsOn, title, label, todayPresses],
  );
  const fill = heightProps(height);
  return (
    <div
      {...passThrough(slotProps)}
      {...props}
      ref={ref}
      data-umbra="planner"
      data-height={fill['data-height']}
      className={cx(layout.slot, styles.root, className)}
      style={{ ...props.style, ...fill.style, ...style }}
    >
      {/* A change of month is said, since the focus may be on a button that does not change. */}
      <span aria-live="polite" aria-atomic="true" className={shared.srOnly}>
        {title}
      </span>
      <PlannerContext value={planner}>{children}</PlannerContext>
    </div>
  );
}

export interface PlannerToolbarProps {
  /** A list of months to jump to. Off shows the month as a title. */
  monthSelect?: boolean | undefined;
  /** How many months before and after the one shown the list offers, within `minMonth` and `maxMonth`. */
  monthSpan?: number | undefined;
  /** Accessible name of the list of months. */
  monthLabel?: string | undefined;
  previousLabel?: string | undefined;
  nextLabel?: string | undefined;
  todayLabel?: string | undefined;
  /** More controls of the app, at the end of the bar before "Today". They move into a menu when they do not fit. */
  actions?: ReactNode | undefined;
  /** Accessible name of that menu's button. */
  moreLabel?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Toolbar({
  monthSelect = true,
  monthSpan = 12,
  monthLabel = 'Month',
  previousLabel = 'Previous month',
  nextLabel = 'Next month',
  todayLabel = 'Today',
  actions,
  moreLabel = 'More actions',
  className,
  style,
}: PlannerToolbarProps) {
  const { locale } = useLocale();
  const { month, setMonth, today, minMonth, maxMonth, title, showToday } = usePlanner();
  const months = Array.from({ length: monthSpan * 2 + 1 }, (_, i) => shiftMonth(month, i - monthSpan)).filter(
    (m) => (!minMonth || m >= minMonth) && (!maxMonth || m <= maxMonth),
  );
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  return (
    <div data-part="toolbar" className={cx(styles.toolbar, className)} style={style}>
      {monthSelect ? (
        <Select
          aria-label={monthLabel}
          value={month}
          onChange={(id) => id && setMonth(id)}
          options={months.map((m) => ({ id: m, label: formatMonth(m, locale) }))}
          className={styles.month}
        />
      ) : (
        <span data-part="title" className={styles.title}>
          {title}
        </span>
      )}
      <IconButton
        icon={<Icon name="back" />}
        label={previousLabel}
        disabled={!!minMonth && previous < minMonth}
        onPress={() => setMonth(previous)}
      />
      <IconButton
        icon={<Icon name="forward" />}
        label={nextLabel}
        disabled={!!maxMonth && next > maxMonth}
        onPress={() => setMonth(next)}
      />
      <span className={styles.spacer} />
      {actions != null && <ActionsRow moreLabel={moreLabel}>{actions}</ActionsRow>}
      {/* Never disabled: on the month of today it still scrolls the day into view, and it keeps the focus. */}
      <Button
        onPress={() => {
          setMonth(monthOf(today));
          showToday();
        }}
      >
        {todayLabel}
      </Button>
    </div>
  );
}

/** One week of the month, as `renderWeek` and the `weekEmpty` part receive it. */
export interface PlannerWeek {
  /** The first and the last of its seven days. */
  start: IsoDate;
  end: IsoDate;
  days: IsoDate[];
  /** Its position in the month shown, from 0. */
  index: number;
  /** The items on its days. */
  items: ScheduleItem[];
  /** True while the side column is collapsed: the content is then drawn in a popover. */
  collapsed: boolean;
}

export interface PlannerGridProps extends DataStateProps {
  /** The entries. Only those on the days shown are drawn. */
  items?: readonly ScheduleItem[] | undefined;
  /** The number of slots of each day. A slot without an item is drawn as a free one. */
  slotsPerDay?: number | undefined;
  /** The chosen day, as `'2026-10-11'`. Controlled; `null` is none. */
  selectedDate?: IsoDate | null | undefined;
  defaultSelectedDate?: IsoDate | null | undefined;
  onSelectedDateChange?: ((date: IsoDate) => void) | undefined;
  /** Called with the id of an item when it is activated: a click, Enter or Space. */
  onAction?: ((id: string) => void) | undefined;
  /** Called with the day when its header or one of its free slots is activated. */
  onDayAction?: ((date: IsoDate) => void) | undefined;
  /** The side column: what stands beside each week, such as its settings or "Copy" and "Clear" buttons. */
  renderWeek?: ((week: PlannerWeek) => ReactNode) | undefined;
  /** Width of the side column, in pixels. */
  weekAsideWidth?: number | undefined;
  /** Names the side column, the side cell of a week ("Week, Oct 11 – 17") and the button it collapses to. */
  weekLabel?: string | undefined;
  /** Shown under the day headers of a week that has no items. */
  emptyWeekLabel?: ReactNode | undefined;
  /** What assistive technology reads for a free slot. */
  freeLabel?: string | undefined;
  /** Names the mark of a day with more items than `slotsPerDay`: "+2" beside its date, read as "2 more" and the items. */
  hiddenItemsLabel?: ((count: number) => string) | undefined;
  /** The names of the weekdays above the grid. `auto` shortens them as the columns narrow. */
  weekdayFormat?: WeekdayFormat | 'auto' | undefined;
  slotSize?: 'default' | 'small' | undefined;
  /** `auto` hides the labels of the slots, leaving their icons, when a day is too narrow for them. */
  slotDisplay?: 'auto' | 'full' | 'icon' | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | (ScheduleParts & {
        /** The row of weekday names. */
        weekdays?: Part<{ days: IsoDate[]; format: WeekdayFormat | 'auto' }> | undefined;
        /** The line of a week without items. */
        weekEmpty?: Part<{ week: PlannerWeek; children: ReactNode }> | undefined;
        /** The empty or error state. */
        state?: Part<{ children: ReactNode }> | undefined;
      })
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The narrowest a day may get before the side column gives its room away, in pixels. */
const MIN_DAY = 40;

function Grid({
  items = [],
  slotsPerDay = 3,
  selectedDate,
  defaultSelectedDate,
  onSelectedDateChange,
  onAction,
  onDayAction,
  renderWeek,
  weekAsideWidth = 200,
  weekLabel = 'Week',
  emptyWeekLabel = 'Nothing planned',
  freeLabel = 'Free',
  hiddenItemsLabel = (count) => `${count} more`,
  weekdayFormat = 'auto',
  slotSize = 'default',
  slotDisplay = 'auto',
  loading = false,
  empty,
  error,
  onRetry,
  retryLabel,
  parts,
  className,
  style,
}: PlannerGridProps) {
  const { locale } = useLocale();
  const baseId = useId();
  const { month, setMonth, today, weekStartsOn, title, label, todayPresses } = usePlanner();
  const weeks = useMemo(() => monthWeeks(month, locale, weekStartsOn), [month, locale, weekStartsOn]);
  const first = weeks[0]![0]!;
  const last = weeks.at(-1)![6]!;
  const shown = items.filter((item) => item.date >= first && item.date <= last);
  const placed = placeItems(shown, weeks.flat(), slotsPerDay);
  const [selected, select] = useSelectedDate({ selectedDate, defaultSelectedDate, onSelectedDateChange });
  const dayPress =
    select || onDayAction
      ? (day: IsoDate) => {
          select?.(day);
          onDayAction?.(day);
        }
      : undefined;
  const home = selected?.startsWith(month) ? selected : today.startsWith(month) ? today : firstOfMonth(month);
  const [ref, handlers, show] = useDateGrid<HTMLDivElement>({
    initial: home,
    onLeave: ({ date }) => setMonth(monthOf(date)),
    onPage: (date, months) => {
      const to = addMonths(date, months);
      return setMonth(monthOf(to)) ? to : undefined;
    },
  });

  const state = dataState(
    { loading, empty, error, onRetry, retryLabel },
    // The weeks are always there to move through; "empty" replaces them only when the app gives the text.
    { part: true, isEmpty: empty !== undefined && shown.length === 0 },
  );
  const hidden = !!state;

  // The day that holds the tab stop is in view when the planner opens, and today on a press of "Today".
  useLayoutEffect(() => {
    show(todayPresses ? today : home);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on a press; `show` reads the page
  }, [todayPresses]);

  // The planner gets its size after its first render: the side column collapses, a stack gives the
  // card its height, the columns become tabs, a font arrives. The day stays in view through all of
  // that, until the user scrolls or moves in the weeks; from then on the place is theirs.
  const inView = useRef(home);
  useLayoutEffect(() => {
    inView.current = todayPresses ? today : home;
  });
  useLayoutEffect(() => {
    const el = ref.current;
    const view = el?.closest<HTMLElement>('[data-part="viewport"]');
    if (!el || !view) return;
    const observer = new ResizeObserver(() => show(inView.current));
    observer.observe(el);
    observer.observe(view);
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    const stop = () => {
      observer.disconnect();
      for (const event of events) view.removeEventListener(event, stop);
    };
    for (const event of events) view.addEventListener(event, stop, { passive: true });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `show` reads the page
  }, [ref, hidden]);

  // The side column collapses when the days would get narrower than `MIN_DAY` beside it. A function of
  // the width alone, so a resize and a fresh load at a width give the same result.
  const [collapsed, setCollapsed] = useState(false);
  const hasAside = !!renderWeek;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !hasAside) return;
    const measure = () => setCollapsed(el.clientWidth < weekAsideWidth + 7 * MIN_DAY);
    measure();
    // Before the paint, so the step is never seen half done.
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, hasAside, weekAsideWidth, hidden]);

  if (state) {
    return (
      <div data-part="state" className={cx(styles.state, className)} style={style}>
        {renderPart(parts?.state, { children: state }, (p) => p.children)}
      </div>
    );
  }

  return (
    <ScrollArea className={cx(styles.scroll, className)} style={style}>
      <div
        {...handlers}
        ref={ref}
        role="grid"
        data-part="grid"
        data-aside={hasAside ? (collapsed ? 'collapsed' : 'open') : undefined}
        aria-label={label ? `${label}, ${title}` : title}
        aria-busy={loading || undefined}
        className={styles.grid}
        style={{ ['--aside-width' as string]: `${weekAsideWidth}px` }}
      >
        {renderPart(parts?.weekdays, { days: weeks[0]!, format: weekdayFormat }, (p) => (
          <div role="rowgroup" data-part="weekdays" data-sticky="" className={styles.weekdays}>
            <div role="row" className={cx(strip.week, styles.week)}>
              {hasAside && (
                <div role="columnheader" className={styles.weekday}>
                  <span className={shared.srOnly}>{weekLabel}</span>
                </div>
              )}
              {p.days.map((day) => (
                <div key={day} role="columnheader" className={styles.weekday}>
                  <span aria-hidden="true">
                    <WeekdayName date={day} format={p.format} />
                  </span>
                  <span className={shared.srOnly}>{formatWeekday(day, locale, 'long')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {weeks.map((days, index) => {
          const week: PlannerWeek = {
            start: days[0]!,
            end: days[6]!,
            days,
            index,
            items: shown.filter((item) => item.date >= days[0]! && item.date <= days[6]!),
            collapsed,
          };
          const isEmpty = !loading && week.items.length === 0;
          const name = `${weekLabel}, ${formatDayMonthRange(days[0]!, days[6]!, locale)}`;
          const content = renderWeek?.(week);
          return (
            <div key={week.start} role="rowgroup" data-part="week" className={cx(strip.week, styles.week)}>
              <WeekLines
                days={days}
                placed={placed}
                slotsPerDay={slotsPerDay}
                baseId={baseId}
                today={today}
                month={month}
                selectedDate={selected}
                onDayPress={dayPress}
                onAction={onAction}
                loading={loading}
                // The first day shown and the first of a month say their month: "28 Sep", "1 Oct".
                chip={(date) => ({ showMonth: date === first || 'auto' })}
                slot={{ size: slotSize, display: collapsed ? 'icon' : slotDisplay }}
                freeLabel={freeLabel}
                hiddenItemsLabel={hiddenItemsLabel}
                parts={parts}
                empty={
                  isEmpty
                    ? renderPart(parts?.weekEmpty, { week, children: emptyWeekLabel }, (p) => p.children)
                    : undefined
                }
                aside={
                  hasAside && (
                    <div
                      role="rowheader"
                      aria-label={name}
                      data-part="weekAside"
                      data-cell=""
                      data-week={week.start}
                      data-col="aside"
                      tabIndex={-1}
                      className={styles.aside}
                      style={{ gridRow: `1 / span ${isEmpty ? 2 : slotsPerDay + 1}` }}
                    >
                      {/* ponytail: the content is mounted again when the column collapses or opens, so
                          state kept inside it (not in the app) is lost on that resize. Move the same
                          elements, as Card does, if that matters. */}
                      {collapsed ? (
                        <Popover
                          trigger={<IconButton variant="ghost" icon={<Icon name="more" />} label={name} />}
                          aria-label={name}
                          placement="end start"
                        >
                          {content}
                        </Popover>
                      ) : (
                        content
                      )}
                    </div>
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export interface PlannerProps
  extends
    Omit<PlannerRootProps, 'children'>,
    Omit<PlannerGridProps, 'parts' | 'className' | 'style'>,
    Pick<PlannerToolbarProps, 'monthLabel' | 'previousLabel' | 'nextLabel' | 'todayLabel' | 'moreLabel'> {
  /** Replace or hide named pieces. */
  parts?:
    | (NonNullable<PlannerGridProps['parts']> & {
        /** The bar above the weeks: the month, previous, next and "Today". */
        toolbar?: Part<PlannerToolbarProps> | undefined;
      })
    | undefined;
}

/** A month of days with a fixed number of slots each, and room beside every week for its controls. */
export function Planner({
  month,
  defaultMonth,
  onMonthChange,
  minMonth,
  maxMonth,
  today,
  weekStartsOn,
  height,
  'aria-label': ariaLabel,
  className,
  style,
  size,
  priority,
  minWidth,
  minHeight,
  label,
  monthLabel,
  previousLabel,
  nextLabel,
  todayLabel,
  moreLabel,
  parts,
  ...grid
}: PlannerProps) {
  const { toolbar, ...gridParts } = parts ?? {};
  return (
    <Root
      {...passThrough(grid)}
      {...{ month, defaultMonth, onMonthChange, minMonth, maxMonth, today, weekStartsOn, height }}
      {...{ size, priority, minWidth, minHeight, label, className, style }}
      aria-label={ariaLabel}
    >
      {renderPart(toolbar, { monthLabel, previousLabel, nextLabel, todayLabel, moreLabel }, (p) => (
        <Toolbar {...p} />
      ))}
      <Grid {...grid} parts={gridParts} />
    </Root>
  );
}

Planner.Root = Root;
Planner.Toolbar = Toolbar;
Planner.Grid = Grid;
Planner.Row = Row;
Planner.Cell = Cell;
