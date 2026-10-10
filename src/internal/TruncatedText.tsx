import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { Tooltip as AriaTooltip, TooltipTriggerStateContext } from 'react-aria-components';
import tooltipStyles from '../overlays/Tooltip.module.css';
import { useScopeAttributes } from '../provider/UmbraProvider';

/** Milliseconds before the tip shows on hover, as for `Tooltip`. Keyboard focus shows it at once. */
const HOVER_DELAY = 500;

/** True when the element's text is cut short by its ellipsis. */
const isTruncated = (el: HTMLElement) => el.scrollWidth > el.clientWidth;

/**
 * Internal: a tooltip for an element that is not a control, such as a line of text or a meter. It shows
 * while the pointer rests on the element, and while the element (or the link or button around it) has
 * keyboard focus. `when` is asked at that moment only, so nothing is measured while rendering.
 *
 * The tip repeats what assistive technology already reads from the element, so it is not wired up as a
 * description. Returns the tooltip, to render beside the element.
 */
export function useHoverTip(
  element: RefObject<HTMLElement | null>,
  content: ReactNode,
  when: (element: HTMLElement) => boolean = () => true,
  /** Hovering the link or button around the element counts, for an element that the control covers. */
  hoverOwner = false,
) {
  const scope = useScopeAttributes();
  const [open, setOpen] = useState(false);
  const latest = useRef(when);
  useEffect(() => {
    latest.current = when;
  });

  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const owner = el.closest<HTMLElement>('a[href], button, [tabindex]') ?? el;
    let timer: number | undefined;
    const show = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setOpen(latest.current(el)), delay);
    };
    const hide = () => {
      window.clearTimeout(timer);
      setOpen(false);
    };
    const onEnter = () => show(HOVER_DELAY);
    // `focusin` also reports a link or button inside the element.
    const onFocus = (event: FocusEvent) => (event.target as Element).matches(':focus-visible') && show(0);
    const hovered = hoverOwner ? owner : el;
    hovered.addEventListener('pointerenter', onEnter);
    hovered.addEventListener('pointerleave', hide);
    hovered.addEventListener('pointerdown', hide);
    owner.addEventListener('focusin', onFocus);
    owner.addEventListener('focusout', hide);
    return () => {
      window.clearTimeout(timer);
      hovered.removeEventListener('pointerenter', onEnter);
      hovered.removeEventListener('pointerleave', hide);
      hovered.removeEventListener('pointerdown', hide);
      owner.removeEventListener('focusin', onFocus);
      owner.removeEventListener('focusout', hide);
    };
  }, [element, hoverOwner]);

  // Escape dismisses it, wherever the focus is.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const empty = content === undefined || content === null || content === false || content === '';
  // React Aria's tooltip reads its state from this context, which a `TooltipTrigger` would supply.
  const state = useMemo(
    () => ({
      isOpen: open && !empty,
      shouldSkipAnimation: false,
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [open, empty],
  );
  return (
    <TooltipTriggerStateContext value={state}>
      <AriaTooltip
        {...scope}
        triggerRef={element}
        placement="top"
        offset={6}
        data-umbra="tooltip"
        data-umbra-overlay=""
        className={tooltipStyles.root}
        style={scope.style}
      >
        <span data-part="body" className={tooltipStyles.body}>
          {content}
        </span>
      </AriaTooltip>
    </TooltipTriggerStateContext>
  );
}

/** Internal: the tooltip with the full text of an element, shown only while its ellipsis cuts the text short. */
export function useTruncatedTip(element: RefObject<HTMLElement | null>, text: ReactNode, hoverOwner = false) {
  return useHoverTip(element, text, isTruncated, hoverOwner);
}

/** Internal: one line of text that ends in an ellipsis when it does not fit, and then shows the whole text in a tooltip. */
export function TruncatedText({
  children,
  part,
  hoverOwner,
  className,
  style,
}: {
  children?: ReactNode;
  part?: string;
  /** The text sits under its control's hit area (the value of a `Select`): hovering the control shows the tip. */
  hoverOwner?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const tip = useTruncatedTip(ref, children, hoverOwner);
  return (
    <>
      <span
        ref={ref}
        data-part={part}
        className={className}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, ...style }}
      >
        {children}
      </span>
      {tip}
    </>
  );
}
