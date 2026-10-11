import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useTruncatedTip } from '../internal/TruncatedText';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './ListItem.module.css';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface ListItemRootProps extends BlockProps {
  /**
   * `message`: sender and tag on the first line, title and time on the second. `pair`: two sides that
   * mirror each other around a centre (set by `opposite`).
   */
  variant?: 'default' | 'message' | 'pair';
  /** `compact` is one control high, for leaderboards and short lists. Otherwise the height follows the density level. */
  size?: 'default' | 'compact';
  /** Violet fill with an edge stripe. Inside a `List`, selection sets it. */
  selected?: boolean;
  /** `true`: bold title and a dot. `false`: the title is dimmed as read. Leave unset where rows have no read state. */
  unread?: boolean;
  /** A colour for an edge stripe that carries a category. Give `accentLabel` too, so it is not colour alone. */
  accent?: string;
  disabled?: boolean;
  /** Shows hover and press feedback. Set by `List`, and by `href` or `onPress`. */
  interactive?: boolean;
}

function Root({
  variant = 'default',
  size = 'default',
  selected,
  unread,
  accent,
  disabled,
  interactive,
  className,
  style,
  children,
}: ListItemRootProps) {
  return (
    <div
      data-umbra="list-item"
      data-variant={variant}
      data-size={size}
      data-selected={selected || undefined}
      data-unread={unread === undefined ? undefined : String(unread)}
      data-accent={accent ? '' : undefined}
      data-disabled={disabled || undefined}
      data-interactive={(interactive && !disabled) || undefined}
      aria-disabled={disabled || undefined}
      className={cx(styles.root, className)}
      style={{ ...(accent && { ['--accent' as string]: accent }), ...style }}
    >
      <div className={styles.layout}>{children}</div>
    </div>
  );
}

const block = (part: string, className: string | undefined, Element: 'div' | 'span' = 'div') =>
  function Block({ className: extra, style, children }: BlockProps) {
    return (
      <Element data-part={part} className={cx(className, extra)} style={style}>
        {children}
      </Element>
    );
  };

const Leading = block('leading', styles.leading);
const Content = block('content', styles.content);
const Overline = block('overline', styles.overline);
export interface ListItemDescriptionProps extends BlockProps {
  /** The most lines the text wraps to before it ends in an ellipsis. */
  lines?: number;
}

function Description({ lines = 1, className, style, children }: ListItemDescriptionProps) {
  return (
    <div
      data-part="description"
      data-lines={lines > 1 ? lines : undefined}
      className={cx(styles.description, className)}
      style={{ ...(lines > 1 && { ['--lines' as string]: lines }), ...style }}
    >
      {children}
    </div>
  );
}
const End = block('end', styles.end);
const Center = block('center', styles.center, 'span');

export interface ListItemSideProps extends BlockProps {
  /** The second side: its pieces start at the centre and its text is aligned to the start. */
  opposite?: boolean;
}

/** One side of a `pair` row. Put the pieces in reading order, from the row's edge to its centre. */
function Side({ opposite, className, style, children }: ListItemSideProps) {
  return (
    <div data-part={opposite ? 'opposite' : 'side'} className={cx(styles.side, className)} style={style}>
      {children}
    </div>
  );
}
export type ListItemMetaProps = BlockProps & ChangeHighlightProps;

function Meta({ className, style, children, ...change }: ListItemMetaProps) {
  return (
    <span data-part="meta" {...changeHost(change)} className={cx(styles.meta, className)} style={style}>
      <ChangeHighlight {...change}>{children}</ChangeHighlight>
      {children}
    </span>
  );
}
const Trailing = block('trailing', styles.trailing);

export interface ListItemTitleProps extends BlockProps {
  /** Makes the whole row a link. */
  href?: string;
  /** Makes the whole row a button. */
  onPress?: () => void;
  disabled?: boolean;
}

/** The title. With `href` or `onPress` it is a link or button whose hit area covers the whole row. */
function Title({ href, onPress, disabled, className, style, children }: ListItemTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tip = useTruncatedTip(ref, children);
  const content =
    href && !disabled ? (
      <a href={href} className={styles.link}>
        {children}
      </a>
    ) : onPress ? (
      <button type="button" className={styles.link} disabled={disabled} onClick={onPress}>
        {children}
      </button>
    ) : (
      children
    );
  return (
    <>
      <div ref={ref} data-part="title" className={cx(styles.title, className)} style={style}>
        {content}
      </div>
      {tip}
    </>
  );
}

export interface ListItemUnreadProps {
  /** What assistive technology hears for the dot. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** A dot with a text for assistive technology, so "unread" is not carried by weight and colour alone. */
function Unread({ label = 'Unread', className, style }: ListItemUnreadProps) {
  return (
    <span data-part="unread" className={cx(styles.unread, className)} style={style}>
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}

export interface ListItemProps extends Omit<ListItemRootProps, 'children'>, ChangeHighlightProps {
  /** The main line. Truncates last. */
  title?: ReactNode;
  /** A second line under the title. */
  description?: ReactNode;
  /** The most lines the description wraps to, for a row that holds a paragraph beside an icon or image. */
  descriptionLines?: number;
  /**
   * The second side of a two-sided row: `title`, `leading` and `meta` are the first side, and these mirror
   * them on the other side of `center`. Sets the `pair` variant.
   */
  opposite?: { title: ReactNode; leading?: ReactNode; meta?: ReactNode };
  /** What stands between the two sides of a `pair` row: a short text or an icon. */
  center?: ReactNode;
  /** A small line above the title, for example a sender. */
  overline?: ReactNode;
  /** Leading node: an avatar or icon. */
  leading?: ReactNode;
  /** Trailing text, for example a time or a value. */
  meta?: ReactNode;
  /** Trailing node: tags, a badge or actions. Hides first when the row is narrow. */
  trailing?: ReactNode;
  /** What assistive technology hears for the unread dot. */
  unreadLabel?: string;
  /** What assistive technology hears for the `accent` stripe, for example the category's name. */
  accentLabel?: string;
  /** Makes the whole row a link. Inside a `List`, the list handles it. */
  href?: string;
  /** Makes the whole row a button. Inside a `List`, the list handles it. */
  onPress?: () => void;
  /** Replace or hide named pieces. */
  parts?: {
    leading?: Part<{ children: ReactNode }>;
    overline?: Part<{ children: ReactNode }>;
    title?: Part<ListItemTitleProps>;
    description?: Part<ListItemDescriptionProps>;
    meta?: Part<{ children: ReactNode }>;
    opposite?: Part<ListItemSideProps>;
    center?: Part<{ children: ReactNode }>;
    unread?: Part<ListItemUnreadProps>;
    trailing?: Part<{ children: ReactNode }>;
  };
}

/** The content of one row of a list: a title with optional lines, and leading and trailing pieces. */
export function ListItem({
  title,
  description,
  descriptionLines,
  opposite,
  center,
  overline,
  leading,
  meta,
  trailing,
  unreadLabel = 'Unread',
  accentLabel,
  href,
  onPress,
  parts,
  ...rest
}: ListItemProps) {
  const [change, root] = splitChange(rest);
  if (opposite) {
    const icon = (node: ReactNode) =>
      node && renderPart(parts?.leading, { children: node }, (p) => <Leading>{p.children}</Leading>);
    const value = (node: ReactNode, live?: ChangeHighlightProps) =>
      node && renderPart(parts?.meta, { children: node }, (p) => <Meta {...live}>{p.children}</Meta>);
    return (
      <Root {...root} variant="pair" interactive={root.interactive ?? !!(href || onPress)}>
        <Side>
          {root.accent && accentLabel && <span className={styles.srOnly}>{accentLabel}</span>}
          {renderPart(parts?.title, { href, onPress, disabled: root.disabled, children: title }, (p) => (
            <Title {...p} />
          ))}
          {icon(leading)}
          {value(meta, change)}
        </Side>
        {center != null &&
          renderPart(parts?.center, { children: center }, (p) => <Center>{p.children}</Center>)}
        {renderPart(
          parts?.opposite,
          {
            opposite: true,
            children: (
              <>
                {value(opposite.meta)}
                {icon(opposite.leading)}
                <Title>{opposite.title}</Title>
              </>
            ),
          },
          (p) => (
            <Side {...p} />
          ),
        )}
      </Root>
    );
  }
  return (
    <Root {...root} interactive={root.interactive ?? !!(href || onPress)}>
      {leading && renderPart(parts?.leading, { children: leading }, (p) => <Leading>{p.children}</Leading>)}
      <Content>
        {root.accent && accentLabel && <span className={styles.srOnly}>{accentLabel}</span>}
        {overline &&
          renderPart(parts?.overline, { children: overline }, (p) => <Overline>{p.children}</Overline>)}
        {renderPart(parts?.title, { href, onPress, disabled: root.disabled, children: title }, (p) => (
          <Title {...p} />
        ))}
        {description &&
          renderPart(parts?.description, { lines: descriptionLines, children: description }, (p) => (
            <Description {...p} />
          ))}
      </Content>
      {(meta || trailing || root.unread) && (
        <End>
          {(meta || root.unread) && (
            <span className={styles.metaRow}>
              {root.unread && renderPart(parts?.unread, { label: unreadLabel }, (p) => <Unread {...p} />)}
              {meta &&
                renderPart(parts?.meta, { children: meta }, (p) => <Meta {...change}>{p.children}</Meta>)}
            </span>
          )}
          {trailing &&
            renderPart(parts?.trailing, { children: trailing }, (p) => <Trailing>{p.children}</Trailing>)}
        </End>
      )}
    </Root>
  );
}

ListItem.Root = Root;
ListItem.Leading = Leading;
ListItem.Content = Content;
ListItem.Overline = Overline;
ListItem.Title = Title;
ListItem.Description = Description;
ListItem.End = End;
ListItem.Side = Side;
ListItem.Center = Center;
ListItem.Meta = Meta;
ListItem.Unread = Unread;
ListItem.Trailing = Trailing;
