// The navigation logic shared by PrimaryNav and SubNav: items, dropdowns, the "More" overflow and keys.
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Popover, useEscapeToClose } from '../internal/overlays';
import { isOverflowing, useShrinkLevel } from '../internal/useShrinkLevel';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './nav.module.css';

/** One navigation entry. `items` inside an entry makes a dropdown. */
export interface NavItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
  items?: NavItem[];
  disabled?: boolean;
}

/** Props for the app's router link: spread them on it. `renderLink={(p) => <RouterLink to={p.href} {...p} />}` */
export type NavLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export interface NavItemProps {
  id: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** A `Menu` block with the sub-pages. */
  menu?: ReactNode;
  /** The label. */
  children?: ReactNode;
}

export interface NavRootProps {
  /** The active item. */
  value?: string;
  /** Called with the id of the item the user chose. */
  onChange?: (id: string) => void;
  /** Plugs in the app's router link. Defaults to a plain `<a>`. */
  renderLink?: (props: NavLinkProps) => ReactNode;
  /** Label of the overflow item. */
  moreLabel?: string;
  /** Accessible name of the navigation landmark. */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface NavContextValue {
  value: string | undefined;
  onChange: ((id: string) => void) | undefined;
  renderLink: (props: NavLinkProps) => ReactNode;
  indicator: Part | undefined;
  /** Set inside a dropdown or the "More" menu, where items render as rows. */
  menu: { close: () => void } | null;
}
const NavContext = createContext<NavContextValue | null>(null);

/** Set by the TopBar: holds the nav's own overflow back until the bar has used its earlier steps. */
export const NavHoldContext = createContext<{ hold: boolean; report: (exhausted: boolean) => void } | null>(
  null,
);

const plainLink = (props: NavLinkProps) => <a {...props} />;
const focusTargets = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[data-nav-focus]')];

function MenuPanel({
  nav,
  close,
  children,
}: {
  nav: NavContextValue;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <NavContext value={{ ...nav, menu: { close } }}>
      <div className={styles.menu}>{children}</div>
    </NavContext>
  );
}

/** One navigation item: a link, or a button when it only opens a dropdown. */
export function Item({ id, href, icon, disabled = false, menu, children }: NavItemProps) {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('A nav Item must be rendered inside PrimaryNav or SubNav.');
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  useEscapeToClose(
    open,
    () => setOpen(false),
    () => anchor.current?.querySelector<HTMLElement>('[aria-haspopup]'),
  );
  const active = nav.value === id;
  const inMenu = nav.menu;
  const choose = () => {
    if (disabled) return;
    nav.onChange?.(id);
    inMenu?.close();
  };
  const content = (
    <>
      {icon && <IconSlot>{icon}</IconSlot>}
      <span className={styles.label}>{children}</span>
    </>
  );
  const common = {
    className: styles.link,
    'aria-current': active ? ('page' as const) : undefined,
    'aria-disabled': disabled || undefined,
    'data-nav-focus': inMenu ? undefined : '',
    tabIndex: inMenu ? undefined : -1,
  };

  if (inMenu) {
    // A row in a dropdown or in "More". Sub-pages follow, indented.
    return (
      <>
        {href && !disabled ? (
          nav.renderLink({ ...common, href, onClick: choose, children: content })
        ) : (
          <button type="button" {...common} onClick={menu ? undefined : choose}>
            {content}
          </button>
        )}
        {menu && <div className={styles.nested}>{menu}</div>}
      </>
    );
  }

  const toggle = () => !disabled && setOpen((o) => !o);
  const popupProps = { 'aria-haspopup': 'dialog' as const, 'aria-expanded': open };
  // Source behaviour: the label navigates and a separate caret opens the dropdown. An item without
  // `href` opens the dropdown from anywhere on it.
  const onKeyDown = (event: KeyboardEvent) => {
    if (menu && !disabled && event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
    }
  };
  return (
    <div
      ref={anchor}
      data-part="item"
      data-active={active || undefined}
      data-open={open || undefined}
      data-disabled={disabled || undefined}
      className={styles.item}
      onKeyDown={onKeyDown}
    >
      {href && !disabled ? (
        nav.renderLink({ ...common, href, onClick: choose, children: content })
      ) : (
        // A disabled item is a button that does nothing: it never navigates, but it keeps its place in
        // the arrow-key order, so it is `aria-disabled` and not `disabled`.
        <button
          type="button"
          {...common}
          {...(menu && !href && popupProps)}
          onClick={menu && !href ? toggle : choose}
        >
          {content}
          {menu && !href && <Icon name="chevronDown" />}
        </button>
      )}
      {menu && href && (
        <button
          type="button"
          className={styles.caret}
          aria-label={typeof children === 'string' ? children : undefined}
          {...popupProps}
          data-nav-focus=""
          tabIndex={-1}
          aria-disabled={disabled || undefined}
          onClick={toggle}
        >
          <Icon name="chevronDown" />
        </button>
      )}
      {active &&
        renderPart(nav.indicator, {}, () => <span data-part="indicator" className={styles.indicator} />)}
      {menu && (
        <Popover
          label={typeof children === 'string' ? children : 'Menu'}
          triggerRef={anchor}
          open={open}
          onOpenChange={setOpen}
        >
          <MenuPanel nav={nav} close={() => setOpen(false)}>
            {menu}
          </MenuPanel>
        </Popover>
      )}
    </div>
  );
}

/** The dropdown of an item: its children are `Item`s. */
export function Menu({ children }: { children?: ReactNode }) {
  return children;
}

function More({ label, nav, children }: { label: string; nav: NavContextValue; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  useEscapeToClose(
    open,
    () => setOpen(false),
    () => anchor.current?.querySelector('button'),
  );
  return (
    <div ref={anchor} data-part="more" data-open={open || undefined} className={styles.item}>
      <button
        type="button"
        className={styles.link}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-nav-focus=""
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.label}>{label}</span>
        <Icon name="chevronDown" />
      </button>
      <Popover label={label} triggerRef={anchor} open={open} onOpenChange={setOpen}>
        <MenuPanel nav={nav} close={() => setOpen(false)}>
          {children}
        </MenuPanel>
      </Popover>
    </div>
  );
}

interface NavListProps extends Omit<NavRootProps, 'className' | 'style' | 'aria-label'> {
  parts?: { indicator?: Part; more?: Part<{ label: string; children: ReactNode }> };
  /** Further shrink steps after every movable item is in "More" (SubNav hides its label). */
  extraSteps?: number;
  /** Called with how many of the extra steps are in use. */
  onExtraSteps?: (count: number) => void;
}

/**
 * The row of items. Items that do not fit move into "More", last first; the active item never moves.
 * One tab stop; arrow keys move between items.
 */
export function NavList({
  value,
  onChange,
  renderLink = plainLink,
  moreLabel = 'More',
  parts,
  extraSteps = 0,
  onExtraSteps,
  children,
}: NavListProps) {
  const list = useRef<HTMLDivElement>(null);
  const held = useContext(NavHoldContext);
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<NavItemProps>[];
  const activeIndex = items.findIndex((item) => item.props.id === value);
  const movable = items.length - (activeIndex >= 0 ? 1 : 0);
  const max = held?.hold ? 0 : movable + extraSteps;
  const level = useShrinkLevel(list, max, items.length);
  const moved = new Set<number>();
  for (let i = items.length - 1; i >= 0 && moved.size < Math.min(level, movable); i--) {
    if (i !== activeIndex) moved.add(i);
  }

  const extra = Math.max(0, level - movable);
  const report = held?.report;
  useLayoutEffect(() => {
    onExtraSteps?.(extra);
    report?.(!held?.hold && level === max && !!list.current && isOverflowing(list.current));
  });

  // One tab stop: the active item, or the first one.
  useLayoutEffect(() => {
    if (!list.current) return;
    const targets = focusTargets(list.current);
    const stop =
      targets.find((t) => t === document.activeElement) ??
      targets.find((t) => t.getAttribute('aria-current')) ??
      targets[0];
    for (const target of targets) target.tabIndex = target === stop ? 0 : -1;
  });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const targets = focusTargets(event.currentTarget);
    const index = targets.indexOf(document.activeElement as HTMLElement);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: targets.length - 1 }[event.key];
    if (index < 0 || next === undefined) return;
    event.preventDefault();
    const target = targets[(next + targets.length) % targets.length]!;
    for (const t of targets) t.tabIndex = t === target ? 0 : -1;
    target.focus();
  };

  const nav: NavContextValue = { value, onChange, renderLink, indicator: parts?.indicator, menu: null };
  const overflow = items.filter((_, i) => moved.has(i));
  return (
    <NavContext value={nav}>
      <div ref={list} data-overflow-watch="" className={styles.list} onKeyDown={onKeyDown}>
        {items.filter((_, i) => !moved.has(i))}
        {overflow.length > 0 &&
          renderPart(parts?.more, { label: moreLabel, children: overflow }, (p) => (
            <More label={p.label} nav={nav}>
              {p.children}
            </More>
          ))}
      </div>
    </NavContext>
  );
}

/** Turns the `items` prop into `Item` elements. */
export function itemsToElements(items: NavItem[] | undefined, part?: Part<NavItemProps>): ReactNode {
  return items?.map((item) => {
    const props: NavItemProps = {
      id: item.id,
      href: item.href,
      icon: item.icon,
      disabled: item.disabled,
      menu: item.items && <Menu>{itemsToElements(item.items)}</Menu>,
      children: item.label,
    };
    const element = renderPart(part, props, (p) => <Item {...p} />);
    // The list reads `id` from each element to find the active item, so a replaced part keeps it.
    return isValidElement(element) ? <NavKey key={item.id} {...props} render={element} /> : null;
  });
}

/** Carries an item's props on the element the list sees, whatever a `parts.item` function returned. */
function NavKey({ render }: NavItemProps & { render: ReactNode }) {
  return render;
}

export const navClass = (kind: 'primary' | 'sub', className?: string) =>
  cx(styles.nav, styles[kind], className);
