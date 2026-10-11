import type { CSSProperties, ReactNode } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Badge.module.css';
import shared from './shared.module.css';
import { toneProps, type Tone } from './tone';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export interface BadgeRootProps extends RootAttributes {
  /** What the colour means. `accent` is the fixed violet. */
  tone?: Tone | undefined;
  /** A custom colour (any CSS colour). Replaces `tone`. */
  color?: string | undefined;
  /** Set when the root holds the element the badge is anchored to. */
  anchored?: boolean | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root({ tone = 'accent', color, anchored, className, style, children, ...rest }: BadgeRootProps) {
  return (
    <span
      {...passThrough(rest)}
      {...toneProps(tone, color, style)}
      data-umbra="badge"
      data-anchored={anchored || undefined}
      className={cx(shared.tone, styles.root, className)}
    >
      {children}
    </span>
  );
}

export interface BadgeIndicatorProps {
  /** A dot, without text. */
  dot?: boolean | undefined;
  /** What a screen reader hears, when it differs from the visible text. */
  label?: string | undefined;
  /**
   * Draws the text without making it text of the page, and hides the badge from assistive technology.
   * For a badge inside a control whose own name already holds the count.
   */
  decorative?: boolean | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** The visible text. */
  children?: ReactNode | undefined;
}

function Indicator({ dot, label, decorative, className, style, children }: BadgeIndicatorProps) {
  const spoken = label !== undefined && label !== children;
  if (decorative) {
    // The text is drawn by CSS from the attribute. As text inside a button it would read as a visible
    // label that the button's name does not start with.
    const drawn = typeof children === 'string' || typeof children === 'number';
    return (
      <span
        aria-hidden="true"
        data-part="indicator"
        data-dot={dot || undefined}
        data-text={!dot && drawn ? children : undefined}
        className={cx(styles.indicator, className)}
        style={style}
      >
        {!dot && !drawn && children}
      </span>
    );
  }
  return (
    <span
      data-part="indicator"
      data-dot={dot || undefined}
      className={cx(styles.indicator, className)}
      style={style}
    >
      {!dot && <span aria-hidden={spoken || undefined}>{children}</span>}
      {(spoken || (dot && label)) && <span className={shared.srOnly}>{label}</span>}
    </span>
  );
}

export interface BadgeProps extends Omit<BadgeRootProps, 'anchored'> {
  /** The number to show. */
  count?: number | undefined;
  /** Shows a dot instead of a number. */
  dot?: boolean | undefined;
  /** Counts above this show as "99+". */
  max?: number | undefined;
  /** Shows the badge when `count` is 0. */
  showZero?: boolean | undefined;
  /**
   * What a screen reader hears: a string, or a function of the count (`(n) => n + ' unread'`).
   * By default the full count is read, also above `max`. A dot is silent without it.
   */
  label?: string | ((count: number) => string) | undefined;
  /**
   * Draws the count without making it text of the page, and hides the badge from assistive technology.
   * For a badge inside a control whose own name already holds the count, as `IconButton` does.
   */
  decorative?: boolean | undefined;
  /** The element the badge sits on the corner of. Without it the badge stands alone. */
  children?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?: { indicator?: Part<BadgeIndicatorProps> | undefined } | undefined;
}

/** A count or a dot, alone or on the corner of another element. */
export function Badge({
  count,
  dot = false,
  max = 99,
  showZero = false,
  label,
  decorative,
  children,
  parts,
  ...root
}: BadgeProps) {
  const visible = dot || (count !== undefined && (count !== 0 || showZero));
  const spoken = typeof label === 'function' ? label(count ?? 0) : (label ?? (dot ? undefined : `${count}`));
  const text = count !== undefined && count > max ? `${max}+` : `${count}`;
  return (
    <Root {...root} anchored={children !== undefined && children !== null}>
      {children}
      {visible &&
        renderPart(
          parts?.indicator,
          { dot, label: spoken, decorative, children: dot ? undefined : text },
          (p) => <Indicator {...p} />,
        )}
    </Root>
  );
}

Badge.Root = Root;
Badge.Indicator = Indicator;
