import type { ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { renderPart, type Part } from '../utils/parts';
import styles from './Chart.module.css';
import { fillKind, FillPattern, fillPaint, seriesColour, type FillKind } from './internal/cues';
import { donutArcs, donutThickness, ringArc, toneFor } from './internal/donut';
import {
  Frame,
  seriesProps,
  useFrame,
  type BuildInput,
  type ChartCommonProps,
  type ChartParts,
  type PointModel,
} from './internal/Frame';
import { numberFormat, polarLayout, type PolarLabel } from './internal/scales';

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  /** Any CSS colour. Without it the segment takes the series palette, by its position. */
  color?: string;
  /** The fill: solid, or outlined with a pattern. By default segments take them in turn. */
  marker?: FillKind;
}

export type DonutTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toneColour: Record<DonutTone, string> = {
  default: 'var(--umbra-chart-value, var(--umbra-color-series-1))',
  success: 'var(--umbra-chart-positive, var(--umbra-color-semantic-success))',
  warning: 'var(--umbra-chart-warning, var(--umbra-color-semantic-warning))',
  danger: 'var(--umbra-chart-negative, var(--umbra-color-semantic-danger))',
  info: 'var(--umbra-chart-info, var(--umbra-color-semantic-info))',
};

/** A round placeholder as tall as the plot allows. Inline, because the skeleton sets its own size. */
const round = { height: '86%', width: 'auto', maxWidth: '100%', aspectRatio: '1', borderRadius: '50%' };

interface DonutModel {
  rows: PointModel[][];
  cx: number;
  cy: number;
  outer: number;
  inner: number;
  track: string;
  segments: { id: string; d: string; color: string; fill: FillKind; point: PointModel }[];
  labels: (PolarLabel & { id: string })[];
}

export interface DonutChartRootProps extends ChartCommonProps {
  /** The single-value form: one value against `max`. */
  value?: number;
  /** What a full ring stands for, in the single-value form. */
  max?: number;
  /** The segment form: several values that share the ring. */
  data?: DonutSegment[];
  /** Width of the ring in pixels. By default a fifth of the radius. */
  thickness?: number;
  /** Where the ring starts, in degrees clockwise from 12 o'clock. */
  startAngle?: number;
  /** Degrees the ring covers. Less than 360 leaves it open, as a gauge. */
  sweep?: number;
  /** Rounds the ends of the value. On by default in the single-value form. */
  roundedCaps?: boolean;
  /** Degrees left empty between segments. */
  gap?: number;
  /** Colour of the single value. The number in the centre is the cue that does not depend on colour. */
  tone?: DonutTone;
  /** Picks the tone from the value: the last entry whose `from` the value reaches. */
  thresholds?: { from: number; tone: DonutTone }[];
  /** Any CSS colour for the single value; wins over `tone`. */
  color?: string;
  /** What the single value is called for screen readers when the chart is named by `aria-labelledby`. */
  valueLabel?: string;
  /** Replace or hide named pieces. */
  parts?: ChartParts;
  /** The blocks to draw, in order. */
  children?: ReactNode;
}

function Root({
  value,
  max = 100,
  data,
  thickness,
  startAngle = 0,
  sweep = 360,
  roundedCaps,
  gap = 2,
  tone = 'default',
  thresholds,
  color,
  valueLabel = 'Value',
  children,
  ...common
}: DonutChartRootProps) {
  const { locale } = useLocale();
  const single = !data;
  const format = common.formatValue ?? numberFormat(locale, { maximumFractionDigits: 2 });
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  const name = common['aria-label'] ?? valueLabel;
  const all: (DonutSegment & { color: string; fill: FillKind })[] = single
    ? [
        {
          id: 'value',
          label: name,
          value: value ?? 0,
          color: color ?? toneColour[toneFor(value ?? 0, thresholds) ?? tone],
          fill: 'square',
        },
      ]
    : data.map((d, i) => ({ ...d, color: d.color ?? seriesColour(i), fill: d.marker ?? fillKind(i) }));
  const sum = (items: readonly DonutSegment[]) => items.reduce((s, d) => s + Math.max(d.value, 0), 0);
  const text = (d: DonutSegment, total: number) =>
    single
      ? `${percent(total ? d.value / total : 0)} (${format(d.value)} / ${format(total)})`
      : `${format(d.value)} (${percent(total ? d.value / total : 0)})`;
  const fullTotal = single ? max : sum(all);

  const build = ({ width, height, fontSize, measure, level, hidden }: BuildInput): DonutModel => {
    const shown = all.filter((d) => !hidden.includes(d.id));
    const total = single ? max : sum(shown);
    // First the angles, to know where labels go; then the radius that leaves room for them.
    const angles = donutArcs(
      shown.map((d) => d.value),
      { total, outer: 1, inner: 0, startAngle, sweep },
    );
    const labelled = common.labels && !single && level < 1;
    const wanted = labelled
      ? shown.flatMap((d, i) =>
          d.value / (total || 1) >= 0.04
            ? [{ id: d.id, text: `${d.label} ${percent(d.value / total)}`, angle: angles[i]!.mid }]
            : [],
        )
      : [];
    const layout = polarLayout(width, height, wanted, fontSize, measure);
    const outer = Math.max(layout.radius - (labelled ? 0 : 1), 0);
    const inner = Math.max(outer - (thickness ?? donutThickness(outer)), 0);
    const arcs = donutArcs(
      shown.map((d) => d.value),
      { total, outer, inner, startAngle, sweep, gap, rounded: roundedCaps ?? single },
    );
    const segments = shown.map((d, i) => {
      const a = arcs[i]!;
      const valueText = text(d, total);
      const point: PointModel = {
        key: d.id,
        group: d.label,
        name: `${d.label}: ${valueText}`,
        valueText,
        color: d.color,
        x: layout.cx + a.centroid[0],
        y: layout.cy + a.centroid[1],
        outline: { type: 'path', d: a.d, transform: `translate(${layout.cx} ${layout.cy})` },
        point: { seriesId: d.id, seriesLabel: d.label, index: all.indexOf(d), x: d.label, value: d.value },
      };
      return { id: d.id, d: a.d, color: d.color, fill: d.fill, point };
    });
    return {
      rows: [segments.filter((s) => s.d).map((s) => s.point)],
      cx: layout.cx,
      cy: layout.cy,
      outer,
      inner,
      track: ringArc(startAngle, startAngle + sweep, outer, inner, sweep < 360 && (roundedCaps ?? single)),
      segments,
      labels: layout.labels.map((l, i) => ({ ...l, id: wanted[i]!.id })),
    };
  };

  return (
    <Frame
      {...common}
      kind="donut-chart"
      series={single ? [] : all.map((d) => ({ id: d.id, label: d.label, color: d.color, marker: d.fill }))}
      table={{
        columns: [name],
        rows: all.map((d) => ({ label: d.label, cells: [text(d, fullTotal)] })),
      }}
      summary={
        single
          ? text(all[0]!, max)
          : `${all.length}: ` +
            all.map((d) => `${d.label} ${percent(fullTotal ? d.value / fullTotal : 0)}`).join(', ')
      }
      isEmpty={single ? value == null : all.length === 0}
      skeleton={<Skeleton shape="block" className={styles.skeletonRing} style={round} />}
      widths={[200, 120, 64]}
      heights={[190, 110, 64]}
      signature={all.map((d) => `${d.id}:${d.value}`).join()}
      build={build}
    >
      {children}
    </Frame>
  );
}

/** The ring behind the value. */
function Track() {
  const { model, uid } = useFrame<DonutModel>();
  return (
    <g data-part="track" transform={`translate(${model.cx} ${model.cy})`}>
      <clipPath id={`${uid}-track`}>
        <path d={model.track} />
      </clipPath>
      <path className={styles.track} d={model.track} clipPath={`url(#${uid}-track)`} />
    </g>
  );
}

/** The value, or the segments. */
function Segments() {
  const frame = useFrame<DonutModel>();
  const { model, uid } = frame;
  return (
    <g data-part="segments" transform={`translate(${model.cx} ${model.cy})`}>
      {model.segments.map((s) => (
        <g key={s.id} className={styles.series} {...seriesProps(frame, s.id)} {...frame.pointProps(s.point)}>
          <defs>
            <FillPattern id={`${uid}-fill-${s.id}`} kind={s.fill} color={s.color} />
          </defs>
          <path d={s.d} {...fillPaint(s.fill, s.color, `${uid}-fill-${s.id}`)} />
        </g>
      ))}
    </g>
  );
}

/** Direct labels beside the segments. Drawn when `labels` is set and there is room. */
function Labels() {
  const { model } = useFrame<DonutModel>();
  return (
    <g data-part="labels">
      {model.labels.map((l) => (
        <text key={l.id} x={l.x} y={l.y} textAnchor={l.anchor}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

export interface DonutChartCenterProps {
  /** The large line. */
  value?: ReactNode;
  /** The caption under it. It is the first to hide as the ring shrinks. */
  label?: ReactNode;
}

/** The content in the middle of the ring. */
function Center({ value, label }: DonutChartCenterProps) {
  const { model, level } = useFrame<DonutModel>();
  const side = model.inner * Math.SQRT2 * 0.94;
  if (level >= 3 || side < 12 || (value == null && label == null)) return null;
  return (
    <foreignObject x={model.cx - side / 2} y={model.cy - side / 2} width={side} height={side}>
      <div data-part="center" className={styles.center} style={{ ['--inner' as string]: `${side}px` }}>
        {value != null && (
          <span data-part="centerValue" className={styles.centerValue}>
            {value}
          </span>
        )}
        {label != null && level < 2 && side >= 72 && (
          <span data-part="centerLabel" className={styles.centerLabel}>
            {label}
          </span>
        )}
      </div>
    </foreignObject>
  );
}

export interface DonutChartProps extends Omit<DonutChartRootProps, 'children' | 'parts'> {
  /** The large line in the middle. In the single-value form it defaults to the percentage; `null` hides it. */
  centerValue?: ReactNode;
  /** The caption under it. */
  centerLabel?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: ChartParts & { center?: Part<DonutChartCenterProps> };
}

/** A ring that shows one value against a total, or how a total splits into segments. */
export function DonutChart({ centerValue, centerLabel, parts, ...root }: DonutChartProps) {
  const { locale } = useLocale();
  const value =
    centerValue !== undefined || root.data || root.value == null
      ? centerValue
      : numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })(
          root.value / ((root.max ?? 100) || 1),
        );
  return (
    <Root {...root} parts={parts}>
      <Track />
      <Segments />
      <Labels />
      {renderPart(parts?.center, { value, label: centerLabel }, (p) => (
        <Center {...p} />
      ))}
    </Root>
  );
}

DonutChart.Root = Root;
DonutChart.Track = Track;
DonutChart.Segments = Segments;
DonutChart.Labels = Labels;
DonutChart.Center = Center;
