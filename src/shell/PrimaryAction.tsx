import { useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';
import { Spinner } from '../basics/Button';
import { ForceCollapseContext } from '../internal/contexts';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { Menu, type MenuEntry } from '../overlays/Menu';
import { Tooltip } from '../overlays/Tooltip';
import { Icon, IconSlot } from '../provider/icons';
import sharedStyles from '../data/shared.module.css';
import { useShortcut } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './PrimaryAction.module.css';
import { defined } from '../utils/defined';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export interface PrimaryActionProps extends RootAttributes {
  /** What the action does now. It changes with the state of the app ("Continue", "Review 3 items"). */
  label: string;
  /** A second, smaller line under the label. */
  description?: ReactNode | undefined;
  /** Shown at the end of the button, and alone when the button collapses. */
  icon?: ReactNode | undefined;
  /** Puts the icon before the label. */
  iconPosition?: 'start' | 'end' | undefined;
  onPress?: (() => void) | undefined;
  /** Renders a link. */
  href?: string | undefined;
  /** Shows the spinner and blocks presses. The button stays focusable. */
  loading?: boolean | undefined;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string | undefined;
  disabled?: boolean | undefined;
  /** Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. */
  shortcut?: string | undefined;
  /** A count beside the label, for example the items that wait for the user. */
  badge?: number | undefined;
  /** Marks that the app needs the user before it can go on: a still marker, never a pulse. */
  attention?: boolean | undefined;
  /** What a screen reader hears for the `attention` marker. */
  attentionLabel?: string | undefined;
  /** Alternative actions. They open from a caret at the end of the button. */
  menu?: MenuEntry[] | undefined;
  /** Called with the id of the chosen alternative. */
  onMenuAction?: ((id: string) => void) | undefined;
  /** Accessible name of the caret that opens `menu`. */
  menuLabel?: string | undefined;
  /** Shows the icon only. Set by the `TopBar` when it runs out of room; the button also does it by itself. */
  collapsed?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        description?: Part<{ children: ReactNode }> | undefined;
        badge?: Part<{ children: number }> | undefined;
        attention?: Part | undefined;
        spinner?: Part | undefined;
        menuTrigger?: Part | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * The one primary action of the app, at the end of the `TopBar`. Its label follows the state of the
 * app. It fills the height of the bar and shows its icon only when the bar runs out of room.
 */
export function PrimaryAction({
  label,
  description,
  icon,
  iconPosition = 'end',
  onPress,
  href,
  loading = false,
  loadingLabel = 'Loading',
  disabled = false,
  shortcut,
  badge,
  attention = false,
  attentionLabel = 'Needs attention',
  menu,
  onMenuAction,
  menuLabel = 'More actions',
  collapsed: collapsedProp,
  parts,
  className,
  style,
  ...rest
}: PrimaryActionProps) {
  const root = useRef<HTMLDivElement>(null);
  const forced = useContext(ForceCollapseContext);
  // Shrink steps of its own: 1 the description hides, 2 the label hides (only with an icon to keep).
  const hasDescription = description !== undefined && description !== null && description !== false;
  const max = (hasDescription ? 1 : 0) + (icon ? 1 : 0);
  // One more step after those: the label truncates. It is a step, not the resting state: an action with
  // nothing to hide used to count as "out of steps" at once, which dropped its minimum width.
  const level = useShrinkLevel(root, max + 1);
  const collapsed = !!icon && (collapsedProp ?? (forced || level >= max));
  const showDescription = hasDescription && !collapsed && level === 0;
  useShortcut(shortcut, disabled || loading ? undefined : onPress);

  const hasBadge = badge !== undefined && badge > 0;
  // The count and the marker's text are part of the content, so they are part of the name.
  const name = [label, hasBadge && badge, attention && attentionLabel].filter(Boolean).join(' ');
  const iconNode = loading
    ? renderPart(parts?.spinner, {}, () => <Spinner label={loadingLabel} />)
    : renderPart(
        parts?.icon,
        { children: icon },
        (p) => p.children && <IconSlot part="icon">{p.children}</IconSlot>,
      );
  const content = (
    <>
      {iconPosition === 'start' && iconNode}
      {!collapsed && (
        <span className={styles.text}>
          {renderPart(parts?.label, { children: label }, (p) => (
            <span data-part="label" className={styles.label}>
              {p.children}
            </span>
          ))}
          {showDescription &&
            renderPart(parts?.description, { children: description }, (p) => (
              <span data-part="description" className={styles.description}>
                {p.children}
              </span>
            ))}
        </span>
      )}
      {hasBadge &&
        renderPart(parts?.badge, { children: badge }, (p) => (
          <span data-part="badge" className={styles.badge}>
            {p.children}
          </span>
        ))}
      {attention &&
        !hasBadge &&
        renderPart(parts?.attention, {}, () => (
          <span data-part="attention" className={styles.attention}>
            <span className={sharedStyles.srOnly}>{attentionLabel}</span>
          </span>
        ))}
      {iconPosition === 'end' && iconNode}
    </>
  );
  const shared = {
    'data-part': 'button',
    // With the label hidden, the name is spelled out.
    'aria-label': collapsed ? name : undefined,
    className: styles.button,
    isDisabled: disabled,
    onPress,
  };
  return (
    <div
      {...passThrough(rest)}
      ref={root}
      data-umbra="primary-action"
      data-collapsed={collapsed || undefined}
      // With nothing left to hide, the label truncates.
      data-truncate={(level > max && !collapsed) || undefined}
      data-attention={attention || undefined}
      data-loading={loading || undefined}
      data-disabled={disabled || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      <Tooltip content={collapsed ? label : null} shortcut={shortcut} placement="bottom">
        {href && !disabled ? (
          <AriaLink {...defined(shared)} href={href}>
            {content}
          </AriaLink>
        ) : (
          <AriaButton {...defined(shared)} isPending={loading}>
            {content}
          </AriaButton>
        )}
      </Tooltip>
      {menu && menu.length > 0 && (
        <Menu
          items={menu}
          onAction={onMenuAction}
          placement="bottom end"
          trigger={
            <AriaButton
              data-part="menuTrigger"
              aria-label={menuLabel}
              isDisabled={disabled}
              {...defined({ className: styles.caret })}
            >
              {renderPart(parts?.menuTrigger, {}, () => (
                <Icon name="chevronDown" />
              ))}
            </AriaButton>
          }
        />
      )}
    </div>
  );
}
