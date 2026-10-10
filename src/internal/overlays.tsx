// Minimal internal overlays for Milestone 0, built on React Aria and not exported. The public Popover,
// Menu and Tooltip components come in Milestone 1 (plan/decisions/02-behaviour-base.md).
import { createContext, useEffect, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  Dialog,
  DialogTrigger,
  Popover as AriaPopover,
  Tooltip as AriaTooltip,
  TooltipTrigger,
} from 'react-aria-components';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { cx } from '../utils/parts';
import styles from './overlays.module.css';

/**
 * Set inside an overflow menu, where buttons render as menu rows with their icon and label and close
 * the menu when pressed.
 */
export const OverflowMenuContext = createContext<{ close: () => void } | null>(null);

/** Shows `content` on hover and focus of the React Aria button or link in `children`. */
export function Tip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const scope = useScopeAttributes();
  if (!content) return children;
  return (
    <TooltipTrigger delay={500} closeDelay={0}>
      {children}
      <AriaTooltip offset={6} className={styles.overlay}>
        <div {...scope} className={styles.tooltip}>
          {content}
        </div>
      </AriaTooltip>
    </TooltipTrigger>
  );
}

interface PopoverProps {
  /** Accessible name of the popover. */
  label: string;
  placement?: 'bottom start' | 'bottom end' | 'bottom';
  /** Anchor and open state, for a popover that is not opened by a trigger child. */
  triggerRef?: RefObject<Element | null>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Applied to the panel, for example to give it the width of its anchor. */
  className?: string;
  style?: CSSProperties;
  children: ReactNode | ((close: () => void) => ReactNode);
}

/** An anchored panel without a backdrop. Keeps the density, context and tokens of where it was opened. */
export function Popover({
  label,
  placement = 'bottom start',
  triggerRef,
  open,
  onOpenChange,
  className,
  style,
  children,
}: PopoverProps) {
  const scope = useScopeAttributes();
  return (
    <AriaPopover
      placement={placement}
      offset={4}
      triggerRef={triggerRef}
      isOpen={open}
      onOpenChange={onOpenChange}
      className={styles.overlay}
    >
      <Dialog aria-label={label} className={styles.dialog}>
        {({ close }) => (
          <div {...scope} className={cx(styles.popover, className)} style={{ ...scope.style, ...style }}>
            {typeof children === 'function' ? children(close) : children}
          </div>
        )}
      </Dialog>
    </AriaPopover>
  );
}

/** A trigger (a React Aria button) and the popover it opens. */
export function PopoverTrigger({ children }: { children: ReactNode }) {
  return <DialogTrigger>{children}</DialogTrigger>;
}

/** The body of an overflow menu: its buttons render as rows, and pressing one closes the menu. */
export function MenuList({ close, children }: { close: () => void; children: ReactNode }) {
  return (
    <OverflowMenuContext value={{ close }}>
      <div className={styles.menu}>{children}</div>
    </OverflowMenuContext>
  );
}

/** A "more" button that opens `children` (buttons) as a menu. Used when actions no longer fit in a row. */
export function ActionsOverflow({
  label,
  trigger,
  children,
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <PopoverTrigger>
      {trigger}
      <Popover label={label} placement="bottom end">
        {(close) => <MenuList close={close}>{children}</MenuList>}
      </Popover>
    </PopoverTrigger>
  );
}

/** Set by a container (the TopBar) to make buttons with `collapseTo="icon"` show their icon only. */
export const ForceCollapseContext = createContext(false);

/**
 * For a popover opened from a plain element. React Aria moves focus into the popover only after its
 * enter transition, and the page behind is inert meanwhile, so for a moment focus is nowhere. Escape
 * must still close the popover then, and focus must return to `target` once the page is interactive.
 */
export function useEscapeToClose(
  open: boolean,
  close: () => void,
  target: () => HTMLElement | null | undefined,
) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      const started = performance.now();
      const refocus = () => {
        const element = target();
        if (!element || (document.activeElement && document.activeElement !== document.body)) return;
        element.focus();
        if (document.activeElement !== element && performance.now() - started < 1000)
          requestAnimationFrame(refocus);
      };
      refocus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `close` and `target` are read when the key is pressed
  }, [open]);
}
