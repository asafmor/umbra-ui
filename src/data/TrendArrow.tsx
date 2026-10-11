import type { CSSProperties, ReactNode } from 'react';
import { RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { IconPart, type IconPartProps } from './IconPart';
import shared from './shared.module.css';
import styles from './TrendArrow.module.css';

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendTone = 'good' | 'bad' | 'neutral';

const arrows: Record<TrendDirection, ReactNode> = {
  up: <RawIcon name="trendUp" />,
  down: <RawIcon name="trendDown" />,
  flat: <RawIcon name="trendFlat" />,
};

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface TrendArrowRootProps extends BlockProps {
  direction: TrendDirection;
  /** The colour of the arrow. */
  tone?: TrendTone | undefined;
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

function TrendIcon(props: IconPartProps) {
  return <IconPart {...props} />;
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
  positive?: 'up' | 'down' | undefined;
  /** Text after the arrow, for example the size of the change. */
  value?: ReactNode | undefined;
  /** Replaces the arrow. Keep a different shape per direction: the shape is the cue that is not colour. */
  icon?: ReactNode | undefined;
  /** What a screen reader hears for the direction. Defaults to the label of the direction below. */
  label?: string | undefined;
  upLabel?: string | undefined;
  downLabel?: string | undefined;
  flatLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
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
