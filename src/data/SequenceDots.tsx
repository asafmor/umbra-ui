import {
  createContext,
  Fragment,
  useContext,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import { Button as AriaButton, Toolbar } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { useHoverTip } from '../internal/TruncatedText';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import shared from './shared.module.css';
import styles from './SequenceDots.module.css';
import { toneProps, type Tone } from './tone';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export type SequenceDotsId = string;

/** The shape of one mark: the cue that does not depend on colour. A bar takes a fill by it. */
export type SequenceDotsMark = 'dot' | 'ring' | 'half' | 'square' | 'diamond' | 'dash';

/** The shape each tone takes when the item gives none. */
const toneMarks: Record<Tone, SequenceDotsMark> = {
  success: 'dot',
  danger: 'ring',
  warning: 'half',
  info: 'square',
  accent: 'diamond',
  neutral: 'dash',
};

export interface SequenceDotsItem {
  id: SequenceDotsId;
  /** What the mark stands for, in words: part of the summary, and the name of the mark's button. */
  label: string;
  /** Colour by meaning. Each tone has its own shape. */
  tone?: Tone | undefined;
  /** Any CSS colour. Wins over `tone`; give `mark` too, so it is not colour alone. */
  color?: string | undefined;
  /** The shape (or, for a bar, the fill). Default: by `tone`. */
  mark?: SequenceDotsMark | undefined;
  /** `bars` only: the height of the bar, on `range`. `null` or nothing draws a stub. */
  value?: number | null | undefined;
  /**
   * Shown on hover, and on keyboard focus of a mark that can be pressed, whose description it is. A text
   * is also part of the summary assistive technology reads.
   */
  tooltip?: ReactNode | undefined;
  disabled?: boolean | undefined;
}

interface SequenceContext {
  variant: 'dots' | 'bars';
  range: readonly [number, number];
  onAction?: ((id: SequenceDotsId) => void) | undefined;
}
const Context = createContext<SequenceContext | null>(null);

export interface SequenceDotsRootProps extends RootAttributes {
  /** `dots`: one small shape per item. `bars`: one thin bar per item, as tall as its `value`. */
  variant?: 'dots' | 'bars' | undefined;
  /** `sm` fits a table cell, `md` a list row, `lg` a header. */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** `bars` only: the values of an empty and of a full bar. */
  range?: readonly [number, number] | undefined;
  /** Makes each mark a button: one tab stop, arrow keys between the marks. */
  onAction?: ((id: SequenceDotsId) => void) | undefined;
  /** What assistive technology reads for the whole sequence. */
  'aria-label'?: string | undefined;
  /** Marks the sequence busy for assistive technology. */
  loading?: boolean | undefined;
  /** The element, for measuring. */
  ref?: Ref<HTMLElement> | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root({
  variant = 'dots',
  size = 'md',
  range = [0, 1],
  onAction,
  'aria-label': label,
  loading,
  ref,
  className,
  style,
  children,
  ...rest
}: SequenceDotsRootProps) {
  const attributes = {
    'data-umbra': 'sequence-dots',
    'data-variant': variant,
    'data-size': size,
    'data-interactive': onAction ? '' : undefined,
    'aria-label': label,
    className: cx(styles.root, className),
    style,
  };
  const content = <Context value={{ variant, range, onAction }}>{children}</Context>;
  // Buttons form a toolbar: one tab stop, arrow keys between the marks.
  return onAction ? (
    <Toolbar
      {...defined(attributes)}
      ref={ref as Ref<HTMLDivElement>}
      render={(props) => <div {...passThrough(rest)} {...defined(props)} aria-busy={loading || undefined} />}
    >
      {content}
    </Toolbar>
  ) : (
    // One image named by the summary: the marks inside are its drawing.
    <span
      {...passThrough(rest)}
      {...attributes}
      role="img"
      aria-busy={loading || undefined}
      ref={ref as Ref<HTMLSpanElement>}
    >
      {content}
    </span>
  );
}

const drawings: Record<SequenceDotsMark, ReactNode> = {
  dot: <circle cx="6" cy="6" r="5" fill="currentColor" />,
  ring: <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />,
  half: (
    <>
      <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 1a5 5 0 0 0 0 10z" fill="currentColor" />
    </>
  ),
  square: <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill="currentColor" />,
  diamond: <path d="M6 .5 11.5 6 6 11.5.5 6z" fill="currentColor" />,
  dash: <rect x="1.5" y="4.5" width="9" height="3" rx="1.5" fill="currentColor" />,
};

export interface SequenceDotsMarkProps extends Omit<SequenceDotsItem, 'id'> {
  id: SequenceDotsId;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** One mark of the sequence. Inside a root with `onAction` it is a button named by `label`. */
function Mark({
  id,
  label,
  tone = 'neutral',
  color,
  mark = toneMarks[tone],
  value,
  tooltip,
  disabled,
  className,
  style,
}: SequenceDotsMarkProps) {
  const sequence = useContext(Context);
  if (!sequence) throw new Error('SequenceDots.Mark must be rendered inside <SequenceDots.Root>.');
  const ref = useRef<HTMLElement>(null);
  const tip = useHoverTip(ref, tooltip);
  const tipId = useId();
  // The tip is only in the page while it shows, so the button is described by a copy that stays.
  const described = !!sequence.onAction && typeof tooltip === 'string' && tooltip !== '' && tooltip !== label;
  const [min, max] = sequence.range;
  const hasValue = value !== null && value !== undefined && !Number.isNaN(value);
  const fraction = hasValue && max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const toned = toneProps(tone, color);
  const drawing =
    sequence.variant === 'bars' ? (
      <span
        className={styles.bar}
        data-empty={hasValue ? undefined : ''}
        style={{ ['--fraction' as string]: fraction }}
      />
    ) : (
      <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.shape}>
        {drawings[mark]}
      </svg>
    );
  const attributes = {
    'data-part': 'mark',
    'data-mark': mark,
    'data-id': id,
    'data-tone': toned['data-tone'],
    className: cx(shared.tone, styles.mark, className),
    style: { ...toned.style, ...style },
  };
  return (
    <>
      {sequence.onAction ? (
        <AriaButton
          {...defined(attributes)}
          ref={ref as Ref<HTMLButtonElement>}
          aria-label={label}
          {...defined({ 'aria-describedby': described ? tipId : undefined })}
          isDisabled={!!disabled}
          onPress={() => sequence.onAction?.(id)}
        >
          {drawing}
          {described && (
            <span id={tipId} hidden>
              {tooltip}
            </span>
          )}
        </AriaButton>
      ) : (
        <span {...attributes} data-disabled={disabled || undefined} ref={ref as Ref<HTMLSpanElement>}>
          {drawing}
        </span>
      )}
      {tip}
    </>
  );
}

export interface SequenceDotsProps extends Omit<SequenceDotsRootProps, 'children' | 'ref' | 'range'> {
  /** The sequence, oldest first. `null` or nothing means there is no value. */
  items?: readonly SequenceDotsItem[] | null | undefined;
  /** The most marks shown: the newest ones. Fewer are shown when they do not fit. */
  max?: number | undefined;
  /** `bars` only: the values of an empty and of a full bar. Default: 0 to the largest value. */
  range?: readonly [number, number] | undefined;
  /**
   * The text assistive technology reads, from the items (all of them up to `max`, whatever fits).
   * Default: each label, with the item's tooltip in brackets when that is another text.
   */
  formatSummary?: ((items: readonly SequenceDotsItem[]) => string) | undefined;
  /** Shows a placeholder of the sequence's size. */
  loading?: boolean | undefined;
  /** What assistive technology reads while loading, when there is no `aria-label`. */
  loadingLabel?: string | undefined;
  /** Shown when there is no value. */
  emptyLabel?: ReactNode | undefined;
  /** What assistive technology reads when there is no value. */
  noValueLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        mark?: Part<SequenceDotsMarkProps> | undefined;
        skeleton?: Part | undefined;
        empty?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

const defaultSummary = (list: readonly SequenceDotsItem[]) =>
  list
    .map(({ label, tooltip }) =>
      typeof tooltip === 'string' && tooltip && tooltip !== label ? `${label} (${tooltip})` : label,
    )
    .join(', ');

/**
 * How many of the oldest marks must go for the rest to fit, from the widths as they are drawn: the
 * marks are of one width, so one measurement tells. (One mark per render stops at 50: React's limit.)
 */
function marksToDrop(row: HTMLElement) {
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const pitch = (row.scrollWidth + gap) / row.childElementCount;
  return Math.ceil((row.scrollWidth - row.clientWidth) / pitch);
}

/** A short ordered row of small marks, one per recent outcome: dots with a shape per tone, or thin bars by value. */
export function SequenceDots({
  items,
  max,
  range,
  formatSummary = defaultSummary,
  'aria-label': label,
  loading = false,
  loadingLabel = 'Loading',
  emptyLabel = '—',
  noValueLabel = 'No value',
  parts,
  ...root
}: SequenceDotsProps) {
  const ref = useRef<HTMLElement>(null);
  const all = items ?? [];
  // The newest are last, so a limit drops from the start.
  const listed = max !== undefined && max >= 0 ? all.slice(Math.max(0, all.length - max)) : all;
  // The level is the number of the oldest marks left out, while the row is wider than its place. The
  // newest stays. It is counted from the widths in one step, so any number of marks settles at once.
  const level = useShrinkLevel(ref, loading ? 0 : Math.max(0, listed.length - 1), listed.length, {
    advance: marksToDrop,
  });

  if (loading) {
    const count = listed.length || max || 5;
    return renderPart(parts?.skeleton, {}, () => (
      <Root {...root} loading aria-label={label ?? loadingLabel}>
        <span
          data-part="skeleton"
          className={styles.skeleton}
          style={{ ['--count' as string]: count }}
          aria-hidden="true"
        >
          <Skeleton shape="block" />
        </span>
      </Root>
    ));
  }
  if (!listed.length) {
    return renderPart(parts?.empty, { children: emptyLabel }, (p) => (
      <span
        {...passThrough(root)}
        data-umbra="sequence-dots"
        data-part="empty"
        data-size={root.size ?? 'md'}
        className={cx(styles.empty, root.className)}
        style={root.style}
      >
        <span aria-hidden="true">{p.children}</span>
        <span className={shared.srOnly}>{noValueLabel}</span>
      </span>
    ));
  }
  const largest = Math.max(0, ...listed.map((item) => item.value ?? 0));
  return (
    <Root {...root} ref={ref} range={range ?? [0, largest || 1]} aria-label={label ?? formatSummary(listed)}>
      {listed.slice(level).map((item) => (
        // Keyed here, so a `mark` part given as a function or a node needs no key of its own.
        <Fragment key={item.id}>
          {renderPart(parts?.mark, item, (p) => (
            <Mark {...p} />
          ))}
        </Fragment>
      ))}
    </Root>
  );
}

SequenceDots.Root = Root;
SequenceDots.Mark = Mark;
