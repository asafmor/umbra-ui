import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  Label as AriaLabel,
  Meter as AriaMeter,
  ProgressBar as AriaProgressBar,
} from 'react-aria-components';
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
import styles from './ProgressBar.module.css';
import {
  defaultThresholds,
  describe,
  outOfRange,
  segmentBounds,
  thresholdFor,
  toFraction,
  type MeterPattern,
  type MeterTone,
  type Threshold,
} from './scale';
import { defined } from '../utils/defined';

/** One coloured part of a stacked bar. */
export interface ProgressBarStackItem {
  id: string;
  /** Read by assistive technology with the part's value. */
  label: string;
  /** The part's amount, in the units of the scale. */
  value: number;
  tone?: MeterTone | undefined;
  /** Any CSS colour. Wins over `tone`. */
  color?: string | undefined;
}

/** What `formatValue` receives besides the value. `percent` is not clamped. */
export interface ProgressBarScale {
  min: number;
  max: number;
  percent: number;
}

interface Fills {
  from: number;
  to: number;
  fills: ProgressBarFillProps[];
}

interface BarContext {
  cells: Fills[];
  valueText: ReactNode;
  targetFraction?: number | undefined;
  hideValue: boolean;
  loading: boolean;
}

const Context = createContext<BarContext | null>(null);

function useBar() {
  const bar = useContext(Context);
  if (!bar) throw new Error('ProgressBar blocks must be rendered inside <ProgressBar.Root>.');
  return bar;
}

interface BlockProps {
  children?: ReactNode | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export interface ProgressBarRootProps extends BlockProps {
  /** The current value. A stacked bar defaults to the sum of its parts. `null` or nothing means there is no value: the bar is empty, and says so. */
  value?: number | null | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** `progress` for a task that advances (`role="progressbar"`), `meter` for a measured level (`role="meter"`). */
  kind?: 'progress' | 'meter' | undefined;
  /** Progress of unknown length. Moves, or shows a static striped fill when motion is reduced. */
  indeterminate?: boolean | undefined;
  /** Colour of the fill. A matching threshold wins over it. */
  tone?: MeterTone | undefined;
  /** Colours the fill by its level. `true` is thirds of the scale: danger, warning, success. Each band also has a pattern. */
  thresholds?: boolean | Threshold[] | undefined;
  /** Reverses the tones of the thresholds, for a scale where low is good. */
  invert?: boolean | undefined;
  size?: 'thin' | 'default' | 'thick' | undefined;
  /** `inline` puts the label, the bar and the value on one line, for table cells and rows. */
  layout?: 'block' | 'inline' | undefined;
  /** Splits the bar: a number of equal segments, or the values where a segment ends. */
  segments?: number | number[] | undefined;
  /** Several coloured parts, one after another. Replaces the single fill. */
  stack?: ProgressBarStackItem[] | undefined;
  /** Draws a tick at a goal value. */
  target?: number | undefined;
  /** Names the target for assistive technology. */
  targetLabel?: string | undefined;
  /** Text of a value. The default is a rounded percentage. */
  formatValue?: ((value: number, scale: ProgressBarScale) => string) | undefined;
  /** Shows skeletons in place of the bar and the value. */
  loading?: boolean | undefined;
  /** Shown in place of the value text when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** What assistive technology and the tooltip say when there is no value. */
  noValueLabel?: string | undefined;
  /** `false` turns off the tooltip that shows the exact value on hover. */
  tooltip?: boolean | undefined;
  /** Names a bar that has no visible label. */
  'aria-label'?: string | undefined;
}

/** True when the label, the value and (on one line) the shortest bar do not fit side by side. */
function tooNarrow(root: HTMLElement) {
  const part = (name: string) => root.querySelector<HTMLElement>(`:scope > [data-part="${name}"]`);
  const value = part('value');
  if (!value) return false;
  const gap = parseFloat(getComputedStyle(root).columnGap) || 0;
  const label = part('label');
  const track = root.dataset.layout === 'inline' ? part('track') : null;
  const needed =
    value.offsetWidth +
    (label ? label.scrollWidth + gap : 0) +
    (track ? (parseFloat(getComputedStyle(track).minWidth) || 0) + gap : 0);
  return needed > root.clientWidth + 1;
}

function Root({
  children,
  value: valueProp,
  min = 0,
  max = 100,
  kind = 'progress',
  indeterminate = false,
  tone = 'default',
  thresholds,
  invert,
  size = 'default',
  layout = 'block',
  segments,
  stack,
  target,
  targetLabel = 'Target',
  formatValue,
  loading = false,
  emptyLabel = '—',
  noValueLabel = 'No value',
  tooltip = true,
  className,
  style,
  ...rest
}: ProgressBarRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hideValue = useShrinkLevel(ref, 1, undefined, { overflowing: tooNarrow }) === 1;

  const range = max > min ? max - min : 0;
  // No value is not zero: the bar is drawn empty and the text says that the value is missing.
  const missing =
    !stack && !indeterminate && (valueProp === undefined || valueProp === null || Number.isNaN(valueProp));
  const value = valueProp ?? stack?.reduce((sum, item) => sum + item.value, 0) ?? min;
  const percentOf = (amount: number) => (range ? (amount / range) * 100 : 0);
  const format = (v: number, percent = percentOf(v - min)) =>
    formatValue ? formatValue(v, { min, max, percent }) : `${Math.round(percent)}%`;

  const band =
    thresholds && !stack && !missing
      ? thresholdFor(value, thresholds === true ? defaultThresholds(min, max) : thresholds, invert)
      : undefined;
  const fillTone = band?.tone ?? tone;

  let cells: Fills[];
  if (stack) {
    let sum = 0;
    const fills = stack.map((item, i) => {
      const start = Math.min(1, sum);
      sum += range ? Math.max(0, item.value) / range : 0;
      return {
        id: item.id,
        fraction: Math.min(1, sum) - start,
        tone: item.tone ?? stackTones[i % stackTones.length]!,
        color: item.color,
        pattern: stackPatterns[i % stackPatterns.length]!,
      };
    });
    cells = [{ from: min, to: max, fills }];
  } else {
    cells = segmentBounds(segments, min, max).map((cell) => ({
      ...cell,
      fills: [
        {
          fraction: indeterminate ? 1 : toFraction(value, cell.from, cell.to),
          tone: fillTone,
          pattern: band?.pattern ?? 'none',
          indeterminate,
        },
      ],
    }));
  }

  const formatted = format(value);
  const valueText = missing ? emptyLabel : band?.label ? `${formatted} · ${band.label}` : formatted;
  const spoken = describe(
    missing ? noValueLabel : formatted,
    band?.label,
    ...(stack ?? []).map((item) => `${item.label} ${format(item.value, percentOf(item.value))}`),
    target !== undefined && `${targetLabel}: ${format(target)}`,
  );

  const shared = {
    'data-umbra': 'progress-bar',
    'data-kind': kind,
    'data-size': size,
    'data-layout': layout,
    'data-variant': stack ? 'stacked' : cells.length > 1 ? 'segmented' : 'plain',
    'data-tone': stack ? undefined : fillTone,
    'data-indeterminate': indeterminate || undefined,
    'data-empty': missing || undefined,
    'data-out-of-range': indeterminate || missing || !range ? undefined : outOfRange(value, min, max),
    'data-value-hidden': hideValue || undefined,
    className: cx(styles.root, className),
    style,
  };
  const context: BarContext = {
    cells,
    valueText,
    targetFraction: target === undefined ? undefined : toFraction(target, min, max),
    hideValue,
    loading,
  };
  const content = <Context.Provider value={context}>{children}</Context.Provider>;
  // The exact value, for a bar that is too small to show it or shows none.
  const tip = useHoverTip(ref, tooltip && !loading && !indeterminate ? spoken : null);

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
  const scale = { minValue: min, maxValue: range ? max : min + 1, 'aria-label': rest['aria-label'] };
  return (
    <>
      {kind === 'meter' ? (
        <AriaMeter ref={ref} {...defined(shared)} {...defined(scale)} value={value} valueLabel={spoken}>
          {content}
        </AriaMeter>
      ) : (
        <AriaProgressBar
          ref={ref}
          {...defined(shared)}
          {...defined(scale)}
          value={value}
          valueLabel={indeterminate ? undefined : spoken}
          isIndeterminate={indeterminate}
        >
          {content}
        </AriaProgressBar>
      )}
      {tip}
    </>
  );
}

// A stacked bar tells its parts apart by colour and by pattern.
const stackTones: MeterTone[] = ['default', 'info', 'success', 'warning', 'neutral'];
const stackPatterns: MeterPattern[] = ['none', 'diagonal', 'vertical', 'reverse'];

/** The name of the bar. Truncates when the bar is narrow. */
function Label({ children, className, style }: BlockProps) {
  const props = { 'data-part': 'label', className: cx(styles.label, className), style };
  // While loading the root is not a progress element, so there is nothing to label.
  return useBar().loading ? <span {...props}>{children}</span> : <AriaLabel {...props}>{children}</AriaLabel>;
}

export interface ProgressBarValueProps extends BlockProps, ChangeHighlightProps {
  /** `inside` draws the value on the bar, at the end of the fill; render it inside `ProgressBar.Track`. */
  placement?: 'outside' | 'inside' | undefined;
}

/** The value as text. Hides first when the bar is narrow. `children` replaces the formatted value. */
function Value({ children, placement = 'outside', className, style, ...change }: ProgressBarValueProps) {
  const bar = useBar();
  const mark = <ChangeHighlight {...change}>{children ?? bar.valueText}</ChangeHighlight>;
  if (placement === 'inside') {
    if (bar.loading) return null;
    const fraction = bar.cells.length === 1 ? bar.cells[0]!.fills.reduce((sum, f) => sum + f.fraction, 0) : 1;
    return (
      <div data-part="inside" className={styles.inside} style={{ inlineSize: `${fraction * 100}%` }}>
        <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
          {mark}
          {children ?? bar.valueText}
        </span>
      </div>
    );
  }
  if (bar.hideValue) return null;
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      {!bar.loading && mark}
      {bar.loading ? <Skeleton width="3ch" /> : (children ?? bar.valueText)}
    </span>
  );
}

export interface ProgressBarFillProps {
  /** Share of its segment that the fill covers, from 0 to 1. */
  fraction: number;
  tone?: MeterTone | undefined;
  /** Any CSS colour. Wins over `tone`. */
  color?: string | undefined;
  /** Hatching drawn over the colour, so fills differ without it. */
  pattern?: MeterPattern | undefined;
  indeterminate?: boolean | undefined;
  /** The id of the stacked part this fill shows. */
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** One coloured fill inside a segment of the track. */
function Fill({
  fraction,
  tone = 'default',
  color,
  pattern = 'none',
  indeterminate,
  id,
  className,
  style,
}: ProgressBarFillProps) {
  return (
    <div
      data-part="fill"
      data-tone={color ? undefined : tone}
      data-pattern={pattern}
      data-indeterminate={indeterminate || undefined}
      data-id={id}
      className={cx(styles.fill, className)}
      style={
        {
          inlineSize: indeterminate ? undefined : `${fraction * 100}%`,
          ...(color && { '--paint': color }),
          ...style,
        } as CSSProperties
      }
    />
  );
}

export interface ProgressBarTrackProps extends BlockProps {
  /** Replaces or hides every fill. A function receives the default fill's props. */
  fill?: Part<ProgressBarFillProps> | undefined;
  /** Replaces the skeleton shown while loading. */
  skeleton?: Part | undefined;
}

/** The bar: its segments and their fills. `children` are drawn over it (`ProgressBar.Target`, an inside value). */
function Track({ children, fill, skeleton, className, style }: ProgressBarTrackProps) {
  const bar = useBar();
  return (
    <div data-part="track" className={cx(styles.track, className)} style={style}>
      {bar.loading ? (
        <span data-part="skeleton" className={styles.skeletonPart}>
          {renderPart(skeleton, {}, () => (
            <Skeleton shape="block" className={styles.skeleton} />
          ))}
        </span>
      ) : (
        <>
          <div data-part="cells" className={styles.cells}>
            {bar.cells.map((cell) => (
              <div key={cell.from} className={styles.cell} style={{ flexGrow: cell.to - cell.from }}>
                {cell.fills.map((props, i) => (
                  <FillPart key={props.id ?? i} part={fill} props={props} />
                ))}
              </div>
            ))}
          </div>
          {children}
        </>
      )}
    </div>
  );
}

function FillPart({
  part,
  props,
}: {
  part: Part<ProgressBarFillProps> | undefined;
  props: ProgressBarFillProps;
}) {
  return renderPart(part, props, (p) => <Fill {...p} />);
}

/** A tick at the goal value. Its label is part of the bar's accessible value text. */
function Target({ className, style }: Omit<BlockProps, 'children'>) {
  const { targetFraction, loading } = useBar();
  if (targetFraction === undefined || loading) return null;
  return (
    <div
      data-part="target"
      aria-hidden="true"
      className={cx(styles.target, className)}
      style={{ insetInlineStart: `${targetFraction * 100}%`, ...style }}
    />
  );
}

export interface ProgressBarProps
  extends Omit<ProgressBarRootProps, 'children'>, Omit<ChangeHighlightProps, 'changeValue'> {
  /** The name of the bar, shown beside or above it. */
  label?: ReactNode | undefined;
  /** Replaces the formatted value. Setting it shows the value. */
  valueLabel?: ReactNode | undefined;
  /** Shows the value as text. */
  showValue?: boolean | undefined;
  /** `inside` draws the value on the bar; it needs `size="thick"`, and hides when the bar is too short for it. */
  valuePlacement?: 'outside' | 'inside' | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        label?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        track?: Part<{ children: ReactNode }> | undefined;
        fill?: Part<ProgressBarFillProps> | undefined;
        target?: Part | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A bar that fills with a value: progress of a task, or a measured level. Fills the width of its container. */
export function ProgressBar({
  label,
  valueLabel,
  showValue = valueLabel !== undefined,
  valuePlacement = 'outside',
  parts,
  ...rest
}: ProgressBarProps) {
  const [change, root] = splitChange(rest);
  const inside = valuePlacement === 'inside' && root.size === 'thick';
  const value =
    showValue &&
    !root.indeterminate &&
    renderPart(parts?.value, { children: valueLabel }, (p) => (
      <Value
        placement={inside ? 'inside' : 'outside'}
        {...change}
        changeValue={typeof root.value === 'number' ? root.value : undefined}
      >
        {p.children}
      </Value>
    ));
  const over = (
    <>
      {root.target !== undefined && renderPart(parts?.target, {}, () => <Target />)}
      {inside && value}
    </>
  );
  // A replaced label no longer names the bar, so its text does.
  const name =
    root['aria-label'] ?? (parts?.label !== undefined && typeof label === 'string' ? label : undefined);
  return (
    <Root {...root} aria-label={name}>
      {label !== undefined &&
        label !== null &&
        renderPart(parts?.label, { children: label }, (p) => <Label>{p.children}</Label>)}
      {!inside && value}
      {renderPart(parts?.track, { children: over }, (p) => (
        <Track fill={parts?.fill} skeleton={parts?.skeleton}>
          {p.children}
        </Track>
      ))}
    </Root>
  );
}

ProgressBar.Root = Root;
ProgressBar.Label = Label;
ProgressBar.Value = Value;
ProgressBar.Track = Track;
ProgressBar.Fill = Fill;
ProgressBar.Target = Target;
