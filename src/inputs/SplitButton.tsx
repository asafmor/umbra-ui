import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { ButtonBase, Spinner, type ButtonVariant } from '../basics/Button';
import buttonStyles from '../basics/Button.module.css';
import { OverflowMenuContext } from '../internal/contexts';
import { Menu, type MenuEntry } from '../overlays/Menu';
import type { OverlayPlacement } from '../overlays/shared';
import { Icon, IconSlot } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './SplitButton.module.css';
import { useFieldControl } from './useField';

interface Shared {
  variant: ButtonVariant;
  size: 'default' | 'small';
  disabled: boolean;
}

const Context = createContext<Shared | null>(null);
function useSplit(block: string) {
  const shared = useContext(Context);
  if (!shared) throw new Error(`SplitButton.${block} must be rendered inside SplitButton.Root.`);
  return shared;
}

export interface SplitButtonRootProps {
  /** The look of both halves: the variants of `Button`. */
  variant?: ButtonVariant | undefined;
  /** `small` is for use inside table cells. Otherwise the height follows the density level. */
  size?: 'default' | 'small' | undefined;
  /** Disables the action and the menu. */
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  /** Names the pair, when the action's own text is not enough. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** The group that joins the two buttons. Among actions in an overflow menu it draws nothing itself. */
function Root({
  variant = 'neutral',
  size = 'default',
  disabled,
  fullWidth,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: SplitButtonRootProps) {
  const inMenu = useContext(OverflowMenuContext);
  const control = useFieldControl({ disabled });
  const content = <Context value={{ variant, size, disabled: control.disabled }}>{children}</Context>;
  // In an overflow menu the action is a row and the menu a submenu row after it.
  if (inMenu) return content;
  return (
    <div
      // The field's label points here; the id and the state tell a checker whose label it is.
      id={control.id}
      role="group"
      aria-disabled={control.disabled || undefined}
      data-umbra="split-button"
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : control.labelledBy}
      aria-describedby={control.describedBy}
      className={cx(styles.root, className)}
      style={style}
    >
      {content}
    </div>
  );
}

export interface SplitButtonActionProps {
  /** The label. */
  children?: ReactNode | undefined;
  iconStart?: ReactNode | undefined;
  /** Shows the spinner and blocks presses of the action. The menu stays usable. */
  loading?: boolean | undefined;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string | undefined;
  disabled?: boolean | undefined;
  /** Renders a link that looks like a button. */
  href?: string | undefined;
  /** Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. */
  shortcut?: string | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  onPress?: (() => void) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The main action: a `Button` in the group's variant and size. */
function Action({
  children,
  iconStart,
  loading = false,
  loadingLabel = 'Loading',
  disabled,
  shortcut,
  onPress,
  className,
  ...rest
}: SplitButtonActionProps) {
  const split = useSplit('Action');
  const off = split.disabled || !!disabled;
  useShortcut(shortcut, off || loading ? undefined : onPress);
  return (
    <ButtonBase
      {...rest}
      umbra="button"
      part="action"
      variant={split.variant}
      size={split.size}
      loading={loading}
      disabled={off}
      text={typeof children === 'string' ? children : undefined}
      shortcut={shortcut}
      onPress={onPress}
      className={cx(styles.action, className)}
    >
      {loading ? (
        <Spinner label={loadingLabel} />
      ) : (
        iconStart && <IconSlot part="iconStart">{iconStart}</IconSlot>
      )}
      <span data-part="label" className={buttonStyles.label}>
        {children}
      </span>
    </ButtonBase>
  );
}

export interface SplitButtonMenuProps {
  /** The related actions, as data: the entries `Menu` takes. */
  items?: MenuEntry[] | undefined;
  /** The related actions, as `Menu.Item`, `Menu.Section`, `Menu.Separator` and `Menu.Sub` blocks. */
  children?: ReactNode | undefined;
  /** Called with the id of the row the user chose. */
  onAction?: ((id: string) => void) | undefined;
  /** The accessible name and tooltip of the caret button, and the name of its menu. */
  label?: string | undefined;
  /** Replaces the caret icon. */
  caret?: ReactNode | undefined;
  /** Side of the caret and alignment along it. */
  placement?: OverlayPlacement | undefined;
  /** Controlled state of the menu. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The caret button and the `Menu` it opens. */
function SplitMenu({
  items,
  children,
  label = 'More options',
  caret,
  placement = 'bottom end',
  className,
  style,
  ...menu
}: SplitButtonMenuProps) {
  const split = useSplit('Menu');
  const inMenu = useContext(OverflowMenuContext);
  return (
    <Menu
      {...menu}
      items={items}
      placement={placement}
      trigger={
        <ButtonBase
          umbra="button"
          part="caret"
          variant={split.variant}
          size={split.size}
          iconOnly={!inMenu}
          label={label}
          text={label}
          // A disabled button with a tooltip is wrapped in a stand-in, which would part the two halves.
          tooltip={split.disabled ? null : label}
          disabled={split.disabled}
          className={cx(styles.caret, className)}
          style={style}
        >
          {inMenu ? (
            <span className={buttonStyles.label}>{label}</span>
          ) : caret === undefined ? (
            <Icon name="chevronDown" />
          ) : (
            caret
          )}
        </ButtonBase>
      }
    >
      {children}
    </Menu>
  );
}

export interface SplitButtonProps
  extends Omit<SplitButtonRootProps, 'children'>, Omit<SplitButtonActionProps, 'className' | 'style'> {
  /** The related actions: the entries `Menu` takes (rows, sections, separators, submenus). */
  items?: MenuEntry[] | undefined;
  /** Called with the id of the menu row the user chose. */
  onAction?: ((id: string) => void) | undefined;
  /** The accessible name and tooltip of the caret button. */
  menuLabel?: string | undefined;
  menuPlacement?: OverlayPlacement | undefined;
  /** Controlled state of the menu. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        action?: Part<SplitButtonActionProps> | undefined;
        menu?: Part<SplitButtonMenuProps> | undefined;
        iconStart?: Part<{ children: ReactNode }> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        /** The icon of the caret button. */
        caret?: Part | undefined;
      }
    | undefined;
}

/**
 * A main action with a caret beside it that opens a menu of related actions. One control to look at,
 * two buttons to use: each is a tab stop.
 */
export function SplitButton({
  variant,
  size,
  disabled,
  fullWidth,
  'aria-label': ariaLabel,
  className,
  style,
  items,
  onAction,
  menuLabel,
  menuPlacement,
  open,
  defaultOpen,
  onOpenChange,
  parts,
  children,
  iconStart,
  ...action
}: SplitButtonProps) {
  return (
    <Root
      variant={variant}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {renderPart(
        parts?.action,
        {
          ...action,
          iconStart: renderPart(parts?.iconStart, { children: iconStart }, (p) => p.children),
          children: renderPart(parts?.label, { children }, (p) => p.children),
        },
        (p) => (
          <Action {...p} />
        ),
      )}
      {renderPart(
        parts?.menu,
        {
          items,
          onAction,
          label: menuLabel,
          placement: menuPlacement,
          open,
          defaultOpen,
          onOpenChange,
          caret: renderPart(parts?.caret, {}, () => undefined),
        },
        (p) => (
          <SplitMenu {...p} />
        ),
      )}
    </Root>
  );
}

SplitButton.Root = Root;
SplitButton.Action = Action;
SplitButton.Menu = SplitMenu;
