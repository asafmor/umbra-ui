import type { CSSProperties, ReactNode } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Badge.module.css';
import shared from './shared.module.css';
import { toneProps, type Tone } from './tone';

export interface BadgeRootProps {
  /** What the colour means. `accent` is the fixed violet. */
  tone?: Tone;
  /** A custom colour (any CSS colour). Replaces `tone`. */
  color?: string;
  /** Set when the root holds the element the badge is anchored to. */
  anchored?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function Root({ tone = 'accent', color, anchored, className, style, children }: BadgeRootProps) {
  return (
    <span
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
  dot?: boolean;
  /** What a screen reader hears, when it differs from the visible text. */
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** The visible text. */
  children?: ReactNode;
}

function Indicator({ dot, label, className, style, children }: BadgeIndicatorProps) {
  const spoken = label !== undefined && label !== children;
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
  count?: number;
  /** Shows a dot instead of a number. */
  dot?: boolean;
  /** Counts above this show as "99+". */
  max?: number;
  /** Shows the badge when `count` is 0. */
  showZero?: boolean;
  /**
   * What a screen reader hears: a string, or a function of the count (`(n) => n + ' unread'`).
   * By default the full count is read, also above `max`. A dot is silent without it.
   */
  label?: string | ((count: number) => string);
  /** The element the badge sits on the corner of. Without it the badge stands alone. */
  children?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: { indicator?: Part<BadgeIndicatorProps> };
}

/** A count or a dot, alone or on the corner of another element. */
export function Badge({
  count,
  dot = false,
  max = 99,
  showZero = false,
  label,
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
        renderPart(parts?.indicator, { dot, label: spoken, children: dot ? undefined : text }, (p) => (
          <Indicator {...p} />
        ))}
    </Root>
  );
}

Badge.Root = Root;
Badge.Indicator = Indicator;
