import type { ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import styles from './Chart.module.css';
import {
  Annotations,
  annotationMarks,
  labelsAbove,
  Axes,
  fitTicks,
  Grid,
  type AxisTick,
  type CartesianModel,
  type ChartAnnotation,
} from './internal/cartesian';
import { resolveThreshold, type Threshold, type ThresholdList } from '../utils/thresholds';
import { fillKind, FillPattern, fillPaint, seriesColour, type FillKind } from './internal/cues';
import { toneColours } from './internal/tones';
import {
  Frame,
  seriesProps,
  useFrame,
  type BuildInput,
  type ChartCommonProps,
  type ChartParts,
  type PointModel,
} from './internal/Frame';
import {
  bands,
  cartesianMargins,
  linear,
  niceDomain,
  numberFormat,
  stack,
  truncate,
} from './internal/scales';

export interface BarSeries {
  id: string;
  label: string;
  /** One value per category, in the order of `categories`. `null` leaves the bar out. */
  values: (number | null)[];
  /** Any CSS colour. Without it the series takes the series palette, by its position. */
  color?: string | undefined;
  /** The fill: solid, or outlined with a pattern. By default series take them in turn. */
  marker?: FillKind | undefined;
}

/** A `Threshold` whose fill can be chosen. */
export interface BarThreshold extends Threshold {
  /** The fill that goes with the colour. By default the bands take the fills in turn, by position. */
  marker?: FillKind | undefined;
}

interface Paint {
  color: string;
  fill: FillKind;
}
interface BarModel extends CartesianModel {
  paints: Paint[];
  bars: {
    seriesId: string;
    paint: number;
    /** The position of the value's band in `thresholds`. */
    band?: number | undefined;
    x: number;
    y: number;
    width: number;
    height: number;
    from: 'bottom' | 'top' | 'start' | 'end';
    point: PointModel;
  }[];
  labels: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; text: string }[];
}

export interface BarChartRootProps extends ChartCommonProps {
  categories: string[];
  series: BarSeries[];
  /** `horizontal` puts the categories on the left and draws the bars sideways. */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /**
   * `grouped`: the series side by side. `stacked`: on top of each other. `diverging`: every second
   * series is drawn on the other side of zero, with all values shown as positive.
   */
  variant?: 'grouped' | 'stacked' | 'diverging' | undefined;
  /** `sign` colours bars by the sign of their value; negative bars are also striped. */
  colorBy?: 'series' | 'sign' | undefined;
  /**
   * Colours bars by the band of their value: an ascending list of `{ from, tone?, color?, label? }`, or
   * plain numbers as boundaries on the value ramp. Each band also has a fill, so the bands differ
   * without colour, and its `label` joins the value in the tooltip and for screen readers.
   */
  thresholds?: ThresholdList<BarThreshold> | undefined;
  /** For a scale where low is good: mirrors the colours and fills of the bands. The labels stay. */
  lowerIsBetter?: boolean | undefined;
  /** The range of the value axis. Defaults to round numbers around the data, with zero. */
  valueDomain?: [number, number] | undefined;
  /** Reference lines and bands on the value axis. */
  annotations?: ChartAnnotation[] | undefined;
  /** Title of the horizontal axis. */
  xTitle?: string | undefined;
  /** Title of the vertical axis. */
  yTitle?: string | undefined;
  /** Replace or hide named pieces. */
  parts?: ChartParts | undefined;
  /** The blocks to draw, in order. */
  children?: ReactNode | undefined;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const positive = 'var(--umbra-chart-positive, var(--umbra-color-semantic-success))';
const negative = 'var(--umbra-chart-negative, var(--umbra-color-semantic-danger))';

function Root({
  categories,
  series,
  orientation = 'vertical',
  variant = 'grouped',
  colorBy = 'series',
  thresholds,
  lowerIsBetter,
  valueDomain,
  annotations,
  xTitle,
  yTitle,
  children,
  ...common
}: BarChartRootProps) {
  const { locale } = useLocale();
  const number = common.formatValue ?? numberFormat(locale, { maximumFractionDigits: 2 });
  const diverging = variant === 'diverging';
  // A diverging chart shows both sides as positive numbers.
  const format = (v: number) => number(diverging ? Math.abs(v) : v);
  const horizontal = orientation === 'horizontal';

  const all = series.map((s, i) => ({
    ...s,
    color: s.color ?? seriesColour(i),
    fill: s.marker ?? fillKind(i),
    // In a diverging chart every second series points the other way.
    values: s.values.map((v) =>
      v == null ? null : diverging ? (i % 2 && v ? -Math.abs(v) : Math.abs(v)) : v,
    ),
  }));

  const build = ({ width, height, fontSize, measure, level, hidden }: BuildInput): BarModel => {
    const shown = all.filter((s) => !hidden.includes(s.id));
    const axes = level < 4;
    const labelled = !!common.labels && level < 2;
    // Where each bar starts and ends on the value axis.
    const spans = categories.map((_, c) =>
      variant === 'grouped'
        ? shown.map((s) => (s.values[c] == null ? null : ([0, s.values[c]] as [number, number])))
        : stack(shown.map((s) => s.values[c] ?? null)),
    );
    const extent = spans.flat().flatMap((s) => s ?? []);
    for (const a of annotations ?? [])
      for (const v of a.type === 'line' ? [a.value] : [a.from, a.to])
        if (typeof v === 'number') extent.push(v);
    let domain = valueDomain ?? niceDomain(extent, true);
    if (diverging && !valueDomain) {
      const reach = Math.max(-domain[0], domain[1]);
      domain = [-reach, reach];
    }

    const valueLabels = (length: number) =>
      linear(domain, [0, length]).ticks(
        clamp(Math.floor(length / (horizontal ? fontSize * 5 : fontSize * 3)), 2, 8),
      );
    const widest = (labels: string[]) => Math.max(...labels.map((l) => measure(l)), 0);
    const endRoom = labelled && horizontal ? widest(extent.map(format)) + 6 : 0;
    const margins = (leftLabels: number) =>
      cartesianMargins({
        level,
        fontSize,
        leftLabels,
        endLabels: endRoom,
        // The last value of a sideways chart is written under the end of the plot.
        endTick: horizontal && axes ? measure(format(domain[1])) : 0,
        topLabels: (labelled && !horizontal) || (horizontal && labelsAbove(annotations, () => true)),
        leftTitle: !!yTitle,
        bottomTitle: !!xTitle,
      });
    let m = margins(0);
    const top = m.top;
    const bottom = Math.max(height - m.bottom, top + 1);
    const leftRoom = !axes
      ? 0
      : horizontal
        ? Math.min(widest(categories), width * 0.35)
        : Math.min(widest(valueLabels(bottom - top).map(format)), width * 0.3);
    m = margins(leftRoom);
    const left = m.left;
    const right = Math.max(width - m.right, left + 1);

    const value = linear(domain, horizontal ? [left, right] : [bottom, top]);
    const band = bands(categories, horizontal ? [top, bottom] : [left, right]);
    const group = bands(
      shown.map((s) => s.id),
      [0, band.width],
      0.1,
      0,
    );
    const zero = value(clamp(0, domain[0], domain[1]));

    const paints: Paint[] = [];
    // The band of `thresholds` a value is in. (`band` below is the scale of the categories.)
    const stepOf = (v: number) => resolveThreshold(v, thresholds, { lowerIsBetter });
    const paintOf = (s: (typeof all)[number], v: number, step: ReturnType<typeof stepOf>) => {
      const paint: Paint = step
        ? {
            // A band without a colour keeps the colour of its series, and still has its own fill.
            color: step.color ?? (step.tone ? toneColours[step.tone] : s.color),
            fill: step.look.marker ?? fillKind(step.cue),
          }
        : colorBy === 'sign'
          ? v < 0
            ? { color: negative, fill: 'stripes' }
            : { color: positive, fill: 'square' }
          : { color: s.color, fill: s.fill };
      const found = paints.findIndex((p) => p.color === paint.color && p.fill === paint.fill);
      return found >= 0 ? found : paints.push(paint) - 1;
    };

    const bars: BarModel['bars'] = [];
    const labels: BarModel['labels'] = [];
    const size = variant === 'grouped' ? group.width : band.width;
    const endLabel = (at: number, end: number, down: boolean, text: string) => {
      // `at` is the middle of the bar across the band; `end` is where the bar ends on the value axis.
      if (horizontal)
        labels.push({
          x: end + (down ? -4 : 4),
          y: at + fontSize * 0.35,
          anchor: down ? 'end' : 'start',
          text,
        });
      else if (measure(text) <= size + 6)
        labels.push({ x: at, y: end + (down ? fontSize + 2 : -5), anchor: 'middle', text });
    };
    categories.forEach((category, c) => {
      const totals = { up: 0, down: 0 };
      shown.forEach((s, i) => {
        const span = spans[c]![i];
        const v = s.values[c];
        if (!span || v == null) return;
        const start = band(category) + (variant === 'grouped' ? group(s.id) : 0);
        const [a, b] = [value(span[0]), value(span[1])];
        // A grouped bar of zero keeps a hairline, so it can still be pointed at.
        const length = Math.max(Math.abs(b - a), variant === 'grouped' ? 1 : 0);
        const rect = horizontal
          ? { x: Math.min(a, b), y: start, width: length, height: size }
          : { x: start, y: Math.min(a, b), width: size, height: length };
        const mid = start + size / 2;
        const step = stepOf(v);
        const paint = paintOf(s, v, step);
        const text = step?.label ? `${format(v)} · ${step.label}` : format(v);
        bars.push({
          seriesId: s.id,
          paint,
          band: step?.index,
          ...rect,
          from: horizontal ? (v < 0 ? 'end' : 'start') : v < 0 ? 'top' : 'bottom',
          point: {
            key: `${s.id}-${c}`,
            group: category,
            name: `${s.label}, ${category}: ${text}`,
            valueText: text,
            color: paints[paint]!.color,
            x: horizontal ? b : mid,
            y: horizontal ? mid : b,
            outline: { type: 'rect', ...rect },
            point: {
              seriesId: s.id,
              seriesLabel: s.label,
              index: c,
              x: category,
              value: diverging ? Math.abs(v) : v,
            },
          },
        });
        if (v < 0) totals.down += v;
        else totals.up += v;
        if (labelled && variant === 'grouped') endLabel(mid, b, v < 0, format(v));
      });
      // Stacked bars are labelled with the total of each side.
      if (labelled && variant !== 'grouped') {
        const mid = band(category) + band.width / 2;
        if (totals.up) endLabel(mid, value(totals.up), false, format(totals.up));
        if (totals.down) endLabel(mid, value(totals.down), true, format(totals.down));
      }
    });

    const length = horizontal ? right - left : bottom - top;
    const valueTicks: AxisTick[] = value
      .ticks(clamp(Math.floor(length / (horizontal ? fontSize * 5 : fontSize * 3)), 2, 8))
      .map((v) => ({ at: value(v), label: format(v) }));
    const categoryTicks: AxisTick[] = categories.map((c) => ({
      at: band(c) + band.width / 2,
      label: horizontal ? truncate(c, leftRoom, measure) : c,
    }));

    return {
      rows: shown.map((s) => bars.filter((b) => b.seriesId === s.id).map((b) => b.point)),
      box: { left, top, right, bottom },
      axes,
      xTicks: horizontal
        ? fitTicks(valueTicks, right - left, fontSize, true, measure)
        : fitTicks(categoryTicks, right - left, fontSize, true, measure),
      yTicks: horizontal ? fitTicks(categoryTicks, bottom - top, fontSize, false) : valueTicks,
      gridX: horizontal ? valueTicks.map((t) => t.at) : [],
      gridY: horizontal ? [] : valueTicks.map((t) => t.at),
      xAxisAt: horizontal ? bottom : zero,
      yAxisAt: horizontal ? zero : left,
      xTitle: level < 3 ? xTitle : undefined,
      yTitle: level < 3 ? yTitle : undefined,
      // Reference values are on the value axis, whichever way the bars point.
      annotations: annotationMarks(annotations, (_axis, v) => value(Number(v))).map((a) => ({
        ...a,
        vertical: horizontal,
      })),
      fontSize,
      paints,
      bars,
      labels,
    };
  };

  return (
    <Frame
      {...common}
      kind="bar-chart"
      vertical={horizontal}
      series={all.map((s) => ({ id: s.id, label: s.label, color: s.color, marker: s.fill }))}
      table={{
        columns: categories,
        rows: all.map((s) => ({
          label: s.label,
          cells: categories.map((_, c) => (s.values[c] == null ? '' : format(s.values[c]))),
        })),
      }}
      summary={`${all.map((s) => s.label).join(', ')}: ${categories.join(', ')}`}
      isEmpty={!categories.length || !series.length}
      skeleton={
        <div className={styles.skeletonBars} data-orientation={orientation}>
          {[55, 80, 40, 95, 65, 75].map((share, i) => (
            <Skeleton
              key={i}
              shape="block"
              style={horizontal ? { width: `${share}%`, flex: 1 } : { height: `${share}%`, flex: 1 }}
            />
          ))}
        </div>
      }
      widths={[360, 280, 220, 150]}
      heights={[240, 190, 150, 100]}
      signature={all.map((s) => `${s.id}:${s.values.join()}`).join('|') + variant + orientation}
      build={build}
    >
      {children}
    </Frame>
  );
}

/** The bars. */
function Bars() {
  const frame = useFrame<BarModel>();
  const { model, uid } = frame;
  return (
    <g data-part="bars">
      <defs>
        {model.paints.map((p, i) => (
          <FillPattern key={i} id={`${uid}-fill-${i}`} kind={p.fill} color={p.color} />
        ))}
      </defs>
      {model.bars.map((b) => {
        const paint = model.paints[b.paint]!;
        return (
          <g
            key={b.point.key}
            className={styles.series}
            data-band={b.band}
            {...seriesProps(frame, b.seriesId)}
            {...frame.pointProps(b.point)}
          >
            <rect
              className={`${styles.bar} ${styles.grow}`}
              data-from={b.from}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              {...fillPaint(paint.fill, paint.color, `${uid}-fill-${b.paint}`)}
            />
          </g>
        );
      })}
    </g>
  );
}

/** The value at the end of each bar, or the total of each stack. Drawn when `labels` is set. */
function ValueLabels() {
  const { model } = useFrame<BarModel>();
  return (
    <g data-part="valueLabels">
      {model.labels.map((l, i) => (
        <text key={i} className={styles.valueLabel} x={l.x} y={l.y} textAnchor={l.anchor}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

export type BarChartProps = Omit<BarChartRootProps, 'children'>;

/** Compares values across categories: grouped, stacked or diverging around zero, upright or sideways. */
export function BarChart(props: BarChartProps) {
  return (
    <Root {...props}>
      <Grid />
      <Annotations />
      <Bars />
      <Axes />
      <ValueLabels />
    </Root>
  );
}

BarChart.Root = Root;
BarChart.Grid = Grid;
BarChart.Annotations = Annotations;
BarChart.Bars = Bars;
BarChart.Axes = Axes;
BarChart.ValueLabels = ValueLabels;
