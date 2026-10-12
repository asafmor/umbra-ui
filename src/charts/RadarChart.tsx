import type { ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { uniqueIds, valueOrNull } from '../utils/finite';
import { Skeleton } from '../basics/Skeleton';
import styles from './Chart.module.css';
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
import { polygonPath, radarAngles, radarPoints, radarRing } from './internal/radar';
import { niceDomain, numberFormat, polar, polarLayout, type PolarLabel } from './internal/scales';

export interface RadarAxis {
  id: string;
  label: string;
  /** The value at the outer ring of this axis. Defaults to the chart's `max`. */
  max?: number | undefined;
}

export interface RadarSeries {
  id: string;
  label: string;
  /** One value per axis, in the order of `axes`. */
  values: (number | null)[];
  /** Any CSS colour. Without it the series takes the series palette, by its position. */
  color?: string | undefined;
  /** The shape drawn on each value. By default series take the shapes in turn. */
  marker?: PointShapeKind | undefined;
}

interface RadarModel {
  rows: PointModel[][];
  cx: number;
  cy: number;
  radius: number;
  angles: number[];
  labels: (PolarLabel & { value?: string | undefined })[];
  series: {
    id: string;
    color: string;
    shape: PointShapeKind;
    dash?: string | undefined;
    path: string;
    points: PointModel[];
  }[];
}

export interface RadarChartRootProps extends ChartCommonProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  /** The value at the outer ring. Defaults to a round number above the largest value. */
  max?: number | undefined;
  /** Where the first axis points, in degrees clockwise from 12 o'clock. */
  startAngle?: number | undefined;
  /** Replace or hide named pieces. */
  parts?: ChartParts | undefined;
  /** The blocks to draw, in order. */
  children?: ReactNode | undefined;
}

const pointSize = 3.5;

function Root({ axes, series: seriesProp, max, startAngle = 0, children, ...common }: RadarChartRootProps) {
  const { locale } = useLocale();
  // Invalid input (plan/decisions/03-charts.md): one series per id, and only finite numbers are values.
  const series = uniqueIds(seriesProp, 'RadarChart').map((s) => ({
    ...s,
    values: s.values.map((v) => valueOrNull(v, 'RadarChart')),
  }));
  const format = common.formatValue ?? numberFormat(locale, { maximumFractionDigits: 2 });
  const text = (v: number | null | undefined) => (v == null ? '' : format(v));
  const all = series.map((s, i) => ({
    ...s,
    color: s.color ?? seriesColour(i),
    shape: s.marker ?? pointShape(i),
    dash: dash(i),
  }));
  const top = max ?? niceDomain([0, ...series.flatMap((s) => s.values.filter((v) => v != null))], true)[1];
  const maxes = axes.map((a) => a.max ?? top);

  const build = ({ width, height, fontSize, measure, level, hidden }: BuildInput): RadarModel => {
    const shown = all.filter((s) => !hidden.includes(s.id));
    const angles = radarAngles(axes.length, startAngle);
    // Values are printed beside the axis labels when only one series is drawn, as in the source.
    const values = common.labels && level < 2 && shown.length === 1 ? shown[0]!.values.map(text) : [];
    const wanted =
      level < 3
        ? axes.map((a, i) => ({ text: values[i] ? `${a.label} ${values[i]}` : a.label, angle: angles[i]! }))
        : [];
    const layout = polarLayout(width, height, wanted, fontSize, measure);
    const radius = Math.max(layout.radius - (wanted.length ? 0 : pointSize + 3), 0);
    const built = shown.map((s) => {
      const at = radarPoints(s.values, maxes, layout.cx, layout.cy, radius, angles);
      const points = axes.flatMap((axis, i): PointModel[] =>
        s.values[i] == null
          ? []
          : [
              {
                key: `${s.id}-${i}`,
                group: axis.label,
                name: `${s.label}, ${axis.label}: ${text(s.values[i])}`,
                valueText: text(s.values[i]),
                color: s.color,
                x: at[i]![0],
                y: at[i]![1],
                outline: { type: 'circle', r: pointSize },
                point: { seriesId: s.id, seriesLabel: s.label, index: i, x: axis.label, value: s.values[i]! },
              },
            ],
      );
      return { id: s.id, color: s.color, shape: s.shape, dash: s.dash, path: polygonPath(at), points };
    });
    return {
      rows: built.map((s) => s.points),
      cx: layout.cx,
      cy: layout.cy,
      radius,
      angles,
      labels: layout.labels.map((l, i) => {
        // The value is drawn in the stronger colour when the label was not truncated.
        const whole = values[i] && l.text === wanted[i]!.text;
        return whole ? { ...l, text: axes[i]!.label, value: values[i] } : l;
      }),
      series: built,
    };
  };

  return (
    <Frame
      {...common}
      kind="radar-chart"
      series={all.map((s) => ({
        id: s.id,
        label: s.label,
        color: s.color,
        glyph: <LineGlyph shape={s.shape} dash={s.dash} color={s.color} />,
      }))}
      table={{
        columns: axes.map((a) => a.label),
        rows: all.map((s) => ({ label: s.label, cells: axes.map((_, i) => text(s.values[i])) })),
      }}
      summary={`${all.map((s) => s.label).join(', ')}: ${axes.map((a) => a.label).join(', ')}`}
      isEmpty={!axes.length || !series.length}
      skeleton={
        <Skeleton
          shape="block"
          style={{ height: '86%', width: 'auto', maxWidth: '100%', aspectRatio: '1', borderRadius: '50%' }}
        />
      }
      widths={[300, 220, 150]}
      heights={[260, 190, 130]}
      signature={all.map((s) => `${s.id}:${s.values.join()}`).join('|')}
      build={build}
    >
      {children}
    </Frame>
  );
}

export interface RadarChartGridProps {
  /** Number of rings, the outer one included. */
  rings?: number | undefined;
  shape?: 'polygon' | 'circle' | undefined;
}

/** The rings and the spokes. */
function Grid({ rings = 3, shape = 'polygon' }: RadarChartGridProps) {
  const { model } = useFrame<RadarModel>();
  const { cx, cy, radius, angles } = model;
  return (
    <g data-part="grid" data-shape={shape}>
      {Array.from({ length: rings }, (_, i) => (
        <path
          key={i}
          className={i === rings - 1 ? styles.axisLine : styles.gridLine}
          style={{ shapeRendering: 'auto' }}
          d={radarRing(shape, cx, cy, (radius * (i + 1)) / rings, angles)}
        />
      ))}
      {angles.map((angle, i) => {
        const [x, y] = polar(cx, cy, radius, angle);
        return (
          <line
            key={i}
            className={styles.gridLine}
            style={{ shapeRendering: 'auto' }}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
          />
        );
      })}
    </g>
  );
}

/** The area, outline and points of each series. */
function Series({ filled = true }: { filled?: boolean | undefined }) {
  const frame = useFrame<RadarModel>();
  return (
    <g data-part="series">
      {frame.model.series.map((s) => (
        <g key={s.id} className={styles.series} style={{ color: s.color }} {...seriesProps(frame, s.id)}>
          {filled && <path className={styles.area} d={s.path} />}
          <path className={styles.line} d={s.path} strokeDasharray={s.dash} />
          {s.points.map((p) => (
            <g key={p.key} {...frame.pointProps(p)}>
              {/* 24px across: the smallest target a pointer can be asked to hit. */}
              <circle className={styles.hit} cx={p.x} cy={p.y} r={12} />
              <g className={styles.point}>
                <PointShape shape={s.shape} x={p.x} y={p.y} size={pointSize} />
              </g>
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

/** The axis names around the grid, with the values when `labels` is set and one series is drawn. */
function AxisLabels() {
  const { model } = useFrame<RadarModel>();
  return (
    <g data-part="axisLabels">
      {model.labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor={l.anchor}>
          {l.text}
          {l.value && (
            <tspan className={styles.valueLabel} dx="0.35em" data-part="valueLabel">
              {l.value}
            </tspan>
          )}
        </text>
      ))}
    </g>
  );
}

export interface RadarChartProps extends Omit<RadarChartRootProps, 'children'> {
  /** Number of grid rings, the outer one included. */
  rings?: number | undefined;
  /** Shape of the grid rings. */
  grid?: 'polygon' | 'circle' | undefined;
  /** Fills the area of each series. */
  filled?: boolean | undefined;
}

/** Compares one or more series across several axes that share a centre. */
export function RadarChart({ rings, grid, filled, ...root }: RadarChartProps) {
  return (
    <Root {...root}>
      <Grid rings={rings} shape={grid} />
      <Series filled={filled} />
      <AxisLabels />
    </Root>
  );
}

RadarChart.Root = Root;
RadarChart.Grid = Grid;
RadarChart.Series = Series;
RadarChart.AxisLabels = AxisLabels;
