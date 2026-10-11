// What Popover, Tooltip and Menu share: the placement type and the open state.
import { useCallback, useContext, useEffect, useState, type RefObject } from 'react';
import { OverlayContainerContext } from '../internal/contexts';

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

/**
 * Gives focus back to what had it before an overlay opened, as soon as the overlay starts to close.
 * React Aria gives it back when the overlay leaves the page, which is after its exit animation: until
 * then focus stays in a field that is going away, and a bare-key shortcut pressed in that time is
 * taken for typing and ignored. `inside` is the overlay's element. Shared by `Modal` and
 * `CommandPalette`.
 */
export function useReturnFocusOnClose(open: boolean, inside: RefObject<Element | null>) {
  const [state, setState] = useState<{ open: boolean; opener: HTMLElement | null }>({
    open: false,
    opener: null,
  });
  // Read while rendering the change to open, before the overlay mounts and takes the focus.
  if (state.open !== open) {
    // On a server there is no document, and nothing to give the focus back to.
    const active = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    setState({ open, opener: open ? active : state.opener });
  }
  useEffect(() => {
    if (open) return;
    // In the next frame: by then React Aria has stopped holding focus inside the closing overlay.
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || !inside.current?.contains(active)) return;
      if (state.opener?.isConnected && state.opener !== document.body) state.opener.focus();
      else active.blur();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the overlay opens or closes
  }, [open]);
}

/**
 * Props for a React Aria popover or tooltip: its layer (`--umbra-layer-*`), and where it is rendered,
 * which is inside the modal it was opened from when there is one. Every overlay of the library takes
 * these, so none is left under a modal or in the inert page behind it.
 *
 * `spotlight` is the layer of a `Spotlight`, between the modal and the command palette. A spotlight
 * takes its container from its target, not from here: it is not rendered inside what it points at.
 * While one is open, the popovers and tooltips of its target are lifted above it by the base
 * stylesheet (`[data-umbra-spotlight]`, src/styles/index.css).
 */
export function useOverlayLayer(layer: 'popover' | 'tooltip' | 'spotlight'): {
  UNSTABLE_portalContainer: HTMLElement | undefined;
  // Stated, so that the name of React Aria's attribute below is not written into the published types.
  [attribute: `data-${string}`]: string | undefined;
} {
  const container = useContext(OverlayContainerContext);
  return {
    'data-umbra-layer': layer,
    UNSTABLE_portalContainer: container ?? undefined,
    // React Aria keeps what carries this out of the inert page behind a modal. A popover is kept out by
    // its own dialog; a tooltip and a spotlight have none.
    'data-react-aria-top-layer': layer === 'popover' ? undefined : 'true',
  };
}
