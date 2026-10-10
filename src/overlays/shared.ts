// What Popover, Tooltip and Menu share: the placement type and the open state.
import { useCallback, useState } from 'react';

export type OverlaySide = 'top' | 'bottom' | 'start' | 'end';
export type OverlayAlign = 'start' | 'center' | 'end';
/** The side of the anchor an overlay opens on, and how it lines up with the anchor along that side. */
export type OverlayPlacement = OverlaySide | `${OverlaySide} ${OverlayAlign}`;

/** Our placement in React Aria's words: beside the anchor, `start` and `end` alignment are top and bottom. */
export function toAriaPlacement(placement: OverlayPlacement) {
  const [side, align = 'center'] = placement.split(' ') as [OverlaySide, OverlayAlign?];
  if (align === 'center') return side;
  const vertical = side === 'top' || side === 'bottom';
  return `${side} ${vertical ? align : align === 'start' ? 'top' : 'bottom'}` as
    `${'top' | 'bottom'} ${'start' | 'end'}` | `${'start' | 'end'} ${'top' | 'bottom'}`;
}

/** Open state that the app may control (`open`) or leave to the component (`defaultOpen`). */
export function useOpenState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [own, setOwn] = useState(defaultOpen ?? false);
  const isOpen = open ?? own;
  const setOpen = (next: boolean) => {
    if (next === isOpen) return;
    setOwn(next);
    onOpenChange?.(next);
  };
  return [isOpen, setOpen] as const;
}

/**
 * A ref for a React Aria popover, so that it flips to the roomier side of its anchor whenever its
 * content would be cut, and not only when it opens.
 *
 * React Aria decides the side from the popover's height at that moment, then caps the height at the
 * room on that side. Content that arrives or grows afterwards (the body of a layout-collapsed card,
 * suggestions that finish loading) cannot push the popover past the cap, so its real height is never
 * measured: the popover stays on the short side with its content cut. Here, when the popover is seen
 * to have grown into a cap that the window set, the cap is lifted. The popover takes its real height,
 * React Aria measures that, flips if the other side has more room, and sets a new cap.
 *
 * `maxHeight` is the popover's own limit, as given to React Aria.
 */
export function useFlipWhenCut(maxHeight?: number) {
  return useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      // The cap at the previous observation: `null` for none, `undefined` before the first.
      let previous: number | null | undefined;
      let frame = 0;
      const read = () => {
        const cap = parseFloat(element.style.maxHeight);
        const fromWindow = !Number.isNaN(cap) && (maxHeight === undefined || cap < maxHeight);
        return { cap: Number.isNaN(cap) ? null : cap, cut: fromWindow && element.offsetHeight >= cap - 1 };
      };
      const observer = new ResizeObserver(() => {
        const { cap, cut } = read();
        // A cap that has just changed was set by React Aria after it measured the real height: leave it.
        const grewIntoIt = cut && (previous === undefined || previous === cap);
        previous = cap;
        cancelAnimationFrame(frame);
        if (!grewIntoIt) return;
        // In the next frame, not here: a size changed in the observer is reported as a ResizeObserver
        // loop, and React Aria's own observer would miss it.
        frame = requestAnimationFrame(() => {
          const now = read();
          if (now.cut && now.cap === cap)
            element.style.maxHeight = maxHeight === undefined ? '' : `${maxHeight}px`;
        });
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    },
    [maxHeight],
  );
}
