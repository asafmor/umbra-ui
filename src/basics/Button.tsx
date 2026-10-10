import { useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';
import { ForceCollapseContext, OverflowMenuContext, Tip } from '../internal/overlays';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { Icon, IconSlot } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'accent' | 'neutral' | 'ghost' | 'danger';

interface BaseProps {
  variant: ButtonVariant;
  /** Icon-only look: square, no padding. */
  iconOnly?: boolean;
  shape?: 'square' | 'circle';
  size?: 'default' | 'small';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  /** Accessible name, when the visible content is not text. */
  label?: string;
  pressed?: boolean;
  expanded?: boolean;
  tooltip?: ReactNode;
  onPress?: () => void;
  elementRef?: React.RefObject<HTMLElement | null>;
  umbra: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Internal: the element, states and tooltip shared by `Button` and `IconButton`. */
export function ButtonBase({
  variant,
  iconOnly,
  shape,
  size = 'default',
  fullWidth,
  loading = false,
  disabled = false,
  href,
  type = 'button',
  label,
  pressed,
  expanded,
  tooltip,
  onPress,
  elementRef,
  umbra,
  className,
  style,
  children,
}: BaseProps) {
  const menu = useContext(OverflowMenuContext);
  const inMenu = !!menu;
  const press = () => {
    onPress?.();
    menu?.close();
  };
  const shared = {
    'data-umbra': umbra,
    'data-variant': inMenu ? 'ghost' : variant,
    'data-size': size,
    'data-shape': shape,
    'data-icon-only': (iconOnly && !inMenu) || undefined,
    'data-full-width': fullWidth || inMenu || undefined,
    'data-in-menu': inMenu || undefined,
    'aria-label': label,
    className: cx(styles.button, className),
    style,
    isDisabled: disabled,
  };
  const element = href ? (
    <AriaLink
      {...shared}
      ref={elementRef as React.RefObject<HTMLAnchorElement>}
      href={href}
      onPress={onPress}
    >
      {children}
    </AriaLink>
  ) : (
    <AriaButton
      {...shared}
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      type={type}
      isPending={loading}
      aria-pressed={pressed}
      aria-expanded={expanded}
      onPress={press}
    >
      {children}
    </AriaButton>
  );
  return <Tip content={inMenu ? null : tooltip}>{element}</Tip>;
}

/** Internal: tooltip content with an optional key hint. */
export function tipWithHint(text: ReactNode, hint: string | undefined) {
  if (!text && !hint) return null;
  return (
    <>
      {text}
      {hint && <kbd>{hint}</kbd>}
    </>
  );
}

export interface ButtonProps {
  /** The label. */
  children?: ReactNode;
  /** `primary`: the single main action of a screen. `accent`: the confirming action of a group. */
  variant?: ButtonVariant;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  /** `small` is for use inside table cells. Otherwise the height follows the density level. */
  size?: 'default' | 'small';
  /** Shows the spinner and blocks presses. The button stays focusable. */
  loading?: boolean;
  disabled?: boolean;
  /** Renders a link that looks like a button. */
  href?: string;
  /** Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. */
  shortcut?: string;
  fullWidth?: boolean;
  /** With an icon set, hides the label when the button does not fit; the label becomes its tooltip and name. */
  collapseTo?: 'icon';
  type?: 'button' | 'submit' | 'reset';
  onPress?: () => void;
  /** Replace or hide named pieces. */
  parts?: {
    iconStart?: Part<{ children: ReactNode }>;
    label?: Part<{ children: ReactNode }>;
    iconEnd?: Part<{ children: ReactNode }>;
    spinner?: Part;
  };
  className?: string;
  style?: CSSProperties;
}

/** Triggers an action. Text, with an optional icon. */
export function Button({
  children,
  variant = 'neutral',
  iconStart,
  iconEnd,
  shortcut,
  collapseTo,
  onPress,
  parts,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const inMenu = !!useContext(OverflowMenuContext);
  const canCollapse = collapseTo === 'icon' && !!(iconStart || iconEnd) && !inMenu;
  const forced = useContext(ForceCollapseContext);
  const collapsed = useShrinkLevel(ref, canCollapse ? 1 : 0) === 1 || (canCollapse && forced);
  const hint = useShortcut(shortcut, rest.disabled || rest.loading ? undefined : onPress);
  const icon = (part: 'iconStart' | 'iconEnd', node: ReactNode) =>
    renderPart(
      parts?.[part],
      { children: node },
      (p) => p.children && <IconSlot part={part}>{p.children}</IconSlot>,
    );
  return (
    <ButtonBase
      {...rest}
      umbra="button"
      variant={variant}
      iconOnly={collapsed}
      elementRef={ref}
      label={collapsed && typeof children === 'string' ? children : undefined}
      tooltip={tipWithHint(collapsed ? children : null, hint)}
      onPress={onPress}
    >
      {rest.loading
        ? renderPart(parts?.spinner, {}, () => <Icon name="spinner" spin part="spinner" />)
        : icon('iconStart', iconStart)}
      {!collapsed &&
        renderPart(parts?.label, { children }, (p) => (
          <span data-part="label" data-fixed={canCollapse || undefined} className={styles.label}>
            {p.children}
          </span>
        ))}
      {icon('iconEnd', iconEnd)}
    </ButtonBase>
  );
}
