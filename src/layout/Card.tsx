import {
  createContext,
  createElement,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { ButtonBase } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { dataState, isContent, type DataStateProps } from '../internal/dataState';
import { useNarrow } from '../internal/useNarrow';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { ActionsOverflow } from '../overlays/Menu';
import { Popover } from '../overlays/Popover';
import { textColourOn } from '../provider/contrast';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Card.module.css';
import { ScrollArea, type ScrollAreaProps } from './ScrollArea';
import { MoreButton } from './SectionTitle';
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
/** The header element: what the card collapses to, and the anchor of its popover. */
const HeaderRefContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
function useCard() {
  const card = useContext(CardContext);
  if (!card) throw new Error('Card blocks must be rendered inside <Card.Root>.');
  return card;
}

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
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

export interface CardRootProps extends BlockProps, SlotProps {
  /** `tinted` takes more of the context tint; `neutral` ignores it. */
  tone?: 'default' | 'tinted' | 'neutral';
  /** `band` fills the header with the brand colour, or the header's `bandColor`. */
  headerStyle?: 'plain' | 'band';
  /** `none` for edge-to-edge tables and media. */
  padding?: 'default' | 'none';
  /** Lets the end user collapse the card to its header. */
  collapsible?: boolean;
  /** Controlled collapse state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Marks the card busy for assistive technology. */
  loading?: boolean;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Accessible name, for a card without a title. */
  'aria-label'?: string;
  /** Accessible names of the collapse caret and of the header of a card the layout has collapsed. */
  collapseLabel?: string;
  expandLabel?: string;
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

  // Collapsed, the card is as tall as its header plus its own borders. An open plain header has less
  // padding below than above; collapsed, the two are equal, so the difference is added while open.
  const headerHeight = (element: HTMLElement) => {
    if (!header.current) return null;
    const { paddingTop, paddingBottom } = getComputedStyle(header.current);
    const grows = Math.max(0, parseFloat(paddingTop) - parseFloat(paddingBottom)) || 0;
    return header.current.offsetHeight + grows + element.offsetHeight - element.clientHeight;
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
    header: headerHeight,
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
      delete element.dataset.resizing;
      if (stopped) return;
      setClosing(false);
      setFrom(null);
    };
    // After the parent Stack has applied its rules again for the new state, and before the browser paints.
    queueMicrotask(() => {
      if (stopped) return;
      const duration = resizeDuration(element);
      const end = userCollapsed ? heightWithoutBody(element) : element.getBoundingClientRect().height;
      if (!duration || Math.abs(end - start) < 1) return done();
      const css = getComputedStyle(element);
      // While it moves, the card's height is the animated one, not its share of the stack.
      element.dataset.resizing = '';
      animation = element.animate([{ height: `${start}px` }, { height: `${end}px` }], {
        duration,
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
        {collapsedBy === 'layout' && (
          <Popover.Content
            aria-label={expandLabel}
            anchorRef={header}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            matchAnchorWidth
            className={styles.popover}
          >
            <div ref={setPopover} className={styles.popoverContent} />
          </Popover.Content>
        )}
      </section>
    </HeaderRefContext>
  );
}

export interface CardTitleProps extends BlockProps {
  /** Makes the title a link. */
  href?: string;
  onOpen?: () => void;
}

function Title({ href, onOpen, className, style, children }: CardTitleProps) {
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
    content = (
      <a href={href} className={styles.titleLink}>
        {children}
      </a>
    );
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
  icon?: ReactNode;
  title?: ReactNode;
  /** Second line, in the body font. */
  subtitle?: ReactNode;
  /** Trailing controls. They move into an overflow menu when they do not fit. */
  actions?: ReactNode;
  /** Overrides the card's `headerStyle`. */
  headerStyle?: 'plain' | 'band';
  /** Colour of the band; defaults to the brand colour. */
  bandColor?: string;
  /** Makes the title a link. */
  href?: string;
  onOpen?: () => void;
  /** Accessible name of the overflow menu button. */
  moreLabel?: string;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    title?: Part<CardTitleProps>;
    subtitle?: Part<{ children: ReactNode }>;
    actions?: Part<{ children: ReactNode }>;
    toggle?: Part;
  };
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
            {renderPart(parts?.title, { href, onOpen, children: title }, (p) => (
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
                {gone('actions') ? (
                  <ActionsOverflow label={moreLabel} trigger={<MoreButton label={moreLabel} />}>
                    {p.children}
                  </ActionsOverflow>
                ) : (
                  p.children
                )}
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

/**
 * Where a body block goes: in the card while it is open, in the popover of a layout-collapsed card
 * while that is open, and nowhere while the card is collapsed.
 */
function useBodyPlace() {
  const card = useCard();
  return (block: ReactNode) =>
    card.collapsedBy === null || card.closing
      ? block
      : card.popover
        ? createPortal(block, card.popover)
        : null;
}

function Toolbar({ className, style, children }: BlockProps) {
  return useBodyPlace()(
    <div data-part="toolbar" className={cx(styles.toolbar, className)} style={style}>
      {children}
    </div>,
  );
}

export interface CardBodyProps
  extends BlockProps, Pick<ScrollAreaProps, 'axis' | 'scrollbar' | 'fade' | 'onReachEnd'> {
  /** Overrides the card's `padding`. */
  padding?: 'default' | 'none';
}

function Body({ padding, className, children, ...scroll }: CardBodyProps) {
  const card = useCard();
  return useBodyPlace()(
    <ScrollArea
      {...scroll}
      data-part="body"
      data-padding={padding ?? card.padding}
      className={cx(styles.body, className)}
    >
      {children}
    </ScrollArea>,
  );
}

function Footer({ className, style, children }: BlockProps) {
  return useBodyPlace()(
    <div data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </div>,
  );
}

export interface CardProps
  extends
    CardRootProps,
    Pick<CardHeaderProps, 'icon' | 'subtitle' | 'actions' | 'href' | 'onOpen' | 'moreLabel'> {
  /** Header title. The header is shown when it is set. */
  title?: ReactNode;
  /** Shows the body skeleton. */
  loading?: boolean;
  /**
   * Shown in place of the body when set (and not loading or in error): text or a node, or
   * `{ title, description, icon, action }` for the same empty state as the other data components.
   */
  empty?: DataStateProps['empty'];
  /**
   * Shown in place of the body when set: text or a node, `{ title, description, icon, action }`, or
   * `true` for a default text.
   */
  error?: DataStateProps['error'];
  /** Adds a retry button to the error state. */
  onRetry?: () => void;
  /** Label of the retry button. */
  retryLabel?: string;
  /** Replace or hide named pieces. `toolbar` and `footer` are empty unless given, as `Card.Toolbar` and `Card.Footer`. */
  parts?: {
    header?: Part<CardHeaderProps>;
    title?: Part<CardTitleProps>;
    actions?: Part<{ children: ReactNode }>;
    toolbar?: Part;
    body?: Part<CardBodyProps>;
    footer?: Part;
    skeleton?: Part;
  };
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
