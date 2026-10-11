import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Dialog, DialogTrigger, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import { Button, ButtonBase, type ButtonProps } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { useNarrow } from '../internal/useNarrow';
import { LayoutProvider } from '../layout/useSlot';
import { Icon, IconSlot } from '../provider/icons';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { warn } from '../utils/dev';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Modal.module.css';
import { OverlayContainerContext } from '../internal/contexts';
import { focusableIn, moveFocusFrom } from '../internal/focus';
import { useReturnFocusOnClose, useOpenState } from './shared';
import { defined } from '../utils/defined';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'dialog' | 'alertdialog' | 'drawer';

interface ModalContextValue {
  open: boolean;
  /** Closing goes through `onRequestClose`. */
  setOpen: (open: boolean) => void;
  /** True for a modal that was open when it mounted: it appears without the enter animation. */
  instant: boolean;
  variant: ModalVariant;
  side: 'start' | 'end' | 'bottom';
  size: ModalSize;
  height: 'auto' | 'fill';
  dismissOnEscape: boolean;
  dismissOnOutsidePress: boolean;
  initialFocusRef: RefObject<HTMLElement | null> | undefined;
  headingLevel: number;
  ariaLabel: string | undefined;
  titleId: string;
  descriptionId: string;
}
const ModalContext = createContext<ModalContextValue | null>(null);
function useModal() {
  const modal = useContext(ModalContext);
  if (!modal) throw new Error('Modal blocks must be rendered inside <Modal.Root>.');
  return modal;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface ModalRootProps {
  /** Controlled open state. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Called before the modal closes, however it was asked to. Return `false` to keep it open (unsaved changes). */
  onRequestClose?: (() => boolean | void) | undefined;
  /** `alertdialog` asks for a decision: no outside press, no close button. `drawer` slides in from an edge. */
  variant?: ModalVariant | undefined;
  /** The edge a `drawer` is attached to. */
  side?: 'start' | 'end' | 'bottom' | undefined;
  /** Width. `full` fills the window minus a margin. A bottom drawer is always as wide as the window. */
  size?: ModalSize | undefined;
  /** `auto`: as tall as the content, up to the window. `fill`: always the full available height. */
  height?: 'auto' | 'fill' | undefined;
  dismissOnEscape?: boolean | undefined;
  /** Default: true, and always false for an `alertdialog`. */
  dismissOnOutsidePress?: boolean | undefined;
  /** Focused when the modal opens, instead of its first control. An element marked `data-autofocus` works too. */
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  /** Heading level of the title. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  /** Accessible name, for a modal without a title. */
  'aria-label'?: string | undefined;
  children?: ReactNode | undefined;
}

function Root({
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  onRequestClose,
  variant = 'dialog',
  side = 'end',
  size = 'md',
  height = 'auto',
  dismissOnEscape = true,
  dismissOnOutsidePress = true,
  initialFocusRef,
  headingLevel = 2,
  'aria-label': ariaLabel,
  children,
}: ModalRootProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  // A modal inside a modal opens one render after it mounts. Two that open in the same render would
  // each make the other inert; opened in turn, the inner one is on top.
  const nested = !!useContext(ModalContext);
  const [ready, setReady] = useState(!nested);
  useEffect(() => setReady(true), []);
  const wanted = controlled ?? uncontrolled;
  const open = wanted && ready;
  const [instant, setInstant] = useState(wanted);
  if (instant && !wanted) setInstant(false);
  const titleId = useId();
  const descriptionId = useId();
  const setOpen = (next: boolean) => {
    if (next === open) return;
    if (!next && onRequestClose?.() === false) return;
    setUncontrolled(next);
    onOpenChange?.(next);
  };
  return (
    <ModalContext
      value={{
        open,
        setOpen,
        instant,
        variant,
        side,
        size,
        height,
        dismissOnEscape,
        dismissOnOutsidePress: dismissOnOutsidePress && variant !== 'alertdialog',
        initialFocusRef,
        headingLevel,
        ariaLabel,
        titleId,
        descriptionId,
      }}
    >
      {children}
    </ModalContext>
  );
}

/** Wraps the button that opens the modal. Focus returns to it on close. */
function Trigger({ children }: { children: ReactNode }) {
  const modal = useModal();
  return (
    <DialogTrigger isOpen={modal.open} onOpenChange={modal.setOpen}>
      {children}
    </DialogTrigger>
  );
}

/** The dimmed backdrop, in a portal. Renders its children only while the modal is open. */
function Overlay({ className, style, children }: BlockProps) {
  const modal = useModal();
  // The portal is outside the scope's element, so the backdrop repeats its density, context and tokens.
  const scope = useScopeAttributes();
  const narrow = useNarrow();
  // Overlays opened from inside the modal render into the backdrop: above the modal, and not inert.
  const [backdrop, setBackdrop] = useState<HTMLElement | null>(null);
  return (
    <ModalOverlay
      {...scope}
      ref={setBackdrop}
      isOpen={modal.open}
      onOpenChange={modal.setOpen}
      isDismissable={modal.dismissOnOutsidePress}
      isKeyboardDismissDisabled={!modal.dismissOnEscape}
      data-umbra="modal-backdrop"
      data-variant={modal.variant}
      data-side={modal.variant === 'drawer' ? modal.side : undefined}
      data-narrow={narrow || undefined}
      data-instant={modal.instant || undefined}
      {...defined({ className: cx(styles.backdrop, className) })}
      style={{ ...scope.style, ...style }}
    >
      <OverlayContainerContext value={backdrop}>{children}</OverlayContainerContext>
    </ModalOverlay>
  );
}

const focusable =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** The panel and its dialog element. Traps focus, and gives it back when the modal closes. */
function Content({ className, style, children }: BlockProps) {
  const modal = useModal();
  const narrow = useNarrow();
  const dialog = useRef<HTMLElement>(null);
  // Focus leaves the modal when it starts to close, not when its exit animation has ended.
  useReturnFocusOnClose(modal.open, dialog);
  // The title and description can be left out or replaced; the dialog only points at ones that exist.
  const [has, setHas] = useState({ title: true, description: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- checked after every render on purpose; an equal value does not render again
  useLayoutEffect(() => {
    const title = !!document.getElementById(modal.titleId);
    const description = !!document.getElementById(modal.descriptionId);
    if (title !== has.title || description !== has.description) setHas({ title, description });
  });

  // What had the focus when the modal opened: the trigger, or a control of the modal below.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  // The modal's own trigger, for a modal that opened without a press (`defaultOpen`, or by the app):
  // nothing had the focus then, so there is nothing to give it back to.
  const ownTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const id = dialog.current?.id;
    ownTrigger.current = id
      ? document.querySelector<HTMLElement>('[aria-controls="' + CSS.escape(id) + '"]')
      : null;
  }, []);
  useEffect(
    () => () => {
      // React Aria gives the focus back, except when a press on the backdrop took it first and the modal
      // below caught it, or when nothing had it. Then it sits on nothing, or on a dialog element: send
      // it to the opener, the modal's trigger, or the first control of the page. Never left on nothing.
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active && active !== document.body && !active.matches('[role$="dialog"]')) return;
        const from = [opener, ownTrigger.current].find((el) => el?.isConnected && el !== document.body);
        (from ?? focusableIn(document).find((el) => el.tabIndex >= 0))?.focus();
      });
    },
    [opener],
  );

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (!modal.ariaLabel && !document.getElementById(modal.titleId))
      warn('a Modal needs a `title` or an `aria-label`.');
    const first = (root: Element | null | undefined) =>
      root?.matches(focusable) ? (root as HTMLElement) : root?.querySelector<HTMLElement>(focusable);
    // A control that focused itself (`autoFocus`) keeps the focus.
    if (document.activeElement !== el && el.contains(document.activeElement)) return;
    const target =
      first(modal.initialFocusRef?.current) ??
      first(el.querySelector('[data-autofocus]')) ??
      // An alert dialog starts on its first footer action: by convention the least destructive one.
      (modal.variant === 'alertdialog' ? first(el.querySelector('[data-part="footer"]')) : null) ??
      [...el.querySelectorAll<HTMLElement>(focusable)].find((c) => !c.closest('[data-part="header"]')) ??
      first(el);
    target?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the modal opens
  }, []);

  return (
    <AriaModal
      data-umbra="modal"
      data-variant={modal.variant}
      data-side={modal.variant === 'drawer' ? modal.side : undefined}
      data-size={modal.size}
      data-height={modal.height}
      data-narrow={narrow || undefined}
      {...defined({ className: cx(styles.panel, className), style })}
    >
      <Dialog
        ref={dialog}
        role={modal.variant === 'alertdialog' ? 'alertdialog' : 'dialog'}
        {...defined({
          'aria-label': modal.ariaLabel,
          'aria-labelledby': modal.ariaLabel || !has.title ? undefined : modal.titleId,
          'aria-describedby': has.description ? modal.descriptionId : undefined,
          className: styles.dialog,
        })}
      >
        {/* Layout children inside the modal belong to it, not to the layout it was opened from. */}
        <LayoutProvider value={null}>{children}</LayoutProvider>
      </Dialog>
    </AriaModal>
  );
}

function Title({ className, style, children }: BlockProps) {
  const modal = useModal();
  return createElement(
    `h${modal.headingLevel}`,
    { id: modal.titleId, 'data-part': 'title', className: cx(styles.title, className), style },
    children,
  );
}

function Description({ className, style, children }: BlockProps) {
  const modal = useModal();
  return (
    <p
      id={modal.descriptionId}
      data-part="description"
      className={cx(styles.description, className)}
      style={style}
    >
      {children}
    </p>
  );
}

export interface ModalCloseProps extends Omit<ButtonProps, 'href' | 'type' | 'children'> {
  /** A label makes it a text button (for a footer). Without one it is the close icon button. */
  children?: ReactNode | undefined;
  /** Accessible name of the icon button. */
  label?: string | undefined;
}

/** A button that closes the modal, after its own `onPress`. */
function Close({ children, label = 'Close', onPress, ...button }: ModalCloseProps) {
  const modal = useModal();
  const press = () => {
    onPress?.();
    modal.setOpen(false);
  };
  if (children !== undefined)
    return (
      <Button {...button} onPress={press}>
        {children}
      </Button>
    );
  return (
    <IconButton
      icon={<Icon name="close" />}
      label={label}
      variant="neutral"
      tooltip={false}
      onPress={press}
      className={button.className}
      style={button.style}
    />
  );
}

export interface ModalHeaderProps extends BlockProps {
  /** Leading icon or image. */
  icon?: ReactNode | undefined;
  title?: ReactNode | undefined;
  /** A line under the title. It is also what a screen reader hears as the modal's description. */
  description?: ReactNode | undefined;
  /** Default: false, and true for an `alertdialog`. */
  hideClose?: boolean | undefined;
  /** Accessible name of the close button. */
  closeLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        title?: Part<BlockProps> | undefined;
        description?: Part<BlockProps> | undefined;
        close?: Part<ModalCloseProps> | undefined;
      }
    | undefined;
}

function Header({
  icon,
  title,
  description,
  hideClose,
  closeLabel,
  parts,
  className,
  style,
  children,
}: ModalHeaderProps) {
  const modal = useModal();
  return (
    <div data-part="header" className={cx(styles.header, className)} style={style}>
      {children ?? (
        <>
          {icon &&
            renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>)}
          <div className={styles.titles}>
            {title !== undefined && renderPart(parts?.title, { children: title }, (p) => <Title {...p} />)}
            {description !== undefined &&
              renderPart(parts?.description, { children: description }, (p) => <Description {...p} />)}
          </div>
        </>
      )}
      {/* Last, so it is the last focus stop of the header. */}
      {!(hideClose ?? modal.variant === 'alertdialog') &&
        renderPart(parts?.close, { label: closeLabel }, (p) => <Close {...p} />)}
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

export interface ModalNavProps extends BlockProps {
  /** Text of the toggle that shows the navigation below the minimum window. */
  label?: string | undefined;
}

/** A side column at the start. Below the minimum window it moves behind a toggle above the body. */
function Nav({ label = 'Sections', className, style, children }: ModalNavProps) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  const shown = !narrow || open;
  // Choosing a section shows it: the list closes again.
  const onClick = (event: MouseEvent) => {
    if (
      narrow &&
      (event.target as Element).closest('a, button:not([aria-expanded]), [role="tab"], [role="option"]')
    ) {
      // The chosen control is about to be hidden with the list: focus goes to the toggle above it.
      moveFocusFrom(
        event.currentTarget,
        event.currentTarget.parentElement?.querySelector<HTMLElement>(':scope > button[aria-expanded]'),
      );
      setOpen(false);
    }
  };
  return (
    <div
      data-part="nav"
      data-narrow={narrow || undefined}
      data-open={(narrow && open) || undefined}
      className={cx(styles.nav, className)}
      style={style}
    >
      {narrow && (
        <ButtonBase umbra="button" variant="neutral" fullWidth expanded={open} onPress={() => setOpen(!open)}>
          <span className={styles.navLabel}>{label}</span>
          <Icon name="chevronDown" />
        </ButtonBase>
      )}
      {/* Listens to the clicks of the controls inside it. */}
      <div hidden={!shown} className={styles.navList} onClickCapture={onClick}>
        {children}
      </div>
    </div>
  );
}

export interface ModalBodyProps
  extends BlockProps, Pick<ScrollAreaProps, 'axis' | 'scrollbar' | 'fade' | 'onReachEnd'> {
  /** `none` for edge-to-edge tables and media. */
  padding?: 'default' | 'none' | undefined;
}

/** The content. It scrolls inside the modal; the page never does. */
function Body({ padding = 'default', className, children, ...scroll }: ModalBodyProps) {
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

export interface ModalProps
  extends
    Omit<ModalRootProps, 'children'>,
    Pick<ModalHeaderProps, 'icon' | 'title' | 'description' | 'hideClose' | 'closeLabel'>,
    BlockProps {
  /** A button that opens the modal. Leave out to control it with `open`. */
  trigger?: ReactNode | undefined;
  /** Tabs or filters that stay fixed under the header. */
  toolbar?: ReactNode | undefined;
  /** Side navigation at the start: the panel becomes two columns. */
  nav?: ReactNode | undefined;
  /** Text of the toggle that shows `nav` below the minimum window. */
  navLabel?: string | undefined;
  /** Status and actions, fixed below the body. */
  footer?: ReactNode | undefined;
  /** `none` for an edge-to-edge body. */
  padding?: 'default' | 'none' | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        header?: Part<ModalHeaderProps> | undefined;
        title?: Part<BlockProps> | undefined;
        description?: Part<BlockProps> | undefined;
        close?: Part<ModalCloseProps> | undefined;
        toolbar?: Part<{ children: ReactNode }> | undefined;
        nav?: Part<ModalNavProps> | undefined;
        body?: Part<ModalBodyProps> | undefined;
        footer?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/**
 * A panel over a dimmed page, for a focused task. Focus stays inside it and the page behind is inert
 * until it closes. Its body scrolls inside; the page never does.
 */
export function Modal({
  trigger,
  icon,
  title,
  description,
  hideClose,
  closeLabel,
  toolbar,
  nav,
  navLabel,
  footer,
  padding,
  parts,
  className,
  style,
  children,
  ...root
}: ModalProps) {
  const headerProps: ModalHeaderProps = {
    icon,
    title,
    description,
    hideClose,
    closeLabel,
    parts: { title: parts?.title, description: parts?.description, close: parts?.close },
  };
  return (
    <Root {...root}>
      {trigger && <Trigger>{trigger}</Trigger>}
      <Overlay>
        <Content className={className} style={style}>
          {renderPart(parts?.header, headerProps, (p) => (
            <Header {...p} />
          ))}
          {renderPart(parts?.toolbar, { children: toolbar }, (p) => p.children && <Toolbar {...p} />)}
          {renderPart(parts?.nav, { label: navLabel, children: nav }, (p) => p.children && <Nav {...p} />)}
          {renderPart(parts?.body, { padding, children }, (p) => (
            <Body {...p} />
          ))}
          {renderPart(parts?.footer, { children: footer }, (p) => p.children && <Footer {...p} />)}
        </Content>
      </Overlay>
    </Root>
  );
}

Modal.Root = Root;
Modal.Trigger = Trigger;
Modal.Overlay = Overlay;
Modal.Content = Content;
Modal.Header = Header;
Modal.Title = Title;
Modal.Description = Description;
Modal.Toolbar = Toolbar;
Modal.Nav = Nav;
Modal.Body = Body;
Modal.Footer = Footer;
Modal.Close = Close;

export interface ConfirmDialogProps
  extends
    Pick<ModalProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'trigger' | 'icon' | 'size'>,
    BlockProps {
  title: ReactNode;
  /** What will happen, in a sentence. */
  description?: ReactNode | undefined;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  /** `danger` makes the confirm button a danger button. */
  tone?: 'default' | 'danger' | undefined;
  /**
   * Called on confirm. When it returns a promise, the confirm button shows `loading` until it settles:
   * the dialog closes when it resolves and stays open when it rejects.
   */
  onConfirm?: (() => void | Promise<unknown>) | undefined;
  onCancel?: (() => void) | undefined;
  /** What a screen reader hears while the confirm action runs. */
  loadingLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        cancel?: Part<ButtonProps> | undefined;
        confirm?: Part<ButtonProps> | undefined;
      }
    | undefined;
}

/**
 * The confirm step before an action that cannot be undone. An alert dialog: it opens with the focus
 * on Cancel, and cannot be dismissed by a press outside it.
 */
export function ConfirmDialog({
  open: controlled,
  defaultOpen,
  onOpenChange,
  trigger,
  icon,
  size = 'sm',
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
  loadingLabel,
  parts,
  className,
  style,
  children,
}: ConfirmDialogProps) {
  const [isOpen, setOpen] = useOpenState(controlled, defaultOpen, onOpenChange);
  const [loading, setLoading] = useState(false);
  const run = async (action: (() => void | Promise<unknown>) | undefined) => {
    try {
      const result = action?.();
      if (result instanceof Promise) {
        setLoading(true);
        await result;
      }
      setOpen(false);
    } catch {
      // The dialog stays open; the app shows what went wrong (for example in `children`).
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      variant="alertdialog"
      open={isOpen}
      // While the confirm action runs, nothing closes the dialog.
      onOpenChange={(next) => loading || setOpen(next)}
      trigger={trigger}
      icon={icon}
      size={size}
      title={title}
      description={description}
      footer={
        <>
          {renderPart(
            parts?.cancel,
            { children: cancelLabel, disabled: loading, onPress: () => run(onCancel) },
            (p) => (
              <Button {...p} />
            ),
          )}
          {renderPart(
            parts?.confirm,
            {
              children: confirmLabel,
              variant: tone === 'danger' ? 'danger' : 'primary',
              loading,
              loadingLabel,
              onPress: () => run(onConfirm),
            },
            (p) => (
              <Button {...p} />
            ),
          )}
        </>
      }
      className={className}
      style={style}
      parts={children ? undefined : { body: null }}
    >
      {children}
    </Modal>
  );
}
