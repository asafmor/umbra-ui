import {
  createContext,
  createElement,
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
import { createPortal } from 'react-dom';
import { Popover as AriaPopover } from 'react-aria-components';
import { Button } from '../basics/Button';
import { focusableIn, focusLost } from '../internal/focus';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { defined } from '../utils/defined';
import { warn } from '../utils/dev';
import { cx, renderPart, type Part } from '../utils/parts';
import { toAriaPlacement, useOpenState, useOverlayLayer, type OverlayPlacement } from './shared';
import styles from './Spotlight.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

/** What a spotlight points at: a ref, a CSS selector, or a function that returns the element. */
export type SpotlightTarget = RefObject<Element | null> | string | (() => Element | null | undefined);

function resolveTarget(target: SpotlightTarget | undefined): Element | null {
  if (!target) return null;
  if (typeof target === 'function') return target() ?? null;
  if (typeof target !== 'string') return target.current;
  try {
    return document.querySelector(target);
  } catch {
    // Not a selector: the same as a target that is not there.
    return null;
  }
}

/**
 * Makes everything inert but `keep` and what is around it on the way up to the page. What something
 * else already made inert (a modal behind) is left alone, and so is what is added afterwards: a menu
 * or a tooltip that the target opens.
 */
function inertOutside(keep: Element[]) {
  const made: HTMLElement[] = [];
  for (const kept of keep) {
    for (let el: Element | null = kept; el?.parentElement; el = el.parentElement) {
      for (const sibling of el.parentElement.children) {
        if (
          sibling instanceof HTMLElement &&
          !sibling.inert &&
          !keep.some((k) => sibling.contains(k)) &&
          !sibling.matches('head, [data-live-announcer], [data-react-aria-top-layer]')
        ) {
          sibling.inert = true;
          made.push(sibling);
        }
      }
    }
  }
  return () => made.forEach((el) => (el.inert = false));
}

interface Found {
  el: Element;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Counts the changes of place, so the callout is placed again after each. */
  moves: number;
}

interface SpotlightContextValue {
  root: HTMLElement | null;
  ring: RefObject<HTMLDivElement | null>;
  target: Element;
  moves: number;
  interactive: boolean;
  titleId: string;
  bodyId: string;
  /** The title and the body can be left out; the dialog only points at ones that are there. */
  has: { title: boolean; body: boolean };
  mark: (part: 'title' | 'body', present: boolean) => void;
  dismissable: boolean;
  /** Closes the spotlight if it is `dismissable`. */
  dismiss: () => void;
}
const SpotlightContext = createContext<SpotlightContextValue | null>(null);
function useSpotlight() {
  const spotlight = useContext(SpotlightContext);
  if (!spotlight) throw new Error('Spotlight blocks must be rendered inside <Spotlight.Root>.');
  return spotlight;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface SpotlightRootProps extends BlockProps, RootAttributes {
  /** The element to light. */
  target?: SpotlightTarget | undefined;
  /** Controlled state. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Whether the target can be used. By default nothing but the callout can: the target is shown, not
   * offered. With `true` the target takes presses and keys, and what it opens is above the dim.
   */
  interactive?: boolean | undefined;
  /** Escape and a press on the dim close the spotlight. */
  dismissable?: boolean | undefined;
  /** Space between the target and the ring, in pixels. */
  padding?: number | undefined;
  /** Corner radius of the cut-out: pixels or any CSS length. Defaults to the card radius. */
  radius?: number | string | undefined;
  /**
   * Called when the target is not in the page, or leaves it. Without it the spotlight closes. Nothing
   * is dimmed while there is no target.
   */
  onTargetLost?: (() => void) | undefined;
}

/**
 * The dim, the cut-out with its ring, and the state. Its children are the callout. Rendered into the
 * modal the target is in, or else at the end of the page.
 */
function Root({
  target,
  open,
  defaultOpen,
  onOpenChange,
  interactive = false,
  dismissable = true,
  padding = 4,
  radius,
  onTargetLost,
  className,
  style,
  children,
  ...rest
}: SpotlightRootProps) {
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('spotlight');
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  const [found, setFound] = useState<Found | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const ring = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const [has, setHas] = useState({ title: false, body: false });
  const mark = useCallback(
    (part: 'title' | 'body', present: boolean) =>
      setHas((now) => (now[part] === present ? now : { ...now, [part]: present })),
    [],
  );

  const latest = useRef({ target, onTargetLost, setOpen, dismissable });
  const measureNow = useRef<(() => void) | undefined>(undefined);
  useLayoutEffect(() => {
    const moved = latest.current.target !== target;
    latest.current = { target, onTargetLost, setOpen, dismissable };
    // Another target (the next step of a tour): found before the paint, so the callout and the ring
    // change together.
    if (moved) measureNow.current?.();
  });

  // Follows the target: its place is read once per frame for as long as the spotlight is open. Not
  // only after a resize, a scroll or a transition: an app can move it with none of them (from a timer).
  // One rectangle per frame, and no render while it is the same.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    let frame = 0;
    let el: Element | null = null;
    let lostFor: SpotlightTarget | undefined | null = null;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
      const wanted = latest.current.target;
      const next = resolveTarget(wanted);
      if (!next?.isConnected || next.getClientRects().length === 0) {
        el = null;
        setFound(null);
        // Once per target: an app that keeps the spotlight open is not asked again and again.
        if (lostFor !== wanted) {
          lostFor = wanted;
          // A selector with a typing mistake, or an attribute the target's component does not pass on.
          warn(
            `Spotlight: the target ${typeof wanted === 'string' ? `"${wanted}" ` : ''}is not in the page, or is not shown.`,
          );
          (latest.current.onTargetLost ?? (() => latest.current.setOpen(false)))();
        }
        return;
      }
      lostFor = null;
      if (next !== el) {
        el = next;
        // The page never scrolls, but the target may be out of sight inside a scroll area.
        next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      const box = next.getBoundingClientRect();
      setFound((prev) =>
        prev?.el === next &&
        prev.x === box.x &&
        prev.y === box.y &&
        prev.width === box.width &&
        prev.height === box.height
          ? prev
          : {
              el: next,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              moves: (prev?.moves ?? 0) + 1,
            },
      );
    };
    measureNow.current = measure;
    measure();
    return () => {
      measureNow.current = undefined;
      cancelAnimationFrame(frame);
      setFound(null);
      // Focus goes back to where it was. In the next frame: by then the page is usable again.
      requestAnimationFrame(() => {
        if (!focusLost()) return;
        const back = opener?.isConnected && opener !== document.body ? opener : null;
        (back ?? focusableIn(document).find((stop) => stop.tabIndex >= 0))?.focus({ preventScroll: true });
      });
    };
  }, [isOpen]);

  const targetEl = found?.el;
  // Everything but the callout is inert, and the target too unless it is `interactive`.
  useEffect(() => {
    if (!root || !targetEl) return;
    // What the target opens is lifted above the dim (src/styles/index.css).
    document.documentElement.setAttribute('data-umbra-spotlight', '');
    const restore = inertOutside(interactive ? [root, targetEl] : [root]);
    return () => {
      document.documentElement.removeAttribute('data-umbra-spotlight');
      restore();
    };
  }, [root, targetEl, interactive]);

  // Escape, with the focus in the callout, in the target or on nothing. Caught before anything else:
  // the modal the target is in must not take it for itself.
  useEffect(() => {
    if (!root) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !latest.current.dismissable) return;
      const active = document.activeElement;
      const ours = !active || active === document.body || root.contains(active) || targetEl?.contains(active);
      if (!ours) return;
      event.preventDefault();
      event.stopPropagation();
      latest.current.setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [root, targetEl]);

  if (!isOpen || !found) return null;
  const dismiss = () => {
    if (dismissable) setOpen(false);
  };
  const box = {
    left: found.x - padding,
    top: found.y - padding,
    width: found.width + 2 * padding,
    height: found.height + 2 * padding,
  };
  // An interactive target is left free: four shields around it. Otherwise one covers the window.
  const shields: CSSProperties[] = interactive
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, box.top) },
        { top: box.top + box.height, left: 0, right: 0, bottom: 0 },
        { top: box.top, left: 0, width: Math.max(0, box.left), height: box.height },
        { top: box.top, left: box.left + box.width, right: 0, height: box.height },
      ]
    : [{ inset: 0 }];
  return createPortal(
    <div
      {...passThrough(rest)}
      {...scope}
      data-umbra-layer={layer['data-umbra-layer']}
      data-react-aria-top-layer={layer['data-react-aria-top-layer']}
      ref={setRoot}
      data-umbra="spotlight"
      // A press in the spotlight is not a press outside a popover of the page.
      data-umbra-overlay=""
      data-interactive={interactive || undefined}
      className={cx(styles.root, className)}
      style={{ ...scope.style, ...style }}
    >
      {shields.map((shield, index) => (
        <div
          key={index}
          data-part="shield"
          className={styles.shield}
          style={shield}
          // The focus stays where it is: a press on the dim must not drop it.
          onMouseDown={(event) => event.preventDefault()}
          onClick={dismiss}
        />
      ))}
      <div ref={ring} data-part="ring" className={styles.ring} style={{ ...box, borderRadius: radius }} />
      <SpotlightContext
        value={{
          root,
          ring,
          target: found.el,
          moves: found.moves,
          interactive,
          titleId,
          bodyId,
          has,
          mark,
          dismissable,
          dismiss,
        }}
      >
        {children}
      </SpotlightContext>
    </div>,
    // Inside the modal the target is in: above it, and not in the page that the modal made inert.
    found.el.closest('[data-umbra="modal-backdrop"]') ?? document.body,
  );
}

export interface SpotlightCalloutProps extends BlockProps {
  /** Side of the target and alignment along it. It flips to the other side to stay in the window. */
  placement?: OverlayPlacement | undefined;
  /** Gap between the ring and the callout, in pixels. */
  offset?: number | undefined;
  /** A change of it moves the focus to the callout again: the step of a tour. */
  stepKey?: string | number | undefined;
  /** Accessible name, when there is no title. */
  'aria-label'?: string | undefined;
}

/** The least distance between the callout and the edge of the window, in pixels. */
const EDGE = 8;

/** The panel beside the target: a dialog, placed like a popover and kept inside the window. */
function Callout({
  placement = 'end',
  offset = 12,
  stepKey,
  'aria-label': label,
  className,
  style,
  children,
}: SpotlightCalloutProps) {
  const spotlight = useSpotlight();
  const callout = useRef<HTMLElement>(null);
  const { has } = spotlight;
  const mounted = !!spotlight.root;
  // Focus goes to the callout when it opens and at every step: a screen reader starts on its text.
  useEffect(() => {
    callout.current?.focus({ preventScroll: true });
  }, [mounted, spotlight.target, stepKey]);

  // React Aria flips the callout to the roomier side, but where neither side has room it lets it
  // leave the window. It is moved back in then, over the edge of the target: never out of sight.
  useLayoutEffect(() => {
    const el = callout.current;
    if (!el) return;
    const keepInside = () => {
      el.style.translate = '';
      const box = el.getBoundingClientRect();
      const shift = (start: number, end: number, size: number) =>
        Math.max(EDGE - start, 0) + Math.min(size - EDGE - end, 0);
      const x = shift(box.left, box.right, window.innerWidth);
      let y = shift(box.top, box.bottom, window.innerHeight);
      // Moved back in along the line, it lies over the target: it goes below it, or above, where one
      // of the two has the room. Where none has, it stays over the target's edge.
      const target = spotlight.ring.current?.getBoundingClientRect();
      if (x && target && box.top + y < target.bottom && box.bottom + y > target.top) {
        const below = target.bottom + offset;
        const above = target.top - offset - box.height;
        if (below + box.height <= window.innerHeight - EDGE) y = below - box.top;
        else if (above >= EDGE) y = above - box.top;
      }
      if (x || y) el.style.translate = `${x}px ${y}px`;
    };
    keepInside();
    // Again after React Aria has placed it anew: the window or the callout changed size.
    let frame = 0;
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(keepInside);
    };
    const observer = new ResizeObserver(soon);
    observer.observe(el);
    window.addEventListener('resize', soon);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', soon);
    };
  }, [mounted, spotlight.moves, placement, offset]);
  if (!spotlight.root) return null;
  return (
    <AriaPopover
      ref={callout}
      triggerRef={spotlight.ring}
      isOpen
      // What React Aria still closes by itself: its hidden "Dismiss" button, for screen readers.
      onOpenChange={(next) => next || spotlight.dismiss()}
      data-dismissable={spotlight.dismissable || undefined}
      // Not modal for React Aria: the spotlight itself decides what is inert and what closes it.
      isNonModal
      isKeyboardDismissDisabled
      shouldCloseOnInteractOutside={() => false}
      placement={toAriaPlacement(placement)}
      offset={offset}
      // React Aria places a popover again when its anchor changes size, not when it moves. A change
      // of this number makes it do so; it is far too small to change where the callout goes.
      arrowBoundaryOffset={(spotlight.moves % 2) / 1000}
      UNSTABLE_portalContainer={spotlight.root}
      render={(props) => (
        <div
          {...(props as React.JSX.IntrinsicElements['div'])}
          role="dialog"
          tabIndex={-1}
          aria-modal={spotlight.interactive ? undefined : true}
          // Here, not below: React Aria does not pass a description on.
          aria-describedby={has.body ? spotlight.bodyId : undefined}
        />
      )}
      {...defined({
        'aria-label': label,
        'aria-labelledby': label || !has.title ? undefined : spotlight.titleId,
        className: cx(styles.callout, className),
        style,
      })}
      data-part="callout"
    >
      {children}
    </AriaPopover>
  );
}

export interface SpotlightTitleProps extends BlockProps {
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}

/** Tells the callout that its title or body is there, for as long as it is. */
function usePresent(part: 'title' | 'body') {
  const { mark } = useSpotlight();
  useEffect(() => {
    mark(part, true);
    return () => mark(part, false);
  }, [mark, part]);
}

function Title({ headingLevel = 2, className, style, children }: SpotlightTitleProps) {
  const spotlight = useSpotlight();
  usePresent('title');
  return createElement(
    `h${headingLevel}`,
    { id: spotlight.titleId, 'data-part': 'title', className: cx(styles.title, className), style },
    children,
  );
}

function Body({ className, style, children }: BlockProps) {
  const spotlight = useSpotlight();
  usePresent('body');
  return (
    <div id={spotlight.bodyId} data-part="body" className={cx(styles.body, className)} style={style}>
      {children}
    </div>
  );
}

function Footer({ className, style, children }: BlockProps) {
  return (
    <div data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </div>
  );
}

/** One step of a tour. */
export interface SpotlightStep {
  target: SpotlightTarget;
  title?: ReactNode | undefined;
  body?: ReactNode | undefined;
  /** For this step, instead of the spotlight's own. */
  placement?: OverlayPlacement | undefined;
  interactive?: boolean | undefined;
}

export interface SpotlightProps
  extends
    Omit<SpotlightRootProps, 'children' | 'onTargetLost'>,
    Pick<SpotlightCalloutProps, 'placement' | 'offset' | 'aria-label'> {
  title?: ReactNode | undefined;
  /** The text of the callout. */
  children?: ReactNode | undefined;
  /** Buttons in place of the built-in ones. */
  actions?: ReactNode | undefined;
  /** A tour: one target, title and text per step, with Back, Next and Skip. */
  steps?: SpotlightStep[] | undefined;
  /** The step shown, from 0. Controlled. */
  step?: number | undefined;
  defaultStep?: number | undefined;
  onStepChange?: ((step: number) => void) | undefined;
  /** Called when the last step, or a spotlight without steps, is ended with its button. */
  onFinish?: (() => void) | undefined;
  /** Heading level of the title. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  nextLabel?: string | undefined;
  previousLabel?: string | undefined;
  skipLabel?: string | undefined;
  /** The button of the last step, and of a spotlight without steps. */
  doneLabel?: string | undefined;
  /** The text that says where the tour is: "2 of 5". */
  progressLabel?: ((current: number, total: number) => string) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        title?: Part<SpotlightTitleProps> | undefined;
        body?: Part<BlockProps> | undefined;
        progress?: Part<{ current: number; total: number; children: ReactNode }> | undefined;
        /** The buttons. */
        actions?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/**
 * Dims everything but one element and explains it in a callout beside it: a coach mark, or with
 * `steps` a tour. Nothing but the callout can be used unless the target is `interactive`.
 */
export function Spotlight({
  target,
  title,
  children,
  actions,
  steps,
  step,
  defaultStep = 0,
  onStepChange,
  onFinish,
  open,
  defaultOpen,
  onOpenChange,
  interactive,
  placement,
  offset,
  'aria-label': ariaLabel,
  headingLevel,
  nextLabel = 'Next',
  previousLabel = 'Back',
  skipLabel = 'Skip',
  doneLabel = 'Done',
  progressLabel = (current, total) => `${current} of ${total}`,
  parts,
  ...root
}: SpotlightProps) {
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  const [ownStep, setOwnStep] = useState(defaultStep);
  const total = steps?.length ?? 0;
  const index = Math.min(Math.max(step ?? ownStep, 0), Math.max(total - 1, 0));
  const current = steps?.[index];
  const close = () => {
    // The next opening of a tour starts from its first step.
    setOwnStep(defaultStep);
    setOpen(false);
  };
  const backwards = useRef(false);
  const go = (to: number) => {
    backwards.current = to < index;
    setOwnStep(to);
    onStepChange?.(to);
  };
  const finish = () => {
    onFinish?.();
    close();
  };
  const last = index >= total - 1;
  // A step whose target is not there is passed over, in the direction the tour was going (so Back
  // does not bounce off it). Before the first step it turns forwards; after the last the tour closes.
  const pass = () => {
    if (!current) return close();
    const to = backwards.current && index > 0 ? index - 1 : index + 1;
    return to < total ? go(to) : close();
  };
  return (
    <Root
      {...root}
      target={current ? current.target : target}
      open={isOpen}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      interactive={current?.interactive ?? interactive}
      onTargetLost={pass}
    >
      <Callout
        placement={current?.placement ?? placement}
        offset={offset}
        stepKey={index}
        aria-label={ariaLabel}
      >
        {/* Spoken when the step changes while the focus stays in the callout. */}
        <div aria-live="polite" aria-atomic="true" className={styles.text}>
          {renderPart(
            parts?.title,
            { headingLevel, children: current ? current.title : title },
            (p) => p.children !== undefined && <Title {...p} />,
          )}
          {renderPart(
            parts?.body,
            { children: current ? current.body : children },
            (p) => p.children !== undefined && <Body {...p} />,
          )}
        </div>
        <Footer>
          {current &&
            renderPart(
              parts?.progress,
              { current: index + 1, total, children: progressLabel(index + 1, total) },
              (p) => (
                <span data-part="progress" className={styles.progress}>
                  {p.children}
                </span>
              ),
            )}
          {renderPart(
            parts?.actions,
            {
              children: actions ?? (
                <>
                  {current && !last && (
                    <Button variant="ghost" size="small" onPress={close}>
                      {skipLabel}
                    </Button>
                  )}
                  {current && index > 0 && (
                    <Button size="small" onPress={() => go(index - 1)}>
                      {previousLabel}
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="small"
                    onPress={() => (current && !last ? go(index + 1) : finish())}
                  >
                    {current && !last ? nextLabel : doneLabel}
                  </Button>
                </>
              ),
            },
            (p) => p.children,
          )}
        </Footer>
      </Callout>
    </Root>
  );
}

Spotlight.Root = Root;
Spotlight.Callout = Callout;
Spotlight.Title = Title;
Spotlight.Body = Body;
Spotlight.Footer = Footer;
