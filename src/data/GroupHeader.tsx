import { createElement, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ButtonBase } from '../basics/Button';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { ActionsOverflow } from '../overlays/Menu';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './GroupHeader.module.css';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface GroupHeaderRootProps extends BlockProps {
  /** Sticks to the top of the scroll area while its group scrolls. The header and its rows must share a parent element. */
  sticky?: boolean;
  /** `strip` is a full-width band (a date above its messages); `plain` has no fill (a label above a few rows). */
  variant?: 'strip' | 'plain';
  /** Set by the all-in-one component: the title may truncate (everything that can hide has hidden). */
  truncate?: boolean;
  elementRef?: React.RefObject<HTMLDivElement | null>;
  /** Marks the group collapsed, for CSS. */
  collapsed?: boolean;
}

function Root({
  sticky,
  variant = 'strip',
  truncate = true,
  collapsed,
  elementRef,
  className,
  style,
  children,
}: GroupHeaderRootProps) {
  return (
    <div
      ref={elementRef}
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
  headingLevel?: 2 | 3 | 4 | 5 | 6;
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
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      {children}
    </div>
  );
}

export interface GroupHeaderToggleProps {
  collapsed: boolean;
  /** Accessible name. Name the group in it when a list has several ("Collapse Today"). */
  label: string;
  onPress: () => void;
}

function Toggle({ collapsed, label, onPress }: GroupHeaderToggleProps) {
  return (
    <ButtonBase
      umbra="icon-button"
      variant="ghost"
      size="small"
      iconOnly
      label={label}
      expanded={!collapsed}
      onPress={onPress}
      className={styles.toggle}
    >
      <Icon name="chevronDown" />
    </ButtonBase>
  );
}

export interface GroupHeaderProps extends Omit<GroupHeaderRootProps, 'children' | 'truncate' | 'elementRef'> {
  /** The group's name. */
  title?: ReactNode;
  /** Leading icon. */
  icon?: ReactNode;
  /** Number of rows in the group, shown after the title. */
  count?: number;
  /** Trailing text, for example a total. Hides when the header is too narrow. */
  meta?: ReactNode;
  /** Trailing controls. They move into an overflow menu when they do not fit. */
  actions?: ReactNode;
  /** Accessible name of the overflow menu button. */
  moreLabel?: string;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Adds a caret button that collapses the group. The app (or `List`) hides the rows. */
  collapsible?: boolean;
  /** Controlled collapse state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible names of the caret. With a text `title`, the title is added: "Collapse Today". */
  collapseLabel?: string;
  expandLabel?: string;
  /** Replace or hide named pieces. */
  parts?: {
    toggle?: Part<GroupHeaderToggleProps>;
    icon?: Part<{ children: ReactNode }>;
    title?: Part<GroupHeaderTitleProps>;
    count?: Part<{ children: number }>;
    meta?: Part<{ children: ReactNode }>;
    actions?: Part<{ children: ReactNode }>;
  };
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
    <Root {...root} elementRef={ref} collapsed={collapsed} truncate={level_ === steps}>
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
            {inMenu ? (
              <ActionsOverflow
                label={moreLabel}
                trigger={
                  <ButtonBase umbra="icon-button" variant="ghost" size="small" iconOnly label={moreLabel}>
                    <Icon name="more" />
                  </ButtonBase>
                }
              >
                {p.children}
              </ActionsOverflow>
            ) : (
              p.children
            )}
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
