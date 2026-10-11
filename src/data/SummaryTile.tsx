import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { useTruncatedTip } from '../internal/TruncatedText';
import { useSlot, type SlotProps } from '../layout/useSlot';
import { IconSlot } from '../provider/icons';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './SummaryTile.module.css';
import { defined } from '../utils/defined';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface SummaryTileRootProps extends BlockProps, SlotProps {
  /** Makes the whole tile one link. */
  href?: string | undefined;
  /** Makes the whole tile one button. */
  onPress?: (() => void) | undefined;
  /** Marks the tile as the current one: a link gets `aria-current`, a button `aria-pressed`. */
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Marks the tile busy for assistive technology. */
  loading?: boolean | undefined;
  /** Accessible name, when the content does not name the tile. */
  'aria-label'?: string | undefined;
}

function Root({
  href,
  onPress,
  selected,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ...slot
}: SummaryTileRootProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slot);
  const surface = { 'data-part': 'surface', 'aria-label': ariaLabel, className: styles.surface };
  // The slot element is separate from the control: in tab mode the layout gives it the tab panel role.
  return (
    <div
      {...props}
      ref={ref}
      aria-busy={loading || undefined}
      data-umbra="summary-tile"
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
      className={cx(styles.root, className)}
      style={{ ...props.style, ...style }}
    >
      {href !== undefined ? (
        <AriaLink
          {...defined(surface)}
          href={href}
          {...defined({ onPress })}
          isDisabled={disabled}
          {...defined({ 'aria-current': selected ? 'true' : undefined })}
        >
          {children}
        </AriaLink>
      ) : onPress ? (
        <AriaButton
          {...defined(surface)}
          onPress={onPress}
          isDisabled={disabled}
          {...defined({ 'aria-pressed': selected })}
        >
          {children}
        </AriaButton>
      ) : (
        <div {...surface} role={ariaLabel ? 'group' : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

function Icon({ className, style, children }: BlockProps) {
  return (
    <span data-part="icon" aria-hidden="true" className={cx(styles.icon, className)} style={style}>
      <IconSlot>{children}</IconSlot>
    </span>
  );
}

/** Holds the title, the value line and the caption, one under the other. */
function Content({ className, style, children }: BlockProps) {
  return (
    <span data-part="content" className={cx(styles.content, className)} style={style}>
      {children}
    </span>
  );
}

function Title({ className, style, children }: BlockProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const tip = useTruncatedTip(ref, children);
  return (
    <>
      <span ref={ref} data-part="title" className={cx(styles.title, className)} style={style}>
        {children}
      </span>
      {tip}
    </>
  );
}

/** The line that holds the value and its trend. */
function Figure({ className, style, children }: BlockProps) {
  return (
    <span data-part="figure" className={cx(styles.figure, className)} style={style}>
      {children}
    </span>
  );
}

export type SummaryTileValueProps = BlockProps & ChangeHighlightProps;

function Value({ className, style, children, ...change }: SummaryTileValueProps) {
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      <ChangeHighlight {...change}>{children}</ChangeHighlight>
      {children}
    </span>
  );
}

function Trend({ className, style, children }: BlockProps) {
  return (
    <span data-part="trend" className={cx(styles.trend, className)} style={style}>
      {children}
    </span>
  );
}

function Caption({ className, style, children }: BlockProps) {
  return (
    <span data-part="caption" className={cx(styles.caption, className)} style={style}>
      {children}
    </span>
  );
}

export interface SummaryTileProps extends Omit<SummaryTileRootProps, 'children'>, ChangeHighlightProps {
  /** Shown in a block at the start of the tile. */
  icon?: ReactNode | undefined;
  /** What the tile is about. */
  title?: ReactNode | undefined;
  /** The one value the tile shows. `null`, `undefined` or an empty text shows `emptyLabel`, without the trend. */
  value?: ReactNode | undefined;
  /** Shown when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** A secondary line under the value. */
  caption?: ReactNode | undefined;
  /** A node after the value that shows its direction, for example a `TrendArrow`. */
  trend?: ReactNode | undefined;
  /** Shows skeletons in place of the value and caption. */
  loading?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        title?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        trend?: Part<{ children: ReactNode }> | undefined;
        caption?: Part<{ children: ReactNode }> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

const has = (node: ReactNode) => node != null && node !== false;

/** A compact tile that sums up one thing: an icon, a title and one value. The whole tile can be a link or a button. */
export function SummaryTile({
  icon,
  title,
  value,
  emptyLabel = '—',
  caption,
  trend,
  parts,
  ...rest
}: SummaryTileProps) {
  const [change, root] = splitChange(rest);
  const { loading } = root;
  const missing = value == null || value === '';
  return (
    <Root {...root}>
      {has(icon) && renderPart(parts?.icon, { children: icon }, (p) => <Icon>{p.children}</Icon>)}
      <Content>
        {renderPart(parts?.title, { children: title }, (p) => (
          <Title>{p.children}</Title>
        ))}
        <Figure>
          {loading ? (
            renderPart(parts?.skeleton, {}, () => (
              <span data-part="skeleton" style={{ display: 'contents' }}>
                <Skeleton width="6em" />
              </span>
            ))
          ) : (
            <>
              {renderPart(parts?.value, { children: missing ? emptyLabel : value }, (p) => (
                <Value {...change}>{p.children}</Value>
              ))}
              {!missing &&
                has(trend) &&
                renderPart(parts?.trend, { children: trend }, (p) => <Trend>{p.children}</Trend>)}
            </>
          )}
        </Figure>
        {has(caption) &&
          renderPart(parts?.caption, { children: loading ? <Skeleton width="9em" /> : caption }, (p) => (
            <Caption>{p.children}</Caption>
          ))}
      </Content>
    </Root>
  );
}

SummaryTile.Root = Root;
SummaryTile.Icon = Icon;
SummaryTile.Content = Content;
SummaryTile.Title = Title;
SummaryTile.Figure = Figure;
SummaryTile.Value = Value;
SummaryTile.Trend = Trend;
SummaryTile.Caption = Caption;
