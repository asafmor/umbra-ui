// Apart from `shared.ts`: this needs React Aria's popover, which a `Card` or a tooltip must not load.
import { useCallback, type RefObject } from 'react';
import { PopoverContext, useSlottedContext } from 'react-aria-components';
import { carryTokens, useFlipWhenCut } from './shared';

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
