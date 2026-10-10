import { useContext, type CSSProperties, type ReactNode } from 'react';
import { OverflowMenuContext } from '../internal/contexts';
import { IconSlot } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { renderPart, type Part } from '../utils/parts';
import { ButtonBase, Spinner, type ButtonVariant } from './Button';
import styles from './Button.module.css';

export interface IconButtonProps {
  icon: ReactNode;
  /** Required. The accessible name and the tooltip text. */
  label: string;
  variant?: ButtonVariant;
  shape?: 'square' | 'circle';
  /** Makes it a toggle (for example a star). */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** A count, or `true` for a dot, at the corner. */
  badge?: number | true;
  /** Shows `label` on hover and focus. A node replaces the text. */
  tooltip?: boolean | ReactNode;
  /** Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. */
  shortcut?: string;
  disabled?: boolean;
  loading?: boolean;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string;
  onPress?: () => void;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    badge?: Part<{ children: ReactNode }>;
    /** The tooltip's text. The key hint of `shortcut` is added after it. */
    tooltip?: Part<{ children: ReactNode }>;
  };
  className?: string;
  style?: CSSProperties;
}

/** A button that shows only an icon. Inside an overflow menu it becomes a menu item with its icon and label. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  shape = 'square',
  pressed,
  onPressedChange,
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
        renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>)
      )}
      {inMenu && <span className={styles.label}>{label}</span>}
      {badge !== undefined &&
        renderPart(parts?.badge, { children: badge === true ? null : badge }, (p) => (
          <span
            aria-hidden="true"
            data-part="badge"
            data-dot={badge === true || undefined}
            // A count is drawn by CSS from this attribute: it is already part of the button's name, and as
            // text in the button it would read as a visible label that the name does not start with.
            data-count={typeof p.children === 'number' ? p.children : undefined}
            className={styles.badge}
          >
            {typeof p.children === 'number' ? null : p.children}
          </span>
        ))}
    </ButtonBase>
  );
}
