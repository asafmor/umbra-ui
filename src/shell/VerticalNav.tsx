import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  createContext,
  Fragment,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { ButtonBase } from '../basics/Button';
import { ScrollArea } from '../layout/ScrollArea';
import { useSlot, type SlotProps } from '../layout/useSlot';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import type { NavLinkProps } from './nav';
import styles from './VerticalNav.module.css';

/** One entry. `items` inside an entry makes a group that opens and closes; groups do not nest. */
export interface VerticalNavItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
  /** A count or marker at the end of the row, for example a `Badge`. */
  badge?: ReactNode;
  disabled?: boolean;
  items?: VerticalNavItem[];
}

/** A heading over a run of entries. */
export interface VerticalNavSection {
  type: 'section';
  label: ReactNode;
  items: VerticalNavItem[];
}

interface NavContextValue {
  value: string | undefined;
  choose: (id: string) => void;
  renderLink: (props: NavLinkProps) => ReactNode;
  expanded: string[];
  expand: (id: string, open: boolean) => void;
  /** Icon-only rail: `user` by the prop or the toggle, `auto` because the slot is narrow. */
  rail: 'user' | 'auto' | null;
  toggleRail: () => void;
}
const NavContext = createContext<NavContextValue | null>(null);
function useNav() {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('VerticalNav blocks must be rendered inside <VerticalNav.Root>.');
  return nav;
}

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface VerticalNavRootProps extends BlockProps, SlotProps {
  /** The current item. */
  value?: string;
  /** Called with the id of the item the user chose. */
  onChange?: (id: string) => void;
  /** Plugs in the app's router link. Defaults to a plain `<a>`. */
  renderLink?: (props: NavLinkProps) => ReactNode;
  /** The open groups (controlled). */
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Icon-only rail (controlled). Each label stays as the accessible name of its item. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible name of the navigation landmark. */
  'aria-label'?: string;
}

const focusTargets = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[data-nav-focus]')];

function Root({
  value,
  onChange,
  renderLink = (props) => <a {...props} />,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  'aria-label': ariaLabel = 'Section navigation',
  className,
  style,
  children,
  ...slot
}: VerticalNavRootProps) {
  const { ref, props } = useSlot<HTMLElement>({ size: 'content', ...slot });
  const [innerExpanded, setInnerExpanded] = useState(defaultExpandedIds);
  const expanded = expandedIds ?? innerExpanded;
  const expand = (id: string, open: boolean) => {
    if (expanded.includes(id) === open) return;
    const next = open ? [...expanded, id] : expanded.filter((v) => v !== id);
    setInnerExpanded(next);
    onExpandedChange?.(next);
  };

  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const byUser = collapsed ?? innerCollapsed;
  // Narrower than the token width, the nav becomes a rail by itself, when every item has an icon to show.
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const below = parseFloat(getComputedStyle(element).getPropertyValue('--rail-below')) || 0;
      const everyIcon = !element.querySelector('[data-nav-focus]:not(:has([data-part="icon"]))');
      setNarrow(everyIcon && element.offsetWidth < below);
    };
    measure();
    // Before the next paint, so the labels are never seen squeezed.
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, children]);
  const rail = byUser ? 'user' : narrow ? 'auto' : null;

  // One tab stop in the list: the focused item, else the current one, else the first.
  useLayoutEffect(() => {
    const list = ref.current?.querySelector<HTMLElement>('[data-part="list"]');
    if (!list) return;
    const targets = focusTargets(list);
    const stop =
      targets.find((t) => t === document.activeElement) ??
      targets.find((t) => t.getAttribute('aria-current')) ??
      targets[0];
    for (const target of targets) target.tabIndex = target === stop ? 0 : -1;
  });

  const nav: NavContextValue = {
    value,
    choose: (id) => onChange?.(id),
    renderLink,
    expanded,
    expand,
    rail,
    toggleRail: () => {
      setInnerCollapsed(!byUser);
      onCollapsedChange?.(!byUser);
    },
  };
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      data-umbra="vertical-nav"
      data-collapsed={rail ?? undefined}
      className={cx(styles.root, className)}
      style={{ ...props.style, ...(rail === 'user' && { flexGrow: 0 }), ...style }}
    >
      <NavContext value={nav}>{children}</NavContext>
    </nav>
  );
}

function Header({ className, style, children }: BlockProps) {
  return (
    <div data-part="header" className={cx(styles.header, className)} style={style}>
      {children}
    </div>
  );
}

function Footer({ className, style, children }: BlockProps) {
  return (
    <div data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </div>
  );
}

/**
 * The list of items. It scrolls inside the nav when it is taller than its space. Up and Down move
 * between items, Home and End go to the ends; Right opens a group or enters it, Left closes it or
 * goes back to it.
 */
function List({ className, style, children }: BlockProps) {
  const nav = useNav();
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const targets = focusTargets(event.currentTarget);
    const from = document.activeElement as HTMLElement;
    const index = targets.indexOf(from);
    if (index < 0) return;
    let next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: targets.length - 1 }[event.key];
    const group = from.dataset.groupId;
    const open = from.getAttribute('aria-expanded');
    if (event.key === 'ArrowRight' && group !== undefined) {
      if (open === 'true') next = index + 1;
      else if (!from.hasAttribute('aria-disabled')) nav.expand(group, true);
    } else if (event.key === 'ArrowLeft') {
      if (group !== undefined && open === 'true') nav.expand(group, false);
      else {
        const parent = from.closest('[data-part="group"]')?.querySelector<HTMLElement>('[data-group-id]');
        if (parent && parent !== from) next = targets.indexOf(parent);
      }
    } else if (next === undefined) return;
    event.preventDefault();
    const target = next === undefined ? undefined : targets[Math.max(0, Math.min(targets.length - 1, next))];
    if (!target) return;
    for (const t of targets) t.tabIndex = t === target ? 0 : -1;
    target.focus();
  };
  return (
    <ScrollArea fade={false} className={styles.scroll}>
      <ul
        role="list"
        data-part="list"
        className={cx(styles.list, className)}
        style={style}
        onKeyDown={onKeyDown}
      >
        {children}
      </ul>
    </ScrollArea>
  );
}

export interface VerticalNavItemProps {
  id: string;
  icon?: ReactNode;
  href?: string;
  /** A count or marker at the end of the row. */
  badge?: ReactNode;
  disabled?: boolean;
  /** The label. */
  children?: ReactNode;
}

/** What a row shows: icon, label, badge. In the rail the label is hidden from sight only. */
function rowContent({ icon, badge, children }: VerticalNavItemProps) {
  return (
    <>
      {icon && <IconSlot part="icon">{icon}</IconSlot>}
      <span data-part="label" className={styles.label}>
        {children}
      </span>
      {badge != null && (
        <span data-part="badge" className={styles.badge}>
          {badge}
        </span>
      )}
    </>
  );
}

/** One item: a link, or a button when it has no `href`. */
function Item(props: VerticalNavItemProps) {
  const { id, href, disabled = false, children } = props;
  const nav = useNav();
  const common = {
    className: styles.link,
    'aria-current': nav.value === id ? ('page' as const) : undefined,
    // A disabled item does nothing but keeps its place in the arrow-key order.
    'aria-disabled': disabled || undefined,
    'data-nav-focus': '',
    tabIndex: -1,
    // The rail has no room for the label; a text label is also the hover hint.
    title: nav.rail && typeof children === 'string' ? children : undefined,
  };
  const choose = () => !disabled && nav.choose(id);
  return (
    <li data-part="item" className={styles.item}>
      {href && !disabled ? (
        nav.renderLink({ ...common, href, onClick: choose, children: rowContent(props) })
      ) : (
        <button type="button" {...common} onClick={choose}>
          {rowContent(props)}
        </button>
      )}
    </li>
  );
}

export interface VerticalNavGroupProps extends Omit<VerticalNavItemProps, 'href' | 'children'> {
  label: ReactNode;
  /** Set when the current item is in this group: the closed group then carries the edge stripe. */
  holdsCurrent?: boolean;
  /** The items of the group. */
  children?: ReactNode;
}

/** An entry that opens and closes a list of items under it. */
function Group({ label, holdsCurrent, children, ...row }: VerticalNavGroupProps) {
  const nav = useNav();
  const open = nav.expanded.includes(row.id);
  return (
    <li data-part="group" data-open={open || undefined} className={styles.item}>
      <button
        type="button"
        className={styles.link}
        aria-expanded={open}
        aria-disabled={row.disabled || undefined}
        data-nav-focus=""
        data-group-id={row.id}
        data-holds-current={holdsCurrent || undefined}
        tabIndex={-1}
        title={nav.rail && typeof label === 'string' ? label : undefined}
        onClick={() => !row.disabled && nav.expand(row.id, !open)}
      >
        {rowContent({ ...row, children: label })}
        <span className={styles.caret}>
          <Icon name="chevronDown" />
        </span>
      </button>
      {open && (
        <ul role="list" className={styles.nested}>
          {children}
        </ul>
      )}
    </li>
  );
}

export interface VerticalNavSectionProps extends BlockProps {
  label: ReactNode;
}

/** A heading over a run of items. In the rail it becomes a rule. */
function Section({ label, className, style, children }: VerticalNavSectionProps) {
  const id = useId();
  return (
    <li data-part="section" className={cx(styles.section, className)} style={style}>
      <div id={id} data-part="section-label" className={styles.sectionLabel}>
        <span className={styles.label}>{label}</span>
      </div>
      <ul role="list" aria-labelledby={id} className={styles.sectionList}>
        {children}
      </ul>
    </li>
  );
}

export interface VerticalNavToggleProps {
  /** Accessible names of the button, by what a press does. */
  collapseLabel?: string;
  expandLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/** The button that switches between the full nav and the rail. Not shown while the slot forces the rail. */
function Toggle({
  collapseLabel = 'Collapse navigation',
  expandLabel = 'Expand navigation',
  className,
  style,
}: VerticalNavToggleProps) {
  const nav = useNav();
  if (nav.rail === 'auto') return null;
  const label = nav.rail ? expandLabel : collapseLabel;
  return (
    <div data-part="toggle" className={cx(styles.toggle, className)} style={style}>
      <ButtonBase
        umbra="icon-button"
        variant="ghost"
        iconOnly
        label={label}
        tooltip={label}
        expanded={!nav.rail}
        onPress={nav.toggleRail}
      >
        <IconSlot>{nav.rail ? <PanelLeftOpen /> : <PanelLeftClose />}</IconSlot>
      </ButtonBase>
    </div>
  );
}

export interface VerticalNavProps extends Omit<VerticalNavRootProps, 'children'>, VerticalNavToggleProps {
  /** The entries: items, groups (an item with `items`) and sections (`{ type: 'section', label, items }`). */
  items?: (VerticalNavItem | VerticalNavSection)[];
  /** Fixed above the list, for example a title or a search field. */
  header?: ReactNode;
  /** Fixed below the list. */
  footer?: ReactNode;
  /** Shows the button that lets the user switch to the icon rail and back. */
  collapsible?: boolean;
  /** Replace or hide named pieces. `item` applies to every item, also inside groups and sections. */
  parts?: {
    header?: Part<{ children: ReactNode }>;
    item?: Part<VerticalNavItemProps>;
    footer?: Part<{ children: ReactNode }>;
    toggle?: Part<VerticalNavToggleProps>;
  };
}

const groupsHolding = (
  items: (VerticalNavItem | VerticalNavSection)[],
  value: string | undefined,
): string[] =>
  items.flatMap((entry) =>
    'type' in entry
      ? groupsHolding(entry.items, value)
      : entry.items?.some((child) => child.id === value)
        ? [entry.id]
        : [],
  );

/** Side navigation for a modal, a settings screen or one column of a page. */
export function VerticalNav({
  items = [],
  header,
  footer,
  collapsible = false,
  collapseLabel,
  expandLabel,
  parts,
  ...root
}: VerticalNavProps) {
  const entry = (item: VerticalNavItem) => {
    const { label, items: children, ...row } = item;
    return (
      <Fragment key={item.id}>
        {children ? (
          <Group {...row} label={label} holdsCurrent={children.some((c) => c.id === root.value)}>
            {children.map(entry)}
          </Group>
        ) : (
          renderPart(parts?.item, { ...row, children: label }, (p) => <Item {...p} />)
        )}
      </Fragment>
    );
  };
  return (
    // A group that holds the current item starts open.
    <Root defaultExpandedIds={groupsHolding(items, root.value)} {...root}>
      {header != null &&
        renderPart(parts?.header, { children: header }, (p) => <Header>{p.children}</Header>)}
      <List>
        {items.map((item, i) =>
          'type' in item ? (
            <Section key={i} label={item.label}>
              {item.items.map(entry)}
            </Section>
          ) : (
            entry(item)
          ),
        )}
      </List>
      {footer != null &&
        renderPart(parts?.footer, { children: footer }, (p) => <Footer>{p.children}</Footer>)}
      {collapsible && renderPart(parts?.toggle, { collapseLabel, expandLabel }, (p) => <Toggle {...p} />)}
    </Root>
  );
}

VerticalNav.Root = Root;
VerticalNav.Header = Header;
VerticalNav.List = List;
VerticalNav.Section = Section;
VerticalNav.Group = Group;
VerticalNav.Item = Item;
VerticalNav.Footer = Footer;
VerticalNav.Toggle = Toggle;
