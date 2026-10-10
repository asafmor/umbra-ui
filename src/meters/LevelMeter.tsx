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
import { Label as AriaLabel, Meter as AriaMeter } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { useHoverTip } from '../internal/TruncatedText';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './LevelMeter.module.css';
import {
  describe,
  outOfRange,
  tickFractions,
  tickShown,
  toFraction,
  zoneBoundaries,
  zoneFor,
  type MeterTone,
  type Zone,
} from './scale';

/** One step of a named scale. */
export interface LevelMeterLevel {
  id: string;
  label: string;
  /** Colour of the marker when it sits on this level. */
  tone?: MeterTone;
}

/** A position on the scale: a number, or the id of a level when `levels` is set (a number is then its index). */
export type LevelMeterValue = number | string;

interface MeterContext {
  ticks: { at: number; lit: boolean }[];
  boundaries: number[];
  value?: number;
  compare?: number;
  band?: [number, number];
  tone: MeterTone;
  valueText: string;
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
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface LevelMeterRootProps extends BlockProps {
  /** Where the marker sits. Leave it out to show only a `range`. */
  value?: LevelMeterValue;
  min?: number;
  max?: number;
  /** Number of ticks on a numeric scale. */
  steps?: number;
  /** A named scale: one tick per level, and the marker sits on a level. Replaces `min`, `max` and `steps`. */
  levels?: LevelMeterLevel[];
  /** Draws a band from the first position to the second, for an estimate or an allowed span. */
  range?: [LevelMeterValue, LevelMeterValue];
  /** A second, smaller marker to compare the value with. */
  compare?: LevelMeterValue;
  /** Names the comparison marker for assistive technology. */
  compareLabel?: string;
  /** Names the band for assistive technology. */
  rangeLabel?: string;
  /** Colours the marker by the zone it is in. Zone edges are drawn as taller ticks, and the zone's label is read out. */
  zones?: Zone[];
  /** Colour of the marker, when no zone or level sets it. */
  tone?: MeterTone;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'default' | 'large';
  /** Draws the box around the ticks. */
  boxed?: boolean;
  /** Text of a position on a numeric scale. A named scale uses the labels of its levels. */
  formatValue?: (value: number) => string;
  /** Shows skeletons in place of the ticks and the value. */
  loading?: boolean;
  /** `false` turns off the tooltip that shows the exact value on hover. */
  tooltip?: boolean;
  /** Names a meter that has no visible label. */
  'aria-label'?: string;
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
  zones,
  tone = 'default',
  orientation = 'horizontal',
  size = 'default',
  boxed = true,
  formatValue,
  loading = false,
  tooltip = true,
  className,
  style,
  ...rest
}: LevelMeterRootProps) {
  const ref = useRef<HTMLDivElement>(null);
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
  const position = (v: LevelMeterValue | undefined) => {
    if (typeof v !== 'string') return v === undefined || Number.isNaN(v) ? undefined : v;
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

  const zone = value !== undefined && zones && !levels ? zoneFor(value, zones) : undefined;
  const markerTone =
    (levels && value !== undefined ? levels[Math.round(value)]?.tone : undefined) ?? zone?.tone ?? tone;
  const valueFraction = fraction(value);
  const count = Math.max(0, Math.floor(levels?.length ?? steps));
  const stride = strides[level]!;
  const ticks = tickFractions(count)
    .map((at, i) => ({ at, lit: valueFraction !== undefined && at <= valueFraction + 1e-9, i }))
    .filter((tick) => tickShown(tick.i, count, stride));

  const shownValue = value === undefined ? '' : text(value);
  const valueText = zone?.label ? `${shownValue} · ${zone.label}` : shownValue;
  const spoken = describe(
    shownValue,
    zone?.label,
    low !== undefined && high !== undefined && `${rangeLabel}: ${text(low)} – ${text(high)}`,
    compare !== undefined && `${compareLabel}: ${text(compare)}`,
  );

  const shared = {
    ref,
    'data-umbra': 'level-meter',
    'data-orientation': orientation,
    'data-size': size,
    'data-boxed': boxed || undefined,
    'data-tone': markerTone,
    'data-shrink': level || undefined,
    'data-out-of-range': value === undefined ? undefined : outOfRange(value, min, max),
    className: cx(styles.root, className),
    style: { '--n': ticks.length, ...style } as CSSProperties,
  };
  const context: MeterContext = {
    ticks,
    boundaries: zones && !levels ? zoneBoundaries(zones, min, max) : [],
    value: valueFraction,
    compare: fraction(compare),
    band,
    tone: markerTone,
    valueText,
    level,
    loading,
  };
  const content = <Context.Provider value={context}>{children}</Context.Provider>;
  // The exact value, range and comparison, which the ticks only approximate.
  const tip = useHoverTip(ref, tooltip && !loading ? spoken : null);

  if (loading) {
    return (
      <div
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
        {...shared}
        // A meter that shows only a range still needs a value: the middle of the range.
        value={value ?? (low !== undefined && high !== undefined ? (low + high) / 2 : min)}
        minValue={min}
        maxValue={max > min ? max : min + 1}
        valueLabel={spoken}
        aria-label={rest['aria-label']}
      >
        {content}
      </AriaMeter>
      {tip}
    </>
  );
}

/** The name of the meter. Truncates once the ticks have thinned as far as they go. */
function Label({ children, className, style }: BlockProps) {
  const props = { 'data-part': 'label', className: cx(styles.label, className), style };
  return useMeter().loading ? (
    <span {...props}>{children}</span>
  ) : (
    <AriaLabel {...props}>{children}</AriaLabel>
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
  skeleton?: Part;
}

/** The ticks. `children` are drawn over them: `LevelMeter.Band` and `LevelMeter.Marker`. */
function Strip({ children, skeleton, className, style }: LevelMeterStripProps) {
  const meter = useMeter();
  if (meter.loading) {
    return renderPart(skeleton, {}, () => (
      <Skeleton shape="block" className={cx(styles.strip, styles.skeleton)} />
    ));
  }
  return (
    <div data-part="strip" className={cx(styles.strip, className)} style={style}>
      <div className={styles.plot}>
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
  kind?: 'value' | 'compare';
}

/** A marker on the strip. Renders nothing when the meter has no such position. */
function Marker({ kind = 'value', className, style }: LevelMeterMarkerProps) {
  const meter = useMeter();
  const fraction = meter[kind];
  if (fraction === undefined) return null;
  return (
    <i
      data-part={kind === 'value' ? 'marker' : 'compare'}
      data-tone={kind === 'value' ? meter.tone : undefined}
      className={className}
      style={at(fraction, style)}
    />
  );
}

/** The value as text. `children` replaces the formatted value. */
function Value({ children, className, style }: BlockProps) {
  const meter = useMeter();
  return (
    <span data-part="value" className={cx(styles.value, className)} style={style}>
      {meter.loading ? <Skeleton width="3ch" /> : (children ?? meter.valueText)}
    </span>
  );
}

export interface LevelMeterProps extends Omit<LevelMeterRootProps, 'children'> {
  /** The name of the meter, shown before it. */
  label?: ReactNode;
  /** Captions at the two ends of the scale. */
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  /** Replaces the formatted value. Setting it shows the value. */
  valueLabel?: ReactNode;
  /** Shows the value as text after the meter. */
  showValue?: boolean;
  /** Replace or hide named pieces. */
  parts?: {
    label?: Part<{ children: ReactNode }>;
    minLabel?: Part<{ children: ReactNode }>;
    maxLabel?: Part<{ children: ReactNode }>;
    strip?: Part<{ children: ReactNode }>;
    band?: Part;
    marker?: Part;
    compare?: Part;
    value?: Part<{ children: ReactNode }>;
    skeleton?: Part;
  };
}

/** A strip of ticks with a marker that shows where a value sits on a scale. */
export function LevelMeter({
  label,
  minLabel,
  maxLabel,
  valueLabel,
  showValue = valueLabel !== undefined,
  parts,
  ...root
}: LevelMeterProps) {
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
      {showValue && renderPart(parts?.value, { children: valueLabel }, (p) => <Value>{p.children}</Value>)}
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
