import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import shared from './shared.module.css';
import styles from './TrendArrow.module.css';

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendTone = 'good' | 'bad' | 'neutral';

const arrows: Record<TrendDirection, ReactNode> = { up: <ArrowUp />, down: <ArrowDown />, flat: <Minus /> };

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface TrendArrowRootProps extends BlockProps {
  direction: TrendDirection;
  /** The colour of the arrow. */
  tone?: TrendTone;
}

function Root({ direction, tone = 'neutral', className, style, children }: TrendArrowRootProps) {
  return (
    <span
      data-umbra="trend-arrow"
      data-direction={direction}
      data-tone={tone}
      className={cx(styles.root, className)}
      style={style}
    >
      {children}
    </span>
  );
}

function TrendIcon({ children }: { children?: ReactNode }) {
  return <IconSlot part="icon">{children}</IconSlot>;
}

function Value({ className, style, children }: BlockProps) {
  return (
    <span data-part="value" className={cx(styles.value, className)} style={style}>
      {children}
    </span>
  );
}

export interface TrendArrowProps extends Omit<TrendArrowRootProps, 'children'> {
  /** Which direction is good: it gets the success colour, the other the danger colour. `flat` is neutral. */
  positive?: 'up' | 'down';
  /** Text after the arrow, for example the size of the change. */
  value?: ReactNode;
  /** Replaces the arrow. Keep a different shape per direction: the shape is the cue that is not colour. */
  icon?: ReactNode;
  /** What a screen reader hears for the direction. Defaults to the label of the direction below. */
  label?: string;
  upLabel?: string;
  downLabel?: string;
  flatLabel?: string;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    value?: Part<{ children: ReactNode }>;
  };
}

/** The direction of a change: up, down or flat. */
export function TrendArrow({
  direction,
  positive = 'up',
  tone = direction === 'flat' ? 'neutral' : direction === positive ? 'good' : 'bad',
  value,
  icon,
  upLabel = 'Up',
  downLabel = 'Down',
  flatLabel = 'No change',
  label = { up: upLabel, down: downLabel, flat: flatLabel }[direction],
  parts,
  ...root
}: TrendArrowProps) {
  return (
    <Root {...root} direction={direction} tone={tone}>
      {renderPart(parts?.icon, { children: icon ?? arrows[direction] }, (p) => (
        <TrendIcon>{p.children}</TrendIcon>
      ))}
      <span className={shared.srOnly}>{label}</span>
      {value !== undefined &&
        value !== null &&
        renderPart(parts?.value, { children: value }, (p) => <Value>{p.children}</Value>)}
    </Root>
  );
}

TrendArrow.Root = Root;
TrendArrow.Icon = TrendIcon;
TrendArrow.Value = Value;
