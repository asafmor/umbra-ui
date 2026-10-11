import { useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Skeleton } from '../basics/Skeleton';
import { IconPart, type IconPartProps } from '../data/IconPart';
import shared from '../data/shared.module.css';
import { toneProps, type Tone } from '../data/tone';
import { useHoverTip } from '../internal/TruncatedText';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import type { IsoDate } from './dates';
import styles from './ScheduleSlot.module.css';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** A colour of the series palette (`--umbra-color-series-1` to `-8`), for categories without a meaning. */
export type ScheduleSlotSeries = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ScheduleSlotRootProps extends BlockProps {
  /** What the colour means. */
  tone?: Tone | undefined;
  /** A free colour (any CSS colour) for a category of the app. Replaces `tone`. */
  color?: string | undefined;
  /** A colour of the series palette, by its number. Replaces `tone`; `color` replaces both. */
  series?: ScheduleSlotSeries | undefined;
  /** `filled`: tinted, with a stripe. `outlined`: the border only. `empty`: dashed and quiet, for free or rest time. */
  variant?: 'filled' | 'outlined' | 'empty' | undefined;
  /** `small` is for a strip in a small card. Otherwise the height follows the density level. */
  size?: 'default' | 'small' | undefined;
  /**
   * `icon` shows the icon alone; the label stays the accessible name and becomes a tooltip. `auto` does
   * that by itself when the day of a `WeekStrip` or `Planner` around it is too narrow for a label.
   * A slot without an icon always keeps its label.
   */
  display?: 'auto' | 'full' | 'icon' | undefined;
  /** Fills the width of its container. Otherwise it is as wide as its content. */
  fullWidth?: boolean | undefined;
  /** Marks the chosen slot with a ring. */
  selected?: boolean | undefined;
  /** What a screen reader hears after the label of a selected slot. */
  selectedLabel?: string | undefined;
  disabled?: boolean | undefined;
  /** Makes the slot a button. */
  onPress?: (() => void) | undefined;
  /** Makes the slot a link. */
  href?: string | undefined;
  /** Plugs in the app's router link. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  /** Shown in a tooltip while the label is hidden or cut short. The all-in-one component passes its label. */
  tooltip?: ReactNode | undefined;
  /** Accessible name, for a slot whose content is not text. */
  'aria-label'?: string | undefined;
}

const plainLink = (props: LinkRenderProps) => <a {...props} />;

/** True while the label is not readable as drawn: hidden (icon only) or cut short by its ellipsis. */
const labelCut = (el: HTMLElement) => {
  const label = el.querySelector<HTMLElement>('[data-part="label"]');
  return !!label && (label.clientWidth <= 1 || label.scrollWidth > label.clientWidth);
};

function Root({
  tone = 'neutral',
  color,
  series,
  variant = 'filled',
  size = 'default',
  display = 'auto',
  fullWidth = false,
  selected = false,
  selectedLabel = 'Selected',
  disabled = false,
  onPress,
  href,
  renderLink = plainLink,
  tooltip,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: ScheduleSlotRootProps) {
  // The element is the app's own when `renderLink` draws it, so it is found from a marker inside it.
  const marker = useRef<HTMLSpanElement>(null);
  const element = useMemo<RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return marker.current?.parentElement ?? null;
      },
      set current(_) {},
    }),
    [],
  );
  const tip = useHoverTip(element, tooltip, labelCut);
  const common = {
    ...toneProps(tone, color ?? (series && `var(--umbra-color-series-${series})`), style),
    'data-umbra': 'schedule-slot',
    'data-variant': variant,
    'data-size': size,
    'data-display': display,
    'data-full-width': fullWidth || undefined,
    'data-interactive': onPress || href !== undefined ? '' : undefined,
    'data-selected': selected || undefined,
    'data-disabled': disabled || undefined,
    'aria-label': ariaLabel,
    className: cx(shared.tone, styles.slot, className),
  };
  const content = (
    <>
      {children}
      {selected && selectedLabel && <span className={shared.srOnly}>, {selectedLabel}</span>}
      <span ref={marker} hidden />
    </>
  );
  const slot =
    href !== undefined && !disabled ? (
      renderLink({
        ...common,
        href,
        onClick: onPress && (() => onPress()),
        children: content,
      })
    ) : onPress || href !== undefined ? (
      <button {...common} type="button" disabled={disabled} onClick={onPress}>
        {content}
      </button>
    ) : (
      // A name on an element without a role is not read: a static slot named by the app is an image.
      <span {...common} role={ariaLabel ? 'img' : undefined}>
        {content}
      </span>
    );
  return (
    <>
      {slot}
      {tip}
    </>
  );
}

function SlotIcon(props: IconPartProps) {
  return <IconPart {...props} />;
}

function Label({ className, style, children }: BlockProps) {
  return (
    <span data-part="label" className={cx(styles.label, className)} style={style}>
      {children}
    </span>
  );
}

export interface ScheduleSlotProps extends Omit<ScheduleSlotRootProps, 'children' | 'tooltip'> {
  /** The label. Without one (`null`, `undefined` or an empty text) the slot is `empty` and shows `emptyLabel`. */
  children?: ReactNode | undefined;
  /** Shown when there is no label. */
  emptyLabel?: ReactNode | undefined;
  /** The category's icon: with the label, the cue that does not depend on colour. */
  icon?: ReactNode | undefined;
  /** Shows a placeholder of the slot's size. */
  loading?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A coloured chip for one entry of a schedule: an icon and a label, coloured by its category. */
export function ScheduleSlot({
  children,
  emptyLabel = '—',
  icon,
  loading = false,
  parts,
  ...root
}: ScheduleSlotProps) {
  if (loading) {
    return renderPart(parts?.skeleton, {}, () => (
      <span
        data-umbra="schedule-slot"
        data-part="skeleton"
        data-loading=""
        data-size={root.size ?? 'default'}
        data-full-width={root.fullWidth || undefined}
        className={cx(styles.slot, styles.skeleton, root.className)}
        style={root.style}
      >
        <Skeleton shape="block" />
      </span>
    ));
  }
  const none = children == null || children === '';
  const label = none ? emptyLabel : children;
  return (
    <Root {...root} variant={none ? 'empty' : root.variant} tooltip={label}>
      {icon && renderPart(parts?.icon, { children: icon }, (p) => <SlotIcon>{p.children}</SlotIcon>)}
      {renderPart(parts?.label, { children: label }, (p) => (
        <Label>{p.children}</Label>
      ))}
    </Root>
  );
}

ScheduleSlot.Root = Root;
ScheduleSlot.Icon = SlotIcon;
ScheduleSlot.Label = Label;

/** One entry of a `WeekStrip` or a `Planner`: a slot, and the day it is on. */
export interface ScheduleItem {
  id: string;
  /** The day, as `'2026-10-11'`. */
  date: IsoDate;
  /** Which slot of the day it takes, from 0. Without it, items fill the day in the order they are given. */
  slot?: number | undefined;
  label: ReactNode;
  /** The label as text, when `label` is not text: the accessible name and the tooltip. */
  textValue?: string | undefined;
  icon?: ReactNode | undefined;
  tone?: Tone | undefined;
  color?: string | undefined;
  series?: ScheduleSlotSeries | undefined;
  variant?: 'filled' | 'outlined' | 'empty' | undefined;
  selected?: boolean | undefined;
  /** Cannot be activated. */
  disabled?: boolean | undefined;
}

/** The items of each day, placed in its slots: `undefined` is a free slot. */
export function placeItems(items: readonly ScheduleItem[], days: readonly IsoDate[], slotsPerDay: number) {
  const byDay = new Map<IsoDate, (ScheduleItem | undefined)[]>(
    days.map((day) => [day, Array.from<ScheduleItem | undefined>({ length: slotsPerDay })]),
  );
  // Items that name their slot first, so the others fill what is left.
  for (const item of [...items].sort((a, b) => Number(b.slot !== undefined) - Number(a.slot !== undefined))) {
    const slots = byDay.get(item.date);
    if (!slots) continue;
    const at = item.slot !== undefined && !slots[item.slot] ? item.slot : slots.indexOf(undefined);
    // A day with more items than slots drops the rest: `slotsPerDay` is the app's to raise.
    if (at >= 0 && at < slotsPerDay) slots[at] = item;
  }
  return byDay;
}
