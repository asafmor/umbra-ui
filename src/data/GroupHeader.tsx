import { createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ButtonBase } from '../basics/Button';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { ActionsOverflow, keepsControls, wrapsKept } from '../internal/ActionsOverflow';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './GroupHeader.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface GroupHeaderRootProps extends BlockProps, RootAttributes {
  /** Sticks to the top of the scroll area while its group scrolls. The header and its rows must share a parent element. */
  sticky?: boolean | undefined;
  /** `strip` is a full-width band (a date above its messages); `plain` has no fill (a label above a few rows). */
  variant?: 'strip' | 'plain' | undefined;
  /**
   * The title may truncate. The all-in-one component turns it off until everything that can hide has
   * hidden; a header composed by hand keeps the default.
   */
  truncate?: boolean | undefined;
  /** The element, for measuring. */
  ref?: React.Ref<HTMLDivElement> | undefined;
  /** Marks the group collapsed, for CSS. */
  collapsed?: boolean | undefined;
}

function Root({
  sticky,
  variant = 'strip',
  truncate = true,
  collapsed,
  ref,
  className,
  style,
  children,
  ...rest
}: GroupHeaderRootProps) {
  return (
    <div
      {...passThrough(rest)}
      ref={ref}
      data-umbra="group-header"
      data-variant={variant}
      data-sticky={sticky || undefined}
      data-truncate={truncate || undefined}
      data-collapsed={collapsed || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      {children}
    </div>
  );
}

export interface GroupHeaderTitleProps extends BlockProps {
  /** Heading level. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
}

function Title({ headingLevel = 3, className, style, children }: GroupHeaderTitleProps) {
  return createElement(
    `h${headingLevel}`,
    { 'data-part': 'title', className: cx(styles.title, className), style },
    children,
  );
}

function Count({ className, style, children }: BlockProps) {
  return (
    <span data-part="count" className={cx(styles.count, className)} style={style}>
      {children}
    </span>
  );
}

function Meta({ className, style, children }: BlockProps) {
  return (
    <span data-part="meta" className={cx(styles.meta, className)} style={style}>
      {children}
    </span>
  );
}

function Actions({ className, style, children }: BlockProps) {
  return (
    <div data-part="actions" className={cx(styles.actions, wrapsKept, className)} style={style}>
      {children}
    </div>
  );
}

export interface GroupHeaderToggleProps {
  collapsed: boolean;
  /** Accessible name. Name the group in it when a list has several ("Collapse Today"). */
  label: string;
  onPress: () => void;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Toggle({ collapsed, label, onPress, className, style }: GroupHeaderToggleProps) {
  // The button is drawn by `ButtonBase`, which passes no `data-part`: it is set on the element. A wrapper
  // would name the part too, but it changes how the button lies in a table cell.
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.setAttribute('data-part', 'toggle'));
  return (
    <ButtonBase
      umbra="icon-button"
      variant="ghost"
      size="small"
      iconOnly
      label={label}
      expanded={!collapsed}
      onPress={() => onPress()}
      elementRef={ref}
      className={cx(styles.toggle, className)}
      style={style}
    >
      <Icon name="chevronDown" />
    </ButtonBase>
  );
}

export interface GroupHeaderProps extends Omit<GroupHeaderRootProps, 'children' | 'truncate' | 'ref'> {
  /** The group's name. */
  title?: ReactNode | undefined;
  /** Leading icon. */
  icon?: ReactNode | undefined;
  /** Number of rows in the group, shown after the title. */
  count?: number | undefined;
  /** Trailing text, for example a total. Hides when the header is too narrow. */
  meta?: ReactNode | undefined;
  /** Trailing controls. They move into an overflow menu when they do not fit. */
  actions?: ReactNode | undefined;
  /** Accessible name of the overflow menu button. */
  moreLabel?: string | undefined;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** Adds a caret button that collapses the group. The app (or `List`) hides the rows. */
  collapsible?: boolean | undefined;
  /** Controlled collapse state. */
  collapsed?: boolean | undefined;
  defaultCollapsed?: boolean | undefined;
  onCollapsedChange?: ((collapsed: boolean) => void) | undefined;
  /** Accessible names of the caret. With a text `title`, the title is added: "Collapse Today". */
  collapseLabel?: string | undefined;
  expandLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        toggle?: Part<GroupHeaderToggleProps> | undefined;
        icon?: Part<{ children: ReactNode }> | undefined;
        title?: Part<GroupHeaderTitleProps> | undefined;
        count?: Part<{ children: number }> | undefined;
        meta?: Part<{ children: ReactNode }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** A header row for one group of rows inside a list or table. */
export function GroupHeader({
  title,
  icon,
  count,
  meta,
  actions,
  headingLevel = 3,
  collapsible = false,
  collapsed: controlled,
  defaultCollapsed = false,
  onCollapsedChange,
  collapseLabel = 'Collapse',
  expandLabel = 'Expand',
  moreLabel = 'More actions',
  parts,
  ...root
}: GroupHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultCollapsed);
  const collapsed = collapsible && (controlled ?? uncontrolled);
  // Shrink order: the meta text hides, the actions move into an overflow menu, then the title truncates.
  const steps = (meta ? 1 : 0) + (actions ? 1 : 0);
  const level_ = useShrinkLevel(ref, steps);
  const inMenu = !!actions && level_ === steps;
  const name = typeof title === 'string' ? ` ${title}` : '';
  return (
    <Root
      {...root}
      // The last step, with actions: what stays of them may shrink and wrap (`wrapsKept`).
      {...(inMenu && keepsControls(actions) && { 'data-wrap': '' })}
      ref={ref}
      collapsed={collapsed}
      truncate={level_ === steps}
    >
      {collapsible &&
        renderPart(
          parts?.toggle,
          {
            collapsed,
            label: (collapsed ? expandLabel : collapseLabel) + name,
            onPress: () => {
              setUncontrolled(!collapsed);
              onCollapsedChange?.(!collapsed);
            },
          },
          (p) => <Toggle {...p} />,
        )}
      {icon &&
        renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>)}
      {renderPart(parts?.title, { headingLevel, children: title }, (p) => (
        <Title {...p} />
      ))}
      {count !== undefined &&
        renderPart(parts?.count, { children: count }, (p) => <Count>{p.children}</Count>)}
      {meta && level_ < 1 && renderPart(parts?.meta, { children: meta }, (p) => <Meta>{p.children}</Meta>)}
      {actions &&
        renderPart(parts?.actions, { children: actions }, (p) => (
          <Actions>
            <ActionsOverflow shrunk={inMenu} label={moreLabel} size="small">
              {p.children}
            </ActionsOverflow>
          </Actions>
        ))}
    </Root>
  );
}

GroupHeader.Root = Root;
GroupHeader.Toggle = Toggle;
GroupHeader.Title = Title;
GroupHeader.Count = Count;
GroupHeader.Meta = Meta;
GroupHeader.Actions = Actions;
