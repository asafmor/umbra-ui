// What Popover, Tooltip and Menu share: the placement type and the open state.
import { useState } from 'react';

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
