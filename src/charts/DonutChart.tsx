import type { ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { renderPart, type Part } from '../utils/parts';
import styles from './Chart.module.css';
import { resolveThreshold, type ThresholdList, type ThresholdTone } from '../utils/thresholds';
import { fillKind, FillPattern, fillPaint, seriesColour, type FillKind } from './internal/cues';
import { toneColours } from './internal/tones';
import { donutArcs, donutThickness, ringArc } from './internal/donut';
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
  color?: string | undefined;
  /** The fill: solid, or outlined with a pattern. By default segments take them in turn. */
  marker?: FillKind | undefined;
}

/** Colour of the single value: `default`, or any tone a threshold can have. */
export type DonutTone = 'default' | ThresholdTone;

/** A round placeholder as tall as the plot allows. Inline, because the skeleton sets its own size. */
const round = { height: '86%', width: 'auto', maxWidth: '100%', aspectRatio: '1', borderRadius: '50%' };

interface DonutModel {
  rows: PointModel[][];
  cx: number;
  cy: number;
  outer: number;
  inner: number;
  track: string;
  /** The position of the single value's band in `thresholds`. */
  band?: number | undefined;
  segments: { id: string; d: string; color: string; fill: FillKind; point: PointModel }[];
  labels: (PolarLabel & { id: string })[];
}

export interface DonutChartRootProps extends ChartCommonProps {
  /** The single-value form: one value against `max`. */
  value?: number | undefined;
  /** What a full ring stands for, in the single-value form. */
  max?: number | undefined;
  /** The segment form: several values that share the ring. */
  data?: DonutSegment[] | undefined;
  /** Width of the ring in pixels. By default a fifth of the radius. */
  thickness?: number | undefined;
  /** Where the ring starts, in degrees clockwise from 12 o'clock. */
  startAngle?: number | undefined;
  /** Degrees the ring covers. Less than 360 leaves it open, as a gauge. */
  sweep?: number | undefined;
  /** Rounds the ends of the value. On by default in the single-value form. */
  roundedCaps?: boolean | undefined;
  /** Degrees left empty between segments. */
  gap?: number | undefined;
  /** Colour of the single value. The number in the centre is the cue that does not depend on colour. */
  tone?: DonutTone | undefined;
  /**
   * Colours the single value by its band: an ascending list of `{ from, tone?, color?, label? }`, or
   * plain numbers as boundaries on the value ramp. The band's `label` joins the value text.
   */
  thresholds?: ThresholdList | undefined;
  /** For a scale where low is good: mirrors the colours of the bands. The labels stay. */
  lowerIsBetter?: boolean | undefined;
  /** Any CSS colour for the single value; wins over `tone` and `thresholds`. */
  color?: string | undefined;
  /** What the single value is called for screen readers when the chart is named by `aria-labelledby`. */
  valueLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?: ChartParts | undefined;
  /** The blocks to draw, in order. */
  children?: ReactNode | undefined;
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
  lowerIsBetter,
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
  const band = single ? resolveThreshold(value, thresholds, { lowerIsBetter }) : undefined;
  const all: (DonutSegment & { color: string; fill: FillKind })[] = single
    ? [
        {
          id: 'value',
          label: name,
          value: value ?? 0,
          color: color ?? band?.color ?? toneColours[band?.tone ?? tone],
          fill: 'square',
        },
      ]
    : data.map((d, i) => ({ ...d, color: d.color ?? seriesColour(i), fill: d.marker ?? fillKind(i) }));
  const sum = (items: readonly DonutSegment[]) => items.reduce((s, d) => s + Math.max(d.value, 0), 0);
  const text = (d: DonutSegment, total: number) =>
    single
      ? `${percent(total ? d.value / total : 0)} (${format(d.value)} / ${format(total)})` +
        (band?.label ? ` · ${band.label}` : '')
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
      band: band?.index,
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
      {/* A value of zero has no arc to draw or to point at. */}
      {model.segments
        .filter((s) => s.d)
        .map((s) => (
          <g
            key={s.id}
            className={styles.series}
            data-band={model.band}
            {...seriesProps(frame, s.id)}
            {...frame.pointProps(s.point)}
          >
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
  value?: ReactNode | undefined;
  /** The caption under it. It is the first to hide as the ring shrinks. */
  label?: ReactNode | undefined;
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
  centerValue?: ReactNode | undefined;
  /** The caption under it. */
  centerLabel?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?: (ChartParts & { center?: Part<DonutChartCenterProps> | undefined }) | undefined;
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
