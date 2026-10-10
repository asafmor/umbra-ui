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
/** True when the element's content is wider than the element (with a pixel of tolerance for rounding). */
export const isOverflowing = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1;

export function useShrinkLevel(
  element: RefObject<HTMLElement | null>,
  max: number,
  resetKey?: unknown,
  options: {
    /** Replaces the default test (content wider than the element). */
    overflowing?: (element: HTMLElement) => boolean;
    /** The level only rises past `level` while this returns true. */
    canAdvance?: (level: number) => boolean;
  } = {},
) {
  const [level, setLevel] = useState(0);
  const limit = useRef(max);
  const latest = useRef(options);
  const overflowing = () => {
    const el = element.current;
    if (!el) return false;
    return latest.current.overflowing?.(el) ?? isOverflowing(el);
  };

  const reset = useRef<unknown[]>([resetKey, max]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every render on purpose; `max` bounds it
  useLayoutEffect(() => {
    limit.current = max;
    latest.current = options;
    // A new reset key or limit restarts from 0. Measuring only means something at the rendered level,
    // so when that is not 0 yet, render at 0 first.
    const restart = reset.current[0] !== resetKey || reset.current[1] !== max;
    reset.current = [resetKey, max];
    if (restart && level !== 0) return setLevel(0);
    if (level < max && (options.canAdvance?.(level) ?? true) && overflowing()) setLevel(level + 1);
  });

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
      const canAdvance = (l: number) => latest.current.canAdvance?.(l) ?? true;
      flushSync(() =>
        setLevel((l) => (grew ? 0 : l < limit.current && canAdvance(l) && overflowing() ? l + 1 : l)),
      );
    });
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    // Text measured before a web font arrived may have been wider; start again when fonts finish loading.
    const restart = () => setLevel(0);
    document.fonts?.addEventListener('loadingdone', restart);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', restart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `overflowing` only reads the ref
  }, [element]);

  return Math.min(level, max);
}
