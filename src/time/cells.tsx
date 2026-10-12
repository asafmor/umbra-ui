// The rows and cells of a grid of days, shared by WeekStrip and Planner: both are the same grid, one
// week or several. The keyboard is in grid.ts, which finds the cells by the attributes set here.
import { createContext, useContext, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import shared from '../data/shared.module.css';
import { useHoverTip } from '../internal/TruncatedText';
import { Popover } from '../overlays/Popover';
import { cx, renderPart, type Part } from '../utils/parts';
import { DateChip, type DateChipProps } from './DateChip';
import { daysBetween, validDate, type IsoDate } from './dates';
import { ScheduleSlot, type ScheduleItem, type ScheduleSlotProps } from './ScheduleSlot';
import styles from './WeekStrip.module.css';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const WeekContext = createContext<{ week: IsoDate; sideColumn: boolean } | null>(null);

export interface ScheduleRowProps extends BlockProps {
  /** The first day of the row's seven, as `'2026-10-05'`. */
  week: IsoDate;
  /**
   * The grid has a column before the days (the side column of a `Planner`): each cell then says which
   * column it is in (`aria-colindex`, from 2), so a row without the side cell is not read one column off.
   * Set `aria-colcount={8}` on the grid with it.
   */
  sideColumn?: boolean | undefined;
}

/** One line of a week: the headers of its days, or one slot of each day. */
export function Row({ week, sideColumn = false, className, style, children }: ScheduleRowProps) {
  const context = useMemo(() => ({ week, sideColumn }), [week, sideColumn]);
  // What is not a date draws nothing, and warns (dates.ts, `validDate`).
  if (!validDate(week, 'Row week')) return null;
  return (
    <div role="row" data-part="row" className={cx(styles.row, className)} style={style}>
      <WeekContext value={context}>{children}</WeekContext>
    </div>
  );
}

export interface ScheduleCellProps extends BlockProps {
  /** The day, as `'2026-10-11'`. */
  date: IsoDate;
  /** 0 is the header of the day; 1 and up are its slots. */
  line?: number | undefined;
  /** The current day: its cells are tinted, and its header is `aria-current="date"`. */
  today?: boolean | undefined;
  /** On a header: whether the day is the chosen one. Leave it out where days cannot be chosen. */
  selected?: boolean | undefined;
  /** A day of another month than the one shown. */
  outside?: boolean | undefined;
  disabled?: boolean | undefined;
  /** A click, Enter or Space on the cell. */
  onPress?: (() => void) | undefined;
  /** `columnheader` for the header of a day in a grid of one week, where it heads its column. */
  role?: 'gridcell' | 'columnheader' | undefined;
  id?: string | undefined;
  'aria-describedby'?: string | undefined;
}

/** One cell of the grid: a stop of the arrow keys. Its content is not a control; the cell is. */
export function Cell({
  date,
  line = 0,
  today = false,
  selected,
  outside = false,
  disabled = false,
  onPress,
  role = 'gridcell',
  id,
  'aria-describedby': describedBy,
  className,
  style,
  children,
}: ScheduleCellProps) {
  const row = useContext(WeekContext);
  if (!row) throw new Error('A cell must be rendered inside a row (WeekStrip.Row or Planner.Row).');
  if (!validDate(date, 'Cell date')) return null;
  const { week, sideColumn } = row;
  const column = daysBetween(week, date);
  const header = line === 0;
  return (
    <div
      role={role}
      id={id}
      data-part={header ? 'dayCell' : 'slotCell'}
      data-cell=""
      data-date={date}
      data-week={week}
      data-col={column}
      data-line={line}
      data-today={today || undefined}
      data-outside={outside || undefined}
      data-action={onPress && !disabled ? '' : undefined}
      aria-selected={header ? selected : undefined}
      aria-current={header && today ? 'date' : undefined}
      aria-disabled={disabled || undefined}
      aria-describedby={describedBy}
      aria-colindex={sideColumn ? column + 2 : undefined}
      tabIndex={-1}
      onClick={disabled ? undefined : () => onPress?.()}
      className={cx(styles.cell, className)}
      style={style}
    >
      {children}
    </div>
  );
}

/** What the `slot` part receives: the props of the default `ScheduleSlot`, and the item it draws. */
export type ScheduleSlotPartProps = ScheduleSlotProps & { item: ScheduleItem };

export interface ScheduleParts {
  /** The chip in the header of a day. */
  day?: Part<DateChipProps> | undefined;
  /** The chip of an item. */
  slot?: Part<ScheduleSlotPartProps> | undefined;
  /** A free slot. */
  placeholder?: Part<{ date: IsoDate; line: number; label: string }> | undefined;
  /** The placeholder of a slot while loading. */
  skeleton?: Part<{ date: IsoDate; line: number }> | undefined;
}

const nameOf = (item: ScheduleItem) => item.textValue ?? (typeof item.label === 'string' ? item.label : '');

/**
 * The mark of a day that has more items than slots: "+2" beside its date. It is a button that opens the
 * list of them, where each is activated as a slot of the day is. It is named by the count and the
 * items themselves, so the day's cell says them, and a pointer or the focus reads them in a tooltip.
 */
function HiddenItems({
  items,
  label,
  onAction,
}: {
  items: ScheduleItem[];
  label: string;
  onAction: ((id: string) => void) | undefined;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const names = items.map(nameOf).filter(Boolean).join(', ');
  const text = names ? `${label}: ${names}` : label;
  // On the element around the button, so the tip also answers to the focus of the day's cell.
  const tip = useHoverTip(ref, text);
  return (
    // A press on the mark or in its list is theirs: it does not also press the day around them (the
    // list is drawn elsewhere on the page, and still a child of the cell to React).
    <span ref={ref} className={styles.hiddenHolder} onClick={(event) => event.stopPropagation()}>
      <Popover
        aria-label={text}
        trigger={
          <button type="button" aria-label={text} data-part="hiddenItems" className={styles.hiddenItems}>
            +{items.length}
          </button>
        }
      >
        {(close) => (
          <div data-part="hiddenList" className={styles.hiddenList}>
            {items.map((item) => (
              <ScheduleSlot
                key={item.id}
                fullWidth
                display="full"
                icon={item.icon}
                tone={item.tone}
                color={item.color}
                series={item.series}
                variant={item.variant}
                selected={item.selected}
                disabled={item.disabled}
                aria-label={typeof item.label === 'string' ? undefined : item.textValue}
                onPress={
                  onAction &&
                  (() => {
                    // Closed first: the focus is back on the mark when the app answers.
                    close();
                    onAction(item.id);
                  })
                }
              >
                {item.label}
              </ScheduleSlot>
            ))}
          </div>
        )}
      </Popover>
      {tip}
    </span>
  );
}

/** Internal: the lines of one week, as the all-in-one components draw them. */
export function WeekLines({
  days,
  placed,
  slotsPerDay,
  baseId,
  today,
  month,
  selectedDate,
  onDayPress,
  onAction,
  loading,
  chip,
  slot,
  freeLabel,
  hiddenItemsLabel,
  parts,
  columnHeaders = false,
  aside,
  empty,
}: {
  days: IsoDate[];
  placed: Map<IsoDate, (ScheduleItem | undefined)[]> & { rest?: Map<IsoDate, ScheduleItem[]> | undefined };
  slotsPerDay: number;
  baseId: string;
  today: IsoDate;
  /** The month shown: days of another are `outside`. */
  month?: string | undefined;
  /** `undefined`: days cannot be chosen. */
  selectedDate: IsoDate | null | undefined;
  onDayPress: ((date: IsoDate) => void) | undefined;
  onAction: ((id: string) => void) | undefined;
  loading: boolean;
  chip: (date: IsoDate) => Partial<DateChipProps>;
  slot: Pick<ScheduleSlotProps, 'size' | 'display'>;
  freeLabel: string;
  hiddenItemsLabel: (count: number) => string;
  parts: ScheduleParts | undefined;
  /** One week only: the headers of the days head their columns, so a slot needs no other word for its day. */
  columnHeaders?: boolean | undefined;
  /** The side cell of the week, first in its first row. */
  aside?: ReactNode | undefined;
  /** Shown in place of the slots of a week that has none. */
  empty?: ReactNode | undefined;
}) {
  const week = days[0]!;
  const sideColumn = !!aside;
  const state = (date: IsoDate) => ({
    date,
    today: date === today,
    outside: month !== undefined && !date.startsWith(month),
  });
  return (
    <>
      <Row week={week} sideColumn={sideColumn}>
        {aside}
        {days.map((date) => (
          <Cell
            key={date}
            {...state(date)}
            id={`${baseId}-${date}`}
            role={columnHeaders ? 'columnheader' : 'gridcell'}
            selected={selectedDate === undefined ? undefined : selectedDate === date}
            onPress={onDayPress && (() => onDayPress(date))}
          >
            {renderPart(
              parts?.day,
              {
                ...state(date),
                selected: selectedDate === date,
                // The cell says both, as `aria-current` and `aria-selected`.
                todayLabel: '',
                selectedLabel: '',
                'data-part': 'day',
                ...chip(date),
              },
              (p) => (
                <DateChip {...p} />
              ),
            )}
            {!loading && placed.rest?.get(date) && (
              <HiddenItems
                items={placed.rest.get(date)!}
                label={hiddenItemsLabel(placed.rest.get(date)!.length)}
                onAction={onAction}
              />
            )}
          </Cell>
        ))}
      </Row>
      {empty !== undefined
        ? // Hidden (`weekEmpty: null`), the week is the headers of its days alone: no blank line.
          empty !== null &&
          empty !== false && (
            <div role="row" data-part="row" className={styles.row}>
              <div
                role="gridcell"
                aria-colspan={7}
                aria-colindex={sideColumn ? 2 : undefined}
                data-part="weekEmpty"
                className={styles.weekEmpty}
              >
                {empty}
              </div>
            </div>
          )
        : Array.from({ length: slotsPerDay }, (_, index) => (
            <Row key={index} week={week} sideColumn={sideColumn}>
              {days.map((date) => {
                const item = placed.get(date)?.[index];
                const line = index + 1;
                const press = item
                  ? onAction && (() => onAction(item.id))
                  : onDayPress && (() => onDayPress(date));
                return (
                  <Cell
                    key={date}
                    {...state(date)}
                    line={line}
                    disabled={item?.disabled}
                    onPress={loading ? undefined : press}
                    aria-describedby={columnHeaders ? undefined : `${baseId}-${date}`}
                  >
                    {loading
                      ? renderPart(parts?.skeleton, { date, line }, () => (
                          <ScheduleSlot loading fullWidth size={slot.size} />
                        ))
                      : item
                        ? renderPart(
                            parts?.slot,
                            {
                              item,
                              ...slot,
                              'data-part': 'slot',
                              fullWidth: true,
                              children: item.label,
                              icon: item.icon,
                              tone: item.tone,
                              color: item.color,
                              series: item.series,
                              variant: item.variant,
                              selected: item.selected,
                              disabled: item.disabled,
                              'aria-label': typeof item.label === 'string' ? undefined : item.textValue,
                            },
                            // The slot takes what it knows; `item` is for the app's function.
                            (p) => <ScheduleSlot {...p} />,
                          )
                        : renderPart(parts?.placeholder, { date, line, label: freeLabel }, (p) => (
                            <ScheduleSlot.Root
                              data-part="placeholder"
                              variant="empty"
                              fullWidth
                              size={slot.size}
                            >
                              <span className={shared.srOnly}>{p.label}</span>
                            </ScheduleSlot.Root>
                          ))}
                  </Cell>
                );
              })}
            </Row>
          ))}
    </>
  );
}
