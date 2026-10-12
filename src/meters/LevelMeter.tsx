import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
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
import { MeterLabel, notOnCutLabel, useInMeterList } from './label';
import styles from './LevelMeter.module.css';
import { resolveThreshold, type ThresholdList } from '../utils/thresholds';
import {
  bandBoundaries,
  describe,
  outOfRange,
  tickFractions,
  tickShown,
  toFraction,
  type MeterTone,
} from './scale';
import { defined } from '../utils/defined';
import { valueOrNull } from '../utils/finite';
import { passThrough, rootRender, type RootAttributes } from '../utils/passThrough';

/** One step of a named scale. */
export interface LevelMeterLevel {
  id: string;
  label: string;
  /** Colour of the marker when it sits on this level. */
  tone?: MeterTone | undefined;
}

/** A position on the scale: a number, or the id of a level when `levels` is set (a number is then its index). */
export type LevelMeterValue = number | string;

interface MeterContext {
  ticks: { at: number; lit: boolean }[];
  boundaries: number[];
  value?: number | undefined;
  compare?: number | undefined;
  band?: [number, number] | undefined;
  tone: MeterTone;
  color?: string | undefined;
  valueText: ReactNode;
  /** How far the meter has shrunk: 1 hides the end labels, 2 and 3 thin the ticks. */
  level: number;
  loading: boolean;
}

const Context = createContext<MeterContext | null>(null);

function useMeter() {
  const meter = useContext(Context);
  if (!meter) throw new Error('LevelMeter blocks must be rendered inside <LevelMeter.Root>.');
  return meter;
}

interface BlockProps {
  children?: ReactNode | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export interface LevelMeterRootProps extends BlockProps, RootAttributes {
  /** Where the marker sits. Leave it out to show only a `range`. */
  value?: LevelMeterValue | null | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** Number of ticks on a numeric scale. */
  steps?: number | undefined;
  /** A named scale: one tick per level, and the marker sits on a level. Replaces `min`, `max` and `steps`. */
  levels?: LevelMeterLevel[] | undefined;
  /** Draws a band from the first position to the second, for an estimate or an allowed span. */
  range?: [LevelMeterValue, LevelMeterValue] | undefined;
  /** A second, smaller marker to compare the value with. */
  compare?: LevelMeterValue | undefined;
  /** Names the comparison marker for assistive technology. */
  compareLabel?: string | undefined;
  /** Names the band for assistive technology. */
  rangeLabel?: string | undefined;
  /**
   * Colours the marker by the band of the value: an ascending list of `{ from, tone?, color?, label? }`,
   * or plain numbers as boundaries on the value ramp. Where a band starts is drawn as a taller tick, and
   * the band's `label` joins the value text.
   */
  thresholds?: ThresholdList | undefined;
  /** For a scale where low is good: mirrors the colours of the bands. The labels stay. */
  lowerIsBetter?: boolean | undefined;
  /** Colour of the marker, when no band or level sets it. */
  tone?: MeterTone | undefined;
  orientation?: 'horizontal' | 'vertical' | undefined;
  size?: 'small' | 'default' | 'large' | undefined;
  /** Draws the box around the ticks. */
  boxed?: boolean | undefined;
  /** Text of a position on a numeric scale. A named scale uses the labels of its levels. */
  formatValue?: ((value: number) => string) | undefined;
  /** Shows skeletons in place of the ticks and the value. */
  loading?: boolean | undefined;
  /** Shown in place of the value text when there is no value, or the value names no level. */
  emptyLabel?: ReactNode | undefined;
  /** What assistive technology and the tooltip say when there is no value and no range. */
  noValueLabel?: string | undefined;
  /** `false` turns off the tooltip that shows the exact value on hover. */
  tooltip?: boolean | undefined;
  /** Names a meter that has no visible label. */
  'aria-label'?: string | undefined;
}

const strides = [1, 1, 2, 5];
const tooTall = (el: HTMLElement) => el.scrollHeight > el.clientHeight + 1;

function Root({
  children,
  value: valueProp,
  min: minProp = 0,
  max: maxProp = 100,
  steps = 10,
  levels,
  range,
  compare: compareProp,
  compareLabel = 'Comparison',
  rangeLabel = 'Range',
  thresholds,
  lowerIsBetter,
  tone = 'default',
  orientation: orientationProp = 'horizontal',
  size = 'default',
  boxed = true,
  formatValue,
  loading = false,
  emptyLabel = '—',
  noValueLabel = 'No value',
  tooltip = true,
  className,
  style,
  'aria-label': ariaLabel,
  ...rest
}: LevelMeterRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  // A row of a `MeterList` is horizontal: its strip is in the list's column of bars.
  const orientation = useInMeterList() ? 'horizontal' : orientationProp;
  const vertical = orientation === 'vertical';

  // The shrink level restarts when the element gets wider. A vertical meter restarts on its height.
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!vertical || !el) return;
    const observer = new ResizeObserver(([entry]) =>
      flushSync(() => setHeight(Math.round(entry!.contentRect.height))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [vertical]);
  const level = useShrinkLevel(ref, 3, vertical ? height : 0, vertical ? { overflowing: tooTall } : {});

  const min = levels ? 0 : minProp;
  const max = levels ? Math.max(1, levels.length - 1) : maxProp;
  /** A value as a number on the scale; `undefined` when it is missing or names no level. */
  const position = (v: LevelMeterValue | null | undefined) => {
    if (typeof v !== 'string') return valueOrNull(v, 'LevelMeter') ?? undefined;
    const index = levels?.findIndex((l) => l.id === v) ?? -1;
    return index < 0 ? undefined : index;
  };
  const text = (n: number) => {
    if (levels) return levels[Math.min(levels.length - 1, Math.max(0, Math.round(n)))]?.label ?? '';
    return formatValue ? formatValue(n) : String(n);
  };
  const fraction = (n: number | undefined) => (n === undefined ? undefined : toFraction(n, min, max));

  const value = position(valueProp);
  const compare = position(compareProp);
  const low = position(range?.[0]);
  const high = position(range?.[1]);
  const band: [number, number] | undefined =
    low !== undefined && high !== undefined
      ? [toFraction(Math.min(low, high), min, max), toFraction(Math.max(low, high), min, max)]
      : undefined;

  const zone = levels ? undefined : resolveThreshold(value, thresholds, { lowerIsBetter });
  const markerTone =
    (levels && value !== undefined ? levels[Math.round(value)]?.tone : undefined) ?? zone?.tone ?? tone;
  const valueFraction = fraction(value);
  const count = Math.max(0, Math.floor(levels?.length ?? steps));
  const stride = strides[level]!;
  const ticks = tickFractions(count)
    .map((at, i) => ({ at, lit: valueFraction !== undefined && at <= valueFraction + 1e-9, i }))
    .filter((tick) => tickShown(tick.i, count, stride));

  const shownValue = value === undefined ? '' : text(value);
  const valueText =
    value === undefined ? emptyLabel : zone?.label ? `${shownValue} · ${zone.label}` : shownValue;
  const hasRange = low !== undefined && high !== undefined;
  const spoken = describe(
    // No value and no range is not zero: the text says that the value is missing.
    value === undefined && !hasRange ? noValueLabel : shownValue,
    zone?.label,
    low !== undefined && high !== undefined && `${rangeLabel}: ${text(low)} – ${text(high)}`,
    compare !== undefined && `${compareLabel}: ${text(compare)}`,
  );

  const shared = {
    'data-umbra': 'level-meter',
    'data-orientation': orientation,
    'data-size': size,
    'data-boxed': boxed || undefined,
    'data-tone': zone?.color ? 'custom' : markerTone,
    'data-band': zone?.index,
    'data-shrink': level || undefined,
    'data-empty': (value === undefined && !hasRange) || undefined,
    'data-out-of-range': value === undefined ? undefined : outOfRange(value, min, max),
    className: cx(styles.root, className),
    style: { '--n': ticks.length, ...style } as CSSProperties,
  };
  const context: MeterContext = {
    ticks,
    boundaries: levels ? [] : bandBoundaries(thresholds, min, max),
    value: valueFraction,
    compare: fraction(compare),
    band,
    tone: markerTone,
    color: zone?.color,
    valueText,
    level,
    loading,
  };
  const content = <Context.Provider value={context}>{children}</Context.Provider>;
  // The exact value, range and comparison, which the ticks only approximate.
  const tip = useHoverTip(ref, tooltip && !loading ? spoken : null, notOnCutLabel);

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
        // A meter that shows only a range still needs a value: the middle of the range.
        value={value ?? (low !== undefined && high !== undefined ? (low + high) / 2 : min)}
        minValue={min}
        maxValue={max > min ? max : min + 1}
        valueLabel={spoken}
        {...defined({ 'aria-label': ariaLabel })}
      >
        {content}
      </AriaMeter>
      {tip}
    </>
  );
}

/** The name of the meter. Truncates once the ticks have thinned as far as they go. */
function Label({ children, className, style }: BlockProps) {
  return (
    <MeterLabel loading={useMeter().loading} className={cx(styles.label, className)} style={style}>
      {children}
    </MeterLabel>
  );
}

export interface LevelMeterEndLabelProps extends BlockProps {
  /** Which end of the scale it names. */
  end: 'min' | 'max';
}

/** A caption at one end of the scale. The first thing to hide when the meter shrinks. */
function EndLabel({ end, children, className, style }: LevelMeterEndLabelProps) {
  if (useMeter().level > 0) return null;
  return (
    <span data-part={`${end}Label`} className={cx(styles.endLabel, className)} style={style}>
      {children}
    </span>
  );
}

const at = (fraction: number, style?: CSSProperties) => ({ '--at': fraction, ...style }) as CSSProperties;

export interface LevelMeterStripProps extends BlockProps {
  /** Replaces the skeleton shown while loading. */
  skeleton?: Part | undefined;
}

/** The ticks. `children` are drawn over them: `LevelMeter.Band` and `LevelMeter.Marker`. */
function Strip({ children, skeleton, className, style }: LevelMeterStripProps) {
  const meter = useMeter();
  if (meter.loading) {
    return (
      <span data-part="skeleton" className={styles.skeletonPart}>
        {renderPart(skeleton, {}, () => (
          <Skeleton shape="block" className={cx(styles.strip, styles.skeleton)} />
        ))}
      </span>
    );
  }
  return (
    <div data-part="strip" className={cx(styles.strip, className)} style={style}>
      <div data-part="plot" className={styles.plot}>
        {meter.ticks.map((tick) => (
          <i key={tick.at} data-part="tick" data-lit={tick.lit || undefined} style={at(tick.at)} />
        ))}
        {meter.boundaries.map((edge) => (
          <i key={edge} data-part="boundary" style={at(edge)} />
        ))}
        {children}
      </div>
    </div>
  );
}

/** The band of a `range`. Renders nothing without one. */
function Band({ className, style }: Omit<BlockProps, 'children'>) {
  const { band } = useMeter();
  if (!band) return null;
  return (
    <i
      data-part="band"
      className={className}
      style={{ ...at(band[0]), '--span': band[1] - band[0], ...style } as CSSProperties}
    />
  );
}

export interface LevelMeterMarkerProps extends Omit<BlockProps, 'children'> {
  /** `value` is the main marker; `compare` is the smaller comparison marker. */
  kind?: 'value' | 'compare' | undefined;
}

/** A marker on the strip. Renders nothing when the meter has no such position. */
function Marker({ kind = 'value', className, style }: LevelMeterMarkerProps) {
  const meter = useMeter();
  const fraction = meter[kind];
  if (fraction === undefined) return null;
  return (
    <i
      data-part={kind === 'value' ? 'marker' : 'compare'}
      data-tone={kind !== 'value' ? undefined : meter.color ? 'custom' : meter.tone}
      className={className}
      style={at(
        fraction,
        kind === 'value' && meter.color ? ({ '--paint': meter.color, ...style } as CSSProperties) : style,
      )}
    />
  );
}

/** The value as text. `children` replaces the formatted value. */
export type LevelMeterValueProps = BlockProps & ChangeHighlightProps;

function Value({ children, className, style, ...change }: LevelMeterValueProps) {
  const meter = useMeter();
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      {!meter.loading && <ChangeHighlight {...change}>{children ?? meter.valueText}</ChangeHighlight>}
      {meter.loading ? <Skeleton width="3ch" /> : (children ?? meter.valueText)}
    </span>
  );
}

export interface LevelMeterProps
  extends Omit<LevelMeterRootProps, 'children'>, Omit<ChangeHighlightProps, 'changeValue'> {
  /** The name of the meter, shown before it. */
  label?: ReactNode | undefined;
  /** Captions at the two ends of the scale. */
  minLabel?: ReactNode | undefined;
  maxLabel?: ReactNode | undefined;
  /** Replaces the formatted value. Setting it shows the value. */
  valueLabel?: ReactNode | undefined;
  /** Shows the value as text after the meter. */
  showValue?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        label?: Part<{ children: ReactNode }> | undefined;
        minLabel?: Part<{ children: ReactNode }> | undefined;
        maxLabel?: Part<{ children: ReactNode }> | undefined;
        strip?: Part<{ children: ReactNode }> | undefined;
        band?: Part | undefined;
        marker?: Part | undefined;
        compare?: Part | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A strip of ticks with a marker that shows where a value sits on a scale. */
export function LevelMeter({
  label,
  minLabel,
  maxLabel,
  valueLabel,
  showValue = valueLabel !== undefined,
  parts,
  ...rest
}: LevelMeterProps) {
  const [change, root] = splitChange(rest);
  const has = (node: ReactNode) => node !== undefined && node !== null;
  const over = (
    <>
      {renderPart(parts?.band, {}, () => (
        <Band />
      ))}
      {renderPart(parts?.compare, {}, () => (
        <Marker kind="compare" />
      ))}
      {renderPart(parts?.marker, {}, () => (
        <Marker />
      ))}
    </>
  );
  const end = (which: 'min' | 'max', node: ReactNode) =>
    has(node) &&
    renderPart(parts?.[`${which}Label`], { children: node }, (p) => (
      <EndLabel end={which}>{p.children}</EndLabel>
    ));
  // A replaced label no longer names the meter, so its text does.
  const name =
    root['aria-label'] ?? (parts?.label !== undefined && typeof label === 'string' ? label : undefined);
  return (
    <Root {...root} aria-label={name}>
      {has(label) && renderPart(parts?.label, { children: label }, (p) => <Label>{p.children}</Label>)}
      {end('min', minLabel)}
      {renderPart(parts?.strip, { children: over }, (p) => (
        <Strip skeleton={parts?.skeleton}>{p.children}</Strip>
      ))}
      {end('max', maxLabel)}
      {showValue &&
        renderPart(parts?.value, { children: valueLabel }, (p) => (
          <Value {...change} changeValue={typeof root.value === 'number' ? root.value : undefined}>
            {p.children}
          </Value>
        ))}
    </Root>
  );
}

LevelMeter.Root = Root;
LevelMeter.Label = Label;
LevelMeter.EndLabel = EndLabel;
LevelMeter.Strip = Strip;
LevelMeter.Band = Band;
LevelMeter.Marker = Marker;
LevelMeter.Value = Value;
