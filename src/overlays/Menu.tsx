import {
  Children,
  Fragment,
  isValidElement,
  useContext,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Header as AriaHeader,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  Popover as AriaPopover,
  Pressable,
  RootMenuTriggerStateContext,
  Separator as AriaSeparator,
  SubmenuTrigger,
  type Key,
} from 'react-aria-components';
import { OverflowMenuContext, staysInRow, type OverflowRowProps } from '../internal/contexts';
import { CheckMark, Hint } from '../internal/menuRow';
import { Icon, IconSlot } from '../provider/icons';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { warn } from '../utils/dev';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Menu.module.css';
import {
  toAriaPlacement,
  useFlipWhenCut,
  useOpenState,
  useOverlayLayer,
  type OverlayPlacement,
} from './shared';
import { defined } from '../utils/defined';
import { passThrough, rootRender, withoutPassThrough, type RootAttributes } from '../utils/passThrough';

/** One row of a menu. `items` inside it makes a submenu. */
export interface MenuItemData {
  id: string;
  label: ReactNode;
  /** The label as text, for type-ahead. Needed when `label` is not a string. */
  textValue?: string | undefined;
  icon?: ReactNode | undefined;
  /** Id of a shortcut in the provider's list: its keys are shown at the end of the row. */
  shortcut?: string | undefined;
  /** A second, quieter line. */
  description?: ReactNode | undefined;
  disabled?: boolean | undefined;
  /** Marks a destructive action. */
  danger?: boolean | undefined;
  /** Makes the row a link. */
  href?: string | undefined;
  /** Marks the link to the current page (`aria-current`, with an edge stripe). */
  current?: boolean | undefined;
  /** The rows of a submenu. */
  items?: MenuEntry[] | undefined;
  /** `checkbox` rows toggle on their own; neighbouring `radio` rows form one group. */
  type?: 'item' | 'checkbox' | 'radio' | undefined;
  /** For `checkbox` and `radio`: sets the state of this row, whatever `selectedIds` says. */
  checked?: boolean | undefined;
}

/** A group of rows under an optional heading. */
export interface MenuSectionData {
  type: 'section';
  label?: ReactNode | undefined;
  items: MenuEntry[];
}

export interface MenuSeparatorData {
  type: 'separator';
}

export type MenuEntry = MenuItemData | MenuSectionData | MenuSeparatorData;

/** What the `item` part receives: the row's data and state. */
export interface MenuItemPartProps {
  item: MenuItemData;
  selected: boolean;
  /** The default content of the row. */
  children: ReactNode;
}

interface MenuParts {
  /** The content of a row. */
  item?: Part<MenuItemPartProps> | undefined;
  /** The mark of a checked row. */
  check?: Part | undefined;
  sectionHeader?: Part<{ children: ReactNode }> | undefined;
}

// Blocks. They only carry data: `Menu` reads their props and renders the rows itself, so they must be
// direct children (or inside fragments) of `Menu`, `Menu.Section` or `Menu.Sub`.

export interface MenuItemProps extends Omit<MenuItemData, 'label' | 'items'> {
  /** The label. */
  children?: ReactNode | undefined;
}
const Item = (() => null) as (props: MenuItemProps) => null;

export interface MenuSectionProps {
  /** The heading. */
  label?: ReactNode | undefined;
  /** `Menu.Item`s and `Menu.Sub`s. */
  children?: ReactNode | undefined;
}
const Section = (() => null) as (props: MenuSectionProps) => null;

const Separator = () => null;

export interface MenuSubProps extends Pick<MenuItemData, 'id' | 'label' | 'textValue' | 'icon' | 'disabled'> {
  /** The rows of the submenu. */
  children?: ReactNode | undefined;
}
const Sub = (() => null) as (props: MenuSubProps) => null;

function toEntries(children: ReactNode): MenuEntry[] {
  return Children.toArray(children).flatMap((child): MenuEntry[] => {
    if (!isValidElement<Record<string, unknown>>(child)) return [];
    const { children: inner, ...props } = child.props as { children?: ReactNode | undefined };
    if (child.type === Fragment) return toEntries(inner);
    if (child.type === Separator) return [{ type: 'separator' }];
    if (child.type === Section)
      return [{ ...(props as MenuSectionProps), type: 'section', items: toEntries(inner) }];
    if (child.type === Sub) return [{ ...(props as MenuSubProps), items: toEntries(inner) }];
    if (child.type === Item) return [{ ...(props as Omit<MenuItemProps, 'children'>), label: inner }];
    warn('Menu only reads Menu.Item, Menu.Section, Menu.Separator and Menu.Sub as children.');
    return [];
  });
}

const isItem = (entry: MenuEntry): entry is MenuItemData => 'id' in entry;
const kindOf = (item: MenuItemData) => (item.items ? 'item' : (item.type ?? 'item'));
const checkable = (item: MenuItemData) => kindOf(item) !== 'item';
/** Every row of the menu, its sections and its submenus. */
const allItems = (entries: MenuEntry[]): MenuItemData[] =>
  entries.flatMap((entry) =>
    isItem(entry) ? [entry, ...allItems(entry.items ?? [])] : 'items' in entry ? allItems(entry.items) : [],
  );
/** Neighbouring rows of one kind: a run of checkboxes or radios is one selection group. */
function runs(items: MenuItemData[]) {
  const out: MenuItemData[][] = [];
  for (const item of items) {
    const last = out.at(-1);
    if (last && kindOf(last[0]!) === kindOf(item)) last.push(item);
    else out.push([item]);
  }
  return out;
}

/** What every level of one menu shares. */
interface Shared {
  onAction: ((id: string) => void) | undefined;
  isSelected: (item: MenuItemData) => boolean;
  select: (group: string[], ids: string[]) => void;
  renderLink: (props: LinkRenderProps) => ReactNode;
  parts: MenuParts | undefined;
  emptyLabel: string;
}

// In their own module, so that `Button` can draw them without importing the menu.
export { CheckMark, Hint };

/** Which leading columns a level reserves, so its labels line up: one for checks, one for icons. */
interface Gutters {
  check: boolean;
  icon: boolean;
}

function row(item: MenuItemData, shared: Shared, gutters: Gutters) {
  const text = item.textValue ?? (typeof item.label === 'string' ? item.label : undefined);
  if (text === undefined)
    warn(`menu item "${item.id}" has a label that is not text; give it a \`textValue\`.`);
  const selected = checkable(item) && shared.isSelected(item);
  const content = (
    <>
      {gutters.check && <CheckMark shown={selected} part={shared.parts?.check} />}
      {gutters.icon && <IconSlot part="icon">{item.icon}</IconSlot>}
      <span className={styles.text}>
        <span data-part="label" className={styles.label}>
          {item.label}
        </span>
        {item.description && (
          <span data-part="description" className={styles.description}>
            {item.description}
          </span>
        )}
      </span>
      {item.shortcut && <Hint id={item.shortcut} />}
      {item.items && <Icon name="chevronRight" part="submenuIndicator" />}
    </>
  );
  const element = (
    <AriaMenuItem
      key={item.id}
      id={item.id}
      textValue={text ?? item.id}
      {...defined({ href: item.disabled ? undefined : item.href, isDisabled: item.disabled })}
      data-part="item"
      data-danger={item.danger || undefined}
      data-current={item.current || undefined}
      {...defined({ className: styles.item })}
      render={(dom) => {
        const props = { ...dom, 'aria-current': item.current ? ('page' as const) : undefined };
        return 'href' in props && props.href ? (
          (shared.renderLink(props as LinkRenderProps) as ReactElement)
        ) : (
          <div {...(props as React.JSX.IntrinsicElements['div'])} />
        );
      }}
    >
      {renderPart(shared.parts?.item, { item, selected, children: content }, (p) => p.children)}
    </AriaMenuItem>
  );
  if (!item.items) return element;
  return (
    <SubmenuTrigger key={item.id}>
      {element}
      <Panel sub entries={item.items} shared={shared} />
    </SubmenuTrigger>
  );
}

function group(items: MenuItemData[], shared: Shared, gutters: Gutters, key: string, heading?: ReactNode) {
  const kind = kindOf(items[0]!);
  const rows = items.map((item) => row(item, shared, gutters));
  const header =
    heading !== undefined &&
    renderPart(shared.parts?.sectionHeader, { children: heading }, (p) => (
      <AriaHeader data-part="sectionHeader" className={styles.sectionHeader}>
        {p.children}
      </AriaHeader>
    ));
  if (kind === 'item') {
    return heading === undefined ? (
      rows
    ) : (
      <AriaMenuSection key={key} {...defined({ className: styles.section })}>
        {header}
        {rows}
      </AriaMenuSection>
    );
  }
  const ids = items.map((item) => item.id);
  return (
    <AriaMenuSection
      key={key}
      {...defined({ className: styles.section })}
      selectionMode={kind === 'radio' ? 'single' : 'multiple'}
      disallowEmptySelection={kind === 'radio'}
      selectedKeys={items.filter(shared.isSelected).map((item) => item.id)}
      onSelectionChange={(keys) => shared.select(ids, keys === 'all' ? ids : [...keys].map(String))}
    >
      {header}
      {rows}
    </AriaMenuSection>
  );
}

function entriesToRows(entries: MenuEntry[], shared: Shared) {
  const level = entries.flatMap((e) => (isItem(e) ? [e] : 'items' in e ? e.items.filter(isItem) : []));
  const gutters = { check: level.some(checkable), icon: level.some((item) => !!item.icon) };
  const out: ReactNode[] = [];
  let pending: MenuItemData[] = [];
  const flush = () => {
    runs(pending).forEach((items, i) => out.push(group(items, shared, gutters, `run-${out.length}-${i}`)));
    pending = [];
  };
  entries.forEach((entry, index) => {
    if (isItem(entry)) return pending.push(entry);
    flush();
    if (entry.type === 'separator') {
      out.push(
        <AriaSeparator
          key={`separator-${index}`}
          data-part="separator"
          {...defined({ className: styles.separator })}
        />,
      );
    } else {
      // The heading goes on the first group of the section.
      runs(entry.items.filter(isItem)).forEach((items, i) =>
        out.push(group(items, shared, gutters, `section-${index}-${i}`, i === 0 ? entry.label : undefined)),
      );
    }
  });
  flush();
  return out;
}

interface PanelProps {
  entries: MenuEntry[];
  shared: Shared;
  /** A submenu: its anchor and state come from the row that opens it. */
  sub?: boolean | undefined;
  anchorRef?: RefObject<Element | null> | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  'aria-label'?: string | undefined;
  placement?: OverlayPlacement | undefined;
  offset?: number | undefined;
  matchAnchorWidth?: boolean | undefined;
  maxHeight?: number | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * What React Aria's `MenuTrigger` gives a menu and its submenus, for a menu that has no trigger of
 * that kind: one opened against an anchor, or by the "more" button of a row of actions. Without it a
 * row chosen in a submenu closes the submenu and leaves the menu open. The submenu stack follows
 * React Stately's `useMenuTriggerState`.
 */
function useRootMenuState(open: boolean, onOpenChange: ((open: boolean) => void) | undefined) {
  const [stack, setStack] = useState<Key[]>([]);
  if (!open && stack.length) setStack([]);
  return {
    isOpen: open,
    focusStrategy: null,
    // Where a context menu opens: this menu has its anchor instead.
    point: null,
    setPoint: () => {},
    setOpen: (next: boolean) => onOpenChange?.(next),
    open: () => onOpenChange?.(true),
    toggle: () => onOpenChange?.(!open),
    close: () => onOpenChange?.(false),
    expandedKeysStack: stack,
    openSubmenu: (key: Key, level: number) =>
      setStack((old) => (level > old.length ? old : [...old.slice(0, level), key])),
    closeSubmenu: (key: Key, level: number) =>
      setStack((old) => (old[level] === key ? old.slice(0, level) : old)),
  };
}

function Surface({
  sub,
  anchorRef,
  open,
  onOpenChange,
  placement = 'bottom start',
  offset = 4,
  matchAnchorWidth,
  maxHeight,
  className,
  style,
  children,
  ...rest
}: Omit<PanelProps, 'entries' | 'shared' | 'aria-label'> & { children: ReactNode }) {
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('popover');
  const flipWhenCut = useFlipWhenCut(maxHeight);
  const root = useRootMenuState(!!open, onOpenChange);
  const popover = (
    <AriaPopover
      {...rootRender('div', rest)}
      {...scope}
      {...defined(layer)}
      ref={flipWhenCut}
      {...defined(
        sub
          ? { offset: -4 }
          : {
              triggerRef: anchorRef,
              isOpen: open,
              onOpenChange,
              placement: toAriaPlacement(placement),
              offset,
            },
      )}
      {...defined({ maxHeight })}
      data-umbra="menu"
      data-umbra-overlay=""
      data-match-width={matchAnchorWidth || undefined}
      {...defined({ className: cx(styles.root, className) })}
      style={{ ...scope.style, ...style }}
    >
      {children}
    </AriaPopover>
  );
  // Inside a `MenuTrigger` or a submenu the state is React Aria's own.
  return anchorRef ? (
    <RootMenuTriggerStateContext value={root}>{popover}</RootMenuTriggerStateContext>
  ) : (
    popover
  );
}

function Panel({ entries, shared, 'aria-label': label, onOpenChange, ...surface }: PanelProps) {
  return (
    <Surface {...surface} onOpenChange={onOpenChange}>
      <AriaMenu
        {...defined({ 'aria-label': label, autoFocus: surface.anchorRef ? 'first' : undefined })}
        onAction={(key) => shared.onAction?.(String(key))}
        {...defined({ onClose: surface.anchorRef ? () => onOpenChange?.(false) : undefined })}
        renderEmptyState={() => <div className={styles.empty}>{shared.emptyLabel}</div>}
        data-part="list"
        {...defined({ className: styles.list })}
      >
        {entriesToRows(entries, shared)}
      </AriaMenu>
    </Surface>
  );
}

/** A plain element as a trigger needs React Aria's press handling; umbra-ui buttons bring their own. */
const pressable = (trigger: ReactNode) =>
  isValidElement(trigger) && typeof trigger.type === 'string' ? (
    <Pressable>{trigger as ReactElement<React.DOMAttributes<HTMLElement>, string>}</Pressable>
  ) : (
    trigger
  );

export interface MenuProps extends RootAttributes {
  /** The rows, as data. */
  items?: MenuEntry[] | undefined;
  /** The rows, as `Menu.Item`, `Menu.Section`, `Menu.Separator` and `Menu.Sub` blocks. */
  children?: ReactNode | undefined;
  /** The control that opens the menu: an umbra-ui button, or a plain `<button>`. Leave it out to use `anchorRef`. */
  trigger?: ReactNode | undefined;
  /** The element to open against, when there is no `trigger`. Use it with `open`. */
  anchorRef?: RefObject<Element | null> | undefined;
  /** Controlled state. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Accessible name. A menu with a `trigger` is named by it. */
  'aria-label'?: string | undefined;
  /** Called with the id of the row the user chose. */
  onAction?: ((id: string) => void) | undefined;
  /** The checked `checkbox` and `radio` rows, in every section and submenu. */
  selectedIds?: string[] | undefined;
  defaultSelectedIds?: string[] | undefined;
  onSelectionChange?: ((ids: string[]) => void) | undefined;
  /** Side of the anchor and alignment along it. It flips to the other side to stay in the window. */
  placement?: OverlayPlacement | undefined;
  /** Gap between the anchor and the menu, in pixels. */
  offset?: number | undefined;
  /** Makes the menu at least as wide as its anchor. */
  matchAnchorWidth?: boolean | undefined;
  /** Tallest the menu may be, in pixels. It is never taller than the room in the window; the rows scroll. */
  maxHeight?: number | undefined;
  /** Plugs in the app's router link for rows with `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  /** Shown when there are no rows. */
  emptyLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?: MenuParts | undefined;
  /** On the menu's panel. */
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const plainLink = (props: LinkRenderProps) => <a {...props} />;

/**
 * A list of actions or links that opens from a control. One tab stop; arrow keys, type-ahead, and
 * submenus that open with the arrow keys.
 */
export function Menu({
  items,
  children,
  trigger,
  anchorRef,
  open,
  defaultOpen,
  onOpenChange,
  onAction,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  renderLink = plainLink,
  emptyLabel = 'No items',
  parts,
  ...panel
}: MenuProps) {
  const inOverflow = useContext(OverflowMenuContext);
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  const entries = items ?? toEntries(children);
  const [ownSelected, setOwnSelected] = useState(defaultSelectedIds ?? []);
  const selected = selectedIds ?? ownSelected;
  const isSelected = (item: MenuItemData) => item.checked ?? selected.includes(item.id);
  const shared: Shared = {
    onAction,
    isSelected,
    select: (group, ids) => {
      const next = allItems(entries)
        .filter(checkable)
        .filter((item) => (group.includes(item.id) ? ids.includes(item.id) : isSelected(item)))
        .map((item) => item.id);
      setOwnSelected(next);
      onSelectionChange?.(next);
    },
    renderLink,
    parts,
    emptyLabel,
  };
  if (trigger && inOverflow) {
    // Among actions that moved into an overflow menu, the trigger is a row and this menu its submenu.
    return (
      <SubmenuTrigger>
        {trigger as ReactElement}
        <Panel sub entries={entries} shared={shared} />
      </SubmenuTrigger>
    );
  }
  if (trigger) {
    return (
      <MenuTrigger isOpen={isOpen} onOpenChange={setOpen}>
        {pressable(trigger)}
        <Panel {...panel} entries={entries} shared={shared} />
      </MenuTrigger>
    );
  }
  return (
    <Panel
      {...panel}
      entries={entries}
      shared={shared}
      anchorRef={anchorRef}
      open={isOpen}
      onOpenChange={setOpen}
    />
  );
}

export interface MenuContextProps extends Omit<
  MenuProps,
  'children' | 'trigger' | 'anchorRef' | 'open' | 'defaultOpen' | 'placement' | 'offset' | 'matchAnchorWidth'
> {
  /** The region the menu belongs to. */
  children?: ReactNode | undefined;
  /** The rows as blocks, in place of `items`. */
  content?: ReactNode | undefined;
  /** Leaves the browser's own context menu alone. */
  disabled?: boolean | undefined;
  /** Called when the menu opens or closes. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** On the region's wrapper, which by default adds no box of its own. */
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * A region with a context menu: it opens at the pointer on a right click, and at the focused element
 * with the context-menu key or Shift+F10.
 */
function Context({
  children,
  content,
  disabled = false,
  onOpenChange,
  className,
  style,
  ...menu
}: MenuContextProps) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const openAt = (x: number, y: number) => {
    setPoint({ x, y });
    if (!point) onOpenChange?.(true);
  };
  return (
    <div
      {...passThrough({ ...menu, 'aria-label': undefined })}
      data-umbra="menu-context"
      className={cx(styles.context, className)}
      style={style}
      onContextMenu={(event) => {
        if (disabled) return;
        event.preventDefault();
        openAt(event.clientX, event.clientY);
      }}
      onKeyDown={(event) => {
        if (disabled || !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
        event.preventDefault();
        const rect = (event.target as Element).getBoundingClientRect();
        openAt(rect.left, rect.bottom);
      }}
    >
      {children}
      {/* The menu is anchored to this point, which sits where the pointer or the focused element was. */}
      <span
        ref={anchor}
        aria-hidden="true"
        className={styles.point}
        style={{ left: point?.x, top: point?.y }}
      />
      <Menu
        {...withoutPassThrough(menu)}
        aria-label={menu['aria-label']}
        anchorRef={anchor}
        open={!!point}
        onOpenChange={(next) => {
          if (next) return;
          setPoint(null);
          onOpenChange?.(false);
        }}
        offset={0}
      >
        {content}
      </Menu>
    </div>
  );
}

Menu.Item = Item;
Menu.Section = Section;
Menu.Separator = Separator;
Menu.Sub = Sub;
Menu.Context = Context;

/**
 * A menu can only hold rows, and one plain element among them makes React Aria drop the rows after it.
 * So a plain wrapper (`<div>`, `<span>`) gives way to what it holds, and text is left out. A component
 * stays: it is expected to render a `Button`, an `IconButton` or a `Menu`. A control that says it
 * cannot be a row (`staysInRow`) is left out: `ActionsOverflow` keeps it beside the "more" button.
 */
function rowsOnly(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode | undefined }>(child) || staysInRow(child)) return null;
    const plain = typeof child.type === 'string' || child.type === Fragment;
    return plain ? rowsOnly(child.props.children) : child;
  });
}

/** A `Button` or `IconButton` as a row of the overflow menu: a toggle is a checkbox item, a link stays a link. */
function OverflowRow({
  label,
  text,
  href,
  disabled,
  pressed,
  shortcut,
  onPress,
  className,
  children,
}: OverflowRowProps) {
  const id = useId();
  const item = (
    <AriaMenuItem
      id={id}
      {...defined({ 'aria-label': label })}
      textValue={text ?? label ?? ''}
      {...defined({ href: disabled ? undefined : href })}
      isDisabled={disabled}
      {...defined({ onAction: onPress })}
      data-part="item"
      {...defined({ className: cx(styles.item, className) })}
    >
      {({ hasSubmenu }) => (
        <>
          {children}
          {shortcut && <Hint id={shortcut} />}
          {/* At the end of the row, so the icons of the rows stay in one column. */}
          {pressed !== undefined && <CheckMark shown={pressed} />}
          {hasSubmenu && <Icon name="chevronRight" part="submenuIndicator" />}
        </>
      )}
    </AriaMenuItem>
  );
  // A toggle is a checkbox item. Its state stays the button's own `pressed`.
  return pressed === undefined ? (
    item
  ) : (
    <AriaMenuSection
      selectionMode="multiple"
      selectedKeys={pressed ? [id] : []}
      {...defined({ className: styles.section })}
    >
      {item}
    </AriaMenuSection>
  );
}

const overflowRow = (row: OverflowRowProps) => <OverflowRow {...row} />;

/**
 * Internal: the menu of `ActionsOverflow` (`src/internal/ActionsOverflow.tsx`), which draws the "more"
 * button, holds the open state, and loads this module the first time a row of actions does not fit.
 * `open` also says where the focus goes: `true` is the menu itself, or its first or last row.
 */
export function OverflowMenu({
  label,
  anchorRef,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  anchorRef: RefObject<Element | null>;
  open: boolean | 'first' | 'last';
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Surface anchorRef={anchorRef} open={open !== false} onOpenChange={onOpenChange} placement="bottom end">
      <OverflowMenuContext value={overflowRow}>
        <AriaMenu
          aria-label={label}
          autoFocus={open || true}
          onClose={() => onOpenChange(false)}
          data-part="list"
          {...defined({ className: styles.list })}
        >
          {rowsOnly(children)}
        </AriaMenu>
      </OverflowMenuContext>
    </Surface>
  );
}
