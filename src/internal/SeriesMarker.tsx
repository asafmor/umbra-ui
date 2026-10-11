// The marker of one data series: what a Legend shows beside a label, and what charts will draw on
// their lines and fills. Shapes and patterns are the cue that does not depend on colour.
import type { CSSProperties } from 'react';
import { cx } from '../utils/parts';
import styles from './SeriesMarker.module.css';

/** Shapes filled with the series colour. */
export const seriesShapes = ['dot', 'square', 'line', 'dashed'] as const;
/** Outlined swatches with a pattern inside: they tell series apart without colour. */
export const seriesPatterns = ['stripes', 'dots'] as const;
export type SeriesShape = (typeof seriesShapes)[number];
export type SeriesPattern = (typeof seriesPatterns)[number];
export type SeriesMarkerKind = SeriesShape | SeriesPattern;

/** Number of colours in the default palette (`color.series` in plan/tokens.json). */
export const seriesCount = 8;

/** The palette colour of the series at `index` (from 0). The palette repeats after its last colour. */
export const seriesColour = (index: number) => `var(--umbra-color-series-${(index % seriesCount) + 1})`;

/**
 * The marker of the series at `index` when none is given: `base` for the first round of the palette,
 * then a pattern per round, so a repeated colour still looks different.
 */
export const seriesMarker = (index: number, base: SeriesMarkerKind = 'dot'): SeriesMarkerKind =>
  index < seriesCount ? base : seriesPatterns[(Math.floor(index / seriesCount) - 1) % seriesPatterns.length]!;

const outline = (
  <rect
    x="1.75"
    y="1.75"
    width="10.5"
    height="10.5"
    rx="2"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  />
);
const drawings: Record<SeriesMarkerKind, React.ReactNode> = {
  dot: <circle cx="7" cy="7" r="5" fill="currentColor" />,
  square: <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" />,
  line: <path d="M1.5 7h11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  dashed: <path d="M1 7h12" stroke="currentColor" strokeWidth="3" strokeDasharray="5 2" />,
  stripes: (
    <>
      {outline}
      <path d="M2 7.5 7.5 2M2 12 12 2M6.5 12 12 6.5" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  dots: (
    <>
      {outline}
      <path
        d="M5 5h.01M9 5h.01M5 9h.01M9 9h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </>
  ),
};

export interface SeriesMarkerProps {
  kind?: SeriesMarkerKind | undefined;
  /** Any CSS colour. Defaults to the text colour. */
  color?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** Internal: draws one series marker. Decorative; the label beside it carries the name. */
export function SeriesMarker({ kind = 'dot', color, className, style }: SeriesMarkerProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      data-part="marker"
      data-kind={kind}
      className={cx(styles.marker, className)}
      style={{ color, ...style }}
    >
      {drawings[kind]}
    </svg>
  );
}
