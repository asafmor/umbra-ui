import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { focusLost, holdFocus } from './focus';

/**
 * Drives "show less as space shrinks" for one row of content. The level starts at 0 and rises by one
 * each time the element's content is wider than the element, up to `max`. The caller hides or moves one
 * more thing per level. When the element or its parent grows, the level restarts from 0. All of this
 * happens before the browser paints, so no intermediate step is visible.
 *
 * The level is a function of the size alone, not of the sizes the row had before:
 * - Growing always restarts from 0, and shrinking only ever adds steps, so both arrive at the level a
 *   fresh load at that size gives.
 * - Sizes are compared with the ones read when the level was last settled, not with the last one the
 *   observer delivered. Two size changes within one frame are then one change, whichever way they went.
 * - A neighbour that gives way later in the same pass (a `ShortcutBar` beside the pages of a `SubNav`)
 *   can leave this row overflowing with no size change to observe. The row is therefore measured once
 *   more when the pass has ended, before the paint.
 *
 * Rows restart together (one observer and one font listener for all of them), so rows that give way
 * in an order, such as the shortcuts before the pages of a `SubNav`, settle in that order every time.
 *
 * Two things are kept through a restart:
 * - A menu opened from the row (the "more" menu). Restarting unmounts its trigger, so the restart waits
 *   until nothing in or beside the row is expanded. A web font that arrives because the menu opened
 *   (its rows use another weight) therefore cannot close it.
 * - Focus. When the focused control is rendered again or moves into the "more" menu, focus goes to its
 *   replacement, or to the first control of the row.
 *
 * The element must clip its overflow, and its content must not shrink below `max` (otherwise nothing
 * ever overflows and there is nothing to measure).
 */
/** True when the element's content is wider than the element (with a pixel of tolerance for rounding). */
export const isOverflowing = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1;

const expanded = '[aria-expanded="true"]';
const overlay = '[role="menu"], [role="listbox"], [role="dialog"]';

// One observer and one font listener for every row. Rows beside each other give way in an order (a
// `ShortcutBar` before the pages of its `SubNav`), and that order only holds when they start again
// together: restarted one after the other, the first would settle against the old state of the second.
type Update = (() => void) | undefined;
interface Row {
  targets: Element[];
  /** A watched element has changed size. */
  resized: () => Update;
  /** Start again from 0. */
  restart: () => Update;
}
const rows = new Set<Row>();
const observed = new Map<Element, number>();
let observer: ResizeObserver | undefined;

/** Applies the updates in one render, before the paint. */
function apply(updates: Update[]) {
  const todo = updates.filter((update) => !!update);
  if (todo.length) flushSync(() => todo.forEach((update) => update()));
}
const restartAll = () => apply([...rows].map((row) => row.restart()));

function addRow(row: Row) {
  observer ??= new ResizeObserver((entries) => {
    const changed = new Set(entries.map((entry) => entry.target));
    apply([...rows].filter((r) => r.targets.some((t) => changed.has(t))).map((r) => r.resized()));
  });
  // Text measured before a web font arrived may have been wider; start again when fonts finish loading.
  if (!rows.size) document.fonts?.addEventListener('loadingdone', restartAll);
  rows.add(row);
  for (const target of row.targets) {
    observed.set(target, (observed.get(target) ?? 0) + 1);
    observer.observe(target);
  }
  return () => {
    rows.delete(row);
    for (const target of row.targets) {
      const left = observed.get(target)! - 1;
      if (left) observed.set(target, left);
      else {
        observed.delete(target);
        observer!.unobserve(target);
      }
    }
    if (!rows.size) document.fonts?.removeEventListener('loadingdone', restartAll);
  };
}

export function useShrinkLevel(
  element: RefObject<HTMLElement | null>,
  max: number,
  resetKey?: unknown,
  options: {
    /** Replaces the default test (content wider than the element). */
    overflowing?: (element: HTMLElement) => boolean;
    /** The level only rises past `level` while this returns true. */
    canAdvance?: (level: number) => boolean;
    /** More elements whose growth restarts the level, besides the element and its parent. */
    watch?: (element: HTMLElement) => (Element | null | undefined)[];
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
  /** True when one more step can and must be taken from `l`. */
  const mustAdvance = (l: number) =>
    l < limit.current && (latest.current.canAdvance?.(l) ?? true) && overflowing();

  // The observed elements, and their widths when the level was last settled.
  const watched = useRef<Element[]>([]);
  const settled = useRef<number[]>([]);
  const widths = () => watched.current.map((el) => el.getBoundingClientRect().width);
  // Puts focus back after a change of level; set before the change (see `holdFocus`).
  const refocus = useRef<(() => void) | null>(null);
  const shown = useRef(0);
  /** The update that renders at `next`, keeping focus. Only for a `next` that is not the level shown. */
  const to = (next: number): Update => {
    const el = element.current;
    refocus.current ??= holdFocus(el?.parentElement ?? el);
    return () => setLevel(next);
  };
  const checking = useRef(false);

  const reset = useRef<unknown[]>([resetKey, max]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every render on purpose; `max` bounds it
  useLayoutEffect(() => {
    limit.current = max;
    latest.current = options;
    shown.current = level;
    // A new reset key or limit restarts from 0. Measuring only means something at the rendered level,
    // so when that is not 0 yet, render at 0 first.
    const restart = reset.current[0] !== resetKey || reset.current[1] !== max;
    reset.current = [resetKey, max];
    if (restart && level !== 0) return setLevel(0);
    if (mustAdvance(level)) return setLevel(level + 1);
    settled.current = widths();
    if (checking.current || (level >= max && !refocus.current)) return;
    checking.current = true;
    // After every other row of this pass has settled, and before the paint.
    queueMicrotask(() => {
      checking.current = false;
      if (!element.current) return;
      // Advancing renders again, and that render ends here in its turn.
      if (shown.current === level && mustAdvance(level)) return apply([to(level + 1)]);
      refocus.current?.();
      refocus.current = null;
    });
  });

  useLayoutEffect(() => {
    const el = element.current;
    if (!el) return;
    watched.current = [el, el.parentElement, ...(latest.current.watch?.(el) ?? [])].filter(
      (target): target is Element => !!target,
    );
    settled.current = widths();
    const scope = el.parentElement ?? el;
    let frame = 0;

    // Starts again from 0, once no menu opened from the row is showing, and once focus has left that
    // menu: a closing menu keeps focus until it has faded out, and only then gives it back to its
    // trigger. Restarting sooner would render the trigger again and leave focus with nowhere to go.
    // When the menu has gone, focus is on nothing for a frame or two before it is given back; the
    // wait for that is bounded, in case it never is.
    let lost = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (busy() || (focusLost() && lost++ < 10)) return later();
        lost = 0;
        restartAll();
      });
    };
    const waiting = new MutationObserver(() => {
      if (scope.querySelector(expanded)) return;
      waiting.disconnect();
      later();
    });
    const busy = () => {
      const active = document.activeElement;
      return (
        !!scope.querySelector(expanded) || (!!active && !scope.contains(active) && !!active.closest(overlay))
      );
    };
    const restart = () => {
      if (scope.querySelector(expanded)) {
        waiting.observe(scope, { subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });
        return;
      }
      if (busy()) return void later();
      if (shown.current !== 0) return to(0);
      if (mustAdvance(0)) return to(1);
    };

    const remove = addRow({
      targets: watched.current,
      resized: () => {
        const now = widths();
        const grew = now.some((width, i) => width > (settled.current[i] ?? width) + 0.5);
        settled.current = now;
        if (grew) return restart();
        if (mustAdvance(shown.current)) return to(shown.current + 1);
      },
      restart,
    });
    return () => {
      remove();
      waiting.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the helpers only read refs
  }, [element]);

  return Math.min(level, max);
}
