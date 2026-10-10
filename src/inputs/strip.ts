// Shared by SegmentedFilter and Tabs: one row (or column) of items that shows less as it shrinks and,
// as the last step, scrolls inside itself with faded edges.
import { useEffect, useState, type RefObject } from 'react';
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
