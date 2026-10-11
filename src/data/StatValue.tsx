import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Skeleton } from '../basics/Skeleton';
import { IconSlot } from '../provider/icons';
import {
  ChangeHighlight,
  changeHost,
  splitChange,
  type ChangeHighlightProps,
} from '../internal/ChangeHighlight';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './StatValue.module.css';

export type StatValueTone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

/** The id that ties the label to the group it names. */
const LabelIdContext = createContext<string | undefined>(undefined);

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface StatValueRootProps extends BlockProps {
  /** Size of the value: `md` is the title font, `lg` the display font, `xl` larger still. */
  size?: 'md' | 'lg' | 'xl' | undefined;
  /** Colour of the value. A tone that carries meaning needs a second cue: a `trend`, an icon or the label. */
  tone?: StatValueTone | undefined;
  align?: 'start' | 'center' | 'end' | undefined;
  /** Marks the stat busy for assistive technology. */
  loading?: boolean | undefined;
  /** Accessible name, for a stat without a label. */
  'aria-label'?: string | undefined;
}

function Root({
  size = 'md',
  tone = 'default',
  align = 'start',
  loading = false,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: StatValueRootProps) {
  const labelId = useId();
  // The label can be left out or hidden through `parts`; the group is only named by one that exists.
  const [hasLabel, setHasLabel] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- checked after every render on purpose; an equal value does not render again
  useLayoutEffect(() => setHasLabel(!!document.getElementById(labelId)));
  return (
    <div
      role="group"
      aria-labelledby={ariaLabel || !hasLabel ? undefined : labelId}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      data-umbra="stat-value"
      data-size={size}
      data-tone={tone}
      data-align={align}
      data-loading={loading || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      <LabelIdContext value={labelId}>{children}</LabelIdContext>
    </div>
  );
}

export interface StatValueLabelProps extends BlockProps {
  /** Shown before the label. */
  icon?: ReactNode | undefined;
}

function Label({ icon, className, style, children }: StatValueLabelProps) {
  return (
    <div
      data-part="label"
      id={useContext(LabelIdContext)}
      className={cx(styles.label, className)}
      style={style}
    >
      {icon}
      <span className={styles.text}>{children}</span>
    </div>
  );
}

/** The line that holds the value, its unit and its trend. */
function Figure({ className, style, children }: BlockProps) {
  return (
    <div data-part="figure" className={cx(styles.figure, className)} style={style}>
      {children}
    </div>
  );
}

export type StatValueValueProps = BlockProps & ChangeHighlightProps;

function Value({ className, style, children, ...change }: StatValueValueProps) {
  return (
    <span data-part="value" {...changeHost(change)} className={cx(styles.value, className)} style={style}>
      <ChangeHighlight {...change}>{children}</ChangeHighlight>
      {children}
    </span>
  );
}

function Unit({ className, style, children }: BlockProps) {
  return (
    <span data-part="unit" className={cx(styles.unit, className)} style={style}>
      {children}
    </span>
  );
}

function Trend({ className, style, children }: BlockProps) {
  return (
    <span data-part="trend" className={cx(styles.trend, className)} style={style}>
      {children}
    </span>
  );
}

function Caption({ className, style, children }: BlockProps) {
  return (
    <div data-part="caption" className={cx(styles.caption, className)} style={style}>
      {children}
    </div>
  );
}

function Meter({ className, style, children }: BlockProps) {
  return (
    <div data-part="meter" className={cx(styles.meter, className)} style={style}>
      {children}
    </div>
  );
}

export interface StatValueProps extends Omit<StatValueRootProps, 'children'>, ChangeHighlightProps {
  /** The value. It never hides. `null`, `undefined` or an empty text shows `emptyLabel`, without unit or trend. */
  value?: ReactNode | undefined;
  /** Shown when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** What the value is. */
  label?: ReactNode | undefined;
  /** Shown before the label. */
  icon?: ReactNode | undefined;
  /** Shown after the value, smaller. */
  unit?: ReactNode | undefined;
  /** A secondary line under the value. */
  caption?: ReactNode | undefined;
  /** A node after the value that shows its direction, for example a `TrendArrow`. */
  trend?: ReactNode | undefined;
  /** A node under the caption that shows the value as a share, for example a `ProgressBar`. */
  meter?: ReactNode | undefined;
  /** Shows skeletons in place of the value, caption and meter. */
  loading?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        label?: Part<StatValueLabelProps> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        unit?: Part<{ children: ReactNode }> | undefined;
        trend?: Part<{ children: ReactNode }> | undefined;
        caption?: Part<{ children: ReactNode }> | undefined;
        meter?: Part<{ children: ReactNode }> | undefined;
        skeleton?: Part | undefined;
      }
    | undefined;
}

const has = (node: ReactNode) => node != null && node !== false;

/** A large value with its label, and optional unit, trend, caption and meter. */
export function StatValue({
  value,
  emptyLabel = '—',
  label,
  icon,
  unit,
  caption,
  trend,
  meter,
  parts,
  ...rest
}: StatValueProps) {
  const [change, root] = splitChange(rest);
  const { loading } = root;
  // No value: a dash, and no unit or trend, which would read as a value of nothing.
  const missing = value == null || value === '';
  const iconNode =
    has(icon) &&
    renderPart(parts?.icon, { children: icon }, (p) => <IconSlot part="icon">{p.children}</IconSlot>);
  return (
    <Root {...root}>
      {has(label) && renderPart(parts?.label, { icon: iconNode, children: label }, (p) => <Label {...p} />)}
      <Figure>
        {loading ? (
          renderPart(parts?.skeleton, {}, () => (
            <span data-part="skeleton" style={{ display: 'contents' }}>
              <Skeleton
                shape="block"
                width="4em"
                height="0.7em"
                style={{ alignSelf: 'center', minHeight: 0 }}
              />
            </span>
          ))
        ) : (
          <>
            {renderPart(parts?.value, { children: missing ? emptyLabel : value }, (p) => (
              <Value {...change}>{p.children}</Value>
            ))}
            {!missing &&
              has(unit) &&
              renderPart(parts?.unit, { children: unit }, (p) => <Unit>{p.children}</Unit>)}
            {!missing &&
              has(trend) &&
              renderPart(parts?.trend, { children: trend }, (p) => <Trend>{p.children}</Trend>)}
          </>
        )}
      </Figure>
      {has(caption) &&
        renderPart(parts?.caption, { children: loading ? <Skeleton width="8em" /> : caption }, (p) => (
          <Caption>{p.children}</Caption>
        ))}
      {has(meter) &&
        renderPart(
          parts?.meter,
          { children: loading ? <Skeleton shape="block" height={8} style={{ minHeight: 0 }} /> : meter },
          (p) => <Meter>{p.children}</Meter>,
        )}
    </Root>
  );
}

StatValue.Root = Root;
StatValue.Label = Label;
StatValue.Figure = Figure;
StatValue.Value = Value;
StatValue.Unit = Unit;
StatValue.Trend = Trend;
StatValue.Caption = Caption;
StatValue.Meter = Meter;
