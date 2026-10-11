import type { CSSProperties, ReactNode } from 'react';
import { RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { IconPart } from './IconPart';
import shared from './shared.module.css';
import styles from './StatusIndicator.module.css';
import { toneProps } from './tone';

export type Status = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** One shape per status, so the status does not depend on colour. */
const icons: Record<Status, ReactNode> = {
  success: <RawIcon name="success" />,
  warning: <RawIcon name="warning" />,
  danger: <RawIcon name="danger" />,
  info: <RawIcon name="info" />,
  neutral: <RawIcon name="neutral" />,
};

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface StatusIndicatorRootProps extends BlockProps {
  status?: Status | undefined;
  /** A custom colour (any CSS colour). Replaces the colour of `status`; the shape stays. */
  color?: string | undefined;
  /** `dot`: a small shape. `icon`: the status icon. `label`: no mark, the label itself is coloured. */
  variant?: 'dot' | 'icon' | 'label' | undefined;
  /** Draws attention with a slow pulse around the dot. With reduced motion the dot stays still. */
  pulse?: boolean | undefined;
  /** Names an indicator that has no visible label. */
  'aria-label'?: string | undefined;
}

function Root({
  status = 'neutral',
  color,
  variant = 'dot',
  pulse,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: StatusIndicatorRootProps) {
  return (
    <span
      {...toneProps(status, color, style)}
      data-umbra="status-indicator"
      data-status={status}
      data-variant={variant}
      data-pulse={pulse || undefined}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      className={cx(shared.tone, styles.root, className)}
    >
      {children}
    </span>
  );
}

/** The mark: a dot in the shape of the status, or an icon when it has children. */
function Indicator({ className, style, children }: BlockProps) {
  return children ? (
    <IconPart part="indicator" className={className} style={style}>
      {children}
    </IconPart>
  ) : (
    <span data-part="indicator" aria-hidden="true" className={cx(styles.dot, className)} style={style} />
  );
}

function Label({ className, style, children }: BlockProps) {
  return (
    <span data-part="label" className={cx(styles.label, className)} style={style}>
      {children}
    </span>
  );
}

export interface StatusIndicatorProps extends Omit<StatusIndicatorRootProps, 'children'> {
  /** The label. Without one, give `aria-label`. */
  children?: ReactNode | undefined;
  /** Replaces the icon of the `icon` variant. */
  icon?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        indicator?: Part<{ children: ReactNode }> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** A status as a dot or an icon with a label, or as a coloured label. */
export function StatusIndicator({ children, icon, parts, ...root }: StatusIndicatorProps) {
  const { status = 'neutral', variant = 'dot' } = root;
  const mark = variant === 'icon' ? (icon ?? icons[status]) : null;
  return (
    <Root {...root}>
      {variant !== 'label' &&
        renderPart(parts?.indicator, { children: mark }, (p) => <Indicator>{p.children}</Indicator>)}
      {children !== undefined &&
        children !== null &&
        renderPart(parts?.label, { children }, (p) => <Label>{p.children}</Label>)}
    </Root>
  );
}

StatusIndicator.Root = Root;
StatusIndicator.Indicator = Indicator;
StatusIndicator.Label = Label;
