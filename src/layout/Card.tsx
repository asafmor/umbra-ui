import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import { ButtonBase } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { ActionsOverflow } from '../internal/ActionsOverflow';
import { OverlayContainerContext } from '../internal/contexts';
import { dataState, isContent, type DataStateProps } from '../internal/dataState';
import { useNarrow } from '../internal/useNarrow';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { textColourOn } from '../provider/contrast';
import { Icon, IconSlot } from '../provider/icons';
import type { LinkRenderProps } from '../utils/link';
import { passThrough, type RootAttributes } from '../utils/passThrough';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Card.module.css';
import { ScrollArea, type ScrollAreaProps } from './ScrollArea';
import { LayoutProvider, slotMinHeight, useSlot, type SlotProps } from './useSlot';

interface CardContextValue {
  titleId: string;
  headingLevel: number;
  headerStyle: 'plain' | 'band';
  padding: 'default' | 'none';
  /** `user`: collapsed with the caret. `layout`: collapsed by the parent Stack to make room. */
  collapsedBy: 'user' | 'layout' | null;
  /** True while a card collapsed with its caret is still closing: its body stays until the animation ends. */
  closing: boolean;
  collapsible: boolean;
  toggle: () => void;
  /**
   * The panel of the popover of a layout-collapsed card, while it is open. The body blocks render into
   * it (a portal), so the card's content exists once, wherever it is shown.
   */
  popover: HTMLElement | null;
  popoverOpen: boolean;
  togglePopover: () => void;
  collapseLabel: string;
  expandLabel: string;
}
const CardContext = createContext<CardContextValue | null>(null);
type PopoverContent = typeof import('../overlays/Popover').Popover.Content;
/** The header element: what the card collapses to, and the anchor of its popover. */
const HeaderRefContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
function useCard() {
  const card = useContext(CardContext);
  if (!card) throw new Error('Card blocks must be rendered inside <Card.Root>.');
  return card;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** How long a collapse by the caret takes: the motion token, and nothing under reduced motion. */
function resizeDuration(element: HTMLElement) {
  const css = getComputedStyle(element);
  const scale = parseFloat(css.getPropertyValue('--umbra-motion-scale'));
  // A build may rewrite the token from "180ms" to ".18s".
  const time = css.getPropertyValue('--umbra-motion-duration-base').trim();
  const base = parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
  return (Number.isNaN(base) ? 180 : base) * (Number.isNaN(scale) ? 1 : scale);
}

/** The height the card will have once its body blocks are gone: measured with them taken out of the layout. */
function heightWithoutBody(element: HTMLElement) {
  const blocks = [...element.children].filter((child): child is HTMLElement =>
    ['toolbar', 'body', 'footer'].includes((child as HTMLElement).dataset.part ?? ''),
  );
  const shown = blocks.map((block) => block.style.display);
  for (const block of blocks) block.style.display = 'none';
  const { height } = element.getBoundingClientRect();
  blocks.forEach((block, i) => (block.style.display = shown[i]!));
  return height;
}

export interface CardRootProps extends BlockProps, SlotProps, RootAttributes {
  /** `tinted` takes more of the context tint; `neutral` ignores it. */
  tone?: 'default' | 'tinted' | 'neutral' | undefined;
  /** `band` fills the header with the brand colour, or the header's `bandColor`. */
  headerStyle?: 'plain' | 'band' | undefined;
  /** `none` for edge-to-edge tables and media. */
  padding?: 'default' | 'none' | undefined;
  /** Lets the end user collapse the card to its header. */
  collapsible?: boolean | undefined;
  /** Controlled collapse state. */
  collapsed?: boolean | undefined;
  defaultCollapsed?: boolean | undefined;
  onCollapsedChange?: ((collapsed: boolean) => void) | undefined;
  /** Marks the card busy for assistive technology. */
  loading?: boolean | undefined;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** Accessible name, for a card without a title. */
  'aria-label'?: string | undefined;
  /** Accessible names of the collapse caret and of the header of a card the layout has collapsed. */
  collapseLabel?: string | undefined;
  expandLabel?: string | undefined;
}

function Root({
  tone = 'default',
  headerStyle = 'plain',
  padding = 'default',
  collapsible = false,
  collapsed: controlled,
  defaultCollapsed = false,
  onCollapsedChange,
  loading = false,
  headingLevel = 2,
  'aria-label': ariaLabel,
  collapseLabel = 'Collapse',
  expandLabel = 'Show content',
  className,
  style,
  children,
  ...slot
}: CardRootProps) {
  const titleId = useId();
  const header = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultCollapsed);
  const userCollapsed = collapsible && (controlled ?? uncontrolled);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // The title can be hidden or replaced through `parts`; the region is only named by one that exists.
  const [hasTitle, setHasTitle] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- checked after every render on purpose; an equal value does not render again
  useLayoutEffect(() => setHasTitle(!!document.getElementById(titleId)));
  const [popover, setPopover] = useState<HTMLElement | null>(null);
  // The popover's code is loaded when a stack first collapses the card (`collapsedBy`, below), not
  // with the card. A press that comes first is kept in `popoverOpen`: the popover opens when it arrives.
  const [PopoverContent, setPopoverContent] = useState<PopoverContent>();

  // Collapsed with the caret, the card is as tall as its header plus its own borders. An open plain
  // header has less padding below than above; collapsed, the two are equal, so the difference is added
  // while open.
  const headerHeight = (element: HTMLElement) => {
    if (!header.current) return null;
    const { paddingTop, paddingBottom } = getComputedStyle(header.current);
    const grows = Math.max(0, parseFloat(paddingTop) - parseFloat(paddingBottom)) || 0;
    return header.current.offsetHeight + grows + element.offsetHeight - element.clientHeight;
  };
  // What the parent Stack counts for this card once it has collapsed it: the header as it is then
  // (title row only, equal padding), which is not the open header. It is measured the same way whether
  // the card is open or collapsed, so the Stack's rule gives one answer for one height
  // (plan/layout.md, rule 3). `data-measure` applies the collapsed look for the length of the read.
  const collapsedHeaderHeight = (element: HTMLElement) => {
    if (!header.current) return null;
    element.dataset.measure = '';
    const height = header.current.offsetHeight + element.offsetHeight - element.clientHeight;
    delete element.dataset.measure;
    return height;
  };
  const {
    ref,
    props,
    collapsed: layoutCollapsed,
    changed,
  } = useSlot<HTMLElement>(slot, {
    min: (element) => {
      if (userCollapsed) return headerHeight(element) ?? 0;
      if (slot.size !== 'content') return undefined;
      // A content-sized card can scroll inside, so it needs its content's height only up to the card minimum.
      const view = element.querySelector(':scope > [data-part="body"] > [data-part="viewport"]');
      const natural = element.offsetHeight + (view ? view.scrollHeight - view.clientHeight : 0);
      return Math.min(natural, slotMinHeight(element));
    },
    // A card collapsed with its caret stays as it is: its header is its minimum.
    header: (element) => (userCollapsed ? headerHeight(element) : collapsedHeaderHeight(element)),
  });
  useLayoutEffect(() => changed?.(), [changed, userCollapsed]);

  // A collapse or expand by the caret animates the card's height (plan/specs/Card.md, "The size
  // animation"). `from` is the height when the caret was pressed; without it (the layout collapsed the
  // card, or the app changed `collapsed` by itself) nothing animates.
  const [from, setFrom] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState(userCollapsed);
  if (shown !== userCollapsed) {
    setShown(userCollapsed);
    // The body stays for the length of the close animation. Set while rendering, so it is never unmounted first.
    setClosing(userCollapsed && from !== null);
  }
  useLayoutEffect(() => {
    const element = ref.current;
    const start = from;
    if (!element || start === null) return;
    let animation: Animation | undefined;
    let stopped = false;
    const done = () => {
      if (stopped) return;
      // Rendered here, not when React next gets to it: the animation has let go of the height, and a
      // content-sized card with its body still in it would be drawn at its full height for one frame.
      flushSync(() => {
        setClosing(false);
        setFrom(null);
      });
      animation?.cancel();
      delete element.dataset.resizing;
    };
    // After the parent Stack has applied its rules again for the new state, and before the browser paints.
    queueMicrotask(() => {
      if (stopped) return;
      const duration = resizeDuration(element);
      const end = userCollapsed ? heightWithoutBody(element) : element.getBoundingClientRect().height;
      // Nothing to animate (reduced motion): the body goes in this same frame, not one render later.
      if (!duration || Math.abs(end - start) < 1) return done();
      const css = getComputedStyle(element);
      // While it moves, the card's height is the animated one, not its share of the stack.
      element.dataset.resizing = '';
      animation = element.animate([{ height: `${start}px` }, { height: `${end}px` }], {
        duration,
        // Held at the end height until `done` has taken the body out, should the event come a frame late.
        fill: 'forwards',
        easing:
          css.getPropertyValue(`--umbra-motion-easing-${userCollapsed ? 'exit' : 'enter'}`).trim() || 'ease',
      });
      animation.onfinish = done;
    });
    return () => {
      stopped = true;
      animation?.cancel();
      delete element.dataset.resizing;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the collapse state changes; `from` is read once
  }, [userCollapsed]);

  const collapsedBy = userCollapsed ? 'user' : layoutCollapsed ? 'layout' : null;
  useEffect(() => {
    if (!layoutCollapsed || PopoverContent) return;
    import('../overlays/Popover').then(
      (module) => setPopoverContent(() => module.Popover.Content),
      // Not loaded: the next time a stack collapses the card asks again.
      () => {},
    );
  }, [layoutCollapsed, PopoverContent]);
  // The popover belongs to the layout-collapsed state: it closes when the card opens again or is hidden
  // behind a tab (entering or leaving tab mode), so it cannot come back by itself or stay without its anchor.
  const narrow = useNarrow();
  const [wasNarrow, setWasNarrow] = useState(narrow);
  if (narrow !== wasNarrow) setWasNarrow(narrow);
  if (popoverOpen && (collapsedBy !== 'layout' || narrow !== wasNarrow)) setPopoverOpen(false);

  const card = useMemo<CardContextValue>(
    () => ({
      titleId,
      headingLevel,
      headerStyle,
      padding,
      collapsedBy,
      closing: closing && collapsedBy === 'user',
      collapsible,
      toggle: () => {
        // The height now, mid-animation too, is where the next animation starts.
        setFrom(ref.current?.getBoundingClientRect().height ?? null);
        setUncontrolled(!userCollapsed);
        onCollapsedChange?.(!userCollapsed);
      },
      popover: popoverOpen && collapsedBy === 'layout' ? popover : null,
      popoverOpen: popoverOpen && collapsedBy === 'layout',
      togglePopover: () => setPopoverOpen((open) => !open),
      collapseLabel,
      expandLabel,
    }),
    [
      titleId,
      headingLevel,
      headerStyle,
      padding,
      collapsedBy,
      closing,
      collapsible,
      userCollapsed,
      onCollapsedChange,
      ref,
      popoverOpen,
      popover,
      collapseLabel,
      expandLabel,
    ],
  );
  return (
    <HeaderRefContext value={header}>
      <section
        {...passThrough(slot)}
        {...props}
        ref={ref}
        aria-labelledby={ariaLabel || !hasTitle ? undefined : titleId}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        data-umbra="card"
        data-tone={tone}
        data-header-style={headerStyle}
        data-padding={padding}
        data-collapsed={collapsedBy ?? undefined}
        data-loading={loading || undefined}
        className={cx(styles.root, className)}
        style={{ ...props.style, ...(collapsedBy && { flexGrow: 0 }), ...style }}
      >
        {/* Layout children inside the card belong to the card, not to the Stack or Columns around it. */}
        <LayoutProvider value={null}>
          <CardContext value={card}>{children}</CardContext>
        </LayoutProvider>
        {collapsedBy === 'layout' && PopoverContent && (
          <PopoverHome card={ref}>
            <PopoverContent
              // Named like the card: its title as text (the tab label), or the card's own name.
              aria-label={slot.label ?? ariaLabel ?? expandLabel}
              anchorRef={header}
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              matchAnchorWidth
              className={styles.popover}
            >
              <div ref={setPopover} className={styles.popoverContent} />
            </PopoverContent>
          </PopoverHome>
        )}
      </section>
    </HeaderRefContext>
  );
}

export interface CardTitleProps extends BlockProps {
  /** Makes the title a link. */
  href?: string | undefined;
  /** Plugs in the app's router link for `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  onOpen?: (() => void) | undefined;
}

const plainLink = (props: LinkRenderProps) => <a {...props} />;

function Title({ href, renderLink = plainLink, onOpen, className, style, children }: CardTitleProps) {
  const card = useCard();
  let content = children;
  if (card.collapsedBy === 'layout') {
    // The whole header is one button that opens the card's content in a popover.
    content = (
      <button
        type="button"
        className={styles.headerButton}
        aria-haspopup="dialog"
        aria-expanded={card.popoverOpen}
        onClick={card.togglePopover}
      >
        {children}
      </button>
    );
  } else if (href) {
    content = renderLink({ href, className: styles.titleLink, children });
  } else if (onOpen) {
    content = (
      <button type="button" className={styles.titleLink} onClick={onOpen}>
        {children}
      </button>
    );
  }
  return createElement(
    `h${card.headingLevel}`,
    { id: card.titleId, 'data-part': 'title', className: cx(styles.title, className), style },
    content,
  );
}

function Actions({ className, style, children }: BlockProps) {
  return (
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends BlockProps {
  /** Leading icon or image. */
  icon?: ReactNode | undefined;
  title?: ReactNode | undefined;
  /** Second line, in the body font. */
  subtitle?: ReactNode | undefined;
  /** Trailing controls. They move into an overflow menu when they do not fit. */
  actions?: ReactNode | undefined;
  /** Overrides the card's `headerStyle`. */
  headerStyle?: 'plain' | 'band' | undefined;
  /** Colour of the band; defaults to the brand colour. */
  bandColor?: string | undefined;
  /** Makes the title a link. */
  href?: string | undefined;
  /** Plugs in the app's router link for `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  onOpen?: (() => void) | undefined;
  /** Accessible name of the overflow menu button. */
  moreLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        title?: Part<CardTitleProps> | undefined;
        subtitle?: Part<{ children: ReactNode }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
        toggle?: Part | undefined;
      }
    | undefined;
}

function Toggle() {
  const card = useCard();
  if (card.collapsedBy === 'layout') return <Icon name="expand" />;
  if (!card.collapsible) return null;
  const collapsed = card.collapsedBy === 'user';
  return (
    <ButtonBase
      umbra="icon-button"
      variant="ghost"
      iconOnly
      label={collapsed ? card.expandLabel : card.collapseLabel}
      expanded={!collapsed}
      onPress={card.toggle}
      className={styles.caret}
    >
      <Icon name="chevronDown" />
    </ButtonBase>
  );
}

function Header({
  icon,
  title,
  subtitle,
  actions,
  headerStyle,
  bandColor,
  href,
  renderLink,
  onOpen,
  moreLabel = 'More actions',
  parts,
  className,
  style,
  children,
}: CardHeaderProps) {
  const card = useCard();
  const layoutCollapsed = card.collapsedBy === 'layout';
  // Shrink order: the subtitle hides, then the actions move into one menu, then the title truncates.
  const steps = [subtitle ? 'subtitle' : null, actions && !layoutCollapsed ? 'actions' : null].filter(
    Boolean,
  );
  const row = useContext(HeaderRefContext)!;
  const level = useShrinkLevel(row, steps.length, layoutCollapsed);
  const gone = (step: string) => steps.indexOf(step) < level;

  return (
    <div
      ref={row}
      data-part="header"
      data-header-style={headerStyle ?? card.headerStyle}
      data-truncate={level === steps.length || undefined}
      className={cx(styles.header, className)}
      style={{
        // Text on a custom band is light or dark, whichever contrasts more with it.
        ...(bandColor && {
          ['--umbra-card-header-bg' as string]: bandColor,
          ['--umbra-card-header-fg' as string]: textColourOn(bandColor)?.colour,
        }),
        ...style,
      }}
    >
      {children ?? (
        <>
          {icon &&
            renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>)}
          <div className={styles.titles}>
            {renderPart(parts?.title, { href, renderLink, onOpen, children: title }, (p) => (
              <Title {...p} />
            ))}
            {subtitle &&
              !gone('subtitle') &&
              !layoutCollapsed &&
              renderPart(parts?.subtitle, { children: subtitle }, (p) => (
                <div data-part="subtitle" className={styles.subtitle}>
                  {p.children}
                </div>
              ))}
          </div>
          {actions &&
            !layoutCollapsed &&
            renderPart(parts?.actions, { children: actions }, (p) => (
              <Actions>
                <ActionsOverflow shrunk={gone('actions')} label={moreLabel}>
                  {p.children}
                </ActionsOverflow>
              </Actions>
            ))}
        </>
      )}
      {renderPart(parts?.toggle, {}, () => (
        <span data-part="toggle" className={styles.toggle}>
          <Toggle />
        </span>
      ))}
      {/* The collapsed header is a single button, so the popover shows the actions above the content. */}
      {actions &&
        card.popover &&
        createPortal(<div className={styles.popoverActions}>{actions}</div>, card.popover)}
    </div>
  );
}

/** Reads the scroll offsets inside `node`, and returns a function that puts them back. */
function keepScroll(node: HTMLElement) {
  const saved = [node, ...node.querySelectorAll<HTMLElement>('*')]
    .filter((el) => el.scrollTop || el.scrollLeft)
    .map((el) => [el, el.scrollTop, el.scrollLeft] as const);
  return () => {
    for (const [el, top, left] of saved) {
      el.scrollTop = top;
      el.scrollLeft = left;
    }
  };
}

/**
 * Where the popover of a layout-collapsed card is rendered. The card's body is moved into it as it is
 * (the same elements), and React only hears what happens in them while they are inside the element
 * React renders the card into. Rendered into `<body>`, as overlays are, the popover would be outside
 * that element: nothing in the moved body would answer a press or a key. So it is rendered into the
 * provider's root element, which is inside. Inside a modal the popover goes into the modal, as every
 * overlay does, and the modal is where the card is rendered: nothing to change there.
 */
function PopoverHome({ card, children }: { card: RefObject<Element | null>; children: ReactNode }) {
  const inModal = useContext(OverlayContainerContext);
  // Mounted when the layout collapses the card, so the card's element is there to ask.
  const [root] = useState(() => card.current?.closest<HTMLElement>('[data-umbra-root]') ?? null);
  return <OverlayContainerContext value={inModal ?? root}>{children}</OverlayContainerContext>;
}

/**
 * Where a body block is: in the card while it is open, in the popover of a layout-collapsed card while
 * that is open, and hidden in the card while the layout has collapsed it and the popover is closed. It
 * stays mounted through all three, so typed text, scroll positions and state inside it survive a
 * resize: the element itself is moved, not rendered again. Collapsed with the caret, it is not rendered.
 */
function useBodyBlock<E extends HTMLElement>() {
  const card = useCard();
  const ref = useRef<E>(null);
  const { collapsedBy, popover } = card;
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || collapsedBy !== 'layout') return;
    const scroll = keepScroll(node);
    // Moving or hiding an element drops the focus it holds; it is put back, or given to the header.
    const focused = () => {
      const active = document.activeElement;
      return active instanceof HTMLElement && node.contains(active) ? active : null;
    };
    if (!popover) {
      // The resize that collapsed the card (or closed its popover) must not leave focus on nothing.
      if (focused()) node.parentElement?.querySelector<HTMLElement>('[data-part="header"] button')?.focus();
      node.hidden = true;
      node.inert = true;
      return () => {
        node.hidden = false;
        node.inert = false;
        scroll();
      };
    }
    // The marker keeps the block's place among the card's children.
    const marker = document.createComment('');
    node.before(marker);
    popover.append(node);
    scroll();
    return () => {
      const back = keepScroll(node);
      const active = focused();
      marker.replaceWith(node);
      back();
      active?.focus({ preventScroll: true });
    };
  }, [collapsedBy, popover]);
  return { ref, rendered: collapsedBy !== 'user' || card.closing };
}

function Toolbar({ className, style, children }: BlockProps) {
  const { ref, rendered } = useBodyBlock<HTMLDivElement>();
  return rendered ? (
    <div ref={ref} data-part="toolbar" className={cx(styles.toolbar, className)} style={style}>
      {children}
    </div>
  ) : null;
}

export interface CardBodyProps
  extends BlockProps, Pick<ScrollAreaProps, 'axis' | 'scrollbar' | 'fade' | 'onReachEnd'> {
  /** Overrides the card's `padding`. */
  padding?: 'default' | 'none' | undefined;
}

function Body({ padding, className, children, ...scroll }: CardBodyProps) {
  const card = useCard();
  const { ref, rendered } = useBodyBlock<HTMLDivElement>();
  return rendered ? (
    <ScrollArea
      {...scroll}
      ref={ref}
      data-part="body"
      data-padding={padding ?? card.padding}
      className={cx(styles.body, className)}
    >
      {children}
    </ScrollArea>
  ) : null;
}

function Footer({ className, style, children }: BlockProps) {
  const { ref, rendered } = useBodyBlock<HTMLDivElement>();
  return rendered ? (
    <div ref={ref} data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </div>
  ) : null;
}

export interface CardProps
  extends
    CardRootProps,
    Pick<CardHeaderProps, 'icon' | 'subtitle' | 'actions' | 'href' | 'renderLink' | 'onOpen' | 'moreLabel'> {
  /** Header title. The header is shown when it is set. */
  title?: ReactNode | undefined;
  /** Shows the body skeleton. */
  loading?: boolean | undefined;
  /**
   * Shown in place of the body when set (and not loading or in error): text or a node, or
   * `{ title, description, icon, action }` for the same empty state as the other data components.
   */
  empty?: DataStateProps['empty'] | undefined;
  /**
   * Shown in place of the body when set: text or a node, `{ title, description, icon, action }`, or
   * `true` for a default text.
   */
  error?: DataStateProps['error'] | undefined;
  /** Adds a retry button to the error state. */
  onRetry?: (() => void) | undefined;
  /** Label of the retry button. */
  retryLabel?: string | undefined;
  /** Replace or hide named pieces. `toolbar` and `footer` are empty unless given, as `Card.Toolbar` and `Card.Footer`. */
  parts?:
    | {
        header?: Part<CardHeaderProps> | undefined;
        title?: Part<CardTitleProps> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
        toolbar?: Part | undefined;
        body?: Part<CardBodyProps> | undefined;
        footer?: Part | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/**
 * The container for one unit of content on a page. Fills the slot its parent gives it and scrolls its
 * own body when the content is taller.
 */
export function Card({
  title,
  subtitle,
  icon,
  actions,
  href,
  renderLink,
  onOpen,
  moreLabel,
  empty,
  error,
  onRetry,
  retryLabel,
  parts,
  children,
  ...root
}: CardProps) {
  const state = root.loading ? 'loading' : error ? 'error' : empty ? 'empty' : null;
  const shown = state === 'error' ? error : empty;
  // Text or a node is drawn as it is, centred. The richer forms (pieces, `true`, a retry button) are
  // the shared empty and error states of the data components.
  const rich = isContent(shown) || shown === true || (state === 'error' && !!onRetry);
  const content =
    state === 'loading' ? (
      renderPart(parts?.skeleton, {}, () => <Skeleton lines={3} />)
    ) : state && rich ? (
      dataState({ empty, error, onRetry, retryLabel }, { isEmpty: true })
    ) : state ? (
      <div className={styles.state} data-state={state} role={state === 'error' ? 'alert' : undefined}>
        {shown as ReactNode}
      </div>
    ) : (
      children
    );
  const headerProps: CardHeaderProps = {
    icon,
    title,
    subtitle,
    actions,
    href,
    renderLink,
    onOpen,
    moreLabel,
    parts: { title: parts?.title, actions: parts?.actions },
  };
  return (
    <Root label={typeof title === 'string' ? title : undefined} {...root}>
      {renderPart(parts?.header, headerProps, (p) => title !== undefined && <Header {...p} />)}
      {renderPart(parts?.toolbar, {}, () => null)}
      {renderPart(parts?.body, { children: content }, (p) => (
        <Body {...p} />
      ))}
      {renderPart(parts?.footer, {}, () => null)}
    </Root>
  );
}

Card.Root = Root;
Card.Header = Header;
Card.Title = Title;
Card.Actions = Actions;
Card.Toolbar = Toolbar;
Card.Body = Body;
Card.Footer = Footer;
