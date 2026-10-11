// The rows and cells of a grid of days, shared by WeekStrip and Planner: both are the same grid, one
// week or several. The keyboard is in grid.ts, which finds the cells by the attributes set here.
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import shared from '../data/shared.module.css';
import { cx, renderPart, type Part } from '../utils/parts';
import { DateChip, type DateChipProps } from './DateChip';
import { daysBetween, type IsoDate } from './dates';
import { ScheduleSlot, type ScheduleItem, type ScheduleSlotProps } from './ScheduleSlot';
import styles from './WeekStrip.module.css';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const WeekContext = createContext<IsoDate | null>(null);

export interface ScheduleRowProps extends BlockProps {
  /** The first day of the row's seven, as `'2026-10-05'`. */
  week: IsoDate;
}

/** One line of a week: the headers of its days, or one slot of each day. */
export function Row({ week, className, style, children }: ScheduleRowProps) {
  return (
    <div role="row" data-part="row" className={cx(styles.row, className)} style={style}>
      <WeekContext value={week}>{children}</WeekContext>
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
  const week = useContext(WeekContext);
  if (!week) throw new Error('A cell must be rendered inside a row (WeekStrip.Row or Planner.Row).');
  const header = line === 0;
  return (
    <div
      role={role}
      id={id}
      data-part={header ? 'dayCell' : 'slotCell'}
      data-cell=""
      data-date={date}
      data-week={week}
      data-col={daysBetween(week, date)}
      data-line={line}
      data-today={today || undefined}
      data-outside={outside || undefined}
      data-action={onPress && !disabled ? '' : undefined}
      aria-selected={header ? selected : undefined}
      aria-current={header && today ? 'date' : undefined}
      aria-disabled={disabled || undefined}
      aria-describedby={describedBy}
      tabIndex={-1}
      onClick={disabled ? undefined : onPress}
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
  parts,
  columnHeaders = false,
  aside,
  empty,
}: {
  days: IsoDate[];
  placed: Map<IsoDate, (ScheduleItem | undefined)[]>;
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
  parts: ScheduleParts | undefined;
  /** One week only: the headers of the days head their columns, so a slot needs no other word for its day. */
  columnHeaders?: boolean | undefined;
  /** The side cell of the week, first in its first row. */
  aside?: ReactNode | undefined;
  /** Shown in place of the slots of a week that has none. */
  empty?: ReactNode | undefined;
}) {
  const week = days[0]!;
  const state = (date: IsoDate) => ({
    date,
    today: date === today,
    outside: month !== undefined && !date.startsWith(month),
  });
  return (
    <>
      <Row week={week}>
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
                ...chip(date),
              },
              (p) => (
                <DateChip {...p} />
              ),
            )}
          </Cell>
        ))}
      </Row>
      {empty !== undefined ? (
        <div role="row" data-part="row" className={styles.row}>
          <div role="gridcell" aria-colspan={7} data-part="weekEmpty" className={styles.weekEmpty}>
            {empty}
          </div>
        </div>
      ) : (
        Array.from({ length: slotsPerDay }, (_, index) => (
          <Row key={index} week={week}>
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
                          <ScheduleSlot.Root variant="empty" fullWidth size={slot.size}>
                            <span className={shared.srOnly}>{p.label}</span>
                          </ScheduleSlot.Root>
                        ))}
                </Cell>
              );
            })}
          </Row>
        ))
      )}
    </>
  );
}
