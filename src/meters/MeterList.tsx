import { Children, useRef, type CSSProperties, type ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import { dataState, type DataStateProps } from '../internal/dataState';
import { isOverflowing, useShrinkLevel } from '../internal/useShrinkLevel';
import { cx, renderPart, type Part } from '../utils/parts';
import { passThrough, type RootAttributes } from '../utils/passThrough';
import { MeterListProvider } from './label';
import styles from './MeterList.module.css';

export interface MeterListRootProps extends RootAttributes {
  /**
   * Width of the shared label column: pixels, or any CSS track size (`"40%"`, `"12rem"`,
   * `"fit-content(50%)"`). Default: as wide as the longest label, as far as the bars keep their minimum.
   */
  labelWidth?: number | string | undefined;
  /** Set while the content is not a list of meters: the list is then busy while `loading`. */
  state?: 'loading' | 'empty' | 'error' | undefined;
  /** Names the group for assistive technology. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** The meters: `ProgressBar`, `LevelMeter`, `PieIndicator` and `DivergingMeter`, in any mix. */
  children?: ReactNode | undefined;
}

const cut = (el: HTMLElement) => el.scrollWidth > el.clientWidth;
/**
 * Too narrow: the columns are wider than the list, or a label is cut because the bars are at their
 * shortest. With a `labelWidth` the app has chosen the width of the labels, and a cut label is its choice.
 */
const tooNarrow = (list: HTMLElement) =>
  isOverflowing(list) ||
  (!list.style.getPropertyValue('--label-column') &&
    [...list.querySelectorAll<HTMLElement>(':scope > * > [data-part="label"]')].some(cut));

function Root({
  labelWidth,
  state,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ...rest
}: MeterListRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  // 1 hides the value column; 2 puts each label above its bar.
  const level = useShrinkLevel(ref, 2, undefined, { overflowing: tooNarrow });
  return (
    <div
      {...passThrough(rest)}
      ref={ref}
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      aria-busy={state === 'loading' || undefined}
      data-umbra="meter-list"
      data-state={state}
      data-shrink={level || undefined}
      className={cx(styles.list, className)}
      style={{
        ...(labelWidth !== undefined && {
          ['--label-column' as string]: typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth,
        }),
        ...style,
      }}
    >
      <MeterListProvider value>{children}</MeterListProvider>
    </div>
  );
}

export interface MeterListProps extends Omit<MeterListRootProps, 'state'>, DataStateProps {
  /** Number of skeleton rows. */
  skeletonRows?: number | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
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
    <div key={i} data-part="skeleton" className={styles.row}>
      <span data-part="label">
        <Skeleton width={skeletonWidths[i % skeletonWidths.length]} />
      </span>
      <span data-part="bar" className={styles.skeletonCell}>
        <Skeleton shape="block" className={styles.skeletonBar} />
      </span>
      <span data-part="value">
        <Skeleton width="3ch" />
      </span>
    </div>
  ));
}

/**
 * A group of meters in aligned columns: every label in one column, every bar in the next, every value
 * in the last. Takes any of the four meters as children.
 */
export function MeterList({
  children,
  loading = false,
  skeletonRows = 4,
  empty,
  error,
  onRetry,
  retryLabel,
  parts,
  ...root
}: MeterListProps) {
  const count = Children.count(children);
  // The shared states: an error wins over loading, as in every data component.
  const state = error ? 'error' : loading ? 'loading' : count === 0 ? 'empty' : undefined;
  const message = dataState(
    { loading, empty, error, onRetry, retryLabel },
    { part: true, isEmpty: count === 0, defaultEmpty: { title: 'No data' } },
  );
  return (
    <Root {...root} state={state}>
      {state === 'loading'
        ? renderPart(parts?.skeleton, { rows: skeletonRows }, (p) => <SkeletonRows {...p} />)
        : state
          ? renderPart(parts?.[state], { children: message }, (p) => (
              <div className={styles.state}>{p.children}</div>
            ))
          : children}
    </Root>
  );
}

MeterList.Root = Root;
