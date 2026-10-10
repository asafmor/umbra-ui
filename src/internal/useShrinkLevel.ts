import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/**
 * Drives "show less as space shrinks" for one row of content. The level starts at 0 and rises by one
 * each time the element's content is wider than the element, up to `max`. The caller hides or moves one
 * more thing per level. When the element or its parent grows, the level restarts from 0. All of this
 * happens before the browser paints, so no intermediate step is visible.
 *
 * The element must clip its overflow, and its content must not shrink below `max` (otherwise nothing
 * ever overflows and there is nothing to measure).
 */
export function useShrinkLevel(element: RefObject<HTMLElement | null>, max: number, resetKey?: unknown) {
  const [level, setLevel] = useState(0);
  const limit = useRef(max);
  const overflowing = () => {
    const el = element.current;
    return !!el && el.scrollWidth > el.clientWidth + 1;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every render on purpose; `max` bounds it
  useLayoutEffect(() => {
    limit.current = max;
    if (level < max && overflowing()) setLevel(level + 1);
  });
  useLayoutEffect(() => setLevel(0), [resetKey, max]);

  useLayoutEffect(() => {
    const el = element.current;
    if (!el) return;
    const widths = new Map<Element, number>();
    const observer = new ResizeObserver((entries) => {
      let grew = false;
      for (const entry of entries) {
        const previous = widths.get(entry.target);
        if (previous !== undefined && entry.contentRect.width > previous + 0.5) grew = true;
        widths.set(entry.target, entry.contentRect.width);
      }
      flushSync(() => setLevel((l) => (grew ? 0 : l < limit.current && overflowing() ? l + 1 : l)));
    });
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `overflowing` only reads the ref
  }, [element]);

  return Math.min(level, max);
}
