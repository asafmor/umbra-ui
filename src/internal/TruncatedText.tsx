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
import { useOverlayLayer } from '../overlays/shared';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { defined } from '../utils/defined';

/** Milliseconds before the tip shows on hover, as for `Tooltip`. Keyboard focus shows it at once. */
const HOVER_DELAY = 500;

/**
 * Milliseconds the tip stays after the pointer has left its element: time to move the pointer onto the
 * tip, which stays while the pointer is over it (WCAG 1.4.13), as for `Tooltip`.
 */
export const TIP_CLOSE_DELAY = 200;

/**
 * Internal: the tooltip the library opens by itself, against an element that is not a `Tooltip`
 * trigger. The one place such a tooltip is rendered: it takes the layer and the container every overlay
 * takes (`useOverlayLayer`), so inside a modal it is in the modal's layer. The owner holds the open
 * state and its timer, and is told what the tip wants: `onOpenChange(true)` while the pointer is over
 * the tip, `(false, TIP_CLOSE_DELAY)` when it leaves, `(false)` on Escape.
 */
/** Closes the tip that is open, if any. */
let closeOpenTip: (() => void) | undefined;

export function Tip({
  anchor,
  open,
  onOpenChange,
  children,
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onOpenChange: (open: boolean, delay?: number) => void;
  children: ReactNode;
}) {
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('tooltip');
  const change = useRef(onOpenChange);
  useEffect(() => {
    change.current = onOpenChange;
  });
  useEffect(() => {
    if (!open) return;
    // One tip at a time: this one closes the one that was open.
    const close = () => change.current(false);
    closeOpenTip?.();
    closeOpenTip = close;
    // Escape dismisses it, wherever the focus is, and nothing else: a modal around it stays open.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      if (closeOpenTip === close) closeOpenTip = undefined;
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);
  // React Aria's tooltip reads its state from this context, which a `TooltipTrigger` would supply.
  const state = useMemo(
    () => ({
      isOpen: open,
      shouldSkipAnimation: false,
      open: () => change.current(true),
      close: (immediate?: boolean) => change.current(false, immediate ? 0 : TIP_CLOSE_DELAY),
    }),
    [open],
  );
  return (
    <TooltipTriggerStateContext value={state}>
      <AriaTooltip
        {...scope}
        {...defined(layer)}
        triggerRef={anchor}
        placement="top"
        offset={6}
        data-umbra="tooltip"
        data-umbra-overlay=""
        {...defined({ className: tooltipStyles.root })}
        style={scope.style}
      >
        <span data-part="body" className={tooltipStyles.body}>
          {children}
        </span>
      </AriaTooltip>
    </TooltipTriggerStateContext>
  );
}

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
  const [open, setOpen] = useState(false);
  const latest = useRef(when);
  useEffect(() => {
    latest.current = when;
  });
  // One timer: a later change replaces a pending one.
  const timer = useRef<number>(undefined);
  const later = (change: () => void, delay = 0) => {
    window.clearTimeout(timer.current);
    if (delay) timer.current = window.setTimeout(change, delay);
    else change();
  };

  useEffect(() => {
    const el = element.current;
    if (!el) return;
    // The control around the element: a link, a button or a row. Never a container that only holds the
    // focus for its content (a modal's dialog), or every tip inside it would answer to any focus.
    const owner =
      el.closest<HTMLElement>('a[href], button, [tabindex]:not([role="dialog"], [role="alertdialog"])') ?? el;
    const show = (delay: number) => later(() => setOpen(latest.current(el)), delay);
    const hide = () => later(() => setOpen(false));
    const onEnter = () => show(HOVER_DELAY);
    // Not at once: the pointer may be on its way to the tip. When it is already there, the tip has been
    // told (React reports that before this event arrives), and it is the tip that closes.
    const onLeave = (event: PointerEvent) => {
      const onTip = (event.relatedTarget as Element | null)?.closest?.('[data-umbra="tooltip"]');
      if (!onTip) later(() => setOpen(false), TIP_CLOSE_DELAY);
    };
    // The focus is on the control itself, or on a link or button inside the element.
    const onFocus = (event: FocusEvent) => {
      const target = event.target as Element;
      if ((target === owner || el.contains(target)) && target.matches(':focus-visible')) show(0);
    };
    const hovered = hoverOwner ? owner : el;
    hovered.addEventListener('pointerenter', onEnter);
    hovered.addEventListener('pointerleave', onLeave);
    hovered.addEventListener('pointerdown', hide);
    owner.addEventListener('focusin', onFocus);
    owner.addEventListener('focusout', hide);
    return () => {
      window.clearTimeout(timer.current);
      hovered.removeEventListener('pointerenter', onEnter);
      hovered.removeEventListener('pointerleave', onLeave);
      hovered.removeEventListener('pointerdown', hide);
      owner.removeEventListener('focusin', onFocus);
      owner.removeEventListener('focusout', hide);
    };
  }, [element, hoverOwner]);

  const empty = content === undefined || content === null || content === false || content === '';
  return (
    <Tip
      anchor={element}
      open={open && !empty}
      onOpenChange={(next, delay) => later(() => setOpen(next), delay)}
    >
      {content}
    </Tip>
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
  children?: ReactNode | undefined;
  part?: string | undefined;
  /** The text sits under its control's hit area (the value of a `Select`): hovering the control shows the tip. */
  hoverOwner?: boolean | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
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
