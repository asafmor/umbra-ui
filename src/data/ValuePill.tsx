import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { cx, renderPart, type Part } from '../utils/parts';
import shared from './shared.module.css';
import { rampSteps, valueLevel, type ValueLevelOptions } from './valueLevel';
import styles from './ValuePill.module.css';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface ValuePillRootProps extends BlockProps {
  /** The step of the value ramp, 1 (worst) to 5 (best). `null` is the look of "no value". */
  level?: number | null;
  /** `square` for values in dense rows, `circle` for grades of one or two characters. */
  shape?: 'pill' | 'square' | 'circle';
  /** `small` is for use inside table cells. */
  size?: 'small' | 'default' | 'large';
}

function Root({
  level = null,
  shape = 'pill',
  size = 'default',
  className,
  style,
  children,
}: ValuePillRootProps) {
  return (
    <span
      data-umbra="value-pill"
      data-level={level ?? 'none'}
      data-shape={shape}
      data-size={size}
      className={cx(styles.pill, className)}
      style={style}
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
  className?: string;
  style?: CSSProperties;
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
    Omit<ValuePillRootProps, 'level' | 'children'>,
    ValueLevelOptions,
    Omit<ChangeHighlightProps, 'changeValue'> {
  /** The value. `null` or `undefined` shows `emptyLabel` in a neutral pill. */
  value: number | null | undefined;
  /** Turns the value into what is shown: `(v) => v.toFixed(2)`, or a grade letter. */
  formatValue?: (value: number) => ReactNode;
  /** Adds a small bar marker of the level, for readers who cannot tell the colours apart. */
  showLevel?: boolean;
  /** What a screen reader hears for the marker. */
  levelLabel?: (level: number, steps: number) => string;
  /** Shown when there is no value. */
  emptyLabel?: ReactNode;
  /** Shows a placeholder of the pill's size. */
  loading?: boolean;
  /** Replace or hide named pieces. */
  parts?: {
    value?: Part<{ children: ReactNode }>;
    level?: Part<ValuePillLevelProps>;
    skeleton?: Part;
  };
}

/** A value coloured by where it falls on a five-step ramp. */
export function ValuePill({
  value,
  min,
  max,
  thresholds,
  ramp,
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
  const level = valueLevel(value, { min, max, thresholds, ramp });
  // `level` is only set for a finite number, so `value` is one here.
  const text = level === null ? emptyLabel : formatValue ? formatValue(value as number) : value;
  return (
    <Root {...root} level={level}>
      {renderPart(parts?.value, { children: text }, (p) => (
        <Value {...change} changeValue={value ?? null}>
          {p.children}
        </Value>
      ))}
      {showLevel &&
        level !== null &&
        renderPart(parts?.level, { level, label: levelLabel(level, rampSteps) }, (p) => <Level {...p} />)}
    </Root>
  );
}

ValuePill.Root = Root;
ValuePill.Value = Value;
ValuePill.Level = Level;
