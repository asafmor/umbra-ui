import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import shared from './shared.module.css';
import styles from './Tag.module.css';
import { toneColour, toneProps, type Tone } from './tone';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface TagRootProps extends BlockProps {
  /** What the colour means. */
  tone?: Tone;
  /** A custom colour (any CSS colour). Replaces `tone`. */
  color?: string;
  /** `outline`: coloured border. `subtle`: tinted fill. `solid`: filled, for short status codes. */
  variant?: 'outline' | 'solid' | 'subtle';
  /** `small` is for use inside table cells. */
  size?: 'default' | 'small';
  /** A second colour on the trailing edge: a tone name or any CSS colour. */
  stripe?: Tone | (string & {});
  /** What the stripe means, for screen readers and as a tooltip. */
  stripeLabel?: string;
}

function Root({
  tone = 'neutral',
  color,
  variant = 'outline',
  size = 'default',
  stripe,
  stripeLabel,
  className,
  style,
  children,
}: TagRootProps) {
  const striped = stripe ? ({ '--stripe': toneColour(stripe), ...style } as CSSProperties) : style;
  return (
    <span
      {...toneProps(tone, color, striped)}
      data-umbra="tag"
      data-variant={variant}
      data-size={size}
      data-stripe={stripe ? '' : undefined}
      title={stripe ? stripeLabel : undefined}
      className={cx(shared.tone, styles.tag, className)}
    >
      {children}
      {stripe && stripeLabel && <span className={shared.srOnly}>({stripeLabel})</span>}
    </span>
  );
}

function TagIcon({ children }: { children?: ReactNode }) {
  return <IconSlot part="icon">{children}</IconSlot>;
}

function Label({ className, style, children }: BlockProps) {
  return (
    <span data-part="label" className={cx(styles.label, className)} style={style}>
      {children}
    </span>
  );
}

export interface TagRemoveProps {
  /** Accessible name of the button. */
  label: string;
  onPress?: () => void;
  className?: string;
  style?: CSSProperties;
}

function Remove({ label, onPress, className, style }: TagRemoveProps) {
  return (
    <button
      type="button"
      data-part="remove"
      aria-label={label}
      className={cx(styles.remove, className)}
      style={style}
      onClick={onPress}
    >
      <Icon name="close" />
    </button>
  );
}

export interface TagProps extends Omit<TagRootProps, 'children'> {
  /** The label. */
  children?: ReactNode;
  /** A leading icon, avatar or flag. */
  icon?: ReactNode;
  /** Shows a remove button. */
  onRemove?: () => void;
  /** Accessible name of the remove button; a text label is added to it ("Remove Region 2"). */
  removeLabel?: string;
  /** Shows a placeholder of the tag's size. */
  loading?: boolean;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    label?: Part<{ children: ReactNode }>;
    remove?: Part<TagRemoveProps>;
    skeleton?: Part;
  };
}

/** A small label chip: a category, a status code or a value with an icon. */
export function Tag({
  children,
  icon,
  onRemove,
  removeLabel = 'Remove',
  loading = false,
  parts,
  ...root
}: TagProps) {
  if (loading) {
    return renderPart(parts?.skeleton, {}, () => (
      <span
        data-umbra="tag"
        data-loading=""
        className={cx(shared.skeleton, root.className)}
        style={root.style}
      >
        <Skeleton shape="block" />
      </span>
    ));
  }
  const name = typeof children === 'string' ? `${removeLabel} ${children}` : removeLabel;
  return (
    <Root {...root}>
      {icon && renderPart(parts?.icon, { children: icon }, (p) => <TagIcon>{p.children}</TagIcon>)}
      {renderPart(parts?.label, { children }, (p) => (
        <Label>{p.children}</Label>
      ))}
      {onRemove && renderPart(parts?.remove, { label: name, onPress: onRemove }, (p) => <Remove {...p} />)}
    </Root>
  );
}

Tag.Root = Root;
Tag.Icon = TagIcon;
Tag.Label = Label;
Tag.Remove = Remove;
