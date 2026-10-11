// The cue of a series that does not depend on colour: a point shape and a dash for lines, a fill
// pattern for bars and segments. The fill patterns are the Legend's own marker kinds
// (src/internal/SeriesMarker.tsx), so a legend swatch and its bars look the same.
import { seriesColour } from '../../internal/SeriesMarker';

export const pointShapes = ['dot', 'square', 'diamond', 'triangle'] as const;
export type PointShapeKind = (typeof pointShapes)[number];
/** Stroke dash arrays, in the order series take them. `undefined` is a solid line. */
export const dashes = [undefined, '6 3', '2 3'] as const;
export const fills = ['square', 'stripes', 'dots'] as const;
/** `square` is a solid fill; the other two are outlined, with the pattern inside. */
export type FillKind = (typeof fills)[number];

/**
 * Four shapes and three dashes, each taken in turn: every one of the twelve pairs is used before one
 * repeats, so twelve lines differ without colour (`lineCues`). With the eight colours of the palette, a
 * colour and cue together repeat after 24 series.
 */
export const lineCues = pointShapes.length * dashes.length;
export const pointShape = (index: number): PointShapeKind => pointShapes[index % pointShapes.length]!;
export const dash = (index: number) => dashes[index % dashes.length];
/**
 * The fill of the series at `index`: solid, stripes, dots, and round again, so neighbours always
 * differ, and with eight colours a colour and fill pair repeats only after 24 series.
 */
export const fillKind = (index: number): FillKind => fills[index % fills.length]!;
export { seriesColour };

export function PointShape({
  shape,
  x,
  y,
  size,
  color,
}: {
  shape: PointShapeKind;
  x: number;
  y: number;
  /** Half the width of the shape. */
  size: number;
  color?: string | undefined;
}) {
  const s = size;
  const common = { fill: color ?? 'currentColor', 'data-shape': shape };
  if (shape === 'square') return <rect x={x - s} y={y - s} width={2 * s} height={2 * s} rx={1} {...common} />;
  if (shape === 'diamond') {
    const d = s * 1.3;
    return <path d={`M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`} {...common} />;
  }
  if (shape === 'triangle') {
    const t = s * 1.25;
    return <path d={`M${x} ${y - t}L${x + t} ${y + t * 0.8}L${x - t} ${y + t * 0.8}Z`} {...common} />;
  }
  return <circle cx={x} cy={y} r={s * 1.1} {...common} />;
}

/**
 * The legend marker of a line or radar series: a piece of its line with its point shape. The piece is
 * two markers wide and drawn at the chart's own scale, so the dash is the line's dash and can be told
 * from the other dashes on both sides of the shape.
 */
export function LineGlyph({
  shape,
  dash: dashArray,
  color,
}: {
  shape: PointShapeKind;
  dash?: string | undefined;
  color: string;
}) {
  return (
    <svg
      viewBox="0 0 28 14"
      aria-hidden="true"
      data-part="marker"
      data-kind={shape}
      style={{ flex: 'none', width: 'calc(2 * var(--umbra-series-marker-size, 0.875rem))', color }}
    >
      <path d="M0 7h28" stroke="currentColor" strokeWidth="2" strokeDasharray={dashArray} />
      <PointShape shape={shape} x={14} y={7} size={3} />
    </svg>
  );
}

/** The `<pattern>` behind a patterned fill. Solid fills need none. */
export function FillPattern({ id, kind, color }: { id: string; kind: FillKind; color: string }) {
  if (kind === 'square') return null;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6">
      {kind === 'stripes' ? (
        <path d="M-1 1l2-2M0 6l6-6M5 7l2-2" stroke={color} strokeWidth="1.5" />
      ) : (
        <circle cx="3" cy="3" r="1.2" fill={color} />
      )}
    </pattern>
  );
}

/** The paint of a bar or segment with this fill: solid, or outlined with the pattern inside. */
export const fillPaint = (kind: FillKind, color: string, patternId: string) =>
  kind === 'square'
    ? { fill: color }
    : {
        fill: `url(#${patternId})`,
        stroke: color,
        style: { strokeWidth: 'var(--umbra-chart-outline-width, 1.5px)' },
        'data-pattern': kind,
      };
