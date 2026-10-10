import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { collapseToFit } from './collapse';

/** Props accepted by every child of `Columns` or `Stack` (plan/layout.md). */
export interface SlotProps {
  /** Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. */
  size?: number | 'content';
  /** Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. */
  priority?: number;
  /** Reserved: `Columns` has no rule that uses it yet, so it has no effect. */
  minWidth?: number;
  /** Below this height a parent `Stack` may collapse the child to its header. */
  minHeight?: number;
  /** Tab label when a parent `Columns` shows one child at a time. */
  label?: string;
}

interface SlotInfo {
  element: HTMLElement | null;
  priority: number;
  label: string | undefined;
  /** Height needed to stay open. */
  min: () => number;
  /** Height when collapsed to a header, or null when the child cannot collapse. */
  header: () => number | null;
}

interface TabState {
  activeId: string | null;
  panelId: (slotId: string) => string;
  tabId: (slotId: string) => string;
}

interface LayoutParent {
  register: (id: string, info: RefObject<SlotInfo | null>) => () => void;
  /** A child calls this when something the parent's rules depend on has changed. */
  changed: () => void;
  collapsed: ReadonlySet<string>;
  /** True when the open children of a Stack all fit at their minimum height; they are then held to it. */
  keepMin: boolean;
  tabs: TabState | null;
}

const LayoutContext = createContext<LayoutParent | null>(null);
export const LayoutProvider = LayoutContext.Provider;

/** True below the minimum window size. Set by `AppShell`. */
export const NarrowContext = createContext(false);

/** The minimum height of a layout child: the `minHeight` prop, or a component default such as the card's. */
export const slotMinHeight = (element: HTMLElement) =>
  parseFloat(getComputedStyle(element).getPropertyValue('--umbra-slot-min-height')) || 0;

interface SlotOptions {
  /** Default tab label, for example a card's title. */
  label?: string;
  /** Overrides the minimum height, for example while a card is collapsed by the user. */
  min?: (element: HTMLElement) => number | undefined;
  /** Measures the header a `Stack` may collapse this child to. Omit when it cannot collapse. */
  header?: (element: HTMLElement) => number | null;
}

/**
 * Makes a component a layout child: applies `size`, and registers `priority`, `minHeight` and `label`
 * with the nearest `Columns` or `Stack`. Spread `props` on the root element and attach `ref` to it.
 */
export function useSlot<E extends HTMLElement>(slot: SlotProps, options: SlotOptions = {}) {
  const { size = 1, priority = 0, minHeight } = slot;
  const label = slot.label ?? options.label;
  const parent = useContext(LayoutContext);
  const id = useId();
  const ref = useRef<E>(null);
  const info = useRef<SlotInfo | null>(null);

  useLayoutEffect(() => {
    info.current = {
      element: ref.current,
      priority,
      label,
      min: () => {
        const element = ref.current;
        if (!element) return 0;
        const own = options.min?.(element);
        if (own !== undefined) return own;
        if (size === 'content') return element.offsetHeight;
        // The prop, or a component default such as the card's, both arrive as this CSS variable.
        return slotMinHeight(element);
      },
      header: () => (ref.current && size !== 'content' ? (options.header?.(ref.current) ?? null) : null),
    };
  });

  const register = parent?.register;
  const changed = parent?.changed;
  useLayoutEffect(() => register?.(id, info), [register, id]);
  useLayoutEffect(() => changed?.(), [changed, priority, minHeight, label, size]);

  const tabs = parent?.tabs;
  const style: CSSProperties = {
    flexGrow: size === 'content' ? undefined : size,
    ...(minHeight !== undefined && { ['--umbra-slot-min-height' as string]: `${minHeight}px` }),
  };
  return {
    ref,
    /** True when the parent `Stack` has collapsed this child to its header. */
    collapsed: parent?.collapsed.has(id) ?? false,
    /** Asks the parent to apply its rules again, after something it measures has changed. */
    changed,
    props: {
      'data-umbra-slot': '',
      'data-size': size === 'content' ? 'content' : undefined,
      'data-keep-min': parent?.keepMin || undefined,
      hidden: tabs ? tabs.activeId !== id : undefined,
      style,
      ...(tabs && { role: 'tabpanel', id: tabs.panelId(id), 'aria-labelledby': tabs.tabId(id) }),
    },
  };
}

const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
  a.size === b.size && [...a].every((v) => b.has(v));

export interface LayoutTab {
  id: string;
  label: string | undefined;
}

/** The parent side: tracks the children, and applies stack collapse or tab mode. */
export function useLayoutParent(
  element: RefObject<HTMLElement | null>,
  mode: { collapse?: boolean; tabs?: boolean },
) {
  const [slots] = useState(() => new Map<string, RefObject<SlotInfo | null>>());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [keepMin, setKeepMin] = useState(false);
  const [tabList, setTabList] = useState<LayoutTab[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const baseId = useId();
  const { collapse = false, tabs = false } = mode;

  const apply = useCallback(() => {
    const container = element.current;
    if (!container) return;
    const ordered = [...slots]
      .filter(([, info]) => info.current?.element)
      .sort(([, a], [, b]) =>
        a.current!.element!.compareDocumentPosition(b.current!.element!) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
    if (collapse) {
      const gap = parseFloat(getComputedStyle(container).rowGap) || 0;
      const next = collapseToFit(
        container.clientHeight,
        gap,
        ordered.map(([id, info]) => ({
          id,
          min: info.current!.min(),
          header: info.current!.header(),
          priority: info.current!.priority,
        })),
      );
      setCollapsed((previous) => (sameSet(previous, next.collapsed) ? previous : next.collapsed));
      setKeepMin(next.fits);
    }
    if (tabs) {
      const next = ordered.map(([id, info]) => ({ id, label: info.current!.label }));
      setTabList((previous) =>
        previous.length === next.length &&
        previous.every((t, i) => t.id === next[i]!.id && t.label === next[i]!.label)
          ? previous
          : next,
      );
    }
  }, [element, slots, collapse, tabs]);

  // Children register and report changes in their layout effects; the tick makes one pass run after them.
  const [tick, setTick] = useState(0);
  const changed = useCallback(() => setTick((t) => t + 1), []);
  useLayoutEffect(apply, [apply, tick]);

  const register = useCallback(
    (id: string, info: RefObject<SlotInfo | null>) => {
      slots.set(id, info);
      changed();
      return () => {
        slots.delete(id);
        changed();
      };
    },
    [slots, changed],
  );

  // Resizing applies the rules before the next paint, so a collapse is instant (plan/interaction.md).
  useLayoutEffect(() => {
    const container = element.current;
    if (!container || !collapse) return;
    const observer = new ResizeObserver(() => flushSync(apply));
    observer.observe(container);
    // Header heights measured before a web font arrived may be off; apply again when fonts finish loading.
    document.fonts?.addEventListener('loadingdone', apply);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', apply);
    };
  }, [element, collapse, apply]);

  const activeId = tabs ? (tabList.find((t) => t.id === selected)?.id ?? tabList[0]?.id ?? null) : null;
  const value = useMemo<LayoutParent>(
    () => ({
      register,
      changed,
      collapsed: collapse ? collapsed : new Set(),
      keepMin: collapse && keepMin,
      tabs: tabs
        ? { activeId, panelId: (id) => `${baseId}-panel-${id}`, tabId: (id) => `${baseId}-tab-${id}` }
        : null,
    }),
    [register, changed, collapse, collapsed, keepMin, tabs, activeId, baseId],
  );
  return { value, tabList, activeId, select: setSelected };
}
