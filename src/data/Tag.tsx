import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import { useHoverTip, useTruncatedTip } from '../internal/TruncatedText';
import { Icon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { IconPart, type IconPartProps } from './IconPart';
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
  /** What the stripe means: read by screen readers, and shown in a tooltip on hover and on keyboard focus. */
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
  const ref = useRef<HTMLSpanElement>(null);
  // The library tooltip, not `title`: it also shows while the remove button has keyboard focus. A
  // truncated label shows its own tooltip instead, so the two never overlap.
  const tip = useHoverTip(ref, stripe ? stripeLabel : undefined, (el) => {
    const label = el.querySelector<HTMLElement>('[data-part="label"]');
    return !label || label.scrollWidth <= label.clientWidth;
  });
  return (
    <>
      <span
        {...toneProps(tone, color, striped)}
        ref={ref}
        data-umbra="tag"
        data-variant={variant}
        data-size={size}
        data-stripe={stripe ? '' : undefined}
        className={cx(shared.tone, styles.tag, className)}
      >
        {children}
        {stripe && stripeLabel && <span className={shared.srOnly}>({stripeLabel})</span>}
      </span>
      {tip}
    </>
  );
}

function TagIcon(props: IconPartProps) {
  return <IconPart {...props} />;
}

function Label({ className, style, children }: BlockProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const tip = useTruncatedTip(ref, children);
  return (
    <>
      <span ref={ref} data-part="label" className={cx(styles.label, className)} style={style}>
        {children}
      </span>
      {tip}
    </>
  );
}

export interface TagRemoveProps {
  /** Accessible name of the button. */
  label: string;
  onPress?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Keeps the focus when the tag of this remove button is taken away: it moves to the remove button of
 * the next tag beside it, else of the previous one, else to the element that holds the tags.
 */
function keepFocusAfterRemoval(button: HTMLButtonElement) {
  const holder = button.closest('[data-umbra="tag"]')?.parentElement;
  if (!holder) return;
  // ponytail: looks at sibling tags only; tags wrapped one by one (list items) fall back to the holder.
  const buttons = [
    ...holder.querySelectorAll<HTMLElement>(':scope > [data-umbra="tag"] [data-part="remove"]'),
  ];
  const at = buttons.indexOf(button);
  const next = buttons[at + 1] ?? buttons[at - 1] ?? holder;
  requestAnimationFrame(() => {
    // Only when the app did remove the tag, and the focus fell to the page with it.
    if (button.isConnected || !next.isConnected) return;
    if (document.activeElement && document.activeElement !== document.body) return;
    if (next === holder && !holder.hasAttribute('tabindex')) holder.tabIndex = -1;
    next.focus();
  });
}

function Remove({ label, onPress, className, style }: TagRemoveProps) {
  return (
    <button
      type="button"
      data-part="remove"
      aria-label={label}
      className={cx(styles.remove, className)}
      style={style}
      onClick={(event) => {
        keepFocusAfterRemoval(event.currentTarget);
        onPress?.();
      }}
    >
      <Icon name="close" />
    </button>
  );
}

export interface TagProps extends Omit<TagRootProps, 'children'> {
  /** The label. Without one (`null`, `undefined` or an empty text) the tag shows `emptyLabel`. */
  children?: ReactNode;
  /** Shown when there is no label. */
  emptyLabel?: ReactNode;
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
  emptyLabel = '—',
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
        data-part="skeleton"
        data-loading=""
        className={cx(shared.skeleton, root.className)}
        style={root.style}
      >
        <Skeleton shape="block" />
      </span>
    ));
  }
  const name = typeof children === 'string' ? `${removeLabel} ${children}` : removeLabel;
  const label = children == null || children === '' ? emptyLabel : children;
  return (
    <Root {...root}>
      {icon && renderPart(parts?.icon, { children: icon }, (p) => <TagIcon>{p.children}</TagIcon>)}
      {renderPart(parts?.label, { children: label }, (p) => (
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
