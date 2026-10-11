import {
  createContext,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useLocale } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { Tip } from '../internal/TruncatedText';
import type { DataTableColumn } from '../table/DataTable';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import { resolveThreshold, type ThresholdList, type ThresholdTone } from '../utils/thresholds';
import { areaPath, linePath, type LineCurve } from './internal/line';
import { linear, numberFormat } from './internal/scales';
import { toneColours } from './internal/tones';
import { useChartSize } from './internal/useChartSize';
import styles from './Sparkline.module.css';

/** What `formatSummary` receives: the numbers a screen reader hears in place of the drawing. */
export interface SparklineStats {
  /** How many values there are, the missing ones left out. */
  count: number;
  first: number;
  last: number;
  min: number;
  max: number;
  /** The last value against the first. */
  trend: 'up' | 'down' | 'flat';
}

interface Mark {
  index: number;
  value: number;
  /** Where the value is, in pixels. */
  x: number;
  y: number;
  color: string;
  band?: number | undefined;
  text: string;
}

interface SparkContext {
  variant: 'line' | 'area' | 'bars' | 'signed';
  width: number;
  height: number;
  marks: Mark[];
  /** The line as pixels, with its gaps. */
  pixels: (readonly [number, number | null])[];
  /** The pixel of zero, or of the bottom of the scale: where bars and the area start. */
  base: number;
  /** The width of a bar. */
  bar: number;
  color: string;
  curve: LineCurve;
  /** The pixels of the reference line (one) or band (two), from the top. */
  reference?: number[] | undefined;
  lastPoint: boolean;
  extremes: boolean;
  active: Mark | undefined;
}

const Context = createContext<SparkContext | null>(null);

function useSpark() {
  const spark = useContext(Context);
  if (!spark) throw new Error('Sparkline blocks must be rendered inside <Sparkline.Root>.');
  return spark;
}

export interface SparklineRootProps {
  /** The values, in order. `null` is a missing value: a gap in the line, no bar. */
  data: readonly (number | null | undefined)[];
  /**
   * `line` and `area` join the values; `bars` draws one bar per value from zero; `signed` draws equal
   * bars above or below the middle by the sign of each value, for a run of outcomes.
   */
  variant?: 'line' | 'area' | 'bars' | 'signed' | undefined;
  /** The name of each value (a month, a round), for the tooltip of an `interactive` sparkline. */
  labels?: readonly string[] | undefined;
  /** The range of the scale. Defaults to the lowest and highest value; bars include zero. */
  domain?: [number, number] | undefined;
  /** Colour of the marks, by meaning. */
  tone?: 'default' | ThresholdTone | undefined;
  /** Any CSS colour. Wins over `tone`. */
  color?: string | undefined;
  /**
   * Colours each bar, and the last point of a line, by the band of its value: an ascending list of
   * `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. The height of
   * a bar already shows its value without colour; the band's `label` joins the value in the tooltip.
   */
  thresholds?: ThresholdList | undefined;
  /** For a scale where low is good: mirrors the colours of the bands. The labels stay. */
  lowerIsBetter?: boolean | undefined;
  /** A reference line at one value, or a band between two. */
  reference?: number | [number, number] | undefined;
  /** Marks the last value with a dot. */
  lastPoint?: boolean | undefined;
  /** Marks the lowest and the highest value with a dot. */
  extremes?: boolean | undefined;
  curve?: LineCurve | undefined;
  /** The widest a bar gets, in pixels. Narrower when the values do not fit. */
  maxBarWidth?: number | undefined;
  /** Makes the sparkline a tab stop that shows the nearest value in a tooltip on hover, focus and arrow keys. */
  interactive?: boolean | undefined;
  /** Formats a value for the summary and the tooltip. Defaults to the provider's locale. */
  formatValue?: ((value: number) => string) | undefined;
  /** The text a screen reader hears in place of the drawing. Defaults to an English sentence. */
  formatSummary?: ((stats: SparklineStats, format: (value: number) => string) => string) | undefined;
  /** Shows a skeleton in place of the marks. */
  loading?: boolean | undefined;
  /** Shown in place of the marks when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** What assistive technology hears when there is no value. */
  noValueLabel?: string | undefined;
  /** Replaces the generated summary as the accessible name. */
  'aria-label'?: string | undefined;
  /** Replaces the skeleton shown while loading. */
  skeleton?: Part | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** The blocks to draw, in order. */
  children?: ReactNode | undefined;
}

const summarise = (s: SparklineStats, format: (value: number) => string) =>
  s.count === 1
    ? `1 value: ${format(s.first)}`
    : `${s.count} values, first ${format(s.first)}, last ${format(s.last)}, lowest ${format(s.min)}, ` +
      `highest ${format(s.max)}, ${s.trend === 'up' ? 'rising' : s.trend === 'down' ? 'falling' : 'flat'}`;

// Room for a marker at the edge of the plot.
const pad = 3;
const positive = 'var(--umbra-sparkline-positive, var(--umbra-color-semantic-success))';
const negative = 'var(--umbra-sparkline-negative, var(--umbra-color-semantic-danger))';

function Root({
  data,
  variant = 'line',
  labels,
  domain,
  tone = 'default',
  color: colorProp,
  thresholds,
  lowerIsBetter,
  reference,
  lastPoint = false,
  extremes = false,
  curve = 'linear',
  maxBarWidth = 6,
  interactive = false,
  formatValue,
  formatSummary = summarise,
  loading = false,
  emptyLabel = '—',
  noValueLabel = 'No data',
  'aria-label': label,
  skeleton,
  className,
  style,
  children,
}: SparklineRootProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { width, height } = useChartSize(ref);
  const { locale } = useLocale();
  const format = formatValue ?? numberFormat(locale, { maximumFractionDigits: 2 });
  const [activeIndex, setActive] = useState<number | null>(null);

  const numbers = data.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  const empty = !numbers.length;
  const [min, max] = [Math.min(...numbers), Math.max(...numbers)];
  const bars = variant === 'bars' || variant === 'signed';
  const color =
    colorProp ??
    (tone === 'default' ? 'var(--umbra-sparkline-color, var(--umbra-color-series-1))' : toneColours[tone]);

  // The scale holds the values, the reference and, for bars, zero.
  const noted = reference === undefined ? [] : [reference].flat();
  const [low, high] = domain ?? [
    Math.min(min, ...noted, ...(variant === 'bars' ? [0] : [])),
    Math.max(max, ...noted, ...(variant === 'bars' ? [0] : [])),
  ];
  const y = linear(high > low ? [low, high] : [low - 1, low + 1], [height - pad, pad]);
  // Bars are packed from the left at their widest, so five values in a wide cell stay five small bars.
  const step = Math.min(width / Math.max(1, data.length), maxBarWidth + 2);
  const x = (i: number) =>
    bars ? step * (i + 0.5) : data.length > 1 ? pad + ((width - 2 * pad) * i) / (data.length - 1) : width / 2;
  const middle = height / 2;

  const marks = data.flatMap((v, index): Mark[] => {
    if (typeof v !== 'number' || Number.isNaN(v)) return [];
    const band = variant === 'signed' ? undefined : resolveThreshold(v, thresholds, { lowerIsBetter });
    return [
      {
        index,
        value: v,
        x: x(index),
        y: variant === 'signed' ? (v > 0 ? pad : v < 0 ? height - pad : middle) : y(v),
        color:
          variant === 'signed'
            ? v > 0
              ? positive
              : v < 0
                ? negative
                : color
            : (band?.color ?? (band?.tone ? toneColours[band.tone] : color)),
        band: band?.index,
        text:
          (labels?.[index] ? `${labels[index]}: ` : '') + format(v) + (band?.label ? ` · ${band.label}` : ''),
      },
    ];
  });
  const active = marks.find((m) => m.index === activeIndex);

  const context: SparkContext = {
    variant,
    width,
    height,
    marks,
    pixels: data.map((v, i) => [x(i), typeof v === 'number' && !Number.isNaN(v) ? y(v) : null] as const),
    base: variant === 'signed' ? middle : Math.min(Math.max(y(0), pad), height - pad),
    bar: Math.max(1, step - Math.min(2, step * 0.3)),
    color,
    curve,
    reference: reference === undefined ? undefined : noted.map((v) => y(v)).sort((a, b) => a - b),
    lastPoint,
    extremes,
    active,
  };

  const drawn = !loading && !empty && width > 0 && height > 0;
  const summary = empty
    ? noValueLabel
    : formatSummary(
        {
          count: numbers.length,
          first: numbers[0]!,
          last: numbers.at(-1)!,
          min,
          max,
          trend: numbers.at(-1)! > numbers[0]! ? 'up' : numbers.at(-1)! < numbers[0]! ? 'down' : 'flat',
        },
        format,
      );
  const live = interactive && drawn;
  const nearest = (event: PointerEvent) => {
    const at = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const mark = marks.reduce((a, b) => (Math.abs(b.x - at) < Math.abs(a.x - at) ? b : a));
    setActive(mark.index);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const at = active ? marks.indexOf(active) : marks.length;
    const next = {
      ArrowLeft: marks[at - 1],
      ArrowRight: marks[at + 1],
      Home: marks[0],
      End: marks.at(-1),
    }[event.key];
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (next) setActive(next.index);
  };

  return (
    <>
      <span
        ref={ref}
        data-umbra="sparkline"
        data-variant={variant}
        data-loading={loading || undefined}
        data-empty={(!loading && empty) || undefined}
        data-interactive={live || undefined}
        // An image needs a name: while loading there is none to give unless the app gave one.
        role={loading && !label ? undefined : 'img'}
        aria-label={loading ? label : (label ?? summary)}
        aria-busy={loading || undefined}
        tabIndex={live ? 0 : undefined}
        className={cx(styles.root, className)}
        style={style}
        {...(live && {
          onPointerMove: nearest,
          onPointerLeave: () => setActive(null),
          onFocus: () => setActive((i) => i ?? marks.at(-1)!.index),
          onBlur: () => setActive(null),
          onKeyDown,
        })}
      >
        {loading ? (
          <span data-part="skeleton" className={styles.state}>
            {renderPart(skeleton, {}, () => (
              <Skeleton shape="block" className={styles.skeleton} />
            ))}
          </span>
        ) : empty ? (
          <span data-part="empty" className={styles.state}>
            {emptyLabel}
          </span>
        ) : (
          drawn && (
            <svg width={width} height={height} aria-hidden="true" className={styles.svg}>
              <Context.Provider value={context}>{children}</Context.Provider>
            </svg>
          )
        )}
      </span>
      {live && (
        <Tip anchor={ref} open={!!active} onOpenChange={(open) => !open && setActive(null)}>
          {active?.text}
        </Tip>
      )}
    </>
  );
}

/** The reference line or band. Renders nothing without `reference`. */
function Reference() {
  const { reference, width } = useSpark();
  if (!reference) return null;
  const [from, to] = [reference[0]!, reference.at(-1)!];
  return (
    <g data-part="reference" className={styles.reference}>
      {to > from && <rect x={0} y={from} width={width} height={to - from} />}
      {[...new Set([from, to])].map((at) => (
        <line key={at} x1={0} x2={width} y1={at} y2={at} />
      ))}
    </g>
  );
}

/** The line, the area or the bars. */
function Marks() {
  const s = useSpark();
  if (s.variant === 'line' || s.variant === 'area') {
    return (
      <g data-part="marks" style={{ color: s.color }}>
        {s.variant === 'area' && <path className={styles.area} d={areaPath(s.pixels, s.base, s.curve)} />}
        <path className={styles.line} d={linePath(s.pixels, s.curve)} />
        {/* A value with no neighbour has no line to it: it is drawn as a dot. */}
        {s.marks
          .filter((m) => s.pixels[m.index - 1]?.[1] == null && s.pixels[m.index + 1]?.[1] == null)
          .map((m) => (
            <circle key={m.index} className={styles.dot} cx={m.x} cy={m.y} r={1.5} />
          ))}
      </g>
    );
  }
  return (
    <g data-part="marks">
      {s.marks.map((m) => {
        // A bar of zero keeps a hairline, so the value is seen to be there.
        const length = Math.max(Math.abs(m.y - s.base), 1);
        return (
          <rect
            key={m.index}
            data-part="bar"
            data-band={m.band}
            data-sign={s.variant === 'signed' ? Math.sign(m.value) : undefined}
            x={m.x - s.bar / 2}
            y={m.y < s.base ? s.base - length : m.y > s.base ? s.base : s.base - length / 2}
            width={s.bar}
            height={length}
            rx={Math.min(1, s.bar / 2)}
            fill={m.color}
          />
        );
      })}
    </g>
  );
}

/** The dots on the last, the lowest and the highest value, and on the value the tooltip shows. */
function Markers() {
  const s = useSpark();
  const last = s.marks.at(-1);
  const by = (pick: (a: Mark, b: Mark) => boolean) => s.marks.reduce((a, b) => (pick(a, b) ? b : a));
  const dots = [
    s.extremes && s.marks.length > 1 && { kind: 'min', mark: by((a, b) => b.value < a.value) },
    s.extremes && s.marks.length > 1 && { kind: 'max', mark: by((a, b) => b.value > a.value) },
    s.lastPoint && last && { kind: 'last', mark: last },
    s.active && { kind: 'active', mark: s.active },
  ].filter((d) => !!d);
  return (
    <g data-part="markers">
      {dots.map((d) => (
        <circle
          key={d.kind}
          data-part={`${d.kind}Point`}
          className={styles.marker}
          cx={d.mark.x}
          cy={d.mark.y}
          r={2.5}
          fill={d.kind === 'last' ? d.mark.color : undefined}
        />
      ))}
    </g>
  );
}

export interface SparklineProps extends Omit<SparklineRootProps, 'children' | 'skeleton'> {
  /** Replace or hide named pieces. */
  parts?:
    | {
        reference?: Part | undefined;
        marks?: Part | undefined;
        markers?: Part | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A tiny chart with no axes: the shape of a run of values, for a table cell, a tile or a line of text. */
export function Sparkline({ parts, ...root }: SparklineProps) {
  return (
    <Root {...root} skeleton={parts?.skeleton}>
      {renderPart(parts?.reference, {}, () => (
        <Reference />
      ))}
      {renderPart(parts?.marks, {}, () => (
        <Marks />
      ))}
      {renderPart(parts?.markers, {}, () => (
        <Markers />
      ))}
    </Root>
  );
}

Sparkline.Root = Root;
Sparkline.Reference = Reference;
Sparkline.Marks = Marks;
Sparkline.Markers = Markers;

/**
 * A `DataTable` column that draws a sparkline in each cell. `values` gives a row's run of values; the
 * column sorts by the last one unless it has an `accessor`. `sparkline` is the props of every cell's
 * `Sparkline`, or a function of the row. It lives in `umbra-ui/charts`, so a table without one loads no
 * chart code.
 */
export function sparklineColumn<Row>({
  values,
  sparkline,
  ...column
}: Omit<DataTableColumn<Row>, 'cell'> & {
  values: (row: Row) => readonly (number | null | undefined)[];
  sparkline?: Omit<SparklineProps, 'data'> | ((row: Row) => Omit<SparklineProps, 'data'>) | undefined;
}): DataTableColumn<Row> {
  return {
    width: 96,
    accessor: (row) => values(row).findLast((v) => typeof v === 'number') ?? null,
    ...defined(column),
    cell: (row) => (
      <Sparkline {...(typeof sparkline === 'function' ? sparkline(row) : sparkline)} data={values(row)} />
    ),
  };
}
