// What every chart shares: the figure and its accessible name, measuring, the "show less" level, the
// legend, the three data states, the tooltip, keyboard navigation and the hidden data table.
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button } from '../../basics/Button';
import { Skeleton } from '../../basics/Skeleton';
import { Legend, type LegendProps } from '../../data/Legend';
import { SeriesMarker, type SeriesMarkerKind } from '../../internal/SeriesMarker';
import { cx, renderPart, type Part } from '../../utils/parts';
import styles from '../Chart.module.css';
import { levelFor, placeTooltip } from './scales';
import { useChartSize } from './useChartSize';

/** One data point, as the app receives it in `onPointPress`. */
export interface ChartPoint {
  seriesId: string;
  seriesLabel: string;
  /** Position of the point in its series. */
  index: number;
  /** The category, axis or x value of the point. */
  x: string | number | Date;
  value: number | string | null;
}

export type ChartLegendPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface ChartTooltipRow {
  id: string;
  label: string;
  value: string;
  color: string;
  /** The row of the point that is hovered or focused. */
  active: boolean;
}
export interface ChartTooltipProps {
  /** The category, axis or x value the rows belong to. */
  title: string;
  rows: ChartTooltipRow[];
}

export interface ChartParts {
  /** The built-in legend. */
  legend?: Part<LegendProps>;
  tooltip?: Part<ChartTooltipProps>;
  /** The placeholder shown while `loading`. */
  skeleton?: Part;
  /** The message shown when there is no data. */
  empty?: Part<{ children: ReactNode }>;
  /** The message and retry action shown when `error` is set. */
  error?: Part<{ children: ReactNode; onRetry?: () => void; retryLabel: string }>;
}

/** Props every chart takes. */
export interface ChartCommonProps {
  /** Accessible name of the chart. Required unless `aria-labelledby` is set. */
  label?: string;
  /** Id of the element that names the chart, for example a card title. */
  'aria-labelledby'?: string;
  /** What a screen reader hears after the name. Defaults to a generated summary of the data. */
  description?: string;
  /**
   * The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it.
   * By default it is shown below the chart when there is more than one series.
   */
  legend?: boolean | ChartLegendPlacement | ReactNode;
  /** Ids of the series that are switched off (controlled). */
  hiddenIds?: readonly string[];
  defaultHiddenIds?: readonly string[];
  onHiddenChange?: (hiddenIds: string[]) => void;
  /** Draws labels on the chart itself, so it can be read without the legend or the tooltip. */
  labels?: boolean;
  /** Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. */
  formatValue?: (value: number) => string;
  /** Called when a point is clicked, or activated with Enter or Space. */
  onPointPress?: (point: ChartPoint) => void;
  /** Shows a placeholder in the chart's shape. */
  loading?: boolean;
  /** Shown when there is no data. */
  empty?: ReactNode;
  /** When set, shown in place of the chart. */
  error?: ReactNode;
  /** Adds a retry button to the error state. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Accessible name of the list of data points. */
  pointsLabel?: string;
  /** Accessible name of the legend. */
  legendLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export type Outline =
  | { type: 'circle'; r: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'path'; d: string; transform?: string };

/** A point as a chart draws it: where it is, what it says, and what the app gets back. */
export interface PointModel {
  key: string;
  /** Points with the same group share one tooltip. */
  group: string;
  /** What a screen reader hears, for example "Orders, March: 42". */
  name: string;
  valueText: string;
  color: string;
  /** Where the tooltip points, in plot pixels. */
  x: number;
  y: number;
  outline: Outline;
  point: ChartPoint;
}

export interface SeriesInfo {
  id: string;
  label: string;
  color: string;
  /** The legend marker: one of the Legend's kinds, or a drawn glyph. */
  marker?: SeriesMarkerKind;
  glyph?: ReactNode;
}

export interface FrameModel {
  /** One row per visible series, each in the order the arrow keys move along. */
  rows: PointModel[][];
}

export interface BuildInput {
  width: number;
  height: number;
  fontSize: number;
  level: number;
  hidden: readonly string[];
}

interface FrameValue {
  model: FrameModel;
  width: number;
  height: number;
  fontSize: number;
  level: number;
  uid: string;
  active: PointModel | null;
  /** The series a legend item points at, if any. */
  highlight: string | null;
  pointProps: (point: PointModel) => Record<string, unknown>;
}
const FrameContext = createContext<FrameValue | null>(null);

/** Internal: what a chart's blocks draw from. */
export function useFrame<M extends FrameModel>() {
  const frame = useContext(FrameContext);
  if (!frame) throw new Error('Chart blocks must be rendered inside the chart’s Root.');
  return frame as FrameValue & { model: M };
}

/** Attributes of the group around one series: it fades while the legend points at another one. */
export const seriesProps = (frame: { highlight: string | null }, id: string) => ({
  'data-series': id,
  'data-dim': (frame.highlight !== null && frame.highlight !== id) || undefined,
});

const placements = ['top', 'bottom', 'start', 'end'];

export interface FrameProps<M extends FrameModel> extends ChartCommonProps {
  /** `data-umbra` of the root. */
  kind: string;
  series: SeriesInfo[];
  /** The same values as a table, for screen readers. */
  table: { columns: string[]; rows: { label: string; cells: string[] }[] };
  summary: string;
  isEmpty: boolean;
  skeleton: ReactNode;
  /** Thresholds of the "show less" levels, largest first. Level 1 always drops the legend. */
  widths: readonly number[];
  heights: readonly number[];
  /** Changes when the data does, so the marks draw in again. */
  signature: string;
  /** The arrow keys along the data are up and down (horizontal bars). */
  vertical?: boolean;
  parts?: ChartParts;
  build: (input: BuildInput) => M;
  children?: ReactNode;
}

export function Frame<M extends FrameModel>({
  kind,
  series,
  table,
  summary,
  isEmpty,
  skeleton,
  widths,
  heights,
  signature,
  vertical = false,
  build,
  parts,
  children,
  label,
  'aria-labelledby': labelledBy,
  description,
  legend,
  hiddenIds,
  defaultHiddenIds = [],
  onHiddenChange,
  onPointPress,
  loading = false,
  empty = 'No data',
  error,
  onRetry,
  retryLabel = 'Retry',
  pointsLabel = 'Data points',
  legendLabel = 'Legend',
  className,
  style,
}: FrameProps<M>) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rootRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const slot = useChartSize(rootRef);
  const plot = useChartSize(plotRef);

  const [uncontrolled, setUncontrolled] = useState(defaultHiddenIds);
  const hidden = hiddenIds ?? uncontrolled;
  const [highlight, setHighlight] = useState<string | null>(null);
  const [activeKey, setActive] = useState<{ key: string; keyboard: boolean } | null>(null);

  const state = loading ? 'loading' : error != null && error !== false ? 'error' : isEmpty ? 'empty' : null;
  const level = levelFor(slot.width, slot.height, widths, heights);

  const custom = legend != null && typeof legend !== 'boolean' && !placements.includes(legend as string);
  const wanted = legend === undefined ? series.length > 1 : legend !== false;
  const placement = placements.includes(legend as string) ? (legend as ChartLegendPlacement) : 'bottom';
  const glyphs = new Map(series.filter((s) => s.glyph).map((s) => [s.id, s.glyph]));
  const legendNode =
    wanted &&
    level < 1 &&
    state !== 'error' &&
    state !== 'empty' &&
    (loading ? (
      // A placeholder of the legend's height, so the plot does not move when the data arrives.
      <div className={styles.legendSkeleton} aria-hidden="true">
        <Skeleton width="40%" />
      </div>
    ) : custom ? (
      (legend as ReactNode)
    ) : (
      renderPart(
        parts?.legend,
        {
          items: series.map((s) => ({ id: s.id, label: s.label, color: s.color, marker: s.marker })),
          interactive: true,
          orientation: placement === 'start' || placement === 'end' ? 'vertical' : 'horizontal',
          align: 'center',
          hiddenIds: hidden,
          onHiddenChange: (next) => {
            setUncontrolled(next);
            onHiddenChange?.(next);
          },
          onHighlight: setHighlight,
          'aria-label': legendLabel,
          // A line or radar series is shown as a piece of its line with its point shape.
          parts: glyphs.size
            ? {
                item: (p) => (
                  <Legend.Item {...p} parts={{ ...p.parts, marker: glyphs.get(p.id) ?? p.parts?.marker }} />
                ),
              }
            : undefined,
        },
        (p) => <Legend {...p} />,
      )
    ));

  // A legend part that renders nothing takes no room either.
  const showLegend = legendNode != null && legendNode !== false;

  const drawn = !state && plot.width > 0 && plot.height > 0;
  const model = drawn ? build({ ...plot, level, hidden }) : null;
  const rows = model?.rows.filter((row) => row.length) ?? [];
  const all = rows.flat();
  const active = (activeKey && all.find((p) => p.key === activeKey.key)) || null;
  const keyboard = !!active && activeKey!.keyboard;

  const onKeyDown = (event: KeyboardEvent) => {
    if (!all.length) return;
    const { key } = event;
    if (key === 'Escape') {
      // Only takes the key when there is something to clear, so a dialog around the chart still closes.
      if (active) event.stopPropagation();
      return setActive(null);
    }
    if ((key === 'Enter' || key === ' ') && active) {
      event.preventDefault();
      return onPointPress?.(active.point);
    }
    const [prev, next, up, down] = vertical
      ? ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      : ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (![prev, next, up, down, 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const r = active ? rows.findIndex((row) => row.includes(active)) : 0;
    const row = rows[r]!;
    const i = active ? row.indexOf(active) : -1;
    let target: PointModel | undefined;
    if (!active) target = key === 'End' ? row.at(-1) : row[0];
    else if (key === 'Home') target = row[0];
    else if (key === 'End') target = row.at(-1);
    else if (key === prev) target = row[i - 1];
    else if (key === next) target = row[i + 1];
    else {
      // To the next series: the point of the same group, or else the nearest one along the axis.
      const other = rows[r + (key === up ? -1 : 1)];
      const along = (p: PointModel) => (vertical ? p.y : p.x);
      target =
        other?.find((p) => p.group === active.group) ??
        other?.reduce((a, b) =>
          Math.abs(along(b) - along(active)) < Math.abs(along(a) - along(active)) ? b : a,
        );
    }
    if (target) setActive({ key: target.key, keyboard: true });
  };

  const pointProps = (point: PointModel) => ({
    id: `${uid}-${point.key}`,
    role: 'option',
    'aria-label': point.name,
    'aria-selected': active === point,
    'data-part': 'point',
    'data-active': active === point || undefined,
    onPointerEnter: () => setActive({ key: point.key, keyboard: false }),
    onClick: () => {
      setActive({ key: point.key, keyboard: false });
      onPointPress?.(point.point);
    },
  });

  const tooltip = active && {
    title: active.group,
    rows: all
      .filter((p) => p.group === active.group)
      .map((p) => ({
        id: p.point.seriesId,
        label: p.point.seriesLabel,
        value: p.valueText,
        color: p.color,
        active: p === active,
      })),
  };
  const place = active && placeTooltip(active.x, active.y, plot.width, plot.height);
  const descriptionId = `${uid}-description`;

  return (
    <figure
      ref={rootRef}
      data-umbra={kind}
      data-level={level}
      data-state={state ?? undefined}
      data-legend={showLegend ? placement : undefined}
      data-pressable={onPointPress ? '' : undefined}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={descriptionId}
      aria-busy={loading || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      {showLegend && (placement === 'top' || placement === 'start') && (
        <div className={styles.legend} data-part="legend">
          {legendNode}
        </div>
      )}
      <div ref={plotRef} className={styles.plot} data-part="plot">
        {state === 'loading' && (
          <div className={styles.state} aria-hidden="true">
            {renderPart(parts?.skeleton, {}, () => skeleton)}
          </div>
        )}
        {state === 'empty' &&
          renderPart(parts?.empty, { children: empty }, (p) => (
            <div className={styles.state} data-part="empty">
              {p.children}
            </div>
          ))}
        {state === 'error' &&
          renderPart(parts?.error, { children: error, onRetry, retryLabel }, (p) => (
            <div className={styles.state} data-part="error" role="alert">
              <span className={styles.message}>{p.children}</span>
              {p.onRetry && (
                <Button size="small" onPress={p.onRetry}>
                  {p.retryLabel}
                </Button>
              )}
            </div>
          ))}
        {model && (
          <div
            className={styles.marks}
            role="listbox"
            aria-label={pointsLabel}
            aria-activedescendant={active ? `${uid}-${active.key}` : undefined}
            tabIndex={0}
            data-has-active={keyboard || undefined}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive((a) => (a?.keyboard ? a : null))}
          >
            <svg width={plot.width} height={plot.height} role="presentation" className={styles.svg}>
              <FrameContext
                value={{ model, ...plot, level, uid, active, highlight, pointProps } satisfies FrameValue}
              >
                <g key={signature} className={styles.draw}>
                  {children}
                </g>
              </FrameContext>
              {active && <Ring point={active} keyboard={keyboard} />}
            </svg>
          </div>
        )}
        {tooltip && place && (
          <div
            className={styles.tooltip}
            data-part="tooltip"
            data-align={place.align}
            data-side={place.side}
            aria-hidden="true"
            style={{ left: active.x, top: active.y }}
          >
            {renderPart(parts?.tooltip, tooltip, (p) => (
              <ChartTooltip {...p} />
            ))}
          </div>
        )}
      </div>
      {showLegend && (placement === 'bottom' || placement === 'end') && (
        <div className={styles.legend} data-part="legend">
          {legendNode}
        </div>
      )}
      <p id={descriptionId} className={styles.hidden}>
        {description ?? summary}
      </p>
      {!state && (
        <table className={styles.hidden}>
          {label && <caption>{label}</caption>}
          <thead>
            <tr>
              <td />
              {table.columns.map((column, i) => (
                <th key={i} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}

/** The outline of the hovered or focused point: the focus ring when it was reached by keyboard. */
function Ring({ point, keyboard }: { point: PointModel; keyboard: boolean }) {
  const o = point.outline;
  const props = { className: styles.ring, 'data-part': 'focus-ring', 'data-keyboard': keyboard || undefined };
  if (o.type === 'circle') return <circle cx={point.x} cy={point.y} r={o.r + 3} {...props} />;
  if (o.type === 'path') return <path d={o.d} transform={o.transform} {...props} />;
  return <rect x={o.x - 2} y={o.y - 2} width={o.width + 4} height={o.height + 4} rx={3} {...props} />;
}

/** The default tooltip content: a title and one row per series. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  const single = rows.length === 1 && rows[0]!.label === title;
  return (
    <>
      {!single && <div className={styles.tooltipTitle}>{title}</div>}
      {rows.map((row) => (
        <div
          key={row.id}
          className={styles.tooltipRow}
          data-active={(row.active && rows.length > 1) || undefined}
        >
          <SeriesMarker kind="square" color={row.color} />
          <span className={styles.tooltipLabel}>{row.label}</span>
          <span className={styles.tooltipValue}>{row.value}</span>
        </div>
      ))}
    </>
  );
}
