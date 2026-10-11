import { useContext, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  ProgressBar as AriaProgressBar,
} from 'react-aria-components';
import { ForceCollapseContext, OverflowMenuContext } from '../internal/contexts';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { Tooltip } from '../overlays/Tooltip';
import { Icon, IconSlot } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Button.module.css';
import { defined } from '../utils/defined';
import { rootRender, type RootAttributes } from '../utils/passThrough';

export type ButtonVariant = 'primary' | 'accent' | 'neutral' | 'ghost' | 'danger';

interface BaseProps {
  variant: ButtonVariant;
  /** Icon-only look: square, no padding. */
  iconOnly?: boolean | undefined;
  shape?: 'square' | 'circle' | undefined;
  size?: 'default' | 'small' | undefined;
  fullWidth?: boolean | undefined;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  href?: string | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  /** Accessible name, when the visible content is not text. */
  label?: string | undefined;
  /** The label as text, for type-ahead when the button is a row of an overflow menu. */
  text?: string | undefined;
  pressed?: boolean | undefined;
  expanded?: boolean | undefined;
  /** The button opens a menu (`aria-haspopup`). While `expanded` it looks pressed. */
  popup?: boolean | undefined;
  tooltip?: ReactNode | undefined;
  /** Id of a shortcut: its keys are shown in the tooltip, or at the end of the row in an overflow menu. */
  shortcut?: string | undefined;
  /** `pointerType` says how it was pressed: `keyboard` and `virtual` are not a pointer. */
  onPress?: ((event: { pointerType: string }) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  elementRef?: React.RefObject<HTMLElement | null> | undefined;
  umbra: string;
  /** `data-part`, when the button is a named piece of another component (`SplitButton`). */
  part?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children: ReactNode;
}

/**
 * Internal: the element, states and tooltip shared by `Button` and `IconButton`. Among actions that
 * moved into an overflow menu it is a menu item: a toggle becomes a checkbox item, a link stays a link.
 */
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
  text,
  pressed,
  expanded,
  popup,
  tooltip,
  shortcut,
  onPress,
  onKeyDown,
  elementRef,
  umbra,
  part,
  className,
  style,
  children,
  ...rest
}: BaseProps) {
  const row = useContext(OverflowMenuContext);
  if (row) {
    return row({
      label,
      text,
      href,
      disabled: disabled || loading,
      pressed,
      shortcut,
      onPress: onPress && (() => onPress({ pointerType: 'virtual' })),
      className: styles.row,
      children,
    });
  }
  const shared = {
    'data-umbra': umbra,
    'data-part': part,
    'data-variant': variant,
    'data-size': size,
    'data-shape': shape,
    'data-icon-only': iconOnly || undefined,
    'data-full-width': fullWidth || undefined,
    'aria-label': label,
    className: cx(styles.button, className),
    style,
    isDisabled: disabled,
  };
  const element = href ? (
    <AriaLink
      {...rootRender('a', rest)}
      {...defined(shared)}
      ref={elementRef as React.RefObject<HTMLAnchorElement>}
      href={href}
      {...defined({ onPress })}
    >
      {children}
    </AriaLink>
  ) : (
    <AriaButton
      {...rootRender('button', rest)}
      {...defined(shared)}
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      type={type}
      isPending={loading}
      {...defined({
        'aria-pressed': pressed,
        'aria-expanded': expanded,
        'aria-haspopup': popup ? ('true' as const) : undefined,
        onPress,
        onKeyDown,
      })}
    >
      {children}
    </AriaButton>
  );
  return (
    <Tooltip content={tooltip} shortcut={shortcut}>
      {element}
    </Tooltip>
  );
}

/**
 * Internal: the spinner of a loading button. It is a named progress element, which the button adds to
 * its own name while it is pending, so a screen reader hears that it is busy.
 */
export function Spinner({ label }: { label: string }) {
  return (
    <AriaProgressBar isIndeterminate aria-label={label} {...defined({ className: styles.spinner })}>
      <Icon name="spinner" spin part="spinner" />
    </AriaProgressBar>
  );
}

export interface ButtonProps extends RootAttributes {
  /** The label. */
  children?: ReactNode | undefined;
  /** `primary`: the single main action of a screen. `accent`: the confirming action of a group. */
  variant?: ButtonVariant | undefined;
  iconStart?: ReactNode | undefined;
  iconEnd?: ReactNode | undefined;
  /** `small` is for use inside table cells. Otherwise the height follows the density level. */
  size?: 'default' | 'small' | undefined;
  /** Shows the spinner and blocks presses. The button stays focusable. */
  loading?: boolean | undefined;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string | undefined;
  disabled?: boolean | undefined;
  /** Renders a link that looks like a button. */
  href?: string | undefined;
  /** Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. */
  shortcut?: string | undefined;
  fullWidth?: boolean | undefined;
  /** With an icon set, hides the label when the button does not fit; the label becomes its tooltip and name. */
  collapseTo?: 'icon' | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  onPress?: (() => void) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        iconStart?: Part<{ children: ReactNode }> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        iconEnd?: Part<{ children: ReactNode }> | undefined;
        spinner?: Part | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** Triggers an action. Text, with an optional icon. */
export function Button({
  children,
  variant = 'neutral',
  iconStart,
  iconEnd,
  shortcut,
  collapseTo,
  loadingLabel = 'Loading',
  onPress,
  parts,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const inMenu = useContext(OverflowMenuContext);
  const canCollapse = collapseTo === 'icon' && !!(iconStart || iconEnd) && !inMenu;
  const forced = useContext(ForceCollapseContext);
  const collapsed = useShrinkLevel(ref, canCollapse ? 1 : 0) === 1 || (canCollapse && forced);
  useShortcut(shortcut, rest.disabled || rest.loading ? undefined : onPress);
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
      text={typeof children === 'string' ? children : undefined}
      tooltip={collapsed ? children : null}
      shortcut={shortcut}
      onPress={onPress}
    >
      {rest.loading
        ? renderPart(parts?.spinner, {}, () => <Spinner label={loadingLabel} />)
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
