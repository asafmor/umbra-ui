import {
  createContext,
  createElement,
  useContext,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Skeleton } from '../basics/Skeleton';
import { useHoverTip } from '../internal/TruncatedText';
import { useSlot, type SlotProps } from '../layout/useSlot';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import { ListItem } from './ListItem';
import styles from './MediaCard.module.css';
import { Tag } from './Tag';
import { useFitLevel } from './useFitLevel';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** The id of the title, so the card is named by it. */
const TitleId = createContext<string | undefined>(undefined);

export interface MediaCardRootProps extends BlockProps, SlotProps {
  /**
   * `hero`: a large image with a large title. `compact`: a small image at the side. `pair`: two sides
   * around a centre, as the `pair` row of `ListItem`.
   */
  variant?: 'hero' | 'compact' | 'pair' | undefined;
  /** `hero` only: the image above the text, or behind it under a scrim. */
  imagePlacement?: 'above' | 'behind' | undefined;
  /** Shows hover and press feedback. Set by `href` or `onPress`. */
  interactive?: boolean | undefined;
  /** Marks the card busy for assistive technology. */
  loading?: boolean | undefined;
  /** Names a card that has no title. */
  'aria-label'?: string | undefined;
}

function Root({
  variant = 'compact',
  imagePlacement = 'above',
  interactive,
  loading,
  'aria-label': label,
  className,
  style,
  children,
  ...slotProps
}: MediaCardRootProps) {
  const { ref, props } = useSlot<HTMLElement>(slotProps);
  const titleId = useId();
  // Less is shown per level while the card is shorter than its content (plan/specs/MediaCard.md).
  const level = useFitLevel(ref, loading ? 0 : 4, variant);
  return (
    <article
      aria-labelledby={label ? undefined : titleId}
      {...props}
      ref={ref}
      data-umbra="media-card"
      data-variant={variant}
      data-image={variant === 'hero' ? imagePlacement : undefined}
      data-interactive={interactive || undefined}
      data-level={level || undefined}
      aria-label={label}
      aria-busy={loading || undefined}
      className={cx(styles.root, className)}
      style={{ ...props.style, ...style }}
    >
      <TitleId value={titleId}>{children}</TitleId>
    </article>
  );
}

export interface MediaCardImageProps extends BlockProps {
  /** The address of the image. When it is missing or fails to load, a drawn placeholder shows. */
  src?: string | undefined;
  /** What the image shows. Leave empty for an image that only decorates the title. */
  alt?: string | undefined;
}

/** A drawn stand-in for a picture: a horizon and a sun, in the card's own colours. */
const placeholder = (
  <svg data-part="placeholder" viewBox="0 0 48 32" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="48" height="32" fill="var(--placeholder-bg)" />
    <circle cx="35" cy="10" r="4" fill="var(--placeholder-fg)" />
    <path d="M0 32 14 14l9 10 6-6 19 14z" fill="var(--placeholder-fg)" />
  </svg>
);

/** The picture: `children` (any node), or `src`, or the placeholder. */
function Image({ src, alt = '', className, style, children }: MediaCardImageProps) {
  // Remembering which address failed shows a new `src` again without an effect.
  const [failed, setFailed] = useState<string>();
  return (
    <div data-part="image" className={cx(styles.media, className)} style={style}>
      <div className={styles.picture}>
        {children ??
          (src && failed !== src ? (
            <img src={src} alt={alt} draggable={false} onError={() => setFailed(src)} />
          ) : (
            placeholder
          ))}
      </div>
    </div>
  );
}

const block = (part: string, className: string | undefined) =>
  function Block({ className: extra, style, children }: BlockProps) {
    return (
      <div data-part={part} className={cx(className, extra)} style={style}>
        {children}
      </div>
    );
  };

const Content = block('content', styles.content);
const Footer = block('footer', styles.footer);
const Category = block('category', styles.category);
const Meta = block('meta', styles.meta);
const Actions = block('actions', styles.actions);

interface LinkProps {
  /** Makes the whole card a link. */
  href?: string | undefined;
  /** Plugs in the app's router link for `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  /** Makes the whole card a button. */
  onPress?: (() => void) | undefined;
}

/** The link or button whose hit area covers the whole card; controls in `actions` stay above it. */
function cover({ href, renderLink = (props) => <a {...props} />, onPress }: LinkProps, children: ReactNode) {
  if (href) return renderLink({ href, className: styles.link, children });
  if (!onPress) return children;
  return (
    <button type="button" className={styles.link} onClick={onPress}>
      {children}
    </button>
  );
}

export interface MediaCardTitleProps extends BlockProps, LinkProps {
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** The most lines the title wraps to before it ends in an ellipsis. */
  lines?: number | undefined;
}

/** The title, a heading. With `href` or `onPress` it is the link or button of the whole card. */
function Title({ headingLevel = 3, lines = 2, className, style, children, ...link }: MediaCardTitleProps) {
  const ref = useRef<HTMLElement>(null);
  const id = useContext(TitleId);
  const tip = useHoverTip(ref, children, (el) => el.scrollHeight > el.clientHeight + 1);
  return (
    <>
      {createElement(
        `h${headingLevel}`,
        {
          ref,
          id,
          'data-part': 'title',
          className: cx(styles.title, className),
          style: { ['--lines' as string]: lines, ...style },
        },
        cover(link, children),
      )}
      {tip}
    </>
  );
}

export interface MediaCardDescriptionProps extends BlockProps {
  /** The most lines the text wraps to before it ends in an ellipsis. */
  lines?: number | undefined;
}

function Description({ lines = 2, className, style, children }: MediaCardDescriptionProps) {
  return (
    <p
      data-part="description"
      className={cx(styles.description, className)}
      style={{ ['--lines' as string]: lines, ...style }}
    >
      {children}
    </p>
  );
}

/** One side of a `pair` card, as in the `opposite` of `ListItem`. */
export interface MediaCardSide {
  title: ReactNode;
  /** An icon or avatar beside the title. */
  leading?: ReactNode | undefined;
  /** The side's value. */
  meta?: ReactNode | undefined;
}

export interface MediaCardPairProps extends LinkProps {
  side: MediaCardSide;
  opposite: MediaCardSide;
  /** What stands between the two sides: a short text or an icon. */
  center?: ReactNode | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * The two sides of a `pair` card. It is the `pair` row of `ListItem`, built from its blocks. With `href`
 * or `onPress` a link or button named by the row covers the whole card.
 */
function Pair({ side, opposite, center, className, style, href, renderLink, onPress }: MediaCardPairProps) {
  const rowId = useContext(TitleId);
  const link = { className: styles.cover, 'aria-labelledby': rowId };
  return (
    <>
      {href ? (
        (renderLink ?? ((props) => <a {...props} />))({ href, ...link })
      ) : onPress ? (
        <button type="button" {...link} onClick={onPress} />
      ) : null}
      <div id={rowId} data-part="pair" className={cx(styles.pair, className)} style={style}>
        <ListItem.Root variant="pair" size="compact">
          <ListItem.Side>
            <ListItem.Title>{side.title}</ListItem.Title>
            {side.leading && <ListItem.Leading>{side.leading}</ListItem.Leading>}
            {side.meta != null && <ListItem.Meta>{side.meta}</ListItem.Meta>}
          </ListItem.Side>
          {center != null && <ListItem.Center>{center}</ListItem.Center>}
          <ListItem.Side opposite>
            {opposite.meta != null && <ListItem.Meta>{opposite.meta}</ListItem.Meta>}
            {opposite.leading && <ListItem.Leading>{opposite.leading}</ListItem.Leading>}
            <ListItem.Title>{opposite.title}</ListItem.Title>
          </ListItem.Side>
        </ListItem.Root>
      </div>
    </>
  );
}

export interface MediaCardProps
  extends Omit<MediaCardRootProps, 'children' | 'interactive' | 'variant'>, LinkProps {
  /** Default `compact`; `pair` when `opposite` is set. */
  variant?: 'hero' | 'compact' | undefined;
  /** The picture, as any node: an `<img>`, an `<svg>`, a chart. Wins over `src`. */
  image?: ReactNode | undefined;
  /** The address of the picture. When there is none, or it fails to load, a drawn placeholder shows. */
  src?: string | undefined;
  /** What the picture shows. Leave empty for a picture that only decorates the title. */
  alt?: string | undefined;
  /** The headline. In a `pair` card, the title of the first side. */
  title?: ReactNode | undefined;
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** The most lines the title wraps to. */
  titleLines?: number | undefined;
  /** A paragraph under the title. */
  description?: ReactNode | undefined;
  /** The most lines the description wraps to. */
  descriptionLines?: number | undefined;
  /** A category: text becomes a `Tag`, a node is drawn as it is. */
  category?: ReactNode | undefined;
  /** A quiet line: a time, a source. */
  meta?: ReactNode | undefined;
  /** Controls of the card: they stay separate from the card's own link. */
  actions?: ReactNode | undefined;
  /** `pair`: the icon and the value of the first side, whose title is `title`. */
  side?: Omit<MediaCardSide, 'title'> | undefined;
  /** `pair`: the second side. Sets the `pair` variant. */
  opposite?: MediaCardSide | undefined;
  /** `pair`: what stands between the two sides. */
  center?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        image?: Part<MediaCardImageProps> | undefined;
        category?: Part<{ children: ReactNode }> | undefined;
        title?: Part<MediaCardTitleProps> | undefined;
        description?: Part<MediaCardDescriptionProps> | undefined;
        meta?: Part<{ children: ReactNode }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
        pair?: Part<MediaCardPairProps> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A card for one article or item: a picture, a title, a few quiet details, and its own link. */
export function MediaCard({
  variant: look = 'compact',
  image,
  src,
  alt,
  title,
  headingLevel,
  titleLines,
  description,
  descriptionLines,
  category,
  meta,
  actions,
  side,
  opposite,
  center,
  href,
  renderLink,
  onPress,
  parts,
  ...root
}: MediaCardProps) {
  const variant = opposite ? 'pair' : look;
  const link = { href, renderLink, onPress };
  const overPicture = variant === 'hero' && root.imagePlacement === 'behind';
  const footer = (category != null || meta != null || actions != null) && (
    <Footer>
      {meta != null && renderPart(parts?.meta, { children: meta }, (p) => <Meta>{p.children}</Meta>)}
      {category != null &&
        renderPart(parts?.category, { children: category }, (p) => (
          <Category>
            {typeof p.children === 'string' ? (
              // Over a picture the tag is filled, so its text keeps its contrast whatever is behind.
              <Tag size="small" variant={overPicture ? 'solid' : 'outline'}>
                {p.children}
              </Tag>
            ) : (
              p.children
            )}
          </Category>
        ))}
      {actions != null &&
        renderPart(parts?.actions, { children: actions }, (p) => <Actions>{p.children}</Actions>)}
    </Footer>
  );
  if (root.loading) {
    return (
      <Root {...root} variant={variant}>
        {renderPart(parts?.skeleton, {}, () => (
          <>
            {variant !== 'pair' && (
              <div data-part="skeleton" className={styles.media} aria-hidden="true">
                <Skeleton shape="block" className={styles.picture} />
              </div>
            )}
            <div data-part="skeleton" className={styles.content} aria-hidden="true">
              <Skeleton width={variant === 'pair' ? '100%' : '80%'} className={styles.skeletonTitle} />
              {variant === 'hero' && <Skeleton lines={2} />}
              <Skeleton width="45%" />
            </div>
          </>
        ))}
      </Root>
    );
  }
  if (opposite) {
    return (
      <Root {...root} variant="pair" interactive={!!(href || onPress)}>
        <Content>
          {renderPart(parts?.pair, { side: { ...side, title }, opposite, center, ...link }, (p) => (
            <Pair {...p} />
          ))}
          {footer}
        </Content>
      </Root>
    );
  }
  return (
    <Root {...root} variant={variant} interactive={!!(href || onPress)}>
      {renderPart(parts?.image, { src, alt, children: image }, (p) => (
        <Image {...p} />
      ))}
      <Content>
        {renderPart(parts?.title, { headingLevel, lines: titleLines, children: title, ...link }, (p) => (
          <Title {...p} />
        ))}
        {description != null &&
          renderPart(parts?.description, { lines: descriptionLines, children: description }, (p) => (
            <Description {...p} />
          ))}
        {footer}
      </Content>
    </Root>
  );
}

MediaCard.Root = Root;
MediaCard.Image = Image;
MediaCard.Content = Content;
MediaCard.Title = Title;
MediaCard.Description = Description;
MediaCard.Footer = Footer;
MediaCard.Meta = Meta;
MediaCard.Category = Category;
MediaCard.Actions = Actions;
MediaCard.Pair = Pair;
