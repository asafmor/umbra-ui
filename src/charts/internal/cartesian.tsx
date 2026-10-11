// Axes, grid and annotations for the charts with two axes (line and bar).
import styles from '../Chart.module.css';
import { useFrame, type FrameModel } from './Frame';
import { labelsThatFit, textWidth, thin, truncate, type Measure } from './scales';

export interface AxisTick {
  /** Position along the axis, in plot pixels. */
  at: number;
  label: string;
}

/** A reference line or band, already in pixels. */
export interface AnnotationMark {
  kind: 'line' | 'band';
  /** A vertical line or band marks a value of the horizontal axis. */
  vertical: boolean;
  from: number;
  to: number;
  label?: string;
  color?: string;
}

export interface CartesianModel extends FrameModel {
  /** The plot area, in pixels. */
  box: { left: number; top: number; right: number; bottom: number };
  /** False when the slot is too small for axes: only the marks are drawn. */
  axes: boolean;
  xTicks: AxisTick[];
  yTicks: AxisTick[];
  /** Grid lines across the plot: horizontal ones at `gridY`, vertical ones at `gridX`. */
  gridX: number[];
  gridY: number[];
  /** Where the two axis lines sit; a bar chart puts the category axis on zero. */
  xAxisAt: number;
  yAxisAt: number;
  xTitle?: string;
  yTitle?: string;
  annotations: AnnotationMark[];
  fontSize: number;
}

export type ChartAnnotationValue = number | string | Date;
/** A reference line at one value, or a band between two, on either axis. */
export type ChartAnnotation =
  | { type: 'line'; axis?: 'x' | 'y'; value: ChartAnnotationValue; label?: string; color?: string }
  | {
      type: 'band';
      axis?: 'x' | 'y';
      from: ChartAnnotationValue;
      to: ChartAnnotationValue;
      label?: string;
      color?: string;
    };

/** Turns annotations into pixels. `position` returns NaN for a value the axis does not have. */
export function annotationMarks(
  annotations: readonly ChartAnnotation[] | undefined,
  position: (axis: 'x' | 'y', value: ChartAnnotationValue) => number,
): AnnotationMark[] {
  return (annotations ?? []).flatMap((a) => {
    const axis = a.axis ?? 'y';
    const from = position(axis, a.type === 'line' ? a.value : a.from);
    const to = position(axis, a.type === 'line' ? a.value : a.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
    return [
      {
        kind: a.type,
        vertical: axis === 'x',
        from: Math.min(from, to),
        to: Math.max(from, to),
        label: a.label,
        color: a.color,
      },
    ];
  });
}

/** True when an annotation of the horizontal axis has a label, which is drawn above the plot. */
export const labelsAbove = (
  annotations: readonly ChartAnnotation[] | undefined,
  vertical: (a: ChartAnnotation) => boolean,
) => !!annotations?.some((a) => a.label && vertical(a));

/** The labels of named positions that fit along an axis; the rest are dropped evenly. */
export function fitTicks(
  ticks: readonly AxisTick[],
  length: number,
  fontSize: number,
  along: boolean,
  measure: Measure | number = fontSize,
) {
  const size = along ? Math.max(...ticks.map((t) => textWidth(t.label, measure)), 1) : fontSize * 1.25;
  return thin(ticks, labelsThatFit(length, size, along ? 12 : 4));
}

/** Grid lines across the plot, at the ticks of the value axis. */
export function Grid() {
  const { model } = useFrame<CartesianModel>();
  const { box } = model;
  if (!model.axes) return null;
  return (
    <g data-part="grid">
      {model.gridY.map((y, i) => (
        <line key={`y${i}`} className={styles.gridLine} x1={box.left} x2={box.right} y1={y} y2={y} />
      ))}
      {model.gridX.map((x, i) => (
        <line key={`x${i}`} className={styles.gridLine} x1={x} x2={x} y1={box.top} y2={box.bottom} />
      ))}
    </g>
  );
}

/** The two axis lines, their tick labels and their titles. */
export function Axes() {
  const { model, width, height, measure } = useFrame<CartesianModel>();
  const { box, fontSize } = model;
  if (!model.axes) return null;
  // A label is centred on its tick, and moved in by what would otherwise be cut by the chart's edge.
  const centred = (at: number, label: string) => {
    const half = measure(label) / 2;
    return Math.max(Math.min(at, width - half - 1), half + 1);
  };
  return (
    <g data-part="axes">
      <line className={styles.axisLine} x1={model.yAxisAt} x2={model.yAxisAt} y1={box.top} y2={box.bottom} />
      <line className={styles.axisLine} x1={box.left} x2={box.right} y1={model.xAxisAt} y2={model.xAxisAt} />
      <g data-part="yTicks">
        {model.yTicks.map((t, i) => (
          <text key={i} x={box.left - 6} y={t.at + fontSize * 0.35} textAnchor="end">
            {t.label}
          </text>
        ))}
      </g>
      <g data-part="xTicks">
        {model.xTicks.map((t, i) => (
          <text key={i} x={centred(t.at, t.label)} y={box.bottom + fontSize + 4} textAnchor="middle">
            {t.label}
          </text>
        ))}
      </g>
      {model.yTitle && (
        <text
          data-part="yTitle"
          className={styles.title}
          textAnchor="middle"
          transform={`translate(${fontSize} ${(box.top + box.bottom) / 2}) rotate(-90)`}
        >
          {truncate(model.yTitle, box.bottom - box.top, measure)}
        </text>
      )}
      {model.xTitle && (
        <text
          data-part="xTitle"
          className={styles.title}
          textAnchor="middle"
          x={(box.left + box.right) / 2}
          y={height - 5}
        >
          {truncate(model.xTitle, box.right - box.left, measure)}
        </text>
      )}
    </g>
  );
}

/** Reference lines and bands. */
export function Annotations() {
  const { model, level, measure } = useFrame<CartesianModel>();
  const { box } = model;
  return (
    <g data-part="annotations">
      {model.annotations.map((a, i) => {
        const label = level < 2 && a.label;
        const span = a.vertical
          ? { x: a.from, y: box.top, width: a.to - a.from, height: box.bottom - box.top }
          : { x: box.left, y: a.from, width: box.right - box.left, height: a.to - a.from };
        return (
          <g key={i} className={styles.annotation} style={{ color: a.color }} data-kind={a.kind}>
            {a.kind === 'band' ? (
              <>
                <rect {...span} />
                {/* The two edges of the band: the cue that does not depend on its tint. */}
                {[a.from, a.to].map((at) =>
                  a.vertical ? (
                    <line key={at} x1={at} x2={at} y1={box.top} y2={box.bottom} />
                  ) : (
                    <line key={at} x1={box.left} x2={box.right} y1={at} y2={at} />
                  ),
                )}
              </>
            ) : a.vertical ? (
              <line x1={a.from} x2={a.from} y1={box.top} y2={box.bottom} />
            ) : (
              <line x1={box.left} x2={box.right} y1={a.from} y2={a.from} />
            )}
            {label &&
              (a.vertical ? (
                // Above the plot, centred on the line or band and kept inside the plot's width.
                <text
                  x={Math.min(
                    Math.max((a.from + a.to) / 2, box.left + measure(label) / 2),
                    Math.max(box.right - measure(label) / 2, box.left),
                  )}
                  y={box.top - 5}
                  textAnchor="middle"
                >
                  {truncate(label, box.right - box.left, measure)}
                </text>
              ) : (
                <text x={box.right - 4} y={a.from - 5} textAnchor="end">
                  {truncate(label, box.right - box.left - 8, measure)}
                </text>
              ))}
          </g>
        );
      })}
    </g>
  );
}
