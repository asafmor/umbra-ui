import { useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { ContextShrinkContext } from '../internal/contexts';
import { useHoverTip } from '../internal/TruncatedText';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './ContextBlock.module.css';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface ContextBlockRootProps extends BlockProps {
  /** Makes the block a button. */
  onPress?: (() => void) | undefined;
  /** Makes the block a link. */
  href?: string | undefined;
  /** Plugs in the app's router link. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  disabled?: boolean | undefined;
  /** Shown on hover and focus while a line is cut short or hidden: the whole text. */
  tooltip?: ReactNode | undefined;
  /** Replaces the name a button or link takes from its lines. */
  'aria-label'?: string | undefined;
}

const cut = (el: Element) => el.scrollWidth > el.clientWidth;

function Root({
  onPress,
  href,
  renderLink = (props) => <a {...props} />,
  disabled = false,
  tooltip,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: ContextBlockRootProps) {
  // Inside a `TopBar` the bar says how many steps to take; elsewhere the lines just end in an ellipsis.
  const level = useContext(ContextShrinkContext);
  const ref = useRef<HTMLElement>(null);
  const tip = useHoverTip(
    ref,
    tooltip,
    (el) => el.dataset.shrink !== '0' || [...el.querySelectorAll('[data-part]')].some(cut),
  );
  const shared = {
    'data-umbra': 'context-block',
    'data-shrink': level,
    'data-interactive': ((onPress || href !== undefined) && !disabled) || undefined,
    'data-disabled': disabled || undefined,
    className: cx(styles.root, className),
    style,
  };
  const control = { 'aria-label': ariaLabel, className: styles.control };
  return (
    <>
      {/* The root holds the ref and the state: an app's router link may not pass a ref on. */}
      <span ref={ref} {...shared}>
        {href !== undefined ? (
          disabled ? (
            <a role="link" aria-disabled="true" {...control}>
              {children}
            </a>
          ) : (
            renderLink({ href, ...control, children })
          )
        ) : onPress ? (
          <button type="button" {...control} disabled={disabled} onClick={onPress}>
            {children}
          </button>
        ) : (
          <span role={ariaLabel ? 'group' : undefined} {...control} data-plain="">
            {children}
          </span>
        )}
      </span>
      {tip}
    </>
  );
}

/** Holds the two lines. */
function Text({ className, style, children }: BlockProps) {
  return (
    <span data-part="text" className={cx(styles.text, className)} style={style}>
      {children}
    </span>
  );
}

function Primary({ className, style, children }: BlockProps) {
  return (
    <span data-part="primary" className={cx(styles.primary, className)} style={style}>
      {children}
    </span>
  );
}

/** The quieter second line. The first thing to hide in a bar that runs out of room. */
function Secondary({ className, style, children }: BlockProps) {
  if (useContext(ContextShrinkContext) >= 1) return null;
  return (
    <span data-part="secondary" className={cx(styles.secondary, className)} style={style}>
      {children}
    </span>
  );
}

export interface ContextBlockChipProps extends BlockProps {
  /** Makes the chip a `<time>` element with this machine-readable value. */
  dateTime?: string | undefined;
}

/** A short value in an outlined box. Hides after the second line. */
function Chip({ dateTime, className, style, children }: ContextBlockChipProps) {
  if (useContext(ContextShrinkContext) >= 2) return null;
  const shared = { 'data-part': 'chip', className: cx(styles.chip, className), style };
  return dateTime ? (
    <time {...shared} dateTime={dateTime}>
      {children}
    </time>
  ) : (
    <span {...shared}>{children}</span>
  );
}

const MINUTE = 60_000;

/**
 * The moment the chip shows, in milliseconds. Not `live`: `time` as given. `live`: a clock that starts
 * at `time` (or at the device's time) and renders again at the start of each minute.
 */
function useClock(time: Date | string | number | undefined, live: boolean) {
  const given = time === undefined ? undefined : new Date(time).getTime();
  const [ticked, setTicked] = useState<{ from: number | undefined; now: number }>();
  useEffect(() => {
    if (!live) return;
    const mounted = Date.now();
    const start = given ?? mounted;
    let timer = 0;
    const tick = () => {
      const now = start + (Date.now() - mounted);
      // The minute it is in: the chip and its `dateTime` do not carry the timer's few milliseconds.
      setTicked({ from: given, now: Math.floor(now / MINUTE) * MINUTE });
      // A few milliseconds past the minute, so a timer that fires early does not show the old one twice.
      timer = window.setTimeout(tick, MINUTE - (now % MINUTE) + 5);
    };
    // With a `time` the first render already shows it; the device's time is only known here.
    timer = window.setTimeout(tick, given === undefined ? 0 : MINUTE - (start % MINUTE) + 5);
    return () => window.clearTimeout(timer);
  }, [live, given]);
  return live && ticked && ticked.from === given ? ticked.now : given;
}

export interface ContextBlockProps extends Omit<ContextBlockRootProps, 'children' | 'tooltip'> {
  /** The main line. */
  primary?: ReactNode | undefined;
  /** The quieter second line. */
  secondary?: ReactNode | undefined;
  /** The chip's content: any short value. Wins over `time`. */
  chip?: ReactNode | undefined;
  /** A moment, shown in the chip in the provider's locale: a `Date`, an ISO string or milliseconds. */
  time?: Date | string | number | undefined;
  /** How `time` is written. Defaults to hour and minute. */
  timeFormat?: Intl.DateTimeFormatOptions | undefined;
  /** Makes the chip a clock: it starts at `time`, or at the device's time, and moves on each minute. Nothing is announced. */
  live?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        primary?: Part<{ children: ReactNode }> | undefined;
        secondary?: Part<{ children: ReactNode }> | undefined;
        chip?: Part<ContextBlockChipProps> | undefined;
      }
    | undefined;
}

/** The two-line status of a `TopBar`, with a short value in a chip, usually the time. */
export function ContextBlock({
  primary,
  secondary,
  chip,
  time,
  timeFormat = { hour: '2-digit', minute: '2-digit' },
  live = false,
  parts,
  ...root
}: ContextBlockProps) {
  const { locale } = useLocale();
  const moment = useClock(time, live);
  const valid = moment !== undefined && !Number.isNaN(moment);
  const chipProps: ContextBlockChipProps | null =
    chip != null
      ? { children: chip }
      : valid
        ? {
            dateTime: new Date(moment).toISOString(),
            children: new Intl.DateTimeFormat(locale, timeFormat).format(moment),
          }
        : null;
  return (
    <Root
      {...root}
      tooltip={
        <>
          {primary}
          {secondary != null && (
            <>
              <br />
              {secondary}
            </>
          )}
          {chipProps && (
            <>
              <br />
              {chipProps.children}
            </>
          )}
        </>
      }
    >
      {(primary != null || secondary != null) && (
        <Text>
          {primary != null &&
            renderPart(parts?.primary, { children: primary }, (p) => <Primary>{p.children}</Primary>)}
          {secondary != null &&
            renderPart(parts?.secondary, { children: secondary }, (p) => <Secondary>{p.children}</Secondary>)}
        </Text>
      )}
      {chipProps && renderPart(parts?.chip, chipProps, (p) => <Chip {...p} />)}
    </Root>
  );
}

ContextBlock.Root = Root;
ContextBlock.Text = Text;
ContextBlock.Primary = Primary;
ContextBlock.Secondary = Secondary;
ContextBlock.Chip = Chip;
