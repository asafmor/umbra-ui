import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { dataState, type DataStateProps } from '../internal/dataState';
import { heightProps, type FillHeight } from '../internal/height';
import { seriesColour } from '../internal/SeriesMarker';
import { TruncatedText } from '../internal/TruncatedText';
import { useSlot, type SlotProps } from '../layout/useSlot';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Comparison.module.css';
import shared from './shared.module.css';
import { useFitLevel } from '../internal/useFitLevel';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export type ComparisonId = string;
export type ComparisonValue = number | null | undefined;

/** One of the two things compared. */
export interface ComparisonSide {
  name: ReactNode;
  /** A mark beside the name: an `EntityIcon` or an `Avatar`. */
  icon?: ReactNode | undefined;
  /** Any CSS colour, for the side's bars and leader mark. Default: the first two series colours. */
  color?: string | undefined;
}

/** One metric: a value per side. */
export interface ComparisonRow {
  id: ComparisonId;
  label: ReactNode;
  /** The value of the first and of the second side. `null` or nothing means there is no value. */
  values: readonly [ComparisonValue, ComparisonValue];
  /** For a metric where low is good: the side with the lower value leads. */
  lowerIsBetter?: boolean | undefined;
  /** Text of this row's values, in place of the component's `formatValue`. */
  formatValue?: ((value: number) => ReactNode) | undefined;
  /** The value of a full bar. Default: the larger of the two values. */
  max?: number | undefined;
}

/** The large pair of values in the middle of the header. */
export interface ComparisonSummary {
  values: readonly [ReactNode, ReactNode];
  /** A quiet line under the values; it also names them for assistive technology. */
  caption?: ReactNode | undefined;
  /** What stands between the two values. */
  separator?: ReactNode | undefined;
}

const hasValue = (value: ComparisonValue): value is number =>
  value !== null && value !== undefined && !Number.isNaN(value);

/** The side that leads a row: 0, 1, or `null` when they are level or a value is missing. */
function leaderOf({ values: [a, b], lowerIsBetter }: Pick<ComparisonRow, 'values' | 'lowerIsBetter'>) {
  if (!hasValue(a) || !hasValue(b) || a === b) return null;
  return a > b !== !!lowerIsBetter ? 0 : 1;
}

export interface ComparisonRootProps extends BlockProps, SlotProps {
  /** `strip` is one line: the two names around one pair of values. */
  variant?: 'table' | 'strip' | undefined;
  /** Shown in place of the children when the rows do not fit the height, even without their bars. */
  strip?: ReactNode | undefined;
  /** `fill` (default) takes the slot's height, `content` its own, a number that many pixels. */
  height?: FillHeight | undefined;
  /** Marks the comparison busy for assistive technology. */
  loading?: boolean | undefined;
}

function Root({
  variant = 'table',
  strip,
  height,
  loading,
  className,
  style,
  children,
  ...slotProps
}: ComparisonRootProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slotProps);
  // Less is shown per level while the rows are taller than the slot: the bars go, then the rows.
  const level = useFitLevel(ref, variant === 'strip' || loading ? 0 : strip ? 2 : 1, variant);
  const sized = heightProps(height);
  return (
    <div
      {...props}
      ref={ref}
      data-umbra="comparison"
      data-variant={level === 2 ? 'strip' : variant}
      data-level={level || undefined}
      data-height={sized['data-height']}
      aria-busy={loading || undefined}
      className={cx(styles.root, className)}
      style={{ ...props.style, ...sized.style, ...style }}
    >
      {level === 2 ? strip : children}
    </div>
  );
}

export interface ComparisonTableProps extends BlockProps {
  /** Names the table for assistive technology. */
  'aria-label'?: string | undefined;
}

/** The table: a header of two sides, then one row per metric. */
function Table({ 'aria-label': label, className, style, children }: ComparisonTableProps) {
  return (
    <div
      role="table"
      aria-label={label}
      data-part="table"
      className={cx(styles.table, className)}
      style={style}
    >
      {children}
    </div>
  );
}

export interface ComparisonHeaderProps extends BlockProps {
  /** The header of the label column, for assistive technology. */
  metricLabel?: string | undefined;
  /** The large pair of values between the two sides: a `Comparison.Summary`. */
  summary?: ReactNode | undefined;
}

/** The two sides, as the column headers. Put two `Comparison.Side` in it. */
function Header({ metricLabel = 'Metric', summary, className, style, children }: ComparisonHeaderProps) {
  return (
    <div
      role="rowgroup"
      data-part="header"
      data-summary={summary ? '' : undefined}
      className={cx(styles.header, className)}
      style={style}
    >
      <div role="row" className={styles.names}>
        <span role="columnheader" className={shared.srOnly}>
          {metricLabel}
        </span>
        {children}
      </div>
      {summary}
    </div>
  );
}

export interface ComparisonSideProps extends BlockProps {
  /** The second side: its icon is at the far end. */
  opposite?: boolean | undefined;
  icon?: ReactNode | undefined;
  /** Any CSS colour, for the side's bars and leader mark. */
  color?: string | undefined;
  /** In a table it is a column header; in a strip it is plain text. */
  role?: 'columnheader' | undefined;
}

/** One side's name and mark. */
function Side({ opposite, icon, color, role, className, style, children }: ComparisonSideProps) {
  return (
    <div
      role={role}
      data-part={opposite ? 'opposite' : 'side'}
      className={cx(styles.side, className)}
      style={{ ...(color && { ['--side' as string]: color }), ...style }}
    >
      {icon && (
        <span data-part="icon" className={styles.icon}>
          {icon}
        </span>
      )}
      <TruncatedText part="name" className={styles.name}>
        {children}
      </TruncatedText>
    </div>
  );
}

export interface ComparisonSummaryProps extends ComparisonSummary {
  /** What assistive technology reads as the row's name when there is no caption. */
  summaryLabel?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The large pair of values in the middle of the header: a row of the table, named by its caption. */
function Summary({
  values,
  caption,
  separator = '–',
  summaryLabel = 'Summary',
  className,
  style,
}: ComparisonSummaryProps) {
  return (
    <div role="row" data-part="summary" className={cx(styles.summary, className)} style={style}>
      <span role="rowheader" data-part="caption" className={caption == null ? shared.srOnly : styles.caption}>
        {caption ?? summaryLabel}
      </span>
      <span role="cell" className={styles.summaryValue}>
        {values[0]}
      </span>
      <span aria-hidden="true" className={styles.separator}>
        {separator}
      </span>
      <span role="cell" className={styles.summaryValue}>
        {values[1]}
      </span>
    </div>
  );
}

/** The rows of the table. */
function Body({ className, style, children }: BlockProps) {
  return (
    <div role="rowgroup" data-part="body" className={cx(styles.body, className)} style={style}>
      {children}
    </div>
  );
}

/** One metric. Put a `Comparison.Label` first, then the two `Comparison.Value`, then `Comparison.Bars`. */
function Row({ className, style, children }: BlockProps) {
  return (
    <div role="row" data-part="row" className={cx(styles.row, className)} style={style}>
      {children}
    </div>
  );
}

/** The metric's name, the header of its row. Truncates, with the whole text in a tooltip. */
function Label({ className, style, children }: BlockProps) {
  return (
    <span role="rowheader" data-part="label" className={cx(styles.label, className)} style={style}>
      <TruncatedText>{children}</TruncatedText>
    </span>
  );
}

export interface ComparisonValueProps extends BlockProps, ChangeHighlightProps {
  /** The second side's value: at the far end of the row. */
  opposite?: boolean | undefined;
  /** This side leads the row: heavier text and a mark. */
  leader?: boolean | undefined;
  /** What assistive technology reads with a leading value. */
  leaderLabel?: string | undefined;
  /** Any CSS colour, for the leader mark. */
  color?: string | undefined;
}

/** One side's value of a metric. */
function Value({
  opposite,
  leader,
  leaderLabel = 'Leading',
  color,
  className,
  style,
  children,
  ...change
}: ComparisonValueProps) {
  return (
    <span
      role="cell"
      data-part="value"
      data-side={opposite ? 'opposite' : 'side'}
      data-leader={leader || undefined}
      className={cx(styles.value, className)}
      style={{ ...(color && { ['--side' as string]: color }), ...style }}
    >
      <span {...changeHost(change)} className={styles.number}>
        <ChangeHighlight {...change}>{children}</ChangeHighlight>
        {children}
      </span>
      {leader && (
        <span data-part="leader" className={styles.leader}>
          <span className={shared.srOnly}>{leaderLabel}</span>
        </span>
      )}
    </span>
  );
}

export interface ComparisonBarsProps {
  /** Each side's share of a full bar, from 0 to 1. */
  shares: readonly [number, number];
  /** Any CSS colours. */
  colors?: readonly [string | undefined, string | undefined] | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** Two bars that grow from the centre, one per side. A drawing of the two values beside it: hidden from assistive technology. */
function Bars({ shares, colors, className, style }: ComparisonBarsProps) {
  return (
    <span aria-hidden="true" data-part="bars" className={cx(styles.bars, className)} style={style}>
      {shares.map((share, side) => (
        <span key={side} className={styles.track}>
          <span
            data-part="bar"
            className={styles.bar}
            style={{
              ['--share' as string]: Math.min(1, Math.max(0, share)),
              ...(colors?.[side] && { ['--side' as string]: colors[side] }),
            }}
          />
        </span>
      ))}
    </span>
  );
}

export interface ComparisonStripProps {
  /** The two `Comparison.Side`, first and second. */
  sides: readonly [ReactNode, ReactNode];
  values: readonly [ReactNode, ReactNode];
  separator?: ReactNode | undefined;
  /** A quiet text after the second side: what the values are. */
  caption?: ReactNode | undefined;
  /** Names the strip for assistive technology. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** One line: the first side, the two values, the second side. Read in that order. */
function Strip({
  sides,
  values,
  separator = '–',
  caption,
  'aria-label': label,
  className,
  style,
}: ComparisonStripProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-part="strip"
      className={cx(styles.strip, className)}
      style={style}
    >
      {sides[0]}
      <span data-part="summary" className={styles.stripValues}>
        <span>{values[0]}</span>
        <span className={styles.separator}>{separator}</span>
        <span>{values[1]}</span>
      </span>
      {sides[1]}
      {caption != null && (
        <span data-part="caption" className={styles.caption}>
          {caption}
        </span>
      )}
    </div>
  );
}

export interface ComparisonProps
  extends
    Omit<ComparisonRootProps, 'children' | 'strip' | 'loading'>,
    DataStateProps,
    Omit<ChangeHighlightProps, 'changeValue'> {
  /** The two things compared: the first at the start of each row, the second at its end. */
  sides: readonly [ComparisonSide, ComparisonSide];
  /** One row per metric. */
  rows: readonly ComparisonRow[];
  /** A large pair of values in the middle of the header, with a caption. */
  summary?: ComparisonSummary | undefined;
  /** Draws each row's two values as bars that grow from the centre. */
  showBars?: boolean | undefined;
  /** Marks the side that leads each row, by weight and a mark. */
  highlightLeader?: boolean | undefined;
  /** Text of a value. */
  formatValue?: ((value: number, row: ComparisonRow) => ReactNode) | undefined;
  /** Shown in place of a value that is missing. */
  emptyLabel?: ReactNode | undefined;
  /** The header of the label column, for assistive technology. */
  metricLabel?: string | undefined;
  /** The name of the summary row for assistive technology, when it has no caption. */
  summaryLabel?: string | undefined;
  /** What assistive technology reads with a leading value. */
  leaderLabel?: string | undefined;
  /** Number of placeholder rows while `loading`. */
  skeletonRows?: number | undefined;
  /** Names the comparison for assistive technology. */
  'aria-label'?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        header?: Part<ComparisonHeaderProps> | undefined;
        side?: Part<ComparisonSideProps> | undefined;
        summary?: Part<ComparisonSummaryProps> | undefined;
        row?: Part<{ row: ComparisonRow; children: ReactNode }> | undefined;
        label?: Part<{ row: ComparisonRow; children: ReactNode }> | undefined;
        value?: Part<ComparisonValueProps & { row: ComparisonRow }> | undefined;
        bars?: Part<ComparisonBarsProps> | undefined;
        strip?: Part<ComparisonStripProps> | undefined;
        skeleton?: Part | undefined;
        /** The empty or error state. */
        state?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** Two sides compared on a list of metrics: a value on each side of every label, with bars from the centre. */
export function Comparison({
  sides,
  rows,
  summary,
  showBars = true,
  highlightLeader = true,
  formatValue = (value) => String(value),
  emptyLabel = '—',
  metricLabel,
  summaryLabel,
  leaderLabel,
  skeletonRows = 5,
  'aria-label': label,
  parts,
  loading,
  empty,
  error,
  onRetry,
  retryLabel,
  ...rest
}: ComparisonProps) {
  const [change, root] = splitChange(rest);
  const colors = [sides[0].color ?? seriesColour(0), sides[1].color ?? seriesColour(1)] as const;
  const text = (row: ComparisonRow, value: ComparisonValue) =>
    hasValue(value) ? (row.formatValue ?? ((v: number) => formatValue(v, row)))(value) : emptyLabel;
  const side = (index: 0 | 1, role?: 'columnheader') =>
    renderPart(
      parts?.side,
      {
        opposite: index === 1,
        icon: sides[index].icon,
        color: colors[index],
        role,
        children: sides[index].name,
      },
      (p) => <Side key={index} {...p} />,
    );

  const state = dataState(
    { loading, empty, error, onRetry, retryLabel },
    { part: true, isEmpty: rows.length === 0, defaultEmpty: { title: 'Nothing to compare' } },
  );
  if (state) {
    return (
      <Root {...root} variant="table">
        {renderPart(parts?.state, { children: state }, (p) => p.children)}
      </Root>
    );
  }

  // The one line of the strip: the summary, or else the first metric.
  const first = rows[0];
  const stripProps: ComparisonStripProps = {
    sides: [side(0), side(1)],
    values: summary?.values ?? [first && text(first, first.values[0]), first && text(first, first.values[1])],
    separator: summary?.separator,
    caption: summary ? summary.caption : first?.label,
    'aria-label': label,
  };
  const strip = renderPart(parts?.strip, stripProps, (p) => <Strip {...p} />);
  if (root.variant === 'strip' && !loading) return <Root {...root}>{strip}</Root>;

  const header = renderPart(
    parts?.header,
    {
      metricLabel,
      summary: summary && renderPart(parts?.summary, { ...summary, summaryLabel }, (p) => <Summary {...p} />),
      children: (
        <>
          {side(0, 'columnheader')}
          {side(1, 'columnheader')}
        </>
      ),
    },
    (p) => <Header {...p} />,
  );

  if (loading) {
    return (
      <Root {...root} variant="table" loading>
        <Table aria-label={label}>
          {header}
          {renderPart(parts?.skeleton, {}, () => (
            <div data-part="skeleton" aria-hidden="true" className={styles.body}>
              {Array.from({ length: skeletonRows }, (_, i) => (
                <div key={i} className={styles.row}>
                  <Skeleton width={28} />
                  <Skeleton width={72 + (i % 3) * 24} style={{ gridArea: '1 / 2', justifySelf: 'center' }} />
                  <Skeleton width={28} style={{ gridArea: '1 / 3', justifySelf: 'end' }} />
                  {showBars && <Skeleton shape="block" className={styles.bars} style={{ minHeight: 0 }} />}
                </div>
              ))}
            </div>
          ))}
        </Table>
      </Root>
    );
  }

  return (
    <Root {...root} strip={strip}>
      <Table aria-label={label}>
        {header}
        <Body>
          {rows.map((row) => {
            const leader = highlightLeader ? leaderOf(row) : null;
            const [a, b] = row.values;
            const full = row.max ?? Math.max(hasValue(a) ? a : 0, hasValue(b) ? b : 0);
            const share = (value: ComparisonValue) => (hasValue(value) && full > 0 ? value / full : 0);
            const value = (index: 0 | 1) => {
              const p: ComparisonValueProps = {
                opposite: index === 1,
                leader: leader === index,
                leaderLabel,
                color: colors[index],
                ...change,
                changeValue: row.values[index],
                children: text(row, row.values[index]),
              };
              return renderPart(parts?.value, { ...p, row }, () => <Value key={index} {...p} />);
            };
            const cells = (
              <>
                {renderPart(parts?.label, { row, children: row.label }, (p) => (
                  <Label>{p.children}</Label>
                ))}
                {value(0)}
                {value(1)}
                {showBars &&
                  renderPart(parts?.bars, { shares: [share(a), share(b)], colors }, (p) => <Bars {...p} />)}
              </>
            );
            return (
              <Fragment key={row.id}>
                {renderPart(parts?.row, { row, children: cells }, (p) => (
                  <Row>{p.children}</Row>
                ))}
              </Fragment>
            );
          })}
        </Body>
      </Table>
    </Root>
  );
}

Comparison.Root = Root;
Comparison.Table = Table;
Comparison.Header = Header;
Comparison.Side = Side;
Comparison.Summary = Summary;
Comparison.Body = Body;
Comparison.Row = Row;
Comparison.Label = Label;
Comparison.Value = Value;
Comparison.Bars = Bars;
Comparison.Strip = Strip;
