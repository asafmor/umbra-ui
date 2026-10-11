import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/** True when the element's content is taller than the element (with a pixel of tolerance for rounding). */
const tooTall = (el: HTMLElement) => el.scrollHeight > el.clientHeight + 1;

/**
 * "Show less as space shrinks" for a block whose height is given by its slot (`MediaCard`,
 * `Comparison`): the level rises by one while the content is taller than the element, up to `max`, and
 * the caller shows less per level. `useShrinkLevel` does the same for a row and its width.
 *
 * The level is a function of the size alone: when the element grows, in either direction, it starts
 * again from 0, and all of it happens before the paint. An element that is as tall as its content (no
 * slot gives it a height) never overflows, so it stays at 0. The element must clip its overflow.
 *
 * The caller's CSS must let the element be that tall where no height is given: `height: 100%`, or a
 * flex basis of `0%` (not `0`, which collapses it to its padding in a column without a height, and
 * every level then hides something until nothing is left). See plan/layout.md, rule 5.
 */
export function useFitLevel(element: RefObject<HTMLElement | null>, max: number, resetKey?: unknown) {
  const [level, setLevel] = useState(0);
  const settled = useRef<[number, number]>([0, 0]);
  const shown = useRef(0);
  const limit = useRef(max);
  const key = useRef(resetKey);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every render on purpose; `max` bounds it
  useLayoutEffect(() => {
    const el = element.current;
    limit.current = max;
    shown.current = level;
    if (!el) return;
    if (key.current !== resetKey) {
      key.current = resetKey;
      if (level !== 0) return setLevel(0);
    }
    if (level < max && tooTall(el)) return setLevel(level + 1);
    settled.current = [el.clientWidth, el.clientHeight];
  });

  useLayoutEffect(() => {
    const el = element.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const [width, height] = settled.current;
      const grew = el.clientWidth > width + 0.5 || el.clientHeight > height + 0.5;
      settled.current = [el.clientWidth, el.clientHeight];
      if (grew && shown.current !== 0) flushSync(() => setLevel(0));
      else if (shown.current < limit.current && tooTall(el)) flushSync(() => setLevel(shown.current + 1));
    });
    observer.observe(el);
    // Text measured before a web font arrived may have been taller; start again when fonts finish loading.
    const restart = () => setLevel(0);
    document.fonts?.addEventListener('loadingdone', restart);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', restart);
    };
  }, [element]);

  return Math.min(level, max);
}
