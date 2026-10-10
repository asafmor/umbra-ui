import { useContext, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  ProgressBar as AriaProgressBar,
} from 'react-aria-components';
import { ForceCollapseContext, OverflowMenuContext } from '../internal/contexts';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { CheckMark, Hint } from '../overlays/Menu';
import menuStyles from '../overlays/Menu.module.css';
import { Tooltip } from '../overlays/Tooltip';
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
  /** The label as text, for type-ahead when the button is a row of an overflow menu. */
  text?: string;
  pressed?: boolean;
  expanded?: boolean;
  tooltip?: ReactNode;
  /** Id of a shortcut: its keys are shown in the tooltip, or at the end of the row in an overflow menu. */
  shortcut?: string;
  onPress?: () => void;
  elementRef?: React.RefObject<HTMLElement | null>;
  umbra: string;
  className?: string;
  style?: CSSProperties;
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
  tooltip,
  shortcut,
  onPress,
  elementRef,
  umbra,
  className,
  style,
  children,
}: BaseProps) {
  const inMenu = useContext(OverflowMenuContext);
  const id = useId();
  if (inMenu) {
    const item = (
      <AriaMenuItem
        id={id}
        aria-label={label}
        textValue={text ?? label ?? ''}
        href={disabled ? undefined : href}
        isDisabled={disabled || loading}
        onAction={onPress}
        data-part="item"
        className={cx(menuStyles.item, styles.row)}
      >
        {({ hasSubmenu }) => (
          <>
            {children}
            {shortcut && <Hint id={shortcut} />}
            {/* At the end of the row, so the icons of the rows stay in one column. */}
            {pressed !== undefined && <CheckMark shown={pressed} />}
            {hasSubmenu && <Icon name="chevronRight" part="submenuIndicator" />}
          </>
        )}
      </AriaMenuItem>
    );
    // A toggle is a checkbox item. Its state stays the button's own `pressed`.
    return pressed === undefined ? (
      item
    ) : (
      <AriaMenuSection
        selectionMode="multiple"
        selectedKeys={pressed ? [id] : []}
        className={menuStyles.section}
      >
        {item}
      </AriaMenuSection>
    );
  }
  const shared = {
    'data-umbra': umbra,
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
      onPress={onPress}
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
    <AriaProgressBar isIndeterminate aria-label={label} className={styles.spinner}>
      <Icon name="spinner" spin part="spinner" />
    </AriaProgressBar>
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
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string;
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
