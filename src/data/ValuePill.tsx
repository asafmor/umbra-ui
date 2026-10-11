import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { textColourOn } from '../provider/contrast';
import { cx, renderPart, type Part } from '../utils/parts';
import { resolveThreshold, type ThresholdList } from '../utils/thresholds';
import shared from './shared.module.css';
import type { Tone } from './tone';
import { rampSteps, valueLevel, type ValueLevelOptions } from './valueLevel';
import styles from './ValuePill.module.css';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface ValuePillRootProps extends BlockProps {
  /** The step of the value ramp, 1 (worst) to 5 (best). `null` is the look of "no value". */
  level?: number | null | undefined;
  /** A colour by meaning in place of a ramp step. Wins over `level`. */
  tone?: Tone | undefined;
  /** Any CSS colour. Wins over `tone` and `level`; the text colour on it is chosen for contrast. */
  color?: string | undefined;
  /** The position of the value's band in `thresholds`, from 0. Set as `data-band`, for CSS and tests. */
  band?: number | undefined;
  /** Shown on hover: the label of the value's band. */
  title?: string | undefined;
  /** `square` for values in dense rows, `circle` for grades of one or two characters. */
  shape?: 'pill' | 'square' | 'circle' | undefined;
  /** `small` is for use inside table cells. */
  size?: 'small' | 'default' | 'large' | undefined;
}

function Root({
  level = null,
  tone,
  color,
  band,
  title,
  shape = 'pill',
  size = 'default',
  className,
  style,
  children,
}: ValuePillRootProps) {
  const custom = color && { '--fill': color, '--ink': textColourOn(color)?.colour };
  return (
    <span
      data-umbra="value-pill"
      data-level={color || tone ? 'none' : (level ?? 'none')}
      data-tone={color ? 'custom' : tone}
      data-band={band}
      data-shape={shape}
      data-size={size}
      title={title}
      className={cx(styles.pill, className)}
      style={custom ? ({ ...custom, ...style } as CSSProperties) : style}
    >
      {children}
    </span>
  );
}

export type ValuePillValueProps = BlockProps & ChangeHighlightProps;

function Value({ className, style, children, ...change }: ValuePillValueProps) {
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      <ChangeHighlight {...change}>{children}</ChangeHighlight>
      {children}
    </span>
  );
}

export interface ValuePillLevelProps {
  /** How many of the five bars are filled. */
  level: number;
  /** What a screen reader hears. */
  label: string;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The level as bars, so it does not depend on colour. */
function Level({ level, label, className, style }: ValuePillLevelProps) {
  return (
    <span data-part="level" className={cx(styles.level, className)} style={style}>
      {Array.from({ length: rampSteps }, (_, i) => (
        <i key={i} data-on={i < level || undefined} aria-hidden="true" />
      ))}
      <span className={shared.srOnly}>{label}</span>
    </span>
  );
}

export interface ValuePillProps
  extends
    Omit<ValuePillRootProps, 'level' | 'tone' | 'color' | 'band' | 'title' | 'children'>,
    ValueLevelOptions,
    Omit<ChangeHighlightProps, 'changeValue'> {
  /** The value. `null` or `undefined` shows `emptyLabel` in a neutral pill. */
  value: number | null | undefined;
  /**
   * Colours the pill by the band of the value, in place of `min` and `max`. Plain numbers are boundaries
   * spread on the value ramp (four give the five steps); a list of `{ from, tone?, color?, label? }` sets
   * each band's colour, and its `label` is read with the value. A value below the first band is neutral.
   */
  thresholds?: ThresholdList | undefined;
  /** Turns the value into what is shown: `(v) => v.toFixed(2)`, or a grade letter. */
  formatValue?: ((value: number) => ReactNode) | undefined;
  /** Adds a small bar marker of the level, for readers who cannot tell the colours apart. */
  showLevel?: boolean | undefined;
  /** What a screen reader hears for the marker. */
  levelLabel?: ((level: number, steps: number) => string) | undefined;
  /** Shown when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** Shows a placeholder of the pill's size. */
  loading?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        value?: Part<{ children: ReactNode }> | undefined;
        level?: Part<ValuePillLevelProps> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

/** A value coloured by where it falls on a five-step ramp. */
export function ValuePill({
  value,
  min,
  max,
  thresholds,
  lowerIsBetter,
  formatValue,
  showLevel = false,
  levelLabel = (level, steps) => `Level ${level} of ${steps}`,
  emptyLabel = '—',
  loading = false,
  parts,
  ...rest
}: ValuePillProps) {
  const [change, root] = splitChange(rest);
  if (loading) {
    return renderPart(parts?.skeleton, {}, () => (
      <span
        data-umbra="value-pill"
        data-part="skeleton"
        data-loading=""
        className={cx(shared.skeleton, styles.skeleton, root.className)}
        style={root.style}
      >
        <Skeleton shape="block" />
      </span>
    ));
  }
  const has = value !== null && value !== undefined && Number.isFinite(value);
  const listed = has && !!thresholds?.length;
  const band = listed ? resolveThreshold(value, thresholds, { lowerIsBetter }) : undefined;
  // The ramp step: of the value's band, or of the scale split in five. A value below every band has none.
  const level = listed ? (band?.level ?? null) : valueLevel(value, { min, max, lowerIsBetter });
  const ramp = !band?.tone || band.tone.startsWith('ramp-');
  const text = !has ? emptyLabel : formatValue ? formatValue(value) : value;
  return (
    <Root
      {...root}
      level={band && !band.tone ? null : level}
      tone={ramp ? undefined : (band.tone as Tone)}
      color={band?.color}
      band={band?.index}
      title={band?.label}
    >
      {renderPart(parts?.value, { children: text }, (p) => (
        <Value {...change} changeValue={value ?? null}>
          {p.children}
        </Value>
      ))}
      {band?.label && <span className={shared.srOnly}>{band.label}</span>}
      {showLevel &&
        level !== null &&
        renderPart(parts?.level, { level, label: levelLabel(level, rampSteps) }, (p) => <Level {...p} />)}
    </Root>
  );
}

ValuePill.Root = Root;
ValuePill.Value = Value;
ValuePill.Level = Level;
