// Shared by SegmentedFilter and Tabs: one row (or column) of items that shows less as it shrinks and,
// as the last step, moves the items that do not fit into a "more" menu. A vertical strip scrolls inside
// itself with faded edges instead.
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import styles from './strip.module.css';

/**
 * The shrink level of a strip (0 to `max`, see `useShrinkLevel`) and the `data-` attributes that say
 * which of its edges hide more content. The element must scroll its own overflow.
 */
export function useStrip(
  element: RefObject<HTMLElement | null>,
  max: number,
  resetKey: unknown,
  vertical = false,
  /** Replaces the default test (content wider than the element). */
  overflowing?: (element: HTMLElement) => boolean,
) {
  const level = useShrinkLevel(element, max, resetKey, { overflowing });
  const [fade, setFade] = useState({ start: false, end: false });

  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const measure = () => {
      const position = Math.abs(vertical ? el.scrollTop : el.scrollLeft);
      const room = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
      const next = { start: position > 1, end: position < room - 1 };
      setFade((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [element, vertical, level, resetKey]);

  return {
    level,
    /** Spread on the element, and add `className` to its classes. */
    className: styles.strip,
    attributes: {
      'data-level': level,
      'data-vertical': vertical || undefined,
      'data-fade-start': fade.start || undefined,
      'data-fade-end': fade.end || undefined,
    },
  };
}

/** Scrolls `item` into view inside `strip` only: `scrollIntoView` would also move clipped ancestors. */
export function reveal(strip: HTMLElement, item: HTMLElement) {
  const a = strip.getBoundingClientRect();
  const b = item.getBoundingClientRect();
  strip.scrollLeft += Math.min(0, b.left - a.left) + Math.max(0, b.right - a.right);
  strip.scrollTop += Math.min(0, b.top - a.top) + Math.max(0, b.bottom - a.bottom);
}

/** The accessible name of an item with a count: "Unread, 4". Only a text label can be combined. */
export const nameWithCount = (label: unknown, count: number | undefined) =>
  typeof label === 'string' && count !== undefined ? `${label}, ${count}` : undefined;

/** What an item tells its strip, so the strip can list it in the "more" menu. */
export interface StripRow {
  label: ReactNode;
  count?: number | undefined;
  icon?: ReactNode | undefined;
  disabled?: boolean | undefined;
}

const none: ReadonlySet<string> = new Set();
/** Given by a strip to its items: which of them are in the "more" menu, and where they report themselves. */
export const StripItemsContext = createContext<{
  hidden: ReadonlySet<string>;
  rows: Map<string, StripRow>;
} | null>(null);

/** For an item: reports itself to the strip, and returns true when it is in the "more" menu and not drawn. */
export function useStripItem(id: string, row: StripRow) {
  const strip = useContext(StripItemsContext);
  useLayoutEffect(() => {
    strip?.rows.set(id, row);
    return () => void strip?.rows.delete(id);
  });
  return !!strip?.hidden.has(id);
}

/** The rows of the "more" menu, for `Menu`'s `items`. */
export function moreRows(
  ids: string[],
  rows: Map<string, StripRow>,
  type: 'radio' | 'checkbox',
  checked: (id: string) => boolean,
) {
  return ids.map((id) => {
    const { label, count, icon, disabled } = rows.get(id) ?? { label: id };
    return {
      id,
      label:
        count === undefined ? (
          label
        ) : (
          <>
            {label} ({count})
          </>
        ),
      textValue: typeof label === 'string' ? label : undefined,
      icon,
      disabled,
      type,
      checked: checked(id),
    };
  });
}

/**
 * The last step of a horizontal strip: finds the items (direct children with `data-id`) that do not fit
 * beside the "more" button. `keep` (the selected item) always stays: it takes the last place that fits.
 *
 * While `overflowed` is `null` nothing is known: every item and the "more" button are rendered, measured
 * before the browser paints, and the result is stored with the parent's width at that moment. A parent
 * narrower than that width, or another `keep`, measures again; a wider one restarts the shrink levels,
 * which makes `active` false and clears the result. The width is the one measured at, not the last one
 * the observer delivered, so two changes within one frame cannot leave an old result standing.
 */
export function useMoreItems(
  element: RefObject<HTMLElement | null>,
  more: RefObject<HTMLElement | null>,
  active: boolean,
  keep: string | null,
) {
  const [overflowed, setOverflowed] = useState<string[] | null>(null);
  const kept = useRef(keep);
  const measuredAt = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every render on purpose; it ends once a result is stored
  useLayoutEffect(() => {
    const el = element.current;
    const changed = kept.current !== keep;
    kept.current = keep;
    if (!el) return;
    if (!active) return overflowed ? setOverflowed(null) : undefined;
    if (changed && overflowed?.length) return setOverflowed(null);
    if (overflowed) return;
    measuredAt.current = el.parentElement?.getBoundingClientRect().width ?? 0;

    const items = [...el.querySelectorAll<HTMLElement>(':scope > [data-id]')];
    const first = items[0]?.getBoundingClientRect();
    if (!first) return setOverflowed([]);
    // The far edge of an item, measured from the start of the first one in either text direction.
    const end = (item: HTMLElement) => {
      const box = item.getBoundingClientRect();
      return Math.max(box.right - first.left, first.right - box.left);
    };
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const button = more.current;
    const reserved = button ? button.offsetWidth + gap : 0;
    // The room the items would have if there were no "more" button.
    const room = el.clientWidth + (button && !el.contains(button) ? reserved : 0);
    if (end(items[items.length - 1]!) <= room + 1) return setOverflowed([]);

    let fit = items.findIndex((item) => end(item) > room - reserved + 1);
    const keptItem = items.find((item) => item.dataset.id === keep);
    if (keptItem && items.indexOf(keptItem) >= fit) {
      const width = keptItem.offsetWidth + gap;
      while (fit > 0 && end(items[fit - 1]!) + width > room - reserved + 1) fit--;
    }
    setOverflowed(items.slice(fit).map((item) => item.dataset.id!));
  });

  useLayoutEffect(() => {
    const parent = element.current?.parentElement;
    if (!active || !parent) return;
    const observer = new ResizeObserver(() => {
      if (parent.getBoundingClientRect().width < measuredAt.current - 0.5)
        flushSync(() => setOverflowed(null));
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [element, active]);

  const ids = active ? (overflowed ?? []) : [];
  return {
    /** The items in the menu, in order. `keep` can be one of them, and is still drawn. */
    overflowed: ids,
    /** The items that are not drawn. */
    hidden: ids.length ? new Set(ids.filter((id) => id !== keep)) : none,
    /** True while the button must be rendered: there are items in the menu, or it is being measured. */
    showMore: active && (overflowed === null || overflowed.length > 0),
  };
}
