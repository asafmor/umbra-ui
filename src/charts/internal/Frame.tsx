// What every chart shares: the figure and its accessible name, measuring, the "show less" level, the
// legend, the three data states, the tooltip, keyboard navigation and the hidden data table.
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Skeleton } from '../../basics/Skeleton';
import { Legend, type LegendProps } from '../../data/Legend';
import { dataState, type DataStateProps } from '../../internal/dataState';
import { heightProps } from '../../internal/height';
import { SeriesMarker, type SeriesMarkerKind } from '../../internal/SeriesMarker';
import { cx, renderPart, type Part } from '../../utils/parts';
import styles from '../Chart.module.css';
import { fitTooltip, levelFor, placeTooltip, type Measure } from './scales';
import { measurer, useChartSize } from './useChartSize';
import { passThrough, type RootAttributes } from '../../utils/passThrough';

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
  legend?: Part<LegendProps> | undefined;
  tooltip?: Part<ChartTooltipProps> | undefined;
  /** The placeholder shown while `loading`. */
  skeleton?: Part | undefined;
  /** The empty state: shown when there is no data, or when every series is switched off. */
  empty?: Part<{ children: ReactNode }> | undefined;
  /** The error state, with its retry button when `onRetry` is set. */
  error?: Part<{ children: ReactNode }> | undefined;
}

/** Props every chart takes. The loading, empty and error props are the same as on every data component. */
export interface ChartCommonProps extends DataStateProps, RootAttributes {
  /** Accessible name of the chart. Required unless `aria-labelledby` is set. */
  'aria-label'?: string | undefined;
  /** Id of the element that names the chart, for example a card title. */
  'aria-labelledby'?: string | undefined;
  /** What a screen reader hears after the name. Defaults to a generated summary of the data. */
  description?: string | undefined;
  /**
   * The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it.
   * By default it is shown below the chart when there is more than one series.
   */
  legend?: boolean | ChartLegendPlacement | ReactNode | undefined;
  /** Ids of the series that are switched off (controlled). */
  hiddenIds?: readonly string[] | undefined;
  defaultHiddenIds?: readonly string[] | undefined;
  onHiddenChange?: ((hiddenIds: string[]) => void) | undefined;
  /** Draws labels on the chart itself, so it can be read without the legend or the tooltip. */
  labels?: boolean | undefined;
  /** Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. */
  formatValue?: ((value: number) => string) | undefined;
  /** Called when a point is clicked, or activated with Enter or Space. */
  onPointPress?: ((point: ChartPoint) => void) | undefined;
  /** Shown in place of the plot when the legend has switched every series off. */
  allHiddenLabel?: string | undefined;
  /** Accessible name of the list of data points. */
  pointsLabel?: string | undefined;
  /** Accessible name of the legend. */
  legendLabel?: string | undefined;
  /**
   * `fill` (default) takes the height of the parent, and falls back to the content's height in a parent
   * that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always
   * as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels.
   */
  height?: 'fill' | 'content' | number | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export type Outline =
  | { type: 'circle'; r: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'path'; d: string; transform?: string | undefined };

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
  marker?: SeriesMarkerKind | undefined;
  glyph?: ReactNode | undefined;
}

export interface FrameModel {
  /** One row per visible series, each in the order the arrow keys move along. */
  rows: PointModel[][];
}

export interface BuildInput {
  width: number;
  height: number;
  fontSize: number;
  /** The width of a label in the chart's font. */
  measure: Measure;
  level: number;
  hidden: readonly string[];
}

interface FrameValue {
  model: FrameModel;
  width: number;
  height: number;
  fontSize: number;
  measure: Measure;
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
  vertical?: boolean | undefined;
  parts?: ChartParts | undefined;
  build: (input: BuildInput) => M;
  children?: ReactNode | undefined;
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
  'aria-label': label,
  'aria-labelledby': labelledBy,
  description,
  legend,
  hiddenIds,
  defaultHiddenIds = [],
  onHiddenChange,
  onPointPress,
  loading = false,
  empty,
  error,
  onRetry,
  retryLabel,
  allHiddenLabel = 'All series are hidden',
  pointsLabel = 'Data points',
  legendLabel = 'Legend',
  height,
  className,
  style,
  ...rest
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

  // With every series switched off there is nothing to draw: the empty state says so, and the legend
  // stays, so a series can be switched back on.
  const allHidden = !isEmpty && series.length > 0 && series.every((s) => hidden.includes(s.id));
  const stateNode = dataState(
    { loading, empty: allHidden ? allHiddenLabel : empty, error, onRetry, retryLabel },
    { part: true, isEmpty: isEmpty || allHidden, defaultEmpty: { title: 'No data' } },
  );
  const state = error ? 'error' : loading ? 'loading' : stateNode ? 'empty' : null;
  const level = levelFor(slot.width, slot.height, widths, heights);

  const custom = legend != null && typeof legend !== 'boolean' && !placements.includes(legend as string);
  const wanted = legend === undefined ? series.length > 1 : legend !== false;
  const placement = placements.includes(legend as string) ? (legend as ChartLegendPlacement) : 'bottom';
  const glyphs = new Map(series.filter((s) => s.glyph).map((s) => [s.id, s.glyph]));
  const legendNode =
    wanted &&
    level < 1 &&
    state !== 'error' &&
    (state !== 'empty' || allHidden) &&
    (state === 'loading' ? (
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
  const measure = measurer(plot.font, plot.fontSize);
  const model = drawn ? build({ ...plot, measure, level, hidden }) : null;
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
  // A tooltip part of `null` shows no tooltip at all, not an empty box.
  const tooltipNode = tooltip ? renderPart(parts?.tooltip, tooltip, (p) => <ChartTooltip {...p} />) : null;
  const place = active && placeTooltip(active.x, active.y, plot.width, plot.height);

  // The tooltip is placed once it is drawn and its size is known, so that it is never cut: inside the
  // chart when it fits, outside it when the chart is too short. It is shown in the top layer (the
  // Popover API), where no card or scroll area clips it, and stays in the chart's own DOM, so it keeps
  // the tokens, the density and the direction of its place. Every supported browser has the Popover API.
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [, replace] = useReducer((n: number) => n + 1, 0);
  useLayoutEffect(() => {
    const [el, plotEl, root] = [tooltipRef.current, plotRef.current, rootRef.current];
    if (!el || !plotEl || !root || !active || !place) return;
    try {
      if (!el.matches(':popover-open')) el.showPopover();
    } catch {
      // Not in the top layer (the element left the page): it is drawn where it is.
    }
    const from = plotEl.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const page = document.documentElement;
    const fit = fitTooltip({
      x: from.left + active.x,
      y: from.top + active.y,
      width: box.width,
      height: box.height,
      align: place.align,
      side: place.side,
      chart: root.getBoundingClientRect(),
      window: { left: 0, top: 0, right: page.clientWidth, bottom: page.clientHeight },
    });
    el.style.left = `${fit.left}px`;
    el.style.top = `${fit.top}px`;
    el.dataset.side = fit.side;
  });
  // While a point is shown: Escape dismisses it wherever the focus is (a hover tooltip too), and the
  // tooltip follows its point when something scrolls.
  const shown = active !== null;
  useEffect(() => {
    if (!shown) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', replace, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', replace, true);
    };
  }, [shown]);
  // No summary of data that is not there (it read "0: ").
  const summaryText = description ?? (isEmpty ? '' : summary);
  const descriptionId = summaryText ? `${uid}-description` : undefined;

  return (
    <figure
      {...passThrough(rest)}
      ref={rootRef}
      data-umbra={kind}
      data-level={level}
      data-state={state ?? undefined}
      data-legend={showLegend ? placement : undefined}
      data-pressable={onPointPress ? '' : undefined}
      data-height={heightProps(height)['data-height']}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={descriptionId}
      aria-busy={state === 'loading' || undefined}
      className={cx(styles.root, className)}
      style={{ ...heightProps(height).style, ...style }}
    >
      {showLegend && (placement === 'top' || placement === 'start') && (
        <div className={styles.legend} data-part="legend">
          {legendNode}
        </div>
      )}
      <div ref={plotRef} className={styles.plot} data-part="plot">
        {state === 'loading' && (
          <div className={styles.state} data-part="skeleton" aria-hidden="true">
            {renderPart(parts?.skeleton, {}, () => skeleton)}
          </div>
        )}
        {(state === 'empty' || state === 'error') &&
          // The shared state (src/internal/dataState.tsx) carries `data-part` "empty" or "error".
          renderPart(
            state === 'error' ? parts?.error : parts?.empty,
            { children: <div className={styles.state}>{stateNode}</div> },
            (p) => p.children,
          )}
        {model && (
          <div
            className={styles.marks}
            // A list of points only when there are points: an empty listbox is not a valid tab stop.
            role={all.length ? 'listbox' : undefined}
            aria-label={all.length ? pointsLabel : undefined}
            aria-activedescendant={active ? `${uid}-${active.key}` : undefined}
            tabIndex={all.length ? 0 : undefined}
            data-has-active={keyboard || undefined}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive((a) => (a?.keyboard ? a : null))}
          >
            <svg width={plot.width} height={plot.height} role="presentation" className={styles.svg}>
              <FrameContext
                value={
                  { model, ...plot, measure, level, uid, active, highlight, pointProps } satisfies FrameValue
                }
              >
                <g key={signature} className={styles.draw}>
                  {children}
                </g>
              </FrameContext>
              {active && <Ring point={active} keyboard={keyboard} />}
            </svg>
          </div>
        )}
        {tooltipNode != null && tooltipNode !== false && place && (
          <div
            ref={tooltipRef}
            popover="manual"
            className={styles.tooltip}
            data-part="tooltip"
            data-align={place.align}
            aria-hidden="true"
          >
            {tooltipNode}
          </div>
        )}
      </div>
      {showLegend && (placement === 'bottom' || placement === 'end') && (
        <div className={styles.legend} data-part="legend">
          {legendNode}
        </div>
      )}
      {summaryText && (
        <p id={descriptionId} className={styles.hidden}>
          {summaryText}
        </p>
      )}
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
  const props = { className: styles.ring, 'data-part': 'focusRing', 'data-keyboard': keyboard || undefined };
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
