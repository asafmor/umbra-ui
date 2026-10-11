import type { ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Chart.module.css';
import {
  Annotations,
  annotationMarks,
  Axes,
  Backdrop,
  fitTicks,
  Grid,
  labelsAbove,
  type AxisTick,
  type CartesianModel,
  type ChartAnnotation,
} from './internal/cartesian';
import { PointShape, pointShape, seriesColour, type PointShapeKind } from './internal/cues';
import {
  Frame,
  seriesProps,
  useFrame,
  type BuildInput,
  type ChartCommonProps,
  type ChartParts,
  type PointModel,
} from './internal/Frame';
import { cartesianMargins, dateFormat, linear, niceDomain, numberFormat, time } from './internal/scales';

export type ScatterX = number | Date;

export interface ScatterPoint {
  /** A number or a date. Use the same kind for every point of a chart. */
  x: ScatterX;
  y: number;
  /** A third value, drawn as the area of the point: a bubble. */
  size?: number | undefined;
  /** Names the point: in the tooltip, for screen readers, and beside the point with `labels`. */
  label?: string | undefined;
  /** What `onAction` receives. Defaults to the series id and the point's position, as `series-0`. */
  id?: string | undefined;
}

export interface ScatterSeries {
  id: string;
  label: string;
  data: ScatterPoint[];
  /** Any CSS colour. Without it the series takes the series palette, by its position. */
  color?: string | undefined;
  /** The shape of its points. By default series take the shapes in turn. */
  marker?: PointShapeKind | undefined;
}

export interface ScatterParts extends ChartParts {
  /** What is drawn behind the points, sized to the plot area: a diagram, a floor plan, a map. */
  backdrop?: Part | undefined;
}

type DrawnPoint = PointModel & { r: number; bubble: boolean };
interface ScatterModel extends CartesianModel {
  series: { id: string; color: string; shape: PointShapeKind; points: DrawnPoint[] }[];
  labels: { x: number; y: number; anchor: 'start' | 'end'; text: string }[];
}

export interface ScatterRootProps extends ChartCommonProps {
  series: ScatterSeries[];
  /** The range of the x axis. Defaults to round numbers around the data, or the first and last date. */
  xDomain?: [number, number] | [Date, Date] | undefined;
  /** The range of the y axis. Defaults to round numbers around the data. */
  yDomain?: [number, number] | undefined;
  /** The `size` values that give the smallest and the largest bubble. Defaults to 0 and the largest size. */
  sizeDomain?: [number, number] | undefined;
  /** Reference lines and bands on either axis. */
  annotations?: ChartAnnotation[] | undefined;
  /** `false` draws no axis lines, grid, tick labels or titles: the points take the whole plot, for a chart over a backdrop. */
  axes?: boolean | undefined;
  xTitle?: string | undefined;
  yTitle?: string | undefined;
  /** Names the `size` value in the tooltip, for screen readers and in the data table. */
  sizeLabel?: string | undefined;
  /** Formats an x value for the axis, the tooltip and screen readers. */
  formatX?: ((x: ScatterX) => string) | undefined;
  /** Formats a `size` value. Defaults to the provider's locale. */
  formatSize?: ((size: number) => string) | undefined;
  /** Called with the id of a point that is clicked, or activated with Enter or Space. */
  onAction?: ((id: string) => void) | undefined;
  /** Replace or hide named pieces. */
  parts?: ScatterParts | undefined;
  /** The blocks to draw, in order. */
  children?: ReactNode | undefined;
}

const pointSize = 4;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const overlap = (a: number[], b: number[]) =>
  a[0]! < b[2]! && b[0]! < a[2]! && a[1]! < b[3]! && b[1]! < a[3]!;

function Root({
  series,
  xDomain,
  yDomain,
  sizeDomain,
  annotations,
  axes: showAxes = true,
  xTitle,
  yTitle,
  sizeLabel = 'Size',
  formatX,
  formatSize,
  onAction,
  children,
  ...common
}: ScatterRootProps) {
  const { locale } = useLocale();
  const number = numberFormat(locale, { maximumFractionDigits: 2 });
  const format = common.formatValue ?? number;
  const dated = series.find((s) => s.data.length)?.data[0]?.x instanceof Date;
  const xText =
    formatX ?? (dated ? (x: ScatterX) => dateFormat(locale)(x as Date) : (x: ScatterX) => number(+x));
  const sizeText = formatSize ?? number;
  const sized = series.some((s) => s.data.some((p) => p.size != null));
  const idOf = (seriesId: string, index: number) =>
    series.find((s) => s.id === seriesId)?.data[index]?.id ?? `${seriesId}-${index}`;
  // With axis titles the two numbers of a point are named; without, they are a pair.
  const named = (title: string | undefined, value: string) => (title ? `${title} ${value}` : value);
  const valueOf = (p: ScatterPoint) =>
    [
      named(xTitle, xText(p.x)),
      named(yTitle, format(p.y)),
      p.size != null && `${sizeLabel} ${sizeText(p.size)}`,
    ]
      .filter(Boolean)
      .join(', ');

  const all = series.map((s, i) => ({
    ...s,
    color: s.color ?? seriesColour(i),
    shape: s.marker ?? pointShape(i),
  }));

  const build = ({ width, height, fontSize, measure, level, hidden }: BuildInput): ScatterModel => {
    const shown = all.filter((s) => !hidden.includes(s.id));
    const axes = showAxes && level < 4;
    const data = (shown.length ? shown : all).flatMap((s) => s.data);
    const noted = (axis: 'x' | 'y') =>
      (annotations ?? [])
        .filter((a) => (a.axis ?? 'y') === axis)
        .flatMap((a) => (a.type === 'line' ? [a.value] : [a.from, a.to]))
        .filter((v): v is number => typeof v === 'number');

    const margins = (leftLabels: number) =>
      cartesianMargins({
        level: axes ? level : 4,
        fontSize,
        leftLabels,
        topLabels: labelsAbove(annotations, (a) => a.axis === 'x'),
        leftTitle: !!yTitle,
        bottomTitle: !!xTitle,
      });
    let m = margins(0);
    const top = m.top;
    const bottom = Math.max(height - m.bottom, top + 1);
    const y = linear(yDomain ?? niceDomain([...data.map((p) => p.y), ...noted('y')]), [bottom, top]);
    const yAll: AxisTick[] = y
      .ticks(clamp(Math.floor((bottom - top) / (fontSize * 3)), 2, 8))
      .map((v) => ({ at: y(v), label: format(v) }));
    const leftRoom = axes ? Math.min(Math.max(...yAll.map((t) => measure(t.label)), 0), width * 0.3) : 0;
    m = margins(leftRoom);
    const left = m.left;
    const right = Math.max(width - m.right, left + 1);

    const count = clamp(Math.floor((right - left) / (fontSize * 6)), 2, 10);
    let xAt: (x: ScatterX) => number;
    let xAll: AxisTick[];
    if (dated) {
      const times = data.map((p) => +p.x);
      const ends = (xDomain as [Date, Date] | undefined) ?? [
        new Date(Math.min(...times)),
        new Date(Math.max(...times)),
      ];
      // A little room at both ends, so the first and last points are not cut by the plot's edge.
      const scale = time(ends, [left + pointSize + 2, right - pointSize - 2]);
      xAt = (x) => scale(x as Date);
      xAll = scale.ticks(count).map((v) => ({ at: scale(v), label: xText(v) }));
    } else {
      const scale = linear(
        (xDomain as [number, number] | undefined) ?? niceDomain([...data.map((p) => +p.x), ...noted('x')]),
        [left, right],
      );
      xAt = (x) => scale(+x);
      xAll = scale.ticks(count).map((v) => ({ at: scale(v), label: xText(v) }));
    }

    // The area of a bubble follows its size, so its radius follows the square root.
    const sizes = sizeDomain ?? [0, Math.max(...all.flatMap((s) => s.data.map((p) => p.size ?? 0)), 0)];
    const largest = clamp(Math.min(right - left, bottom - top) / 9, 6, 24);
    const radius = (size: number | undefined) =>
      size == null || !(sizes[1] > sizes[0])
        ? pointSize
        : 3 + (largest - 3) * Math.sqrt(clamp((size - sizes[0]) / (sizes[1] - sizes[0]), 0, 1));

    const built = shown.map((s) => ({
      id: s.id,
      color: s.color,
      shape: s.shape,
      points: s.data
        .map((p, i): DrawnPoint => {
          const value = valueOf(p);
          return {
            key: `${s.id}-${i}`,
            // Points share a tooltip only when they are the same point.
            group: p.label ?? value,
            name: `${s.label}${p.label ? `, ${p.label}` : ''}: ${value}`,
            valueText: value,
            color: s.color,
            x: xAt(p.x),
            y: y(p.y),
            r: radius(p.size),
            bubble: p.size != null,
            outline: { type: 'circle', r: radius(p.size) * 1.1 },
            point: { seriesId: s.id, seriesLabel: s.label, index: i, x: p.x, value: p.y },
          };
        })
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
        // The arrow keys move along the x axis.
        .sort((a, b) => a.x - b.x),
    }));

    // A label sits after its point, or before it at the end of the plot, and is left out when it would
    // cover a point or a label that is already placed.
    const labels: ScatterModel['labels'] = [];
    if (common.labels && level < 2) {
      const drawn = built.flatMap((s) => s.points);
      const taken = drawn.map((p) => [p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r]);
      const half = fontSize * 0.65;
      drawn.forEach((p, i) => {
        const text = series.find((s) => s.id === p.point.seriesId)?.data[p.point.index]?.label;
        if (!text) return;
        const w = measure(text);
        const start = p.x + p.r + 4;
        const end = p.x - p.r - 4;
        const boxes = [
          start + w <= right ? ([start, p.y - half, start + w, p.y + half] as number[]) : null,
          end - w >= left ? [end - w, p.y - half, end, p.y + half] : null,
        ];
        const side = boxes.findIndex((box) => box && !taken.some((t, j) => j !== i && overlap(box, t)));
        if (side < 0) return;
        taken.push(boxes[side]!);
        labels.push({ x: side ? end : start, y: p.y, anchor: side ? 'end' : 'start', text });
      });
    }

    return {
      rows: built.map((s) => s.points),
      box: { left, top, right, bottom },
      axes,
      xTicks: fitTicks(xAll, right - left, fontSize, true, measure),
      yTicks: yAll,
      gridX: xAll.map((t) => t.at),
      gridY: yAll.map((t) => t.at),
      xAxisAt: bottom,
      yAxisAt: left,
      xTitle: level < 3 ? xTitle : undefined,
      yTitle: level < 3 ? yTitle : undefined,
      annotations: annotationMarks(annotations, (axis, v) =>
        axis === 'y' ? y(Number(v)) : xAt(v as ScatterX),
      ),
      fontSize,
      series: built,
      labels,
    };
  };

  const pressed = common.onPointPress;
  return (
    <Frame
      {...common}
      onPointPress={
        pressed || onAction
          ? (point) => {
              pressed?.(point);
              onAction?.(idOf(point.seriesId, point.index));
            }
          : undefined
      }
      kind="scatter"
      series={all.map((s) => ({
        id: s.id,
        label: s.label,
        color: s.color,
        glyph: (
          <svg
            viewBox="0 0 14 14"
            aria-hidden="true"
            data-part="marker"
            data-kind={s.shape}
            style={{ flex: 'none', width: 'var(--umbra-series-marker-size, 0.875rem)', color: s.color }}
          >
            <PointShape shape={s.shape} x={7} y={7} size={4.5} />
          </svg>
        ),
      }))}
      table={{
        columns: [xTitle ?? 'x', yTitle ?? 'y', ...(sized ? [sizeLabel] : [])],
        rows: all.flatMap((s) =>
          s.data.map((p) => ({
            label: p.label ? `${s.label}, ${p.label}` : s.label,
            cells: [xText(p.x), format(p.y), ...(sized ? [p.size == null ? '' : sizeText(p.size)] : [])],
          })),
        ),
      }}
      summary={all.map((s) => s.label).join(', ') + (xTitle && yTitle ? `: ${xTitle}, ${yTitle}` : '')}
      isEmpty={!series.some((s) => s.data.length)}
      skeleton={<Skeleton shape="block" />}
      widths={[360, 280, 220, 150]}
      heights={[240, 190, 150, 100]}
      signature={all
        .map((s) => `${s.id}:${s.data.map((p) => `${+p.x},${p.y},${p.size}`).join(';')}`)
        .join('|')}
      build={build}
    >
      {children}
    </Frame>
  );
}

/** The points of each series: its shape in its colour. The largest bubbles are drawn first, so none hides a smaller one. */
function Points() {
  const frame = useFrame<ScatterModel>();
  return (
    <g data-part="series">
      {frame.model.series.map((s) => (
        <g key={s.id} className={styles.series} style={{ color: s.color }} {...seriesProps(frame, s.id)}>
          {[...s.points]
            .sort((a, b) => b.r - a.r)
            .map((p) => (
              <g key={p.key} {...frame.pointProps(p)}>
                {/* At least 24px across: the smallest target a pointer can be asked to hit. */}
                <circle className={styles.hit} cx={p.x} cy={p.y} r={Math.max(12, p.r)} />
                <g className={cx(styles.point, p.bubble && styles.bubble)}>
                  <PointShape shape={s.shape} x={p.x} y={p.y} size={p.r} />
                </g>
              </g>
            ))}
        </g>
      ))}
    </g>
  );
}

/** The names of the points, with `labels`. One that would cover a point or another label is left out. */
function PointLabels() {
  const { model } = useFrame<ScatterModel>();
  return (
    <g data-part="pointLabels">
      {model.labels.map((l, i) => (
        <text
          key={i}
          className={styles.pointLabel}
          x={l.x}
          y={l.y + model.fontSize * 0.35}
          textAnchor={l.anchor}
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}

export type ScatterProps = Omit<ScatterRootProps, 'children'>;

/** Points by two values, in one or more series; a third value makes them bubbles. */
export function Scatter(props: ScatterProps) {
  return (
    <Root {...props}>
      <Backdrop>{renderPart(props.parts?.backdrop, {}, () => null)}</Backdrop>
      <Grid />
      <Annotations />
      <Points />
      <Axes />
      <PointLabels />
    </Root>
  );
}

Scatter.Root = Root;
Scatter.Backdrop = Backdrop;
Scatter.Grid = Grid;
Scatter.Annotations = Annotations;
Scatter.Points = Points;
Scatter.Axes = Axes;
Scatter.PointLabels = PointLabels;
