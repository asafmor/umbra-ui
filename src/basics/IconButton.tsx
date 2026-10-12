import { useContext, type CSSProperties, type ReactNode } from 'react';
import { Badge } from '../data/Badge';
import { OverflowMenuContext } from '../internal/contexts';
import { IconSlot } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { renderPart, type Part } from '../utils/parts';
import { ButtonBase, Spinner, type ButtonVariant } from './Button';
import styles from './Button.module.css';
import { type RootAttributes } from '../utils/passThrough';

export interface IconButtonProps extends RootAttributes {
  icon: ReactNode;
  /** Required. The accessible name and the tooltip text. */
  label: string;
  variant?: ButtonVariant | undefined;
  shape?: 'square' | 'circle' | undefined;
  /**
   * Makes it a toggle (for example a star). While `true` the icon takes the accent colour and is drawn
   * filled; a `ghost` toggle has no outline.
   */
  pressed?: boolean | undefined;
  onPressedChange?: ((pressed: boolean) => void) | undefined;
  /**
   * The icon while `pressed`, in place of `icon` drawn filled: for an icon that is not one closed
   * shape, or a set that has its own filled glyphs.
   */
  pressedIcon?: ReactNode | undefined;
  /** A count, or `true` for a dot, at the corner. */
  badge?: number | true | undefined;
  /** Shows `label` on hover and focus. A node replaces the text. */
  tooltip?: boolean | ReactNode | undefined;
  /** Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. */
  shortcut?: string | undefined;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string | undefined;
  onPress?: (() => void) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        badge?: Part<{ children: ReactNode }> | undefined;
        /** The tooltip's text. The key hint of `shortcut` is added after it. */
        tooltip?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** A button that shows only an icon. Inside an overflow menu it becomes a menu item with its icon and label. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  shape = 'square',
  pressed,
  onPressedChange,
  pressedIcon,
  badge,
  tooltip = true,
  shortcut,
  loadingLabel = 'Loading',
  onPress,
  parts,
  ...rest
}: IconButtonProps) {
  const inMenu = useContext(OverflowMenuContext);
  const press = () => {
    onPress?.();
    if (pressed !== undefined) onPressedChange?.(!pressed);
  };
  useShortcut(shortcut, rest.disabled || rest.loading ? undefined : press);
  const tipText = tooltip === true ? label : tooltip;
  return (
    <ButtonBase
      {...rest}
      umbra="icon-button"
      variant={variant}
      shape={shape}
      iconOnly
      pressed={pressed}
      label={typeof badge === 'number' ? `${label} (${badge})` : label}
      text={label}
      tooltip={
        tipText === false ? null : renderPart(parts?.tooltip, { children: tipText }, (p) => p.children)
      }
      shortcut={tipText === false ? undefined : shortcut}
      onPress={press}
    >
      {rest.loading ? (
        <Spinner label={loadingLabel} />
      ) : (
        renderPart(parts?.icon, { children: pressed && pressedIcon ? pressedIcon : icon }, (p) => (
          // The app's own pressed icon is drawn as it is.
          <IconSlot part="icon" filled={pressed && !pressedIcon}>
            {p.children}
          </IconSlot>
        ))
      )}
      {inMenu && <span className={styles.label}>{label}</span>}
      {badge !== undefined &&
        renderPart(parts?.badge, { children: badge === true ? null : badge }, (p) => (
          // The public `Badge`, at the corner. It is decorative: a count is already part of the button's
          // name, and as text in the button it would read as a visible label that the name does not
          // start with.
          <span aria-hidden="true" data-part="badge" className={styles.badge}>
            {typeof p.children === 'number' ? (
              <Badge count={p.children} showZero decorative />
            ) : p.children === null ? (
              <Badge dot decorative />
            ) : (
              <Badge.Root>
                <Badge.Indicator decorative>{p.children}</Badge.Indicator>
              </Badge.Root>
            )}
          </span>
        ))}
    </ButtonBase>
  );
}

/** A row of the "more" menu among actions that overflow (`ActionsOverflow`). */
IconButton.overflowsToMenu = true;
