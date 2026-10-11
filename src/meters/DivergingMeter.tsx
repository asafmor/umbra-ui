import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { Meter as AriaMeter } from 'react-aria-components';
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
import { valueOrNull } from '../utils/finite';
import { resolveThreshold, type ThresholdList } from '../utils/thresholds';
import { MeterLabel, useInMeterList } from './label';
import styles from './DivergingMeter.module.css';
import { tooNarrow } from './fit';
import { describe, outOfRange, toFraction, type MeterTone } from './scale';
import tones from './tone.module.css';
import { passThrough, rootRender, type RootAttributes } from '../utils/passThrough';

/** What `formatValue` receives besides the value. */
export interface DivergingMeterScale {
  min: number;
  max: number;
  origin: number;
}

/** Which side of the origin the value is on. */
export type DivergingMeterDirection = 'positive' | 'negative' | 'neutral';

interface MeterContext {
  /** Where the fill starts and how long it is, as fractions of the track. */
  start: number;
  length: number;
  /** Where the tick is, or `undefined` without one. */
  origin?: number | undefined;
  direction: DivergingMeterDirection;
  tone: MeterTone;
  color?: string | undefined;
  valueText: ReactNode;
  hideValue: boolean;
  loading: boolean;
}

const Context = createContext<MeterContext | null>(null);

function useMeter() {
  const meter = useContext(Context);
  if (!meter) throw new Error('DivergingMeter blocks must be rendered inside <DivergingMeter.Root>.');
  return meter;
}

interface BlockProps {
  children?: ReactNode | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export interface DivergingMeterRootProps extends BlockProps, RootAttributes {
  /** The current value. `null` or nothing means there is no value: nothing is filled, and the text says so. */
  value?: number | null | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** The value the fill grows from. Defaults to 0, or to the middle of a scale that does not hold 0. */
  origin?: number | undefined;
  /** Colour of a fill above the origin. A matching threshold wins over it. */
  tone?: MeterTone | undefined;
  /** Colour of a fill below the origin, which is also hatched. */
  negativeTone?: MeterTone | undefined;
  /**
   * Colours the fill by the band of the value: an ascending list of `{ from, tone?, color?, label? }`,
   * or plain numbers as boundaries on the value ramp. The band's `label` joins the value text.
   */
  thresholds?: ThresholdList | undefined;
  /** For a scale where low is good: swaps the colours of the two sides, and mirrors those of the bands. The hatch stays below the origin. */
  lowerIsBetter?: boolean | undefined;
  size?: 'thin' | 'default' | 'thick' | undefined;
  /** `inline` puts the label, the bar and the value on one line, for table cells and rows. */
  layout?: 'block' | 'inline' | undefined;
  /** `false` hides the tick at the origin. */
  originTick?: boolean | undefined;
  /** Text of a value. The default is the distance from the origin, with its sign. */
  formatValue?: ((value: number, scale: DivergingMeterScale) => string) | undefined;
  /** Shows skeletons in place of the bar and the value. */
  loading?: boolean | undefined;
  /** Shown in place of the value text when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** What assistive technology and the tooltip say when there is no value. */
  noValueLabel?: string | undefined;
  /** `false` turns off the tooltip that shows the exact value on hover. */
  tooltip?: boolean | undefined;
  /** Names a meter that has no visible label. */
  'aria-label'?: string | undefined;
}

function Root({
  children,
  value: valueProp,
  min = -100,
  max = 100,
  origin: originProp,
  tone = 'success',
  negativeTone = 'danger',
  thresholds,
  lowerIsBetter = false,
  size = 'default',
  layout: layoutProp = 'block',
  originTick = true,
  formatValue,
  loading = false,
  emptyLabel = '—',
  noValueLabel = 'No value',
  tooltip = true,
  className,
  style,
  'aria-label': ariaLabel,
  ...rest
}: DivergingMeterRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  // In a `MeterList` the list sets the columns and hides the values of all its rows together.
  const inList = useInMeterList();
  const layout = inList ? 'inline' : layoutProp;
  const hideValue = useShrinkLevel(ref, inList ? 0 : 1, undefined, { overflowing: tooNarrow }) === 1;

  const range = max > min;
  const origin = originProp ?? (min <= 0 && max >= 0 ? 0 : (min + max) / 2);
  const given = valueOrNull(valueProp, 'DivergingMeter');
  const missing = given === null;
  const value = given ?? origin;
  const direction: DivergingMeterDirection =
    value > origin ? 'positive' : value < origin ? 'negative' : 'neutral';

  const band = missing ? undefined : resolveThreshold(value, thresholds, { lowerIsBetter });
  const side = (direction === 'negative') !== lowerIsBetter ? negativeTone : tone;
  // Without the noise of binary fractions: 0.3 − 0.1 reads 0.2, not 0.19999999999999998.
  // The sign is the cue of the direction in the text; the minus is the real one, not a hyphen.
  const delta = value - origin;
  const formatted = formatValue
    ? formatValue(value, { min, max, origin })
    : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${+Math.abs(delta).toPrecision(12)}`;
  const valueText = missing ? emptyLabel : band?.label ? `${formatted} · ${band.label}` : formatted;
  const spoken = describe(missing ? noValueLabel : formatted, band?.label);

  const [from, to] = [toFraction(origin, min, max), toFraction(value, min, max)];
  const shared = {
    'data-umbra': 'diverging-meter',
    'data-size': size,
    'data-layout': layout,
    'data-direction': missing ? undefined : direction,
    'data-tone': band?.color ? 'custom' : (band?.tone ?? side),
    'data-band': band?.index,
    'data-empty': missing || undefined,
    'data-out-of-range': missing || !range ? undefined : outOfRange(value, min, max),
    'data-value-hidden': hideValue || undefined,
    className: cx(styles.root, className),
    style,
  };
  const context: MeterContext = {
    start: Math.min(from, to),
    length: Math.abs(to - from),
    origin: originTick ? from : undefined,
    direction,
    tone: band?.tone ?? side,
    color: band?.color,
    valueText,
    hideValue,
    loading,
  };
  const content = <Context.Provider value={context}>{children}</Context.Provider>;
  // The exact value, for a bar that is too small to show it or shows none.
  const tip = useHoverTip(ref, tooltip && !loading ? spoken : null);

  if (loading) {
    return (
      <div
        ref={ref}
        {...passThrough(rest)}
        {...shared}
        data-loading
        aria-busy="true"
        role={ariaLabel ? 'group' : undefined}
        aria-label={ariaLabel}
      >
        {content}
      </div>
    );
  }
  return (
    <>
      <AriaMeter
        ref={ref}
        {...rootRender('div', rest)}
        {...defined(shared)}
        value={value}
        minValue={min}
        maxValue={range ? max : min + 1}
        valueLabel={spoken}
        {...defined({ 'aria-label': ariaLabel })}
      >
        {content}
      </AriaMeter>
      {tip}
    </>
  );
}

/** The name of the meter. Truncates when the meter is narrow. */
function Label({ children, className, style }: BlockProps) {
  return (
    <MeterLabel loading={useMeter().loading} className={cx(styles.label, className)} style={style}>
      {children}
    </MeterLabel>
  );
}

export type DivergingMeterValueProps = BlockProps & ChangeHighlightProps;

/** The value as text. Hides first when the meter is narrow. `children` replaces the formatted value. */
function Value({ children, className, style, ...change }: DivergingMeterValueProps) {
  const meter = useMeter();
  if (meter.hideValue) return null;
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      {!meter.loading && <ChangeHighlight {...change}>{children ?? meter.valueText}</ChangeHighlight>}
      {meter.loading ? <Skeleton width="3ch" /> : (children ?? meter.valueText)}
    </span>
  );
}

export interface DivergingMeterFillProps extends Omit<BlockProps, 'children'> {
  /** Overrides the colour the meter gives the fill. */
  tone?: MeterTone | undefined;
  /** Any CSS colour. Wins over `tone`. */
  color?: string | undefined;
}

/** The coloured chunk between the origin and the value. Renders nothing for a value at the origin. */
function Fill({ tone, color, className, style }: DivergingMeterFillProps) {
  const meter = useMeter();
  if (!meter.length || meter.loading) return null;
  const paint = color ?? (tone ? undefined : meter.color);
  return (
    <div
      data-part="fill"
      data-direction={meter.direction}
      data-tone={paint ? undefined : (tone ?? meter.tone)}
      className={cx(styles.fill, tones.tone, className)}
      style={
        {
          insetInlineStart: `${meter.start * 100}%`,
          inlineSize: `${meter.length * 100}%`,
          ...(paint && { '--paint': paint }),
          ...style,
        } as CSSProperties
      }
    />
  );
}

/** The tick at the origin. Renders nothing with `originTick={false}`. */
function Origin({ className, style }: Omit<BlockProps, 'children'>) {
  const { origin, loading } = useMeter();
  if (origin === undefined || loading) return null;
  return (
    <div
      data-part="origin"
      aria-hidden="true"
      className={cx(styles.origin, className)}
      style={{ insetInlineStart: `${origin * 100}%`, ...style }}
    />
  );
}

export interface DivergingMeterTrackProps extends BlockProps {
  /** Replaces the skeleton shown while loading. */
  skeleton?: Part | undefined;
}

/** The bar. `children` are drawn on it: `DivergingMeter.Fill` and `DivergingMeter.Origin`. */
function Track({ children, skeleton, className, style }: DivergingMeterTrackProps) {
  const meter = useMeter();
  return (
    <div data-part="track" className={cx(styles.track, className)} style={style}>
      {meter.loading ? (
        <span data-part="skeleton" className={styles.skeletonPart}>
          {renderPart(skeleton, {}, () => (
            <Skeleton shape="block" className={styles.skeleton} />
          ))}
        </span>
      ) : (
        <>
          <div data-part="rail" className={styles.rail} />
          {children}
        </>
      )}
    </div>
  );
}

export interface DivergingMeterProps
  extends Omit<DivergingMeterRootProps, 'children'>, Omit<ChangeHighlightProps, 'changeValue'> {
  /** The name of the meter, shown above or beside it. */
  label?: ReactNode | undefined;
  /** Replaces the formatted value. Setting it shows the value. */
  valueLabel?: ReactNode | undefined;
  /** Shows the value as text. */
  showValue?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        label?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        track?: Part<{ children: ReactNode }> | undefined;
        fill?: Part<DivergingMeterFillProps> | undefined;
        origin?: Part | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A bar that fills to one side of an origin or the other: the direction and the size of a change or an effect. */
export function DivergingMeter({
  label,
  valueLabel,
  showValue = valueLabel !== undefined,
  parts,
  ...rest
}: DivergingMeterProps) {
  const [change, root] = splitChange(rest);
  // A replaced label no longer names the meter, so its text does.
  const name =
    root['aria-label'] ?? (parts?.label !== undefined && typeof label === 'string' ? label : undefined);
  const over = (
    <>
      {renderPart(parts?.fill, {}, (p) => (
        <Fill {...p} />
      ))}
      {renderPart(parts?.origin, {}, () => (
        <Origin />
      ))}
    </>
  );
  return (
    <Root {...root} aria-label={name}>
      {label !== undefined &&
        label !== null &&
        renderPart(parts?.label, { children: label }, (p) => <Label>{p.children}</Label>)}
      {showValue &&
        renderPart(parts?.value, { children: valueLabel }, (p) => (
          <Value {...change} changeValue={typeof root.value === 'number' ? root.value : undefined}>
            {p.children}
          </Value>
        ))}
      {renderPart(parts?.track, { children: over }, (p) => (
        <Track skeleton={parts?.skeleton}>{p.children}</Track>
      ))}
    </Root>
  );
}

DivergingMeter.Root = Root;
DivergingMeter.Label = Label;
DivergingMeter.Value = Value;
DivergingMeter.Track = Track;
DivergingMeter.Fill = Fill;
DivergingMeter.Origin = Origin;
