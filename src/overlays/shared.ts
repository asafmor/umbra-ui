// What Popover, Tooltip and Menu share: the placement type and the open state.
import { useCallback, useContext, useEffect, useState, type RefObject } from 'react';
import { PopoverContext, useSlottedContext } from 'react-aria-components';
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
    setState({ open, opener: open ? (document.activeElement as HTMLElement | null) : state.opener });
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

/**
 * Writes on `overlay` the `--umbra-*` properties that reach `from` and not the overlay. An overlay is
 * rendered in a portal, outside the element it was opened from, so a token the app set on an ancestor of
 * that element (in a stylesheet or a `style`) would not reach it: `--umbra-menu-bg` on a toolbar would
 * colour nothing. What a scope sets (`UmbraScope`, a `TopBar`) the overlay has already, and is not written.
 *
 * Read once, when the overlay opens.
 * ponytail: a token that changes while the overlay is open is not followed; observe the anchor's
 * ancestors if an app needs that.
 */
export function carryTokens(from: Element, overlay: HTMLElement) {
  const there = getComputedStyle(from);
  const here = getComputedStyle(overlay);
  const names = new Set<string>();
  // Browsers list custom properties in one of the two: Chromium in the style map, Firefox in the declaration.
  const map = (
    from as Element & { computedStyleMap?: (() => Iterable<[string, unknown]>) | undefined }
  ).computedStyleMap?.();
  if (map) for (const [name] of map) names.add(name);
  for (let i = 0; i < there.length; i++) names.add(there.item(i));
  const carried: [string, string][] = [];
  for (const name of names) {
    // `--umbra-slot-min-height` is a layout child's own (plan/decisions/07-customisation.md).
    if (!name.startsWith('--umbra-') || name === '--umbra-slot-min-height') continue;
    const value = there.getPropertyValue(name);
    if (value !== here.getPropertyValue(name)) carried.push([name, value]);
  }
  for (const [name, value] of carried) overlay.style.setProperty(name, value);
}

/**
 * The ref of every popover of the library (`Popover`, `Menu`, the list of a `Select`, the suggestions
 * of a `SearchField`): it flips when its content is cut (`useFlipWhenCut`), and it takes the tokens of
 * the place it was opened from (`carryTokens`). `anchor` is what it is anchored to, when that is not
 * the trigger React Aria knows.
 */
export function usePopoverRef(maxHeight?: number, anchor?: RefObject<Element | null>) {
  const flipWhenCut = useFlipWhenCut(maxHeight);
  const trigger = useSlottedContext(PopoverContext)?.triggerRef;
  const from = anchor ?? trigger;
  return useCallback(
    (element: HTMLElement | null) => {
      if (element && from?.current) carryTokens(from.current, element);
      return flipWhenCut(element);
    },
    [flipWhenCut, from],
  );
}
