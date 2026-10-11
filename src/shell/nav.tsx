// The navigation logic shared by PrimaryNav and SubNav: items, dropdowns, the "More" overflow and keys.
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { rowKeys, useDirection } from '../internal/direction';
import { isOverflowing, useShrinkLevel } from '../internal/useShrinkLevel';
import { Menu as UmbraMenu, type MenuEntry } from '../overlays/Menu';
import { Icon, IconSlot } from '../provider/icons';
import { warn } from '../utils/dev';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './nav.module.css';

/** One navigation entry. `items` inside an entry makes a dropdown. */
export interface NavItem {
  id: string;
  label: ReactNode;
  /** The label as text. Required when `label` is not a string: it names the item's dropdown and its rows. */
  textValue?: string;
  icon?: ReactNode;
  href?: string;
  items?: NavItem[];
  disabled?: boolean;
}

export interface NavItemProps {
  id: string;
  /** The label as text. Required when the label is not a string: it names the item's dropdown and its rows. */
  textValue?: string;
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
  renderLink?: (props: LinkRenderProps) => ReactNode;
  /** Label of the overflow item. */
  moreLabel?: string;
  /** Accessible name of the caret that opens an item's dropdown, from the item's label. */
  submenuLabel?: (label: string) => string;
  /** Accessible name of the navigation landmark. */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface NavContextValue {
  value: string | undefined;
  onChange: ((id: string) => void) | undefined;
  renderLink: (props: LinkRenderProps) => ReactNode;
  indicator: Part | undefined;
  submenuLabel: (label: string) => string;
}
const NavContext = createContext<NavContextValue | null>(null);

/**
 * Set by the TopBar: holds the nav's own overflow back until the bar has used its earlier steps. The nav
 * reports when it has moved every item it can.
 */
export const NavHoldContext = createContext<{ hold: boolean; report: (exhausted: boolean) => void } | null>(
  null,
);

const plainLink = (props: LinkRenderProps) => <a {...props} />;
const focusTargets = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[data-nav-focus]')];

/** The name of an item as text: its label when that is a string, or its `textValue`. */
function textOf({ id, textValue, children }: NavItemProps) {
  if (textValue !== undefined) return textValue;
  if (typeof children === 'string') return children;
  warn(`nav item "${id}" has a label that is not text; give it a \`textValue\`.`);
  return id;
}

/** The sub-pages given in an item's `menu`, as elements. */
const subItems = (menu: ReactNode) =>
  Children.toArray(
    isValidElement<{ children?: ReactNode }>(menu) && menu.type === Menu ? menu.props.children : menu,
  ).filter(isValidElement) as ReactElement<NavItemProps>[];

/**
 * Items as the rows of a menu. An item with sub-pages is a submenu; when it is also a link, its own
 * page is the first row of that submenu.
 */
function toRows(items: ReactElement<NavItemProps>[], value: string | undefined): MenuEntry[] {
  return items.map(({ props }) => {
    const row = {
      id: props.id,
      label: props.children,
      textValue: textOf(props),
      icon: props.icon,
      disabled: props.disabled,
    };
    const own = { ...row, href: props.href, current: props.id === value };
    if (!props.menu) return own;
    const rows = toRows(subItems(props.menu), value);
    return { ...row, items: props.href ? [own, { type: 'separator' }, ...rows] : rows };
  });
}

/** True when `value` is one of the sub-pages of the item, at any depth. */
const holdsValue = (props: NavItemProps, value: string | undefined): boolean =>
  value !== undefined &&
  subItems(props.menu).some((sub) => sub.props.id === value || holdsValue(sub.props, value));

/**
 * Keys for a button that opens a menu. Enter and Space open it here, on the key going down, and not
 * through the click the browser makes of them: after such a click React Aria takes the press for a
 * virtual one and leaves the focus on the menu itself, where Enter does nothing. Opened by a key, the
 * menu starts on its first row.
 */
function openKeys(open: boolean, show: () => void) {
  const isPopup = (event: KeyboardEvent) =>
    (event.target as Element).getAttribute('aria-haspopup') === 'menu' &&
    (event.target as Element).getAttribute('aria-disabled') !== 'true';
  return {
    onKeyDown: (event: KeyboardEvent) => {
      const opens =
        event.key === 'ArrowDown' || ((event.key === 'Enter' || event.key === ' ') && isPopup(event));
      if (!opens || open) return;
      event.preventDefault();
      show();
    },
    // Space presses a button when the key comes up.
    onKeyUp: (event: KeyboardEvent) => {
      if (event.key === ' ' && isPopup(event)) event.preventDefault();
    },
  };
}

/** One navigation item: a link, or a button when it only opens a dropdown. */
export function Item(props: NavItemProps) {
  const { id, href, icon, disabled = false, menu, children } = props;
  const nav = useContext(NavContext);
  if (!nav) throw new Error('A nav Item must be rendered inside PrimaryNav or SubNav.');
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const active = nav.value === id;
  // A sub-page is the current one: this item is the current section.
  const holds = !active && holdsValue(props, nav.value);
  const choose = () => {
    if (!disabled) nav.onChange?.(id);
  };
  const content = (
    <>
      {icon && <IconSlot>{icon}</IconSlot>}
      <span className={styles.label}>{children}</span>
    </>
  );
  const common = {
    className: styles.link,
    'aria-current': active ? ('page' as const) : holds ? ('true' as const) : undefined,
    'aria-disabled': disabled || undefined,
    'data-nav-focus': '',
    tabIndex: -1,
  };

  const toggle = () => !disabled && setOpen((o) => !o);
  const popupProps = { 'aria-haspopup': 'menu' as const, 'aria-expanded': open };
  // Source behaviour: the label navigates and a separate caret opens the dropdown. An item without
  // `href` opens the dropdown from anywhere on it.
  const keys = openKeys(open, () => setOpen(true));
  return (
    <div
      ref={anchor}
      data-part="item"
      data-active={active || holds || undefined}
      data-section={holds || undefined}
      data-open={open || undefined}
      data-disabled={disabled || undefined}
      className={styles.item}
      {...(menu && !disabled && keys)}
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
        // Its own name, so it is not confused with the link beside it.
        <button
          type="button"
          className={styles.caret}
          aria-label={nav.submenuLabel(textOf(props))}
          {...popupProps}
          data-nav-focus=""
          tabIndex={-1}
          aria-disabled={disabled || undefined}
          onClick={toggle}
        >
          <Icon name="chevronDown" />
        </button>
      )}
      {(active || holds) &&
        renderPart(nav.indicator, {}, () => <span data-part="indicator" className={styles.indicator} />)}
      {menu && (
        <UmbraMenu
          items={toRows(subItems(menu), nav.value)}
          aria-label={textOf(props)}
          anchorRef={anchor}
          open={open}
          onOpenChange={setOpen}
          // Closed here, not left to the menu: choosing a sub-page re-renders the bar, and with it the menu.
          onAction={(chosen) => {
            setOpen(false);
            nav.onChange?.(chosen);
          }}
          renderLink={nav.renderLink}
        />
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
  return (
    <div ref={anchor} data-part="more" data-open={open || undefined} className={styles.item}>
      <button
        type="button"
        className={styles.link}
        aria-haspopup="menu"
        aria-expanded={open}
        data-nav-focus=""
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        {...openKeys(open, () => setOpen(true))}
      >
        <span className={styles.label}>{label}</span>
        <Icon name="chevronDown" />
      </button>
      <UmbraMenu
        items={toRows(subItems(children), nav.value)}
        aria-label={label}
        anchorRef={anchor}
        open={open}
        onOpenChange={setOpen}
        onAction={(chosen) => {
          setOpen(false);
          nav.onChange?.(chosen);
        }}
        renderLink={nav.renderLink}
      />
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
  submenuLabel = (label) => `${label}, submenu`,
  parts,
  extraSteps = 0,
  onExtraSteps,
  children,
}: NavListProps) {
  const list = useRef<HTMLDivElement>(null);
  const direction = useDirection();
  const held = useContext(NavHoldContext);
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<NavItemProps>[];
  // The current item, or the item whose sub-page is current: it never moves into "More".
  const activeIndex = items.findIndex((item) => item.props.id === value || holdsValue(item.props, value));
  const movable = items.length - (activeIndex >= 0 ? 1 : 0);
  const max = held?.hold ? 0 : movable + extraSteps;
  const level = useShrinkLevel(list, max, items.length, {
    // A `ShortcutBar` in the end slot of the same bar gives way first. While it still has chips to move
    // (its own list is cut), no page moves; the list is measured again when the bar has settled.
    canAdvance: () =>
      ![
        ...(list.current?.parentElement?.querySelectorAll<HTMLElement>(
          ':scope > [data-part="end"] [data-umbra="shortcut-bar"] > [data-part="list"]',
        ) ?? []),
      ].some(isOverflowing),
  });
  const moved = new Set<number>();
  for (let i = items.length - 1; i >= 0 && moved.size < Math.min(level, movable); i--) {
    if (i !== activeIndex) moved.add(i);
  }

  const extra = Math.max(0, level - movable);
  const report = held?.report;
  useLayoutEffect(() => {
    onExtraSteps?.(extra);
    // Whether it still overflows is for the bar to measure, each time its own width changes: this list
    // does not render again once it has nothing left to move.
    report?.(!held?.hold && level === max);
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
    const [back, forward] = rowKeys(direction);
    const next = { [forward]: index + 1, [back]: index - 1, Home: 0, End: targets.length - 1 }[event.key];
    if (index < 0 || next === undefined) return;
    event.preventDefault();
    const target = targets[(next + targets.length) % targets.length]!;
    for (const t of targets) t.tabIndex = t === target ? 0 : -1;
    target.focus();
  };

  const nav: NavContextValue = { value, onChange, renderLink, indicator: parts?.indicator, submenuLabel };
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
      textValue: item.textValue,
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
