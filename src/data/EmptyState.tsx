import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { BareIcon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './EmptyState.module.css';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface EmptyStateRootProps extends BlockProps {
  /** `block` is centred in its slot; `inline` is one line of text. */
  variant?: 'block' | 'inline';
  /** `error` marks a failure: a danger-coloured icon, the built-in one unless `icon` is given. */
  tone?: 'neutral' | 'error';
  /** `alert` announces the content when it appears (for an error); `status` announces it politely. */
  role?: 'alert' | 'status';
  /** The part this state plays in the component that shows it (`empty`, `error`). */
  'data-part'?: string;
}

/** True when the content is wider or taller than the element. */
const overflows = (el: HTMLElement) =>
  el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;

function Root({
  variant = 'block',
  tone = 'neutral',
  role,
  'data-part': part,
  className,
  style,
  children,
}: EmptyStateRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  // `useShrinkLevel` starts again when the element gets wider; a block also has to when it gets taller.
  const [grown, setGrown] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let height = el.offsetHeight;
    const observer = new ResizeObserver(() => {
      if (el.offsetHeight > height + 0.5) setGrown((n) => n + 1);
      height = el.offsetHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // Level 1 hides the icon, level 2 the description; the CSS reads the level, so hand-composed blocks shrink too.
  const level = useShrinkLevel(ref, 2, grown, { overflowing: overflows });
  return (
    <div
      ref={ref}
      role={role}
      data-umbra="empty-state"
      data-part={part}
      data-variant={variant}
      data-tone={tone}
      data-shrink={level || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      {children}
    </div>
  );
}

function Icon({ className, style, children }: BlockProps) {
  return (
    <span data-part="icon" className={cx(styles.icon, className)} style={style}>
      <IconSlot>{children}</IconSlot>
    </span>
  );
}

function Title({ className, style, children }: BlockProps) {
  return (
    <div data-part="title" className={cx(styles.title, className)} style={style}>
      {children}
    </div>
  );
}

function Description({ className, style, children }: BlockProps) {
  return (
    <div data-part="description" className={cx(styles.description, className)} style={style}>
      {children}
    </div>
  );
}

function Action({ className, style, children }: BlockProps) {
  return (
    <div data-part="action" className={cx(styles.action, className)} style={style}>
      {children}
    </div>
  );
}

export interface EmptyStateProps extends Omit<EmptyStateRootProps, 'children'> {
  /** The short statement: "No orders". */
  title?: ReactNode;
  /** One or two sentences that explain the state or say what to do. */
  description?: ReactNode;
  /** Decorative icon. Hides first when space is short. */
  icon?: ReactNode;
  /** A control that resolves the state, for example a `Button`. */
  action?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    title?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
    action?: Part<{ children: ReactNode }>;
  };
}

/** Says that a region has nothing to show, or failed to load, and what to do about it. */
export function EmptyState({ title, description, icon, action, parts, ...root }: EmptyStateProps) {
  // An error always carries a mark that is not colour; `icon={null}` leaves it out.
  const shown = icon === undefined && root.tone === 'error' ? <BareIcon name="danger" /> : icon;
  return (
    <Root {...root}>
      {shown && renderPart(parts?.icon, { children: shown }, (p) => <Icon>{p.children}</Icon>)}
      {title && renderPart(parts?.title, { children: title }, (p) => <Title>{p.children}</Title>)}
      {description &&
        renderPart(parts?.description, { children: description }, (p) => (
          <Description>{p.children}</Description>
        ))}
      {action && renderPart(parts?.action, { children: action }, (p) => <Action>{p.children}</Action>)}
    </Root>
  );
}

EmptyState.Root = Root;
EmptyState.Icon = Icon;
EmptyState.Title = Title;
EmptyState.Description = Description;
EmptyState.Action = Action;
