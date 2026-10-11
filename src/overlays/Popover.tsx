import {
  createContext,
  createElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  DialogTrigger,
  OverlayArrow,
  OverlayTriggerStateContext,
  Popover as AriaPopover,
  PopoverContext as AriaPopoverContext,
  Pressable,
  useSlottedContext,
} from 'react-aria-components';
import { ButtonBase } from '../basics/Button';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { Icon } from '../provider/icons';
import { focusableIn } from '../internal/focus';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { warn } from '../utils/dev';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Popover.module.css';
import {
  toAriaPlacement,
  useFlipWhenCut,
  useOpenState,
  useOverlayLayer,
  type OverlayPlacement,
} from './shared';
import { defined } from '../utils/defined';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface PopoverContextValue {
  titleId: string;
  close: () => void;
}
const PopoverContext = createContext<PopoverContextValue | null>(null);
function usePopover() {
  const popover = useContext(PopoverContext);
  if (!popover) throw new Error('Popover blocks must be rendered inside <Popover.Content>.');
  return popover;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

interface OpenProps {
  /** Controlled state. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface PopoverRootProps extends OpenProps {
  /** A `Popover.Trigger` and a `Popover.Content`. */
  children?: ReactNode | undefined;
}

function Root({ open, defaultOpen, onOpenChange, children }: PopoverRootProps) {
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      {children}
    </DialogTrigger>
  );
}

/** The control that opens the popover: an umbra-ui button, or a plain `<button>`. */
function Trigger({ children }: { children?: ReactNode | undefined }) {
  return isValidElement(children) && typeof children.type === 'string' ? (
    <Pressable>{children as React.ReactElement<React.DOMAttributes<HTMLElement>, string>}</Pressable>
  ) : (
    children
  );
}

export interface PopoverContentProps extends OpenProps, Omit<BlockProps, 'children'>, RootAttributes {
  /** The element to open against, when there is no `Popover.Trigger`. Use it with `open`. */
  anchorRef?: RefObject<Element | null> | undefined;
  /** Side of the anchor and alignment along it. It flips to the other side to stay in the window. */
  placement?: OverlayPlacement | undefined;
  /** Gap between the anchor and the panel, in pixels. */
  offset?: number | undefined;
  /** Gives the panel the width of its anchor. */
  matchAnchorWidth?: boolean | undefined;
  /** Tallest the panel may be, in pixels. It is never taller than the room in the window; the body scrolls. */
  maxHeight?: number | undefined;
  /** `large` is a wide panel with room for a toolbar and a footer. */
  size?: 'default' | 'large' | undefined;
  /** A small pointer towards the anchor. */
  arrow?: boolean | undefined;
  /** Accessible name, when there is no title. */
  'aria-label'?: string | undefined;
  /** Closes when keyboard focus leaves the panel. Escape and a press outside always close it. */
  dismissOnBlur?: boolean | undefined;
  /** The blocks. A function receives `close`. */
  children?: ReactNode | ((close: () => void) => ReactNode) | undefined;
}

const ARROW = 6;

function Content({
  anchorRef,
  open,
  defaultOpen,
  onOpenChange,
  placement = 'bottom start',
  offset = 4,
  matchAnchorWidth = false,
  maxHeight,
  size = 'default',
  arrow = false,
  'aria-label': label,
  dismissOnBlur = true,
  className,
  style,
  children,
  ...rest
}: PopoverContentProps) {
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('popover');
  // Under a `Popover.Root` the state is the root's; alone (with `anchorRef`) the content keeps its own.
  const root = useContext(OverlayTriggerStateContext);
  const fromTrigger = useSlottedContext(AriaPopoverContext);
  const [ownOpen, setOwnOpen] = useOpenState(open, defaultOpen, onOpenChange);
  const isOpen = root ? root.isOpen : ownOpen;
  const setOpen = root ? root.setOpen : setOwnOpen;
  const anchor = anchorRef ?? fromTrigger?.triggerRef;
  const panel = useRef<HTMLElement>(null);
  const cap = maxHeight ?? (size === 'large' ? undefined : 480);
  const flipWhenCut = useFlipWhenCut(cap);
  const setPanel = useCallback(
    (element: HTMLElement | null) => {
      panel.current = element;
      return flipWhenCut(element);
    },
    [flipWhenCut],
  );
  const titleId = useId();
  // The title can be left out or replaced; the dialog is only named by one that exists.
  const [hasTitle, setHasTitle] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- checked after every render on purpose; an equal value does not render again
  useLayoutEffect(() => setHasTitle(isOpen && !!document.getElementById(titleId)));

  // True from the start of a pointer press to its click. Focus that moves because of a press is the
  // press's business (see below), not a reason of its own to close.
  const pressing = useRef(false);
  const latest = useRef({ setOpen, anchor, dismissOnBlur });
  useEffect(() => {
    latest.current = { setOpen, anchor, dismissOnBlur };
  });
  useEffect(() => {
    if (!isOpen) return;
    const el = panel.current;
    // Focus moves in. React Aria returns it to where it was when the popover closes.
    if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    if (!label && !document.getElementById(titleId) && !fromTrigger)
      warn('a Popover without a title or a trigger needs an `aria-label`.');

    // The page stays usable, so nothing covers it to catch a press: listen for one instead. A press in
    // another overlay (a menu opened from inside this popover) is not outside, and while a modal overlay
    // is open above this one (it makes the rest inert) nothing here reacts.
    const covered = () => !!panel.current?.closest('[inert]');
    const inside = (target: EventTarget | null) =>
      target instanceof Element &&
      (!!target.closest('[data-umbra-overlay]') || !!latest.current.anchor?.current?.contains(target));
    // A press that starts inside and ends outside (a drag, a text selection) is not a press outside.
    let startedInside = false;
    const onPointerDown = (event: PointerEvent) => {
      startedInside = inside(event.target);
      pressing.current = true;
    };
    const onPointerEnd = () => {
      // After the click that follows, if one does.
      window.setTimeout(() => (pressing.current = false));
    };
    // The page's own handler for the press runs first: a button that toggles this popover closes it
    // there, and closing it here before that would make the button open it again.
    let timer = 0;
    const onClick = (event: MouseEvent) => {
      if (covered() || startedInside || inside(event.target)) return;
      timer = window.setTimeout(() => latest.current.setOpen(false));
    };
    // Escape with focus in the panel is handled by the panel. This is for focus elsewhere on the page.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !covered()) latest.current.setOpen(false);
    };
    // The panel is rendered at the end of the page, but in the tab order it sits right after its
    // trigger: Shift+Tab from its start goes to the trigger, Tab from its end to what follows the
    // trigger.
    const onTab = (event: KeyboardEvent) => {
      const panelEl = panel.current;
      const trigger = latest.current.anchor?.current;
      if (event.key !== 'Tab' || event.defaultPrevented || !(trigger instanceof HTMLElement)) return;
      if (!panelEl || !(event.target instanceof Node) || !panelEl.contains(event.target)) return;
      const stops = focusableIn(panelEl).filter((stop) => stop.tabIndex >= 0);
      const active = document.activeElement;
      const atEdge = event.shiftKey
        ? active === panelEl || active === stops[0]
        : active === panelEl
          ? stops.length === 0
          : active === stops.at(-1);
      if (!atEdge) return;
      const page = focusableIn(document).filter((stop) => stop.tabIndex >= 0 && !panelEl.contains(stop));
      const own = page.find((stop) => trigger === stop || trigger.contains(stop)) ?? trigger;
      const after = page.find(
        (stop) =>
          !trigger.contains(stop) && trigger.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      event.preventDefault();
      event.stopPropagation();
      (event.shiftKey ? own : (after ?? own)).focus();
      if (latest.current.dismissOnBlur) latest.current.setOpen(false);
    };
    // On the window, as the key is caught, so before React Aria's own handler on the document: that one
    // sends Shift+Tab to the control before the trigger, and to nothing when the trigger is the first.
    window.addEventListener('keydown', onTab, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerEnd, true);
    document.addEventListener('pointercancel', onPointerEnd, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      pressing.current = false;
      window.removeEventListener('keydown', onTab, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerEnd, true);
      document.removeEventListener('pointercancel', onPointerEnd, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the rest is read when the event happens
  }, [isOpen]);

  const popover = { titleId, close: () => setOpen(false) };
  return (
    <AriaPopover
      {...scope}
      {...defined(layer)}
      ref={setPanel}
      {...defined({ triggerRef: anchor })}
      isOpen={isOpen}
      onOpenChange={setOpen}
      // Not modal: the page behind stays usable, and there is no backdrop.
      isNonModal
      placement={toAriaPlacement(placement)}
      offset={offset + (arrow ? ARROW : 0)}
      {...defined({ maxHeight: cap })}
      // Without a backdrop this only decides whether focus leaving the panel closes it.
      shouldCloseOnInteractOutside={(element) =>
        dismissOnBlur &&
        !pressing.current &&
        !anchor?.current?.contains(element) &&
        !element.closest('[data-umbra-overlay]')
      }
      // The trigger points at the panel with `aria-controls`, so the panel carries that id.
      render={(props) => (
        <div
          {...passThrough(rest)}
          {...(props as React.JSX.IntrinsicElements['div'])}
          id={fromTrigger?.id ?? (passThrough(rest).id as string | undefined)}
          role="dialog"
          tabIndex={-1}
          // A `label` names the dialog; the trigger's id, which React Aria adds by itself, would win over it.
          aria-labelledby={
            label ? undefined : (props as { 'aria-labelledby'?: string | undefined })['aria-labelledby']
          }
        />
      )}
      {...defined({
        'aria-label': label,
        'aria-labelledby': label ? undefined : hasTitle ? titleId : fromTrigger?.['aria-labelledby'],
      })}
      data-umbra="popover"
      data-umbra-overlay=""
      data-size={size}
      data-match-width={matchAnchorWidth || undefined}
      {...defined({ className: cx(styles.root, className) })}
      style={{ ...scope.style, ...style }}
    >
      {arrow && (
        <OverlayArrow data-part="arrow" {...defined({ className: styles.arrow })}>
          <svg width={ARROW * 2} height={ARROW} viewBox="0 0 12 6" aria-hidden="true">
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
      )}
      <PopoverContext value={popover}>
        <div className={styles.frame}>
          {typeof children === 'function' ? children(popover.close) : children}
        </div>
      </PopoverContext>
    </AriaPopover>
  );
}

export interface PopoverHeaderProps extends BlockProps {
  title?: ReactNode | undefined;
  /** Second line, in the body font. */
  subtitle?: ReactNode | undefined;
  /** Trailing controls, for example the popover's main action. */
  actions?: ReactNode | undefined;
  /** Shows a close button. */
  closeButton?: boolean | undefined;
  /** Accessible name of the close button. */
  closeLabel?: string | undefined;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
}

function Header({
  title,
  subtitle,
  actions,
  closeButton = false,
  closeLabel = 'Close',
  headingLevel = 2,
  className,
  style,
  children,
}: PopoverHeaderProps) {
  const popover = usePopover();
  return (
    <div data-part="header" className={cx(styles.header, className)} style={style}>
      {children ?? (
        <>
          <div className={styles.titles}>
            {title !== undefined &&
              createElement(
                `h${headingLevel}`,
                { id: popover.titleId, 'data-part': 'title', className: styles.title },
                title,
              )}
            {subtitle && (
              <div data-part="subtitle" className={styles.subtitle}>
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div data-part="actions" className={styles.actions}>
              {actions}
            </div>
          )}
        </>
      )}
      {closeButton && (
        <ButtonBase umbra="icon-button" variant="ghost" iconOnly label={closeLabel} onPress={popover.close}>
          <Icon name="close" />
        </ButtonBase>
      )}
    </div>
  );
}

function Toolbar({ className, style, children }: BlockProps) {
  return (
    <div data-part="toolbar" className={cx(styles.toolbar, className)} style={style}>
      {children}
    </div>
  );
}

export interface PopoverBodyProps
  extends BlockProps, Pick<ScrollAreaProps, 'axis' | 'scrollbar' | 'fade' | 'onReachEnd'> {
  /** `none` for edge-to-edge lists and tables. */
  padding?: 'default' | 'none' | undefined;
}

function Body({ padding = 'default', className, children, ...scroll }: PopoverBodyProps) {
  return (
    <ScrollArea {...scroll} data-part="body" data-padding={padding} className={cx(styles.body, className)}>
      {children}
    </ScrollArea>
  );
}

function Footer({ className, style, children }: BlockProps) {
  return (
    <div data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </div>
  );
}

export interface PopoverProps
  extends
    Omit<PopoverContentProps, 'children'>,
    Pick<PopoverHeaderProps, 'title' | 'subtitle' | 'actions' | 'closeButton' | 'closeLabel'>,
    Pick<PopoverBodyProps, 'padding'> {
  /** The control that opens it: an umbra-ui button, or a plain `<button>`. Leave it out to use `anchorRef`. */
  trigger?: ReactNode | undefined;
  /** Filters or tabs that stay fixed above the body. */
  toolbar?: ReactNode | undefined;
  /** Status or actions fixed below the body. */
  footer?: ReactNode | undefined;
  /** The body. A function receives `close`. */
  children?: ReactNode | ((close: () => void) => ReactNode) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        header?: Part<PopoverHeaderProps> | undefined;
        toolbar?: Part<{ children: ReactNode }> | undefined;
        body?: Part<PopoverBodyProps> | undefined;
        footer?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/**
 * An anchored panel without a backdrop: the page behind it stays usable. It keeps the density, context
 * tint and tokens of the place it was opened from.
 */
export function Popover({
  trigger,
  title,
  subtitle,
  actions,
  closeButton,
  closeLabel,
  toolbar,
  footer,
  padding,
  parts,
  children,
  open,
  defaultOpen,
  onOpenChange,
  ...content
}: PopoverProps) {
  const state = { open, defaultOpen, onOpenChange };
  const headerProps: PopoverHeaderProps = { title, subtitle, actions, closeButton, closeLabel };
  const panel = (
    <Content {...content} {...(trigger ? null : state)}>
      {(close) => (
        <>
          {renderPart(
            parts?.header,
            headerProps,
            (p) => (p.title !== undefined || p.actions || p.closeButton) && <Header {...p} />,
          )}
          {renderPart(
            parts?.toolbar,
            { children: toolbar },
            (p) => p.children && <Toolbar>{p.children}</Toolbar>,
          )}
          {renderPart(
            parts?.body,
            { padding, children: typeof children === 'function' ? children(close) : children },
            (p) => (
              <Body {...p} />
            ),
          )}
          {renderPart(
            parts?.footer,
            { children: footer },
            (p) => p.children && <Footer>{p.children}</Footer>,
          )}
        </>
      )}
    </Content>
  );
  if (!trigger) return panel;
  return (
    <Root {...state}>
      <Trigger>{trigger}</Trigger>
      {panel}
    </Root>
  );
}

Popover.Root = Root;
Popover.Trigger = Trigger;
Popover.Content = Content;
Popover.Header = Header;
Popover.Toolbar = Toolbar;
Popover.Body = Body;
Popover.Footer = Footer;
