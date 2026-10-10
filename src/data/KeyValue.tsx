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
import { useTruncatedTip } from '../internal/TruncatedText';
import { IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './KeyValue.module.css';

type Orientation = 'inline' | 'stacked';
type Align = 'start' | 'end';

/** What a `KeyValueList` gives its rows: their defaults, and that they are inside a list element. */
const ListContext = createContext<{ orientation: Orientation; align?: Align; wrap?: boolean } | null>(null);

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface KeyValueRootProps extends BlockProps {
  /** `inline`: label and value side by side. `stacked`: the label above the value. */
  orientation?: Orientation;
  /** Where the value sits. Default: `end` when inline, `start` when stacked. */
  align?: Align;
  /** Lets a long value wrap onto more lines. Without it the value is cut with an ellipsis. */
  wrap?: boolean;
}

function Root({ orientation, align, wrap, className, style, children }: KeyValueRootProps) {
  const list = useContext(ListContext);
  const direction = orientation ?? list?.orientation ?? 'inline';
  // A row is a group inside the list's <dl>; on its own it is a one-row list.
  const Element = list ? 'div' : 'dl';
  return (
    <Element
      data-umbra="key-value"
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

export interface KeyValueLabelProps extends BlockProps {
  /** Shown before the label. */
  icon?: ReactNode;
}

function Label({ icon, className, style, children }: KeyValueLabelProps) {
  return (
    <dt data-part="label" className={cx(styles.label, className)} style={style}>
      {icon}
      <span className={styles.text}>{children}</span>
    </dt>
  );
}

function Value({ className, style, children }: BlockProps) {
  const ref = useRef<HTMLElement>(null);
  const tip = useTruncatedTip(ref, children);
  return (
    <>
      <dd ref={ref} data-part="value" className={cx(styles.value, className)} style={style}>
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

export interface KeyValueProps extends Omit<KeyValueRootProps, 'children'> {
  /** What the value is. */
  label?: ReactNode;
  /** The value. `children` is used when it is not set. */
  value?: ReactNode;
  children?: ReactNode;
  /** Shown before the label. */
  icon?: ReactNode;
  /** A secondary line: under the label when inline, under the value when stacked. */
  hint?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    icon?: Part<{ children: ReactNode }>;
    label?: Part<KeyValueLabelProps>;
    value?: Part<{ children: ReactNode }>;
    hint?: Part<{ children: ReactNode }>;
  };
}

/** One label with its value. Use it inside a `KeyValueList`, or on its own. */
export function KeyValue({ label, value, children, icon, hint, parts, ...root }: KeyValueProps) {
  const iconNode =
    icon != null &&
    icon !== false &&
    renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>);
  return (
    <Root {...root}>
      {renderPart(parts?.label, { icon: iconNode, children: label }, (p) => (
        <Label {...p} />
      ))}
      {renderPart(parts?.value, { children: value ?? children }, (p) => (
        <Value>{p.children}</Value>
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

export interface KeyValueListRootProps extends BlockProps {
  /** `rows`: one row per item, sharing one label column. `columns`: side by side. `grid`: in `columns` columns. */
  layout?: 'rows' | 'columns' | 'grid';
  /** Most columns of the `grid` layout. Fewer are used when the list is narrow. */
  columns?: number;
  /** Orientation of every item. Default: `inline` in rows, `stacked` in columns and in the grid. */
  orientation?: Orientation;
  /** Where every value sits. */
  align?: Align;
  /** Lets long values wrap instead of being cut. */
  wrap?: boolean;
  /** Shades every other row (`rows` layout). */
  striped?: boolean;
  /** Draws a line between items (`rows` and `columns` layouts). */
  dividers?: boolean;
  /** Width of the shared label column in the `rows` layout: pixels or any CSS length. Default: as wide as the longest label, at most 60%. */
  labelWidth?: number | string;
  /** Set while the content is not a list of items: the root is then a plain element, busy while `loading`. */
  state?: 'loading' | 'empty' | 'error';
  /** Names the list for assistive technology. */
  'aria-label'?: string;
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
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: KeyValueListRootProps) {
  // Only real rows make a description list; skeleton rows and messages sit in a plain element.
  const Element = state ? 'div' : 'dl';
  return (
    <Element
      role={state && ariaLabel ? 'group' : undefined}
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
        value={{ orientation: orientation ?? (layout === 'rows' ? 'inline' : 'stacked'), align, wrap }}
      >
        {children}
      </ListContext>
    </Element>
  );
}

export type KeyValueItem = Omit<KeyValueProps, 'children'> & { key?: string | number };

export interface KeyValueListProps extends Omit<KeyValueListRootProps, 'state'> {
  /** The rows as data. Use this or `children`. */
  items?: KeyValueItem[];
  /** The rows as `KeyValue` elements. */
  children?: ReactNode;
  /** Shows skeleton rows in the final layout. */
  loading?: boolean;
  /** Number of skeleton rows. */
  skeletonRows?: number;
  /** Shown when there are no items. */
  empty?: ReactNode;
  /** Shown in place of the items when set. Put a retry action inside it. */
  error?: ReactNode;
  /** Replace or hide named pieces. `item` receives the props of each row built from `items`. */
  parts?: {
    item?: Part<KeyValueProps>;
    skeleton?: Part<{ rows: number }>;
    empty?: Part<{ children: ReactNode }>;
    error?: Part<{ children: ReactNode }>;
  };
}

// Label widths of the skeleton rows, so they do not look like a solid block.
const skeletonWidths = ['7em', '5em', '9em', '6em'];

function SkeletonRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }, (_, i) => (
    <Root key={i}>
      <div className={styles.label}>
        <Skeleton width={skeletonWidths[i % skeletonWidths.length]} />
      </div>
      <div className={styles.value}>
        <Skeleton width="3em" className={styles.skeletonValue} />
      </div>
    </Root>
  ));
}

/** A group of labels with their values, in rows, columns or a grid. */
export function KeyValueList({
  items,
  children,
  loading = false,
  skeletonRows = 4,
  empty = 'No data',
  error,
  parts,
  ...root
}: KeyValueListProps) {
  const count = items ? items.length : Children.count(children);
  const state = loading ? 'loading' : error ? 'error' : count === 0 ? 'empty' : undefined;
  return (
    <ListRoot {...root} state={state}>
      {state === 'loading'
        ? renderPart(parts?.skeleton, { rows: skeletonRows }, (p) => <SkeletonRows {...p} />)
        : state === 'error'
          ? renderPart(parts?.error, { children: error }, (p) => (
              <div data-part="error" role="alert" className={styles.state}>
                {p.children}
              </div>
            ))
          : state === 'empty'
            ? renderPart(parts?.empty, { children: empty }, (p) => (
                <div data-part="empty" className={styles.state}>
                  {p.children}
                </div>
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
