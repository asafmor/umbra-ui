import {
  Children,
  createContext,
  Fragment,
  useContext,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Skeleton } from '../basics/Skeleton';
import { dataState, type DataStateProps } from '../internal/dataState';
import { useTruncatedTip } from '../internal/TruncatedText';
import { IconSlot } from '../provider/icons';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './KeyValue.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

type Orientation = 'inline' | 'stacked';
type Align = 'start' | 'end';

/** What a `KeyValueList` gives its rows: their defaults, and that they are inside a list element. */
const ListContext = createContext<{
  orientation: Orientation;
  align?: Align | undefined;
  wrap?: boolean | undefined;
  change?: ChangeHighlightProps | undefined;
} | null>(null);

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface KeyValueRootProps extends BlockProps, RootAttributes {
  /** `inline`: label and value side by side. `stacked`: the label above the value. */
  orientation?: Orientation | undefined;
  /** Where the value sits. Default: `end` when inline, `start` when stacked. */
  align?: Align | undefined;
  /** Lets a long value wrap onto more lines. Without it the value is cut with an ellipsis. */
  wrap?: boolean | undefined;
  /** Marks a key row: a tinted fill, and the label in bold as the cue that is not colour. */
  highlighted?: boolean | undefined;
}

function Row({
  orientation,
  align,
  wrap,
  highlighted,
  part,
  className,
  style,
  children,
  ...rest
}: KeyValueRootProps & { part?: string | undefined }) {
  const list = useContext(ListContext);
  const direction = orientation ?? list?.orientation ?? 'inline';
  // A row is a group inside the list's <dl>; on its own it is a one-row list.
  const Element = list ? 'div' : 'dl';
  return (
    <Element
      {...passThrough(rest)}
      data-umbra="key-value"
      data-part={part ?? (list ? 'item' : undefined)}
      data-highlighted={highlighted || undefined}
      data-orientation={direction}
      data-align={align ?? list?.align ?? (direction === 'inline' ? 'end' : 'start')}
      data-wrap={(wrap ?? list?.wrap) || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      {children}
    </Element>
  );
}

function Root(props: KeyValueRootProps) {
  return <Row {...props} />;
}

export interface KeyValueLabelProps extends BlockProps {
  /** Shown before the label. */
  icon?: ReactNode | undefined;
}

function Label({ icon, className, style, children }: KeyValueLabelProps) {
  return (
    <dt data-part="label" className={cx(styles.label, className)} style={style}>
      {icon}
      <span className={styles.text}>{children}</span>
    </dt>
  );
}

export type KeyValueValueProps = BlockProps & ChangeHighlightProps;

function Value({ className, style, children, ...own }: KeyValueValueProps) {
  // A list's `highlightChanges` is the default of its rows; a row's own props win.
  const list = useContext(ListContext)?.change;
  const change: ChangeHighlightProps = {
    highlightChanges: own.highlightChanges ?? list?.highlightChanges,
    changeValue: own.changeValue,
    increasedLabel: own.increasedLabel ?? list?.increasedLabel,
    decreasedLabel: own.decreasedLabel ?? list?.decreasedLabel,
  };
  const ref = useRef<HTMLElement>(null);
  const tip = useTruncatedTip(ref, children);
  return (
    <>
      <dd
        ref={ref}
        data-part="value"
        {...changeHost(change)}
        className={cx(styles.value, className)}
        style={style}
      >
        <ChangeHighlight {...change}>{children}</ChangeHighlight>
        {children}
      </dd>
      {tip}
    </>
  );
}

function Hint({ className, style, children }: BlockProps) {
  return (
    <dd data-part="hint" className={cx(styles.hint, className)} style={style}>
      {children}
    </dd>
  );
}

export interface KeyValueProps extends Omit<KeyValueRootProps, 'children'>, ChangeHighlightProps {
  /** What the value is. */
  label?: ReactNode | undefined;
  /** The value. `children` is used when it is not set. With neither, the row shows `emptyLabel`. */
  value?: ReactNode | undefined;
  children?: ReactNode | undefined;
  /** Shown when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** Shown before the label. */
  icon?: ReactNode | undefined;
  /** A secondary line: under the label when inline, under the value when stacked. */
  hint?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        label?: Part<KeyValueLabelProps> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        hint?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** One label with its value. Use it inside a `KeyValueList`, or on its own. */
export function KeyValue({
  label,
  value,
  children,
  emptyLabel = '—',
  icon,
  hint,
  parts,
  ...rest
}: KeyValueProps) {
  const [change, root] = splitChange(rest);
  const shown = value ?? children;
  const iconNode =
    icon != null &&
    icon !== false &&
    renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>);
  return (
    <Root {...root}>
      {renderPart(parts?.label, { icon: iconNode, children: label }, (p) => (
        <Label {...p} />
      ))}
      {renderPart(parts?.value, { children: shown == null || shown === '' ? emptyLabel : shown }, (p) => (
        <Value {...change}>{p.children}</Value>
      ))}
      {hint != null &&
        hint !== false &&
        renderPart(parts?.hint, { children: hint }, (p) => <Hint>{p.children}</Hint>)}
    </Root>
  );
}

KeyValue.Root = Root;
KeyValue.Label = Label;
KeyValue.Value = Value;
KeyValue.Hint = Hint;

export interface KeyValueListRootProps
  extends BlockProps, Omit<ChangeHighlightProps, 'changeValue'>, RootAttributes {
  /** `rows`: one row per item, sharing one label column. `columns`: side by side. `grid`: in `columns` columns. */
  layout?: 'rows' | 'columns' | 'grid' | undefined;
  /** Most columns of the `grid` layout. Fewer are used when the list is narrow. */
  columns?: number | undefined;
  /** Orientation of every item. Default: `inline` in rows, `stacked` in columns and in the grid. */
  orientation?: Orientation | undefined;
  /** Where every value sits. */
  align?: Align | undefined;
  /** Lets long values wrap instead of being cut. */
  wrap?: boolean | undefined;
  /** Shades every other row (`rows` layout). */
  striped?: boolean | undefined;
  /** Draws a line between items (`rows` and `columns` layouts). */
  dividers?: boolean | undefined;
  /** Width of the shared label column in the `rows` layout: pixels or any CSS length. Default: as wide as the longest label, at most 60%. */
  labelWidth?: number | string | undefined;
  /** Set while the content is not a list of items: the root is then a plain element, busy while `loading`. */
  state?: 'loading' | 'empty' | 'error' | undefined;
  /** Names the list for assistive technology. */
  'aria-label'?: string | undefined;
}

function ListRoot({
  layout = 'rows',
  columns = 2,
  orientation,
  align,
  wrap,
  striped,
  dividers,
  labelWidth,
  state,
  highlightChanges,
  increasedLabel,
  decreasedLabel,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ...rest
}: KeyValueListRootProps) {
  // Only real rows make a description list: around skeleton rows and messages the element has another
  // role. It stays the same element, so the focus it holds after a retry survives the change of state.
  return (
    <dl
      {...passThrough(rest)}
      role={state ? (ariaLabel ? 'group' : 'presentation') : undefined}
      aria-label={ariaLabel}
      aria-busy={state === 'loading' || undefined}
      data-umbra="key-value-list"
      data-layout={layout}
      data-striped={striped || undefined}
      data-dividers={dividers || undefined}
      data-state={state}
      className={cx(styles.list, className)}
      style={{
        ['--columns' as string]: columns,
        ...(labelWidth !== undefined && {
          ['--label-column' as string]: typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth,
        }),
        ...style,
      }}
    >
      <ListContext
        value={{
          orientation: orientation ?? (layout === 'rows' ? 'inline' : 'stacked'),
          align,
          wrap,
          change: { highlightChanges, increasedLabel, decreasedLabel },
        }}
      >
        {children}
      </ListContext>
    </dl>
  );
}

export type KeyValueItem = Omit<KeyValueProps, 'children'> & { key?: string | number | undefined };

export interface KeyValueListProps extends Omit<KeyValueListRootProps, 'state'>, DataStateProps {
  /** The rows as data. Use this or `children`. */
  items?: KeyValueItem[] | undefined;
  /** The rows as `KeyValue` elements. */
  children?: ReactNode | undefined;
  /** Number of skeleton rows. */
  skeletonRows?: number | undefined;
  /** Replace or hide named pieces. `item` receives the props of each row built from `items`. */
  parts?:
    | {
        item?: Part<KeyValueProps> | undefined;
        skeleton?: Part<{ rows: number }> | undefined;
        empty?: Part<{ children: ReactNode }> | undefined;
        error?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

// Label widths of the skeleton rows, so they do not look like a solid block.
const skeletonWidths = ['7em', '5em', '9em', '6em'];

function SkeletonRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }, (_, i) => (
    <Row key={i} part="skeleton">
      <div className={styles.label}>
        <Skeleton width={skeletonWidths[i % skeletonWidths.length]} />
      </div>
      <div className={styles.value}>
        <Skeleton width="3em" className={styles.skeletonValue} />
      </div>
    </Row>
  ));
}

/** A group of labels with their values, in rows, columns or a grid. */
export function KeyValueList({
  items,
  children,
  loading = false,
  skeletonRows = 4,
  empty,
  error,
  onRetry,
  retryLabel,
  parts,
  ...root
}: KeyValueListProps) {
  const count = items ? items.length : Children.count(children);
  // The shared states: an error wins over loading, as in every data component.
  const state = error ? 'error' : loading ? 'loading' : count === 0 ? 'empty' : undefined;
  const message = dataState(
    { loading, empty, error, onRetry, retryLabel },
    { part: true, isEmpty: count === 0, defaultEmpty: { title: 'No data' } },
  );
  return (
    <ListRoot {...root} state={state}>
      {state === 'loading'
        ? renderPart(parts?.skeleton, { rows: skeletonRows }, (p) => <SkeletonRows {...p} />)
        : state
          ? renderPart(parts?.[state], { children: message }, (p) => (
              <div className={styles.state}>{p.children}</div>
            ))
          : items
            ? items.map(({ key, ...item }, i) => (
                <Fragment key={key ?? i}>
                  {renderPart(parts?.item, item, (p) => (
                    <KeyValue {...p} />
                  ))}
                </Fragment>
              ))
            : children}
    </ListRoot>
  );
}

KeyValueList.Root = ListRoot;
KeyValueList.Item = KeyValue;
