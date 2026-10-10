import { useContext, type CSSProperties, type ReactNode } from 'react';
import { OverflowMenuContext } from '../internal/overlays';
import { Icon, IconSlot } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { renderPart, type Part } from '../utils/parts';
import { ButtonBase, tipWithHint, type ButtonVariant } from './Button';
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
  onPress?: () => void;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    badge?: Part<{ children: ReactNode }>;
    tooltip?: Part<{ children: ReactNode }>;
  };
  className?: string;
  style?: CSSProperties;
}

/** A button that shows only an icon. Inside an overflow menu it becomes a row with its icon and label. */
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
  onPress,
  parts,
  ...rest
}: IconButtonProps) {
  const inMenu = !!useContext(OverflowMenuContext);
  const press = () => {
    onPress?.();
    if (pressed !== undefined) onPressedChange?.(!pressed);
  };
  const hint = useShortcut(shortcut, rest.disabled || rest.loading ? undefined : press);
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
      tooltip={
        tipText === false
          ? null
          : renderPart(parts?.tooltip, { children: tipWithHint(tipText, hint) }, (p) => p.children)
      }
      onPress={press}
    >
      {rest.loading ? (
        <Icon name="spinner" spin />
      ) : (
        renderPart(parts?.icon, { children: icon }, (p) => <IconSlot>{p.children}</IconSlot>)
      )}
      {inMenu && <span className={styles.label}>{label}</span>}
      {badge !== undefined &&
        renderPart(parts?.badge, { children: badge === true ? null : badge }, (p) => (
          <span data-part="badge" data-dot={badge === true || undefined} className={styles.badge}>
            {p.children}
          </span>
        ))}
    </ButtonBase>
  );
}
