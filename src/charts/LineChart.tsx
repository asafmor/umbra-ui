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
import { dash, LineGlyph, PointShape, pointShape, seriesColour, type PointShapeKind } from './internal/cues';
import {
  Frame,
  seriesProps,
  useFrame,
  type BuildInput,
  type ChartCommonProps,
  type ChartParts,
  type PointModel,
} from './internal/Frame';
import { areaPath, isIsolated, linePath, spread, type LineCurve } from './internal/line';
import {
  cartesianMargins,
  dateFormat,
  linear,
  niceDomain,
  numberFormat,
  points as pointScale,
  time,
  truncate,
} from './internal/scales';

export type LineX = string | number | Date;

export interface LinePoint {
  /** A category name, a number or a date. Use the same kind for every point of a chart. */
  x: LineX;
  /** A number, the name of one of `yLevels`, or `null` for a missing value, which breaks the line. */
  y: number | string | null;
  /** Any CSS colour for this point only. */
  color?: string;
  /** The shape of this point only. */
  marker?: PointShapeKind;
}

export interface LineSeries {
  id: string;
  label: string;
  data: LinePoint[];
  /** Any CSS colour. Without it the series takes the series palette, by its position. */
  color?: string;
  /** The shape of its points. By default series take the shapes in turn. */
  marker?: PointShapeKind;
  /** The stroke dash array of its line, or `false` for a solid line. By default series take the dashes in turn. */
  dash?: string | false;
}

type DrawnPoint = PointModel & { shape: PointShapeKind; show: boolean };
interface LineModel extends CartesianModel {
  series: {
    id: string;
    color: string;
    dash?: string;
    line: string;
    area?: string;
    points: DrawnPoint[];
    end?: { x: number; y: number; text: string };
  }[];
}

export interface LineChartRootProps extends ChartCommonProps {
  series: LineSeries[];
  /** The order of a category x axis. Defaults to the order the names first appear in. */
  categories?: string[];
  /** Makes the y axis ordinal: the named levels, from the bottom up. Points then give a level name as `y`. */
  yLevels?: string[];
  /** The range of a numeric y axis. Defaults to round numbers around the data. */
  yDomain?: [number, number];
  /** `step` holds each value until the next point. */
  curve?: LineCurve;
  /** Fills the area under each line; the y axis then starts at zero. */
  area?: boolean;
  /** Draws a shape on every value. Points too dense to tell apart are left out. */
  points?: boolean;
  /** Reference lines and bands on either axis. */
  annotations?: ChartAnnotation[];
  xTitle?: string;
  yTitle?: string;
  /** Formats an x value for the axis, the tooltip and screen readers. */
  formatX?: (x: LineX) => string;
  /** Replace or hide named pieces. */
  parts?: ChartParts;
  /** The blocks to draw, in order. */
  children?: ReactNode;
}

const pointSize = 3.5;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function Root({
  series,
  categories,
  yLevels,
  yDomain,
  curve = 'linear',
  area = false,
  points = true,
  annotations,
  xTitle,
  yTitle,
  formatX,
  children,
  ...common
}: LineChartRootProps) {
  const { locale } = useLocale();
  const format = common.formatValue ?? numberFormat(locale, { maximumFractionDigits: 2 });
  const first = series.find((s) => s.data.length)?.data[0]?.x;
  const kind = first instanceof Date ? 'time' : typeof first === 'number' ? 'number' : 'category';
  const xText =
    formatX ??
    (kind === 'time'
      ? (x: LineX) => dateFormat(locale)(x as Date)
      : kind === 'number'
        ? (x: LineX) => numberFormat(locale, { maximumFractionDigits: 2 })(x as number)
        : String);
  const yText = (y: LinePoint['y']) => (y == null ? '' : typeof y === 'number' ? format(y) : y);
  const xKey = (x: LineX) => (kind === 'category' ? String(x) : String(+x));

  const all = series.map((s, i) => ({
    ...s,
    color: s.color ?? seriesColour(i),
    shape: s.marker ?? pointShape(i),
    dash: s.dash === false ? undefined : (s.dash ?? dash(i)),
  }));
  // Every x of every series, in axis order: the columns of the table and the category axis.
  const seen = new Map<string, LineX>();
  if (kind === 'category') for (const c of categories ?? []) seen.set(c, c);
  for (const s of series) for (const p of s.data) if (!seen.has(xKey(p.x))) seen.set(xKey(p.x), p.x);
  const xs = [...seen.values()];
  if (kind !== 'category') xs.sort((a, b) => +a - +b);
  const names = xs.map(String);

  const build = ({ width, height, fontSize, measure, level, hidden }: BuildInput): LineModel => {
    const shown = all.filter((s) => !hidden.includes(s.id));
    const axes = level < 4;
    const numbers = (shown.length ? shown : all).flatMap((s) =>
      s.data.flatMap((p) => (typeof p.y === 'number' ? [p.y] : [])),
    );
    for (const a of annotations ?? []) {
      if ((a.axis ?? 'y') !== 'y') continue;
      for (const v of a.type === 'line' ? [a.value] : [a.from, a.to])
        if (typeof v === 'number') numbers.push(v);
    }
    const domain = yDomain ?? niceDomain(numbers, area);
    const endRoom =
      common.labels && level < 2
        ? Math.min(Math.max(...shown.map((s) => measure(s.label)), 0) + 10, width * 0.3)
        : 0;
    const margins = (leftLabels: number) =>
      cartesianMargins({
        level,
        fontSize,
        leftLabels,
        endLabels: endRoom,
        topLabels: labelsAbove(annotations, (a) => a.axis === 'x'),
        leftTitle: !!yTitle,
        bottomTitle: !!xTitle,
      });
    let m = margins(0);
    const top = m.top;
    const bottom = Math.max(height - m.bottom, top + 1);

    // The y axis: named levels, or numbers.
    let yAt: (y: LinePoint['y']) => number;
    let yAll: AxisTick[];
    let yTicks: AxisTick[];
    if (yLevels) {
      const scale = pointScale(yLevels, [bottom, top]);
      yAt = (y) => scale(String(y));
      yAll = yLevels.map((l) => ({ at: scale(l), label: l }));
      yTicks = fitTicks(yAll, bottom - top, fontSize, false);
    } else {
      const scale = linear(domain, [bottom, top]);
      yAt = (y) => scale(Number(y));
      yAll = scale
        .ticks(clamp(Math.floor((bottom - top) / (fontSize * 3)), 2, 8))
        .map((v) => ({ at: scale(v), label: format(v) }));
      yTicks = yAll;
    }
    const leftRoom = axes ? Math.min(Math.max(...yTicks.map((t) => measure(t.label)), 0), width * 0.3) : 0;
    yTicks = yTicks.map((t) => ({ ...t, label: truncate(t.label, leftRoom, measure) }));
    m = margins(leftRoom);
    const left = m.left;
    const right = Math.max(width - m.right, left + 1);

    // The x axis: categories, numbers or dates.
    let xAt: (x: LineX) => number;
    let xTicks: AxisTick[];
    if (kind === 'category') {
      const scale = pointScale(names, [left, right]);
      xAt = (x) => scale(String(x));
      xTicks = names.map((n, i) => ({ at: scale(n), label: xText(xs[i]!) }));
    } else {
      // A little room at both ends, so the first and last points are not cut by the plot's edge.
      const range: [number, number] = [left + pointSize + 2, right - pointSize - 2];
      const ends = xs.length ? [xs[0]!, xs.at(-1)!] : [0, 1];
      const count = clamp(Math.floor((right - left) / (fontSize * 6)), 2, 10);
      if (kind === 'time') {
        const scale = time(ends as [Date, Date], range);
        xAt = (x) => scale(x as Date);
        xTicks = scale.ticks(count).map((v) => ({ at: scale(v), label: xText(v) }));
      } else {
        const scale = linear(ends as [number, number], range);
        xAt = (x) => scale(x as number);
        xTicks = scale.ticks(count).map((v) => ({ at: scale(v), label: xText(v) }));
      }
    }
    xTicks = fitTicks(xTicks, right - left, fontSize, true, measure);

    const most = Math.max(...shown.map((s) => s.data.length), 1);
    const dense = (right - left) / most < 14;
    const built = shown.map((s) => {
      const pixels = s.data.map((p) => {
        const y = p.y == null ? NaN : yAt(p.y);
        return [xAt(p.x), Number.isFinite(y) ? y : null] as const;
      });
      const drawn = s.data.flatMap((p, i): DrawnPoint[] => {
        const [x, y] = pixels[i]!;
        if (y == null || !Number.isFinite(x)) return [];
        return [
          {
            key: `${s.id}-${i}`,
            group: xText(p.x),
            name: `${s.label}, ${xText(p.x)}: ${yText(p.y)}`,
            valueText: yText(p.y),
            color: p.color ?? s.color,
            x,
            y,
            outline: { type: 'circle', r: pointSize },
            point: { seriesId: s.id, seriesLabel: s.label, index: i, x: p.x, value: p.y },
            shape: p.marker ?? s.shape,
            // A point of its own colour or shape, or one with no line to it, is always drawn.
            show: (points && !dense) || !!p.color || !!p.marker || isIsolated(pixels, i),
          },
        ];
      });
      const last = drawn.at(-1);
      return {
        id: s.id,
        color: s.color,
        dash: s.dash,
        line: linePath(pixels, curve),
        area: area
          ? areaPath(pixels, clamp(yAt(yLevels ? yLevels[0]! : Math.max(domain[0], 0)), top, bottom), curve)
          : undefined,
        points: drawn,
        end:
          endRoom && last
            ? { x: last.x + 8, y: last.y, text: truncate(s.label, endRoom - 10, measure) }
            : undefined,
      };
    });
    // Labels at the ends of the lines are kept a line apart.
    const ends = built.filter((s) => s.end);
    spread(
      ends.map((s) => s.end!.y),
      fontSize * 1.15,
      top + fontSize / 2,
      bottom,
    ).forEach((y, i) => (ends[i]!.end!.y = y));

    return {
      rows: built.map((s) => s.points),
      box: { left, top, right, bottom },
      axes,
      xTicks,
      yTicks,
      gridX: [],
      gridY: yAll.map((t) => t.at),
      xAxisAt: bottom,
      yAxisAt: left,
      xTitle: level < 3 ? xTitle : undefined,
      yTitle: level < 3 ? yTitle : undefined,
      annotations: annotationMarks(annotations, (axis, v) =>
        axis === 'y' ? yAt(v as LinePoint['y']) : xAt(v),
      ),
      fontSize,
      series: built,
    };
  };

  return (
    <Frame
      {...common}
      kind="line-chart"
      series={all.map((s) => ({
        id: s.id,
        label: s.label,
        color: s.color,
        glyph: <LineGlyph shape={s.shape} dash={s.dash} color={s.color} />,
      }))}
      table={{
        columns: xs.map(xText),
        rows: all.map((s) => {
          const byX = new Map(s.data.map((p) => [xKey(p.x), yText(p.y)]));
          return { label: s.label, cells: xs.map((x) => byX.get(xKey(x)) ?? '') };
        }),
      }}
      summary={
        `${all.map((s) => s.label).join(', ')}` +
        (xs.length ? `: ${xText(xs[0]!)} – ${xText(xs.at(-1)!)}` : '')
      }
      isEmpty={!series.some((s) => s.data.length)}
      skeleton={<Skeleton shape="block" className={styles.skeletonArea} />}
      widths={[360, 280, 220, 150]}
      heights={[240, 190, 150, 100]}
      signature={all.map((s) => `${s.id}:${s.data.map((p) => `${xKey(p.x)}=${p.y}`).join()}`).join('|')}
      build={build}
    >
      {children}
    </Frame>
  );
}

/** The area, line, points and end label of each series. */
function Series() {
  const frame = useFrame<LineModel>();
  return (
    <g data-part="series">
      {frame.model.series.map((s) => (
        <g key={s.id} className={styles.series} style={{ color: s.color }} {...seriesProps(frame, s.id)}>
          {s.area && <path className={styles.area} data-part="area" d={s.area} />}
          <path className={styles.line} data-part="line" d={s.line} strokeDasharray={s.dash} />
          {s.points.map((p) => (
            <g key={p.key} {...frame.pointProps(p)}>
              <circle className={styles.hit} cx={p.x} cy={p.y} r={10} />
              {p.show && (
                <g className={styles.point} style={{ color: p.color }}>
                  <PointShape shape={p.shape} x={p.x} y={p.y} size={pointSize} />
                </g>
              )}
            </g>
          ))}
          {s.end && (
            <text data-part="seriesLabel" x={s.end.x} y={s.end.y + frame.model.fontSize * 0.35}>
              {s.end.text}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

export type LineChartProps = Omit<LineChartRootProps, 'children'>;

/** One or more series over categories, numbers or time, with a numeric or an ordinal y axis. */
export function LineChart(props: LineChartProps) {
  return (
    <Root {...props}>
      <Grid />
      <Annotations />
      <Series />
      <Axes />
    </Root>
  );
}

LineChart.Root = Root;
LineChart.Grid = Grid;
LineChart.Annotations = Annotations;
LineChart.Series = Series;
LineChart.Axes = Axes;
