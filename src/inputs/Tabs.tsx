import {
  Children,
  Fragment,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { LayoutProvider, useSlot, type SlotProps } from '../layout/useSlot';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { nameWithCount, reveal, useStrip } from './strip';
import styles from './Tabs.module.css';

export type TabsVariant = 'underline' | 'pill' | 'button-group';

/** One tab and its panel, as data. */
export interface TabsItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** A number shown after the label and read with it ("Orders, 12"). */
  count?: number;
  disabled?: boolean;
  /** With `onClose` set, `false` keeps this tab from being closed. */
  closable?: boolean;
  /** The panel shown while this tab is selected. Without it the tab has no panel. */
  content?: ReactNode;
}

interface TabsOptions {
  /** `underline`: text with a bar. `pill`: separate rounded buttons. `button-group`: joined buttons. */
  variant?: TabsVariant;
  /** `vertical` puts the tab list beside the panel. */
  orientation?: 'horizontal' | 'vertical';
  /** `small` is for dense areas. Otherwise the height follows the density level. */
  size?: 'default' | 'small';
  /** The tabs share the width of the list. */
  fullWidth?: boolean;
  /** `automatic`: arrow keys select. `manual`: arrow keys move focus, and Enter or Space selects. */
  activation?: 'automatic' | 'manual';
  /** Keeps the panels that are not selected mounted and hidden, so they keep their state. */
  keepMounted?: boolean;
  /** Makes tabs closable: called with the id of the tab whose close button (or Delete key) was used. */
  onClose?: (id: string) => void;
  /** First word of the close button's name: "Close Orders". */
  closeLabel?: string;
}

interface TabsContextValue extends Required<Omit<TabsOptions, 'onClose'>> {
  value: string | null;
  select: (id: string) => void;
  tabId: (id: string) => string;
  panelId: (id: string) => string;
  onClose: ((id: string) => void) | undefined;
}
const TabsContext = createContext<TabsContextValue | null>(null);
function useTabs() {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error('Tabs blocks must be rendered inside <Tabs.Root>.');
  return tabs;
}

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface TabsRootProps extends TabsOptions, BlockProps, Omit<SlotProps, 'size'> {
  /** The selected tab. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the id of the tab the user selected. */
  onChange?: (id: string) => void;
  /**
   * Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1.
   * Other layout children call this `size`; here `size` is the size of the tabs.
   */
  share?: SlotProps['size'];
}

/** Holds the state. The list and the panels can sit anywhere inside it, also apart. */
function Root({
  value: controlled,
  defaultValue = null,
  onChange,
  variant = 'underline',
  orientation = 'horizontal',
  size = 'default',
  fullWidth = false,
  activation = 'automatic',
  keepMounted = false,
  onClose,
  closeLabel = 'Close',
  share,
  className,
  style,
  children,
  ...slot
}: TabsRootProps) {
  const { ref, props } = useSlot<HTMLDivElement>({ ...slot, size: share });
  const [own, setOwn] = useState(defaultValue);
  const value = controlled === undefined ? own : controlled;
  const baseId = useId();
  const tabs = useMemo<TabsContextValue>(
    () => ({
      value,
      select: (id) => {
        setOwn(id);
        if (id !== value) onChange?.(id);
      },
      tabId: (id) => `${baseId}-tab-${encodeURIComponent(id)}`,
      panelId: (id) => `${baseId}-panel-${encodeURIComponent(id)}`,
      variant,
      orientation,
      size,
      fullWidth,
      activation,
      keepMounted,
      onClose,
      closeLabel,
    }),
    [
      value,
      onChange,
      baseId,
      variant,
      orientation,
      size,
      fullWidth,
      activation,
      keepMounted,
      onClose,
      closeLabel,
    ],
  );
  return (
    <TabsContext value={tabs}>
      {/* Layout children inside the tabs belong to the tabs, not to the Stack or Columns around them. */}
      <LayoutProvider value={null}>
        <div
          {...props}
          ref={ref}
          data-umbra="tabs"
          data-orientation={orientation}
          className={cx(styles.root, className)}
          style={{ ...props.style, ...style }}
        >
          {children}
        </div>
      </LayoutProvider>
    </TabsContext>
  );
}

export interface TabsListProps extends BlockProps {
  /** Accessible name of the tab list. */
  'aria-label'?: string;
  /** Shown after the tabs and outside the tab list, for example an "add" button. */
  end?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: { indicator?: Part };
}

const tabsIn = (strip: HTMLElement) => [...strip.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

/** The row (or column) of tabs. One tab stop; arrow keys, Home and End move between tabs. */
function List({ 'aria-label': label, end, parts, className, style, children }: TabsListProps) {
  const tabs = useTabs();
  const vertical = tabs.orientation === 'vertical';
  const strip = useRef<HTMLDivElement>(null);
  const owner = useRef<HTMLSpanElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const count = Children.count(children);
  // The indicator is still where the last render left it when the strip is measured, so it is the last
  // tab that says whether the tabs fit.
  const shrink = useStrip(strip, vertical ? 0 : 2, count, vertical, (el) => {
    const last = el.querySelector<HTMLElement>('[data-part="tab"]:last-of-type');
    return !!last && last.offsetLeft + last.offsetWidth > el.clientWidth + 1;
  });
  // A close button may not be inside a `tablist`. With closable tabs the role moves to an empty element
  // that owns the tabs, and the buttons stay beside their tabs.
  const closable = !!tabs.onClose;

  /** Moves the indicator to the selected tab: sliding when the selection changed, at once otherwise. */
  const place = (animate: boolean) => {
    const bar = indicator.current;
    const tab = strip.current?.querySelector<HTMLElement>('[data-part="tab"][data-selected]');
    if (!bar) return;
    const at = tab ? [tab.offsetLeft, tab.offsetTop, tab.offsetWidth, tab.offsetHeight] : [];
    if (bar.dataset.at === at.join()) return;
    const first = !bar.dataset.at;
    bar.dataset.at = at.join();
    bar.hidden = !tab;
    if (!tab) return;
    bar.style.transition = animate && !first ? '' : 'none';
    bar.style.translate = `${at[0]}px ${at[1]}px`;
    bar.style.width = `${at[2]}px`;
    bar.style.height = `${at[3]}px`;
    void bar.offsetWidth;
    bar.style.transition = '';
  };

  const previous = useRef(tabs.value);
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const all = tabsIn(el);
    const enabled = all.filter((t) => !t.disabled);
    // One tab stop: the focused tab, or the selected one, or the first.
    const stop =
      enabled.find((t) => t === document.activeElement) ??
      enabled.find((t) => t.getAttribute('aria-selected') === 'true') ??
      enabled[0];
    for (const tab of all) {
      tab.tabIndex = tab === stop ? 0 : -1;
      // A tab only points at a panel that is in the document.
      const panel = tab.dataset.panel!;
      if (document.getElementById(panel)) tab.setAttribute('aria-controls', panel);
      else tab.removeAttribute('aria-controls');
    }
    owner.current?.setAttribute('aria-owns', all.map((t) => t.id).join(' '));
    place(previous.current !== tabs.value);
    previous.current = tabs.value;
  });

  // Tabs change size without a render when a font arrives or the list is resized.
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, [count]);

  // The selected tab always stays in view.
  useLayoutEffect(() => {
    const el = strip.current;
    const tab = el?.querySelector<HTMLElement>('[data-part="tab"][data-selected]');
    if (el && tab) reveal(el, tab);
  }, [tabs.value, shrink.level]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = tabsIn(event.currentTarget).filter((t) => !t.disabled);
    const index = enabled.indexOf(event.target as HTMLButtonElement);
    const [back, forward] = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    const next = { [back]: index - 1, [forward]: index + 1, Home: 0, End: enabled.length - 1 }[event.key];
    if (index < 0 || next === undefined) return;
    event.preventDefault();
    const target = enabled[(next + enabled.length) % enabled.length]!;
    for (const tab of enabled) tab.tabIndex = tab === target ? 0 : -1;
    target.focus();
    if (tabs.activation === 'automatic') target.click();
  };

  const tablist = { role: 'tablist', 'aria-label': label, 'aria-orientation': tabs.orientation } as const;
  return (
    <div
      data-part="list"
      data-variant={tabs.variant}
      data-orientation={tabs.orientation}
      data-size={tabs.size}
      data-full-width={tabs.fullWidth || undefined}
      className={cx(styles.list, className)}
      style={style}
    >
      <div
        ref={strip}
        {...(!closable && tablist)}
        {...shrink.attributes}
        className={cx(shrink.className, styles.strip)}
        onKeyDown={onKeyDown}
      >
        {closable && <span ref={owner} {...tablist} className={styles.owner} />}
        {renderPart(parts?.indicator, {}, () => (
          <span
            ref={indicator}
            aria-hidden="true"
            hidden
            data-part="indicator"
            className={styles.indicator}
          />
        ))}
        {children}
      </div>
      {end && (
        <div data-part="end" className={styles.end}>
          {end}
        </div>
      )}
    </div>
  );
}

export interface TabsTabProps extends Omit<TabsItem, 'label' | 'content'> {
  /** Replace or hide named pieces of this tab. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    count?: Part<{ children: number }>;
    close?: Part<{ label: string; onPress: () => void }>;
  };
  className?: string;
  style?: CSSProperties;
  /** The label. */
  children?: ReactNode;
}

/** One tab. */
function Tab({
  id,
  icon,
  count,
  disabled = false,
  closable,
  parts,
  className,
  style,
  children,
}: TabsTabProps) {
  const tabs = useTabs();
  const selected = tabs.value === id;
  const canClose = !!tabs.onClose && closable !== false && !disabled;
  const close = (from: HTMLElement) => {
    // The tab is about to go: focus moves to its neighbour, so the keyboard user stays in the list.
    const enabled = tabsIn(from.closest<HTMLElement>('[data-part="list"]')!).filter((t) => !t.disabled);
    const index = enabled.findIndex((t) => t.id === tabs.tabId(id));
    tabs.onClose?.(id);
    (enabled[index + 1] ?? enabled[index - 1])?.focus();
  };
  return (
    <div
      role="presentation"
      data-part="tab"
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-icon={icon ? '' : undefined}
      className={cx(styles.tab, className)}
      style={style}
    >
      <button
        type="button"
        role="tab"
        id={tabs.tabId(id)}
        data-panel={tabs.panelId(id)}
        aria-selected={selected}
        aria-label={nameWithCount(children, count)}
        aria-keyshortcuts={canClose ? 'Delete' : undefined}
        disabled={disabled}
        tabIndex={-1}
        className={styles.trigger}
        onClick={() => tabs.select(id)}
        onKeyDown={(event) => {
          if (canClose && event.key === 'Delete') close(event.currentTarget);
        }}
      >
        {renderPart(
          parts?.icon,
          { children: icon },
          (p) => p.children && <IconSlot part="icon">{p.children}</IconSlot>,
        )}
        <span data-part="label" className={styles.label}>
          {children}
        </span>
        {count !== undefined &&
          renderPart(parts?.count, { children: count }, (p) => (
            <span data-part="count" className={styles.count}>
              ({p.children})
            </span>
          ))}
      </button>
      {canClose &&
        renderPart(
          parts?.close,
          {
            label: typeof children === 'string' ? `${tabs.closeLabel} ${children}` : tabs.closeLabel,
            onPress: () => tabs.onClose?.(id),
          },
          (p) => (
            <button
              type="button"
              data-part="close"
              aria-label={p.label}
              tabIndex={-1}
              className={styles.close}
              onClick={p.onPress}
            >
              <Icon name="close" />
            </button>
          ),
        )}
    </div>
  );
}

export interface TabsPanelProps extends BlockProps {
  /** The id of the tab this panel belongs to. */
  id: string;
}

/** The content of one tab. It fills the space the tabs leave. */
function Panel({ id, className, style, children }: TabsPanelProps) {
  const tabs = useTabs();
  const selected = tabs.value === id;
  if (!selected && !tabs.keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={tabs.panelId(id)}
      aria-labelledby={tabs.tabId(id)}
      hidden={!selected}
      tabIndex={0}
      data-part="panel"
      className={cx(styles.panel, className)}
      style={style}
    >
      {children}
    </div>
  );
}

export interface TabsProps extends TabsRootProps {
  /** The tabs and their panels. Leave out to compose `Tabs.List`, `Tabs.Tab` and `Tabs.Panel` yourself. */
  items?: TabsItem[];
  /** Accessible name of the tab list. */
  'aria-label'?: string;
  /** Shown after the tabs, for example an "add" button. */
  end?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: NonNullable<TabsListProps['parts']> &
    NonNullable<TabsTabProps['parts']> & {
      list?: Part<TabsListProps>;
      tab?: Part<TabsTabProps>;
      panel?: Part<TabsPanelProps>;
    };
}

/** Switches between views of the same content area. The panel fills the rest of the slot. */
export function Tabs({
  items,
  'aria-label': label,
  end,
  parts,
  value,
  defaultValue,
  onChange,
  children,
  ...root
}: TabsProps) {
  const [own, setOwn] = useState(defaultValue);
  if (!items) {
    return (
      <Root {...root} value={value} defaultValue={defaultValue} onChange={onChange}>
        {children}
      </Root>
    );
  }
  // With `items` the tabs are known: the first one that can be selected is, when nothing else is.
  const wanted = value === undefined ? own : value;
  const active = (items.find((i) => i.id === wanted) ?? items.find((i) => !i.disabled))?.id ?? null;
  const { list, tab, panel, indicator, ...tabParts } = parts ?? {};
  return (
    <Root
      {...root}
      value={active}
      onChange={(id) => {
        setOwn(id);
        onChange?.(id);
      }}
    >
      {renderPart(
        list,
        {
          'aria-label': label,
          end,
          parts: { indicator },
          children: items.map(({ id, label: text, icon, count, disabled, closable }) => (
            <Fragment key={id}>
              {renderPart(
                tab,
                { id, icon, count, disabled, closable, parts: tabParts, children: text },
                (p) => (
                  <Tab {...p} />
                ),
              )}
            </Fragment>
          )),
        },
        (p) => (
          <List {...p} />
        ),
      )}
      {items.map(
        (item) =>
          item.content !== undefined && (
            <Fragment key={item.id}>
              {renderPart(panel, { id: item.id, children: item.content }, (p) => (
                <Panel {...p} />
              ))}
            </Fragment>
          ),
      )}
      {children}
    </Root>
  );
}

Tabs.Root = Root;
Tabs.List = List;
Tabs.Tab = Tab;
Tabs.Panel = Panel;

/** Internal: a tab strip for tabs and panels that live elsewhere, with their own ids (`Columns`). */
export function TabStrip({
  tabs,
  onSelect,
  label,
}: {
  tabs: { id: string; label: string; selected: boolean; tabId: string; panelId: string }[];
  onSelect: (id: string) => void;
  label: string;
}) {
  const find = (id: string) => tabs.find((t) => t.id === id);
  const value: TabsContextValue = {
    value: tabs.find((t) => t.selected)?.id ?? null,
    select: onSelect,
    tabId: (id) => find(id)?.tabId ?? id,
    panelId: (id) => find(id)?.panelId ?? id,
    variant: 'underline',
    orientation: 'horizontal',
    size: 'default',
    fullWidth: false,
    activation: 'automatic',
    keepMounted: false,
    onClose: undefined,
    closeLabel: '',
  };
  return (
    <TabsContext value={value}>
      <List aria-label={label}>
        {tabs.map((t) => (
          <Tab key={t.id} id={t.id}>
            {t.label}
          </Tab>
        ))}
      </List>
    </TabsContext>
  );
}
