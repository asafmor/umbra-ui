import { createContext, useContext, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { Label as AriaLabel, Meter as AriaMeter } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { useHoverTip } from '../internal/TruncatedText';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { cx, renderPart, type Part } from '../utils/parts';
import { defined } from '../utils/defined';
import { resolveThreshold, type ThresholdList } from '../utils/thresholds';
import { tooNarrow } from './fit';
import styles from './PieIndicator.module.css';
import { describe, outOfRange, thirdsThresholds, toFraction, type MeterTone } from './scale';
import tones from './tone.module.css';

/** What `formatValue` receives besides the value. `percent` is not clamped. */
export interface PieIndicatorScale {
  min: number;
  max: number;
  percent: number;
}

interface PieContext {
  /** The share of the disc that is filled, from 0 to 1, already snapped to whole wedges. */
  fraction: number;
  /** Number of wedges; 0 for a continuous disc. */
  segments: number;
  tone: MeterTone;
  color?: string | undefined;
  valueText: ReactNode;
  hideValue: boolean;
  loading: boolean;
}

const Context = createContext<PieContext | null>(null);

function usePie() {
  const pie = useContext(Context);
  if (!pie) throw new Error('PieIndicator blocks must be rendered inside <PieIndicator.Root>.');
  return pie;
}

interface BlockProps {
  children?: ReactNode | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export interface PieIndicatorRootProps extends BlockProps {
  /** The current value. `null` or nothing means there is no value: the disc is empty, and says so. */
  value?: number | null | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** Colour of the filled wedges. A matching threshold wins over it. */
  tone?: MeterTone | undefined;
  /**
   * Colours the fill by the band of the value: an ascending list of `{ from, tone?, color?, label? }`.
   * `true` is thirds of the scale (danger, warning, success); plain numbers are boundaries on the value
   * ramp. The filled amount shows the level without the colour, and the band's `label` joins the value text.
   */
  thresholds?: boolean | ThresholdList | undefined;
  /** For a scale where low is good: mirrors the colours of the bands. The labels stay. */
  lowerIsBetter?: boolean | undefined;
  size?: 'small' | 'default' | 'large' | undefined;
  /** `inline` puts the disc, the label and the value on one line; `block` puts the disc above them. */
  layout?: 'inline' | 'block' | undefined;
  /** Number of wedges of the segmented disc. */
  segments?: number | undefined;
  /** `segmented` fills whole wedges; `continuous` fills one sector to the exact value. */
  variant?: 'segmented' | 'continuous' | undefined;
  /** Text of a value. The default is a rounded percentage. */
  formatValue?: ((value: number, scale: PieIndicatorScale) => string) | undefined;
  /** Shows skeletons in place of the disc and the value. */
  loading?: boolean | undefined;
  /** Shown in place of the value text when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** What assistive technology and the tooltip say when there is no value. */
  noValueLabel?: string | undefined;
  /** `false` turns off the tooltip that shows the exact value on hover. */
  tooltip?: boolean | undefined;
  /** Names an indicator that has no visible label. */
  'aria-label'?: string | undefined;
}

const narrow = (root: HTMLElement) => tooNarrow(root, 'disc');

function Root({
  children,
  value: valueProp,
  min = 0,
  max = 100,
  tone = 'default',
  thresholds,
  lowerIsBetter,
  size = 'default',
  layout = 'inline',
  segments = 8,
  variant = 'segmented',
  formatValue,
  loading = false,
  emptyLabel = '—',
  noValueLabel = 'No value',
  tooltip = true,
  className,
  style,
  ...rest
}: PieIndicatorRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hideValue = useShrinkLevel(ref, 1, undefined, { overflowing: narrow }) === 1;

  const range = max > min ? max - min : 0;
  // No value is not zero: the disc is drawn empty with a dashed edge, and the text says so.
  const missing = valueProp === undefined || valueProp === null || Number.isNaN(valueProp);
  const value = missing ? min : valueProp;
  const percent = range ? ((value - min) / range) * 100 : 0;
  const formatted = formatValue ? formatValue(value, { min, max, percent }) : `${Math.round(percent)}%`;

  const band =
    thresholds && !missing
      ? resolveThreshold(value, thresholds === true ? thirdsThresholds(min, max) : thresholds, {
          lowerIsBetter,
        })
      : undefined;
  const count = variant === 'continuous' ? 0 : Math.max(1, Math.floor(segments));
  const exact = missing ? 0 : toFraction(value, min, max);
  // A value above the minimum lights at least one wedge, so "a little" never looks like "nothing".
  const fraction = count && exact > 0 ? Math.max(1, Math.round(exact * count)) / count : exact;

  const valueText = missing ? emptyLabel : band?.label ? `${formatted} · ${band.label}` : formatted;
  const spoken = describe(missing ? noValueLabel : formatted, band?.label);

  const shared = {
    'data-umbra': 'pie-indicator',
    'data-size': size,
    'data-layout': layout,
    'data-variant': variant,
    'data-tone': band?.color ? 'custom' : (band?.tone ?? tone),
    'data-band': band?.index,
    'data-empty': missing || undefined,
    'data-out-of-range': missing || !range ? undefined : outOfRange(value, min, max),
    'data-value-hidden': hideValue || undefined,
    className: cx(styles.root, className),
    style,
  };
  const context: PieContext = {
    fraction,
    segments: count,
    tone: band?.tone ?? tone,
    color: band?.color,
    valueText,
    hideValue,
    loading,
  };
  const content = <Context.Provider value={context}>{children}</Context.Provider>;
  // The exact value, which a few wedges only approximate.
  const tip = useHoverTip(ref, tooltip && !loading ? spoken : null);

  if (loading) {
    return (
      <div
        ref={ref}
        {...shared}
        data-loading
        aria-busy="true"
        role={rest['aria-label'] ? 'group' : undefined}
        aria-label={rest['aria-label']}
      >
        {content}
      </div>
    );
  }
  return (
    <>
      <AriaMeter
        ref={ref}
        {...defined(shared)}
        value={value}
        minValue={min}
        maxValue={range ? max : min + 1}
        valueLabel={spoken}
        {...defined({ 'aria-label': rest['aria-label'] })}
      >
        {content}
      </AriaMeter>
      {tip}
    </>
  );
}

/** The path of a sector that starts at 12 o'clock and runs clockwise over `fraction` of the circle. */
const sector = (fraction: number) => {
  const a = 2 * Math.PI * fraction;
  return `M0 0L0 -1A1 1 0 ${fraction > 0.5 ? 1 : 0} 1 ${Math.sin(a).toFixed(4)} ${(-Math.cos(a)).toFixed(4)}Z`;
};

export interface PieIndicatorDiscProps extends Omit<BlockProps, 'children'> {
  /** Replaces the skeleton shown while loading. */
  skeleton?: Part | undefined;
}

/** The disc: a track, the filled sector, and the gaps that cut it into wedges. Decorative; the root carries the value. */
function Disc({ skeleton, className, style }: PieIndicatorDiscProps) {
  const pie = usePie();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (pie.loading) {
    return (
      <span data-part="skeleton" className={styles.skeletonPart}>
        {renderPart(skeleton, {}, () => (
          <Skeleton shape="circle" className={styles.skeleton} />
        ))}
      </span>
    );
  }
  const { fraction, segments } = pie;
  return (
    <svg
      data-part="disc"
      aria-hidden="true"
      viewBox="-1.1 -1.1 2.2 2.2"
      className={cx(styles.disc, className)}
      style={style}
    >
      {segments > 1 && (
        <mask id={id} maskUnits="userSpaceOnUse" x="-1.1" y="-1.1" width="2.2" height="2.2">
          <rect x="-1.1" y="-1.1" width="2.2" height="2.2" fill="#fff" />
          {Array.from({ length: segments }, (_, i) => (
            <line
              key={i}
              className={styles.gap}
              y2="-1.2"
              stroke="#000"
              transform={`rotate(${(360 * i) / segments})`}
            />
          ))}
        </mask>
      )}
      <g mask={segments > 1 ? `url(#${id})` : undefined}>
        <circle data-part="track" r="1" className={styles.track} />
        {fraction > 0 && (
          <g
            data-part="fill"
            data-tone={pie.color ? undefined : pie.tone}
            className={cx(styles.fill, tones.tone)}
            style={pie.color ? ({ '--paint': pie.color } as CSSProperties) : undefined}
          >
            {fraction >= 1 ? <circle r="1" /> : <path d={sector(fraction)} />}
          </g>
        )}
      </g>
    </svg>
  );
}

/** The name of the indicator. Truncates when the row is narrow. */
function Label({ children, className, style }: BlockProps) {
  const props = { 'data-part': 'label', className: cx(styles.label, className), style };
  // While loading the root is not a meter, so there is nothing to label.
  return usePie().loading ? <span {...props}>{children}</span> : <AriaLabel {...props}>{children}</AriaLabel>;
}

export type PieIndicatorValueProps = BlockProps & ChangeHighlightProps;

/** The value as text. Hides first when the row is narrow. `children` replaces the formatted value. */
function Value({ children, className, style, ...change }: PieIndicatorValueProps) {
  const pie = usePie();
  if (pie.hideValue) return null;
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      {!pie.loading && <ChangeHighlight {...change}>{children ?? pie.valueText}</ChangeHighlight>}
      {pie.loading ? <Skeleton width="3ch" /> : (children ?? pie.valueText)}
    </span>
  );
}

export interface PieIndicatorProps
  extends Omit<PieIndicatorRootProps, 'children'>, Omit<ChangeHighlightProps, 'changeValue'> {
  /** The name of the indicator, shown after the disc. */
  label?: ReactNode | undefined;
  /** Replaces the formatted value. Setting it shows the value. */
  valueLabel?: ReactNode | undefined;
  /** Shows the value as text. */
  showValue?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        disc?: Part | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A small disc of wedges that fills with a value: a level gauge for table cells, rows and lines of text. */
export function PieIndicator({
  label,
  valueLabel,
  showValue = valueLabel !== undefined,
  parts,
  ...rest
}: PieIndicatorProps) {
  const [change, root] = splitChange(rest);
  // A replaced label no longer names the indicator, so its text does.
  const name =
    root['aria-label'] ?? (parts?.label !== undefined && typeof label === 'string' ? label : undefined);
  return (
    <Root {...root} aria-label={name}>
      {renderPart(parts?.disc, {}, () => (
        <Disc skeleton={parts?.skeleton} />
      ))}
      {label !== undefined &&
        label !== null &&
        renderPart(parts?.label, { children: label }, (p) => <Label>{p.children}</Label>)}
      {showValue &&
        renderPart(parts?.value, { children: valueLabel }, (p) => (
          <Value {...change} changeValue={typeof root.value === 'number' ? root.value : undefined}>
            {p.children}
          </Value>
        ))}
    </Root>
  );
}

PieIndicator.Root = Root;
PieIndicator.Disc = Disc;
PieIndicator.Label = Label;
PieIndicator.Value = Value;
