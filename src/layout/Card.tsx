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
import { ButtonBase } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { ActionsOverflow, Popover, useEscapeToClose } from '../internal/overlays';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { textColourOn } from '../provider/contrast';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Card.module.css';
import { ScrollArea, type ScrollAreaProps } from './ScrollArea';
import { MoreButton } from './SectionTitle';
import { LayoutProvider, NarrowContext, useSlot, type SlotProps } from './useSlot';

interface CardContextValue {
  titleId: string;
  headingLevel: number;
  headerStyle: 'plain' | 'band';
  padding: 'default' | 'none';
  /** `user`: collapsed with the caret. `layout`: collapsed by the parent Stack to make room. */
  collapsedBy: 'user' | 'layout' | null;
  collapsible: boolean;
  toggle: () => void;
  /** True for the copy of the card's content that is shown in the popover of a layout-collapsed card. */
  inPopover: boolean;
  popoverOpen: boolean;
  openPopover: () => void;
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
  const [width, setWidth] = useState(0);

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
    min: (element) => (userCollapsed ? (headerHeight(element) ?? 0) : undefined),
    header: headerHeight,
  });
  useLayoutEffect(() => changed?.(), [changed, userCollapsed]);

  const collapsedBy = userCollapsed ? 'user' : layoutCollapsed ? 'layout' : null;
  // The popover belongs to the layout-collapsed state: it closes when the card opens again or is hidden
  // behind a tab (entering or leaving tab mode), so it cannot come back by itself or stay without its anchor.
  const narrow = useContext(NarrowContext);
  const [wasNarrow, setWasNarrow] = useState(narrow);
  if (narrow !== wasNarrow) setWasNarrow(narrow);
  if (popoverOpen && (collapsedBy !== 'layout' || narrow !== wasNarrow)) setPopoverOpen(false);

  useEscapeToClose(
    popoverOpen,
    () => setPopoverOpen(false),
    () => header.current?.querySelector('button'),
  );
  const card = useMemo<CardContextValue>(
    () => ({
      titleId,
      headingLevel,
      headerStyle,
      padding,
      collapsedBy,
      collapsible,
      toggle: () => {
        setUncontrolled(!userCollapsed);
        onCollapsedChange?.(!userCollapsed);
      },
      inPopover: false,
      popoverOpen: popoverOpen && collapsedBy === 'layout',
      openPopover: () => {
        setWidth(ref.current?.offsetWidth ?? 0);
        setPopoverOpen(true);
      },
      collapseLabel,
      expandLabel,
    }),
    [
      titleId,
      headingLevel,
      headerStyle,
      padding,
      collapsedBy,
      collapsible,
      userCollapsed,
      onCollapsedChange,
      popoverOpen,
      ref,
      collapseLabel,
      expandLabel,
    ],
  );
  const inPopover = useMemo(() => ({ ...card, inPopover: true }), [card]);

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
          <Popover
            label={expandLabel}
            triggerRef={header}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            className={styles.popover}
            style={{ width }}
          >
            <LayoutProvider value={null}>
              <CardContext value={inPopover}>{children}</CardContext>
            </LayoutProvider>
          </Popover>
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
        onClick={card.openPopover}
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

  if (card.inPopover) {
    // The popover of a layout-collapsed card repeats the actions above the content.
    return actions ? <div className={styles.popoverActions}>{actions}</div> : null;
  }
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
    </div>
  );
}

/** Hides a body block while the card is collapsed; the popover copy always shows it. */
function useBodyVisible() {
  const card = useCard();
  return card.inPopover || card.collapsedBy === null;
}

function Toolbar({ className, style, children }: BlockProps) {
  if (!useBodyVisible()) return null;
  return (
    <div data-part="toolbar" className={cx(styles.toolbar, className)} style={style}>
      {children}
    </div>
  );
}

export interface CardBodyProps
  extends BlockProps, Pick<ScrollAreaProps, 'axis' | 'scrollbar' | 'fade' | 'onReachEnd'> {
  /** Overrides the card's `padding`. */
  padding?: 'default' | 'none';
}

function Body({ padding, className, children, ...scroll }: CardBodyProps) {
  const card = useCard();
  if (!useBodyVisible()) return null;
  return (
    <ScrollArea
      {...scroll}
      data-part="body"
      data-padding={padding ?? card.padding}
      className={cx(styles.body, className)}
    >
      {children}
    </ScrollArea>
  );
}

function Footer({ className, style, children }: BlockProps) {
  if (!useBodyVisible()) return null;
  return (
    <div data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </div>
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
  /** Shown in place of the body when set (and not loading or in error). */
  empty?: ReactNode;
  /** Shown in place of the body when set. Put a retry action inside it. */
  error?: ReactNode;
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
  parts,
  children,
  ...root
}: CardProps) {
  const state = root.loading ? 'loading' : error ? 'error' : empty ? 'empty' : null;
  const content =
    state === 'loading' ? (
      renderPart(parts?.skeleton, {}, () => <Skeleton lines={3} />)
    ) : state ? (
      <div className={styles.state} data-state={state} role={state === 'error' ? 'alert' : undefined}>
        {error ?? empty}
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
