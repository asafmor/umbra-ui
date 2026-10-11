import type { ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { Legend } from '../data/Legend';
import { renderPart, type Part } from '../utils/parts';
import { normalizeThresholds, resolveThreshold, type ThresholdList } from '../utils/thresholds';
import styles from './Chart.module.css';
import { Axes, Backdrop, fitTicks, type CartesianModel } from './internal/cartesian';
import {
  ChartTooltip,
  Frame,
  seriesProps,
  useFrame,
  type BuildInput,
  type ChartCommonProps,
  type ChartParts,
  type PointModel,
} from './internal/Frame';
import { binPoints, stepIndex, stepShare, stepSize, type HeatPoint } from './internal/heat';
import { bands, cartesianMargins, niceDomain, numberFormat, truncate } from './internal/scales';
import { toneColours } from './internal/tones';

export type { HeatPoint as HeatmapPoint };

export interface HeatmapParts extends ChartParts {
  /** What is drawn behind the cells, sized to the plot area: a diagram, a floor plan, a map. */
  backdrop?: Part | undefined;
}

interface HeatModel extends CartesianModel {
  cells: {
    /** The id of the cell's step on the colour scale: what the legend switches. */
    step: string;
    /** The position of the value's band in `thresholds`. */
    band?: number | undefined;
    color: string;
    /** The mark: the whole cell, or a smaller square when size stands in for the printed value. */
    x: number;
    y: number;
    size: [number, number];
    /** The whole cell: what the pointer hits. */
    hit: { x: number; y: number; width: number; height: number };
    text?: string | undefined;
    point: PointModel;
  }[];
}

export interface HeatmapRootProps extends ChartCommonProps {
  /** The names of the rows, from the top down. */
  rows?: string[] | undefined;
  /** The names of the columns. */
  columns?: string[] | undefined;
  /** One list per row, with one value per column. `null` leaves the cell out. */
  values?: (number | null)[][] | undefined;
  /** Instead of `rows`, `columns` and `values`: points that the chart sums into a grid of `bins`. */
  points?: HeatPoint[] | undefined;
  /** The grid of `points`: the number of columns and rows, or one number for both. */
  bins?: number | [number, number] | undefined;
  /** The range `points` are binned over. Defaults to the range of the points. */
  xDomain?: [number, number] | undefined;
  yDomain?: [number, number] | undefined;
  /** Number of steps of the colour scale. `thresholds` replaces it. */
  steps?: number | undefined;
  /** The range of the colour scale. Defaults to the lowest and highest value. */
  valueDomain?: [number, number] | undefined;
  /**
   * Colours cells by the band of their value in place of the scale: an ascending list of
   * `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. The band's
   * `label` joins the value in the tooltip and for screen readers, and names the band in the legend.
   */
  thresholds?: ThresholdList | undefined;
  /** For a scale where low is good: mirrors the colours over the steps or bands. The labels stay. */
  lowerIsBetter?: boolean | undefined;
  /** `false` draws no axis lines, tick labels or titles: the cells take the whole plot, for a chart over a backdrop. */
  axes?: boolean | undefined;
  xTitle?: string | undefined;
  yTitle?: string | undefined;
  /** The captions at the two ends of the scale's legend. */
  lowLabel?: string | undefined;
  highLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?: HeatmapParts | undefined;
  /** The blocks to draw, in order. */
  children?: ReactNode | undefined;
}

/** The chart's own default for a part: used unless the app gave the part (`null` hides it, as everywhere). */
const orDefault = <P,>(part: Part<P> | undefined, fallback: (props: P) => ReactNode): Part<P> =>
  part === undefined ? fallback : part;

function Root({
  rows: rowsProp = [],
  columns: columnsProp = [],
  values: valuesProp = [],
  points,
  bins,
  xDomain,
  yDomain,
  steps = 5,
  valueDomain,
  thresholds,
  lowerIsBetter,
  axes: showAxes = true,
  xTitle,
  yTitle,
  lowLabel = 'Low',
  highLabel = 'High',
  labels = true,
  parts,
  children,
  ...common
}: HeatmapRootProps) {
  const { locale } = useLocale();
  const number = numberFormat(locale, { maximumFractionDigits: 2 });
  const format = common.formatValue ?? number;
  const span = (from: number, to: number) => `${number(from)} – ${number(to)}`;

  // Binned points become the same grid as named rows and columns: each is named by its range.
  const grid = points ? binPoints(points, { bins, xDomain, yDomain }) : undefined;
  const pairs = (edges: number[]) => edges.slice(0, -1).map((from, i) => span(from, edges[i + 1]!));
  const columns = grid ? pairs(grid.xEdges) : columnsProp;
  const rows = grid ? pairs(grid.yEdges).reverse() : rowsProp;
  const values = grid ? grid.values : valuesProp;
  const numbers = values.flat().filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  // The colour scale: the bands of `thresholds`, or equal steps between the lowest and highest value.
  const list = normalizeThresholds(thresholds);
  const count = list.length || Math.max(1, Math.floor(steps));
  // Round ends, so the steps of the scale start at round numbers.
  const domain = valueDomain ?? niceDomain(numbers, false, count);
  const ramp = (cue: number) =>
    `color-mix(in oklab, var(--umbra-heatmap-high, var(--umbra-color-series-1)) ${stepShare(cue, count)}%, var(--umbra-heatmap-low, var(--umbra-color-base-surface3)))`;
  const scale = Array.from({ length: count }, (_, i) => {
    const cue = lowerIsBetter ? count - 1 - i : i;
    const look = list[cue];
    const from = list.length ? list[i]!.from : domain[0] + ((domain[1] - domain[0]) * i) / count;
    const to = list.length ? list[i + 1]?.from : domain[0] + ((domain[1] - domain[0]) * (i + 1)) / count;
    const range =
      to === undefined ? `${format(from)}+` : Number.isFinite(from) ? span(from, to) : `< ${format(to)}`;
    return {
      id: `step-${i}`,
      cue,
      // The band's own name, or its range.
      label: list[i]?.label ?? range,
      name: list[i]?.label,
      color: look?.color ?? (look?.tone ? toneColours[look.tone] : ramp(cue)),
    };
  });
  /** The step a value is on, or `undefined` for a value below the first band. */
  const stepOf = (v: number) =>
    list.length ? resolveThreshold(v, thresholds, { lowerIsBetter })?.index : stepIndex(v, domain, count);
  const text = (v: number, step: number | undefined) => {
    const name = step === undefined ? undefined : scale[step]!.name;
    return name ? `${format(v)} · ${name}` : format(v);
  };

  const build = ({ width, height, fontSize, measure, level, hidden }: BuildInput): HeatModel => {
    const axes = showAxes && level < 4;
    const margins = (leftLabels: number) =>
      cartesianMargins({
        level: axes ? level : 4,
        fontSize,
        leftLabels,
        leftTitle: !!yTitle,
        bottomTitle: !!xTitle,
      });
    let m = margins(0);
    const top = m.top;
    const bottom = Math.max(height - m.bottom, top + 1);
    const leftRoom = axes ? Math.min(Math.max(...rows.map((r) => measure(r)), 0), width * 0.3) : 0;
    m = margins(leftRoom);
    const left = m.left;
    const right = Math.max(width - m.right, left + 1);

    const x = bands(columns, [left, right], 0.06, 0);
    const y = bands(rows, [top, bottom], 0.06, 0);
    // The value is printed when every value fits its cell. Otherwise the size of the mark stands in for it.
    const printed =
      labels &&
      level < 2 &&
      y.width >= fontSize * 1.3 &&
      Math.max(...numbers.map((v) => measure(format(v))), 0) + 6 <= x.width;

    const cells: HeatModel['cells'] = [];
    const lines = rows.map((row, r) =>
      columns.flatMap((column, c): PointModel[] => {
        const v = values[r]?.[c];
        if (v == null || Number.isNaN(v)) return [];
        const step = stepOf(v);
        if (step === undefined || hidden.includes(scale[step]!.id)) return [];
        const { id, cue, color } = scale[step]!;
        const hit = { x: x(column), y: y(row), width: x.width, height: y.width };
        const share = printed ? 1 : stepSize(cue, count);
        const size: [number, number] = [hit.width * share, hit.height * share];
        const point: PointModel = {
          key: `${r}-${c}`,
          group: `${row}, ${column}`,
          name: `${row}, ${column}: ${text(v, step)}`,
          valueText: text(v, step),
          color,
          x: hit.x + hit.width / 2,
          y: hit.y + hit.height / 2,
          outline: { type: 'rect', ...hit },
          point: { seriesId: row, seriesLabel: row, index: c, x: column, value: v },
        };
        cells.push({
          step: id,
          band: list.length ? step : undefined,
          color,
          x: point.x - size[0] / 2,
          y: point.y - size[1] / 2,
          size,
          hit,
          text: printed ? format(v) : undefined,
          point,
        });
        return [point];
      }),
    );

    return {
      rows: lines,
      box: { left, top, right, bottom },
      axes,
      xTicks: fitTicks(
        columns.map((c) => ({ at: x(c) + x.width / 2, label: c })),
        right - left,
        fontSize,
        true,
        measure,
      ),
      yTicks: fitTicks(
        rows.map((r) => ({ at: y(r) + y.width / 2, label: truncate(r, leftRoom, measure) })),
        bottom - top,
        fontSize,
        false,
      ),
      gridX: [],
      gridY: [],
      xAxisAt: bottom,
      yAxisAt: left,
      xTitle: level < 3 ? xTitle : undefined,
      yTitle: level < 3 ? yTitle : undefined,
      annotations: [],
      fontSize,
      cells,
    };
  };

  return (
    <Frame
      {...common}
      kind="heatmap"
      series={scale.map((s) => ({ id: s.id, label: s.label, color: s.color, marker: 'square' as const }))}
      table={{
        columns,
        rows: rows.map((row, r) => ({
          label: row,
          cells: columns.map((_, c) => {
            const v = values[r]?.[c];
            return v == null || Number.isNaN(v) ? '' : text(v, stepOf(v));
          }),
        })),
      }}
      summary={`${rows.join(', ')}: ${columns.join(', ')}`}
      isEmpty={!numbers.length}
      skeleton={<Skeleton shape="block" />}
      widths={[360, 280, 220, 150]}
      heights={[240, 190, 150, 100]}
      signature={`${rows.join()}|${columns.join()}|${values.map((row) => row.join()).join('|')}`}
      parts={{
        ...parts,
        // The scale reads from low to high, and says so at its two ends. Bands carry their own names.
        legend: orDefault(parts?.legend, (p) =>
          list.length ? (
            <Legend {...p} />
          ) : (
            <div className={styles.scaleLegend}>
              <span data-part="lowLabel">{lowLabel}</span>
              {/* Swatches only: the range of each step is its name for assistive technology. */}
              <Legend
                {...p}
                parts={{ ...p.parts, label: (l) => <span className={styles.hidden}>{l.children}</span> }}
              />
              <span data-part="highLabel">{highLabel}</span>
            </div>
          ),
        ),
        // A cell is one value: its row and column are the name, not a title over a list of one.
        tooltip: orDefault(parts?.tooltip, (p) => (
          <ChartTooltip title={p.title} rows={p.rows.map((row) => ({ ...row, label: p.title }))} />
        )),
      }}
      build={build}
    >
      {children}
    </Frame>
  );
}

/** The cells. Each is a point: hovered, reached with the arrow keys, and pressed. */
function Cells() {
  const frame = useFrame<HeatModel>();
  return (
    <g data-part="cells">
      {frame.model.cells.map((c) => (
        <g
          key={c.point.key}
          className={styles.series}
          data-band={c.band}
          {...seriesProps(frame, c.step)}
          {...frame.pointProps(c.point)}
        >
          <rect className={styles.hit} {...c.hit} />
          <rect
            className={styles.cell}
            data-part="cell"
            rx={2}
            x={c.x}
            y={c.y}
            width={c.size[0]}
            height={c.size[1]}
            fill={c.color}
          />
        </g>
      ))}
    </g>
  );
}

/** The value printed in each cell, when every value fits. */
function ValueLabels() {
  const { model } = useFrame<HeatModel>();
  return (
    <g data-part="valueLabels">
      {model.cells.map(
        (c) =>
          c.text !== undefined && (
            <text
              key={c.point.key}
              className={styles.cellLabel}
              x={c.point.x}
              y={c.point.y + model.fontSize * 0.35}
              textAnchor="middle"
            >
              {c.text}
            </text>
          ),
      )}
    </g>
  );
}

export type HeatmapProps = Omit<HeatmapRootProps, 'children'>;

/** A grid of cells coloured by value: two categories against each other, or points summed into bins. */
export function Heatmap(props: HeatmapProps) {
  return (
    <Root {...props}>
      <Backdrop>{renderPart(props.parts?.backdrop, {}, () => null)}</Backdrop>
      <Cells />
      <Axes />
      <ValueLabels />
    </Root>
  );
}

Heatmap.Root = Root;
Heatmap.Backdrop = Backdrop;
Heatmap.Cells = Cells;
Heatmap.Axes = Axes;
Heatmap.ValueLabels = ValueLabels;
