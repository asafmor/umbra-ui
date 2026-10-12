import {
  Children,
  Fragment,
  isValidElement,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Button as AriaButton, Link as AriaLink, Toolbar } from 'react-aria-components';
import { Badge } from '../data/Badge';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { Menu } from '../overlays/Menu';
import { Tooltip } from '../overlays/Tooltip';
import { IconSlot } from '../provider/icons';
import { useUmbra } from '../provider/UmbraProvider';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './ShortcutBar.module.css';
import { defined } from '../utils/defined';
import { rootRender, type RootAttributes } from '../utils/passThrough';

/** One pinned shortcut. */
export interface ShortcutBarItem {
  id: string;
  label: string;
  icon?: ReactNode | undefined;
  /** Makes it a link. */
  href?: string | undefined;
  onPress?: (() => void) | undefined;
  /** A count, or `true` for a dot. */
  badge?: number | true | undefined;
  disabled?: boolean | undefined;
}

export interface ShortcutBarItemProps extends Omit<ShortcutBarItem, 'label'> {
  /** The label, as text. */
  children: string;
}
// A block that only carries data: the bar reads its props, because an item that does not fit is drawn
// as a row of the "+N" menu instead.
const Item = (() => null) as (props: ShortcutBarItemProps) => null;

function toItems(children: ReactNode): ShortcutBarItem[] {
  return Children.toArray(children).flatMap((child): ShortcutBarItem[] => {
    if (!isValidElement<{ children?: ReactNode | undefined }>(child)) return [];
    if (child.type === Fragment) return toItems(child.props.children);
    if (child.type !== Item) return [];
    const { children: label, ...item } = child.props as ShortcutBarItemProps;
    return [{ ...item, label }];
  });
}

/** What the `item` part receives. */
export interface ShortcutBarItemPartProps {
  item: ShortcutBarItem;
  /** The label is hidden: the item shows its icon only. */
  iconOnly: boolean;
  /** The default content of the chip. */
  children: ReactNode;
}

export interface ShortcutBarProps extends RootAttributes {
  /** The shortcuts, as data. */
  items?: ShortcutBarItem[] | undefined;
  /** The shortcuts, as `ShortcutBar.Item` blocks. */
  children?: ReactNode | undefined;
  /** Plugs in the app's router link for items with `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  /**
   * `labels`: icon and label. `icons`: icons only, the label is the tooltip. `auto`: labels while they
   * fit, then icons, when every item has one.
   */
  mode?: 'labels' | 'icons' | 'auto' | undefined;
  /** The text of the overflow chip, from the number of items in its menu. */
  moreLabel?: ((count: number) => string) | undefined;
  /** Accessible name of the overflow chip and its menu, from the same number. */
  moreName?: ((count: number) => string) | undefined;
  /** Shows a button at the end for changing the shortcuts. */
  onEdit?: (() => void) | undefined;
  editLabel?: string | undefined;
  /** Accessible name of the toolbar. */
  'aria-label'?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        /** The content of a chip. */
        item?: Part<ShortcutBarItemPartProps> | undefined;
        /** The content of the overflow chip. */
        more?: Part<{ count: number; children: string }> | undefined;
        /** The icon of the edit button. */
        editIcon?: Part | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const plainLink = (props: LinkRenderProps) => <a {...props} />;

/**
 * The user's pinned shortcuts, at the end of the `SubNav`. One tab stop; arrow keys move between the
 * chips. Chips that do not fit move into a "+N" menu.
 */
export function ShortcutBar({
  items,
  children,
  renderLink = plainLink,
  mode = 'auto',
  moreLabel = (count) => `+${count}`,
  moreName = (count) => `${count} more shortcuts`,
  onEdit,
  editLabel = 'Edit shortcuts',
  'aria-label': ariaLabel = 'Shortcuts',
  parts,
  className,
  style,
  ...rest
}: ShortcutBarProps) {
  const { icons } = useUmbra();
  const list = useRef<HTMLDivElement>(null);
  const all = items ?? toItems(children);
  // Shrink steps: first the labels go (in `auto`, when every item has an icon), then the items move
  // into the menu one at a time, last first.
  const canDropLabels = mode === 'auto' && all.length > 0 && all.every((item) => !!item.icon);
  const labelSteps = canDropLabels ? 1 : 0;
  // The bar is as wide as what it shows, so it never grows by itself: it starts again from everything
  // visible when the room around it grows (its slot, or the bar that holds the slot).
  const level = useShrinkLevel(list, labelSteps + all.length, `${mode}:${all.length}`, {
    watch: (el) => {
      const slot = el.parentElement?.parentElement;
      return [slot, slot?.parentElement];
    },
  });
  const iconsOnly = mode === 'icons' || (canDropLabels && level >= 1);
  const visible = all.slice(0, all.length - Math.max(0, level - labelSteps));
  const moved = all.slice(visible.length);

  const badge = (item: ShortcutBarItem) =>
    item.badge !== undefined && (
      <Badge count={item.badge === true ? undefined : item.badge} dot={item.badge === true} />
    );
  const chip = (item: ShortcutBarItem) => {
    const iconOnly = iconsOnly && !!item.icon;
    const content = renderPart(
      parts?.item,
      {
        item,
        iconOnly,
        children: (
          <>
            {item.icon && <IconSlot part="icon">{item.icon}</IconSlot>}
            {!iconOnly && (
              <span data-part="label" className={styles.label}>
                {item.label}
              </span>
            )}
            {badge(item)}
          </>
        ),
      },
      (p) => p.children,
    );
    const shared = {
      'data-part': 'item',
      'data-icon-only': iconOnly || undefined,
      // With the label hidden, the name is spelled out; otherwise the content is the name.
      'aria-label': iconOnly
        ? [item.label, typeof item.badge === 'number' && item.badge].filter(Boolean).join(' ')
        : undefined,
      className: styles.chip,
      isDisabled: item.disabled,
      onPress: item.onPress,
    };
    return (
      <Tooltip key={item.id} content={iconOnly ? item.label : null} placement="bottom">
        {item.href && !item.disabled ? (
          <AriaLink
            {...defined(shared)}
            href={item.href}
            render={(dom) => renderLink(dom as LinkRenderProps) as ReactElement}
          >
            {content}
          </AriaLink>
        ) : (
          <AriaButton {...defined(shared)}>{content}</AriaButton>
        )}
      </Tooltip>
    );
  };

  return (
    <Toolbar
      {...rootRender('div', rest)}
      aria-label={ariaLabel}
      data-umbra="shortcut-bar"
      data-mode={iconsOnly ? 'icons' : 'labels'}
      data-overflow={moved.length || undefined}
      {...defined({ className: cx(styles.root, className), style })}
    >
      <div ref={list} data-part="list" className={styles.list}>
        {visible.map(chip)}
      </div>
      {moved.length > 0 && (
        <Menu
          items={moved.map((item) => ({
            id: item.id,
            label: (
              <span className={styles.row}>
                {item.label}
                {badge(item)}
              </span>
            ),
            textValue: item.label,
            icon: item.icon,
            href: item.href,
            disabled: item.disabled,
          }))}
          onAction={(id) => moved.find((item) => item.id === id)?.onPress?.()}
          renderLink={renderLink}
          placement="bottom end"
          trigger={
            <AriaButton
              data-part="more"
              aria-label={moreName(moved.length)}
              {...defined({ className: styles.chip })}
            >
              {renderPart(
                parts?.more,
                { count: moved.length, children: moreLabel(moved.length) },
                (p) => p.children,
              )}
            </AriaButton>
          }
        />
      )}
      {onEdit && (
        <Tooltip content={editLabel} placement="bottom">
          <AriaButton
            data-part="edit"
            data-icon-only=""
            aria-label={editLabel}
            {...defined({ className: styles.chip })}
            onPress={() => onEdit()}
          >
            <IconSlot>{renderPart(parts?.editIcon, {}, () => icons.edit)}</IconSlot>
          </AriaButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

ShortcutBar.Item = Item;
