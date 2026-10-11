import { isValidElement, useContext, type CSSProperties, type ReactNode } from 'react';
import { Focusable, Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import { OverflowMenuContext } from '../internal/contexts';
import { useScopeAttributes, useShortcut } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import { toAriaPlacement, useOverlayLayer, type OverlayPlacement } from './shared';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** The control the tooltip describes: any umbra-ui control, or a plain focusable element. */
  children: ReactNode;
  /** The text. Nothing is shown when it is empty (and there is no `title` or `shortcut`). */
  content?: ReactNode;
  /** A heading above the text, for a rich tooltip. */
  title?: ReactNode;
  /** Id of a shortcut in the provider's list: its keys are shown as a hint. */
  shortcut?: string;
  placement?: OverlayPlacement;
  /** Milliseconds before it shows on hover. Keyboard focus shows it at once. */
  delay?: number;
  /**
   * Milliseconds it stays after the pointer has left the control: time to move the pointer onto the
   * tooltip, which stays while the pointer is over it.
   */
  closeDelay?: number;
  /** Gap between the control and the tooltip, in pixels. */
  offset?: number;
  /** Controlled state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Never shows. */
  disabled?: boolean;
  /**
   * Puts the control in a focusable wrapper that carries the tooltip, so it also shows for a control
   * that takes no pointer or focus events. Defaults to the control's own `disabled` prop.
   */
  wrap?: boolean;
  /** Replace or hide named pieces. */
  parts?: {
    title?: Part<{ children: ReactNode }>;
    body?: Part<{ children: ReactNode }>;
    hint?: Part<{ children: string }>;
  };
  /** On the tooltip itself. */
  className?: string;
  style?: CSSProperties;
}

/**
 * A short description of a control, shown on hover and on keyboard focus. Text only: it never holds
 * anything the user could interact with.
 */
export function Tooltip({
  children,
  content,
  title,
  shortcut,
  placement = 'top',
  delay = 500,
  closeDelay = 200,
  offset = 6,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  wrap,
  parts,
  className,
  style,
}: TooltipProps) {
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('tooltip');
  const hint = useShortcut(shortcut, undefined);
  const inMenu = useContext(OverflowMenuContext);
  const empty = (node: ReactNode) => node === undefined || node === null || node === false || node === '';
  // Inside an overflow menu the control is a menu row, which shows its own label and key hint.
  if (inMenu || (empty(content) && empty(title) && !hint)) return children;

  const child = isValidElement<{ disabled?: boolean }>(children) ? children : null;
  const standIn = (wrapper: HTMLSpanElement | null) => {
    const control = wrapper?.firstElementChild;
    if (!wrapper || !(control instanceof HTMLElement)) return;
    wrapper.setAttribute('aria-label', control.getAttribute('aria-label') ?? control.textContent ?? '');
    control.inert = true;
  };
  const wrapped = wrap ?? child?.props.disabled === true;
  const trigger = wrapped ? (
    // The wrapper stands in for the control: it reads as a disabled button with the control's name, and
    // the tooltip is its description. The control itself is made inert, so there is one button, not two.
    <Focusable>
      <span ref={standIn} role="button" aria-disabled="true" data-part="wrapper" className={styles.wrapper}>
        {children}
      </span>
    </Focusable>
  ) : child && typeof child.type === 'string' ? (
    <Focusable>{child as React.ReactElement<React.DOMAttributes<Element>, string>}</Focusable>
  ) : (
    children
  );
  return (
    <TooltipTrigger
      delay={delay}
      // Long enough to move the pointer from the control onto the tooltip, which then stays while the
      // pointer is over it (WCAG 1.4.13, hoverable).
      closeDelay={closeDelay}
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDisabled={disabled}
    >
      {trigger}
      <AriaTooltip
        {...scope}
        {...layer}
        placement={toAriaPlacement(placement)}
        offset={offset}
        // React Aria keeps what carries this out of the inert page behind a modal.
        data-react-aria-top-layer="true"
        data-umbra="tooltip"
        data-umbra-overlay=""
        data-rich={!empty(title) || undefined}
        className={cx(styles.root, className)}
        style={{ ...scope.style, ...style }}
      >
        {!empty(title) &&
          renderPart(parts?.title, { children: title }, (p) => (
            <strong data-part="title" className={styles.title}>
              {p.children}
            </strong>
          ))}
        {!empty(content) &&
          renderPart(parts?.body, { children: content }, (p) => (
            <span data-part="body" className={styles.body}>
              {p.children}
            </span>
          ))}
        {hint &&
          renderPart(parts?.hint, { children: hint }, (p) => (
            <kbd data-part="hint" className={styles.hint}>
              {p.children}
            </kbd>
          ))}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
