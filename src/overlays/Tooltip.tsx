import { isValidElement, useContext, type CSSProperties, type ReactNode } from 'react';
import { Focusable, Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import { OverflowMenuContext } from '../internal/contexts';
import { useScopeAttributes, useShortcut } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import { toAriaPlacement, type OverlayPlacement } from './shared';
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
  const hint = useShortcut(shortcut, undefined);
  const inMenu = useContext(OverflowMenuContext);
  const empty = (node: ReactNode) => node === undefined || node === null || node === false || node === '';
  // Inside an overflow menu the control is a menu row, which shows its own label and key hint.
  if (inMenu || (empty(content) && empty(title) && !hint)) return children;

  const child = isValidElement<{ disabled?: boolean }>(children) ? children : null;
  const wrapped = wrap ?? child?.props.disabled === true;
  const trigger = wrapped ? (
    // The control inside is inert, so the wrapper stands in for it: it reads as a disabled button with
    // the control's name, and the tooltip is its description.
    <Focusable>
      <span role="button" aria-disabled="true" data-part="wrapper" className={styles.wrapper}>
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
      closeDelay={0}
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDisabled={disabled}
    >
      {trigger}
      <AriaTooltip
        {...scope}
        placement={toAriaPlacement(placement)}
        offset={offset}
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
