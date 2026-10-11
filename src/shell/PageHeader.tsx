import {
  createContext,
  createElement,
  useContext,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { ButtonBase } from '../basics/Button';
import { ActionsOverflow } from '../internal/ActionsOverflow';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { textColourOn } from '../provider/contrast';
import { Tooltip } from '../overlays/Tooltip';
import { Icon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import type { LinkRenderProps } from '../utils/link';
import styles from './PageHeader.module.css';

// What gives way as the header narrows, in this order. After the last step the title truncates.
const steps = ['meta', 'actions', 'subtitle', 'media'] as const;
type Step = (typeof steps)[number];

interface HeaderContextValue {
  headingLevel: number;
  /** How many shrink steps have been taken. */
  level: number;
}
const HeaderContext = createContext<HeaderContextValue | null>(null);
/** The elements the root measures: the bar it watches, and the row inside it that overflows. */
const RefsContext = createContext<Record<'bar' | 'row', RefObject<HTMLDivElement | null>> | null>(null);
function useHeader() {
  const header = useContext(HeaderContext);
  if (!header) throw new Error('PageHeader blocks must be rendered inside <PageHeader.Root>.');
  return { ...header, taken: (step: Step) => steps.indexOf(step) < header.level };
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface PageHeaderRootProps extends BlockProps {
  /** `tinted` is a panel in the context tint. `band` fills with the brand colour, or `bandColor`. */
  tone?: 'default' | 'tinted' | 'band' | undefined;
  /** Colour of the band (hex or `rgb()`); the text colour is chosen for contrast with it. */
  bandColor?: string | undefined;
  /** `compact` is for the header of a detail pane inside a card. */
  size?: 'default' | 'compact' | undefined;
  /** Heading level of the title. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}

function Root({
  tone = 'default',
  bandColor,
  size = 'default',
  headingLevel = 1,
  className,
  style,
  children,
}: PageHeaderRootProps) {
  const bar = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  // The bar keeps its width whatever the level, so it is the element watched; the row inside it is the
  // one that overflows.
  const level = useShrinkLevel(bar, steps.length, undefined, {
    overflowing: () => !!row.current && row.current.scrollWidth > row.current.clientWidth + 1,
  });
  const onBand = tone === 'band' && bandColor ? textColourOn(bandColor)?.colour : undefined;
  return (
    <div
      data-umbra="page-header"
      data-tone={tone}
      data-size={size}
      data-shrink={level}
      data-truncate={level === steps.length || undefined}
      className={cx(styles.root, className)}
      style={{
        ...(tone === 'band' &&
          bandColor && {
            ['--umbra-page-header-bg' as string]: bandColor,
            // Text and focus rings on a custom band are light or dark, whichever contrasts more with it.
            ['--umbra-page-header-fg' as string]: onBand,
            // Private: the app's own `--umbra-focus-color`, set on any ancestor, still wins.
            ['--focus-color' as string]: onBand,
          }),
        ...style,
      }}
    >
      <RefsContext value={{ bar, row }}>
        <HeaderContext value={{ headingLevel, level }}>{children}</HeaderContext>
      </RefsContext>
    </div>
  );
}

/** One step of the path to the current page. The last one is the current page. */
export interface PageHeaderCrumb {
  label: ReactNode;
  href?: string | undefined;
}

export interface PageHeaderBreadcrumbsProps {
  items: PageHeaderCrumb[];
  /** Accessible name of the landmark. */
  label?: string | undefined;
  /** Plugs in the app's router link. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Breadcrumbs({
  items,
  label = 'Breadcrumb',
  renderLink = (props) => <a {...props} />,
  className,
  style,
}: PageHeaderBreadcrumbsProps) {
  return (
    <nav
      aria-label={label}
      data-part="breadcrumbs"
      className={cx(styles.breadcrumbs, className)}
      style={style}
    >
      <ol>
        {items.map((item, i) => {
          const current = i === items.length - 1;
          return (
            <li key={i}>
              {i > 0 && <Icon name="chevronRight" />}
              {item.href && !current ? (
                renderLink({ href: item.href, className: styles.crumb, children: item.label })
              ) : (
                <span className={styles.crumb} aria-current={current ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The main line: holds `Content` and `Actions`. */
function Bar({ className, style, children }: BlockProps) {
  return (
    <div
      ref={useContext(RefsContext)?.bar}
      data-part="bar"
      className={cx(styles.bar, className)}
      style={style}
    >
      {children}
    </div>
  );
}

/** The row of back button, media, titles and meta. It is the part that is measured. */
function Content({ className, style, children }: BlockProps) {
  return (
    <div
      ref={useContext(RefsContext)?.row}
      data-part="content"
      className={cx(styles.row, className)}
      style={style}
    >
      {children}
    </div>
  );
}

export interface PageHeaderBackProps {
  /** Accessible name of the button. */
  label?: string | undefined;
  onBack?: (() => void) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Back({ label = 'Back', onBack, className, style }: PageHeaderBackProps) {
  return (
    <span data-part="back" className={cx(styles.back, className)} style={style}>
      {/* An icon alone: its name is also its tooltip, as on an `IconButton`. */}
      <Tooltip content={label} placement="bottom">
        <ButtonBase umbra="icon-button" variant="ghost" iconOnly label={label} onPress={onBack}>
          <Icon name="back" />
        </ButtonBase>
      </Tooltip>
    </span>
  );
}

/** The leading avatar, entity icon or image. It gets smaller as the last step before the title truncates. */
function Media({ className, style, children }: BlockProps) {
  return (
    <div
      data-part="media"
      data-small={useHeader().taken('media') || undefined}
      className={cx(styles.media, className)}
      style={style}
    >
      {children}
    </div>
  );
}

/** Holds the overline, the title and the subtitle. */
function Titles({ className, style, children }: BlockProps) {
  return (
    <div data-part="titles" className={cx(styles.titles, className)} style={style}>
      {children}
    </div>
  );
}

function Overline({ className, style, children }: BlockProps) {
  return (
    <div data-part="overline" className={cx(styles.overline, className)} style={style}>
      {children}
    </div>
  );
}

export interface PageHeaderTitleProps extends BlockProps {
  /** Tags or badges shown after the title. */
  tags?: ReactNode | undefined;
}

function Title({ tags, className, style, children }: PageHeaderTitleProps) {
  const { headingLevel } = useHeader();
  return (
    <div className={styles.titleRow}>
      {createElement(
        `h${headingLevel}`,
        { 'data-part': 'title', className: cx(styles.title, className), style },
        children,
      )}
      {tags != null && (
        <div data-part="tags" className={styles.tags}>
          {tags}
        </div>
      )}
    </div>
  );
}

function Subtitle({ className, style, children }: BlockProps) {
  if (useHeader().taken('subtitle')) return null;
  return (
    <div data-part="subtitle" className={cx(styles.subtitle, className)} style={style}>
      {children}
    </div>
  );
}

/** One labelled fact in the meta row. */
export interface PageHeaderFact {
  label: ReactNode;
  value: ReactNode;
}

export interface PageHeaderMetaProps extends BlockProps {
  /** Labelled facts, shown as a list with a rule between them. Or pass any nodes as children. */
  items?: PageHeaderFact[] | undefined;
}

function Meta({ items, className, style, children }: PageHeaderMetaProps) {
  if (useHeader().taken('meta')) return null;
  const shared = { 'data-part': 'meta', className: cx(styles.meta, className), style };
  if (!items) return <div {...shared}>{children}</div>;
  return (
    <dl {...shared}>
      {items.map((fact, i) => (
        <div key={i} className={styles.fact}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface PageHeaderActionsProps extends BlockProps {
  /** Accessible name of the overflow menu button. */
  moreLabel?: string | undefined;
}

/** Trailing controls. They move into an overflow menu when they do not fit beside the titles. */
function Actions({ moreLabel = 'More actions', className, style, children }: PageHeaderActionsProps) {
  const header = useHeader();
  return (
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      {header.taken('actions') ? <ActionsOverflow label={moreLabel}>{children}</ActionsOverflow> : children}
    </div>
  );
}

/** A tab list along the bottom edge. */
function Tabs({ className, style, children }: BlockProps) {
  return (
    <div data-part="tabs" className={cx(styles.tabs, className)} style={style}>
      {children}
    </div>
  );
}

export interface PageHeaderProps extends Omit<PageHeaderRootProps, 'children'> {
  title?: ReactNode | undefined;
  /** A line under the title. */
  subtitle?: ReactNode | undefined;
  /** A small line above the title, for example the kind of thing the page shows. */
  overline?: ReactNode | undefined;
  /** Leading avatar, entity icon or image. */
  media?: ReactNode | undefined;
  /** A row of facts: `{ label, value }` items, or any node. */
  meta?: ReactNode | PageHeaderFact[] | undefined;
  /** Tags or badges after the title. */
  tags?: ReactNode | undefined;
  /** Trailing controls. They move into an overflow menu when they do not fit. */
  actions?: ReactNode | undefined;
  /** Accessible name of the overflow menu button. */
  moreLabel?: string | undefined;
  /** Shows a back button before the title. */
  onBack?: (() => void) | undefined;
  /** Accessible name of the back button. */
  backLabel?: string | undefined;
  /** The path to this page; the last item is the current page. */
  breadcrumbs?: PageHeaderCrumb[] | undefined;
  /** Accessible name of the breadcrumb landmark. */
  breadcrumbsLabel?: string | undefined;
  /** Plugs the app's router link into the breadcrumbs. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  /** A tab list, placed along the bottom edge. */
  tabs?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        breadcrumbs?: Part<PageHeaderBreadcrumbsProps> | undefined;
        back?: Part<PageHeaderBackProps> | undefined;
        media?: Part<{ children: ReactNode }> | undefined;
        overline?: Part<{ children: ReactNode }> | undefined;
        title?: Part<PageHeaderTitleProps> | undefined;
        subtitle?: Part<{ children: ReactNode }> | undefined;
        meta?: Part<PageHeaderMetaProps> | undefined;
        actions?: Part<PageHeaderActionsProps> | undefined;
        tabs?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

const isFacts = (meta: PageHeaderProps['meta']): meta is PageHeaderFact[] =>
  Array.isArray(meta) &&
  meta.every((m) => m != null && typeof m === 'object' && 'label' in m && 'value' in m);

/** The header of a page or of a detail pane: what it shows, facts about it, and its actions. */
export function PageHeader({
  title,
  subtitle,
  overline,
  media,
  meta,
  tags,
  actions,
  moreLabel,
  onBack,
  backLabel,
  breadcrumbs,
  breadcrumbsLabel,
  renderLink,
  tabs,
  parts,
  ...root
}: PageHeaderProps) {
  return (
    <Root {...root}>
      {breadcrumbs &&
        renderPart(parts?.breadcrumbs, { items: breadcrumbs, label: breadcrumbsLabel, renderLink }, (p) => (
          <Breadcrumbs {...p} />
        ))}
      <Bar>
        <Content>
          {onBack && renderPart(parts?.back, { label: backLabel, onBack }, (p) => <Back {...p} />)}
          {media != null && renderPart(parts?.media, { children: media }, (p) => <Media>{p.children}</Media>)}
          <Titles>
            {overline != null &&
              renderPart(parts?.overline, { children: overline }, (p) => <Overline>{p.children}</Overline>)}
            {renderPart(parts?.title, { tags, children: title }, (p) => (
              <Title {...p} />
            ))}
            {subtitle != null &&
              renderPart(parts?.subtitle, { children: subtitle }, (p) => <Subtitle>{p.children}</Subtitle>)}
          </Titles>
          {meta != null &&
            renderPart(
              parts?.meta,
              isFacts(meta) ? { items: meta } : { children: meta as ReactNode },
              (p) => <Meta {...p} />,
            )}
        </Content>
        {actions != null &&
          renderPart(parts?.actions, { children: actions, moreLabel }, (p) => <Actions {...p} />)}
      </Bar>
      {tabs != null && renderPart(parts?.tabs, { children: tabs }, (p) => <Tabs>{p.children}</Tabs>)}
    </Root>
  );
}

PageHeader.Root = Root;
PageHeader.Breadcrumbs = Breadcrumbs;
PageHeader.Bar = Bar;
PageHeader.Content = Content;
PageHeader.Back = Back;
PageHeader.Media = Media;
PageHeader.Titles = Titles;
PageHeader.Overline = Overline;
PageHeader.Title = Title;
PageHeader.Subtitle = Subtitle;
PageHeader.Meta = Meta;
PageHeader.Actions = Actions;
PageHeader.Tabs = Tabs;
