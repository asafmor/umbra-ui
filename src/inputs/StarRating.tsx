import {
  createContext,
  Fragment,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { RawIcon } from '../provider/icons';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './StarRating.module.css';
import { useFieldControl } from './useField';

export type StarRatingSize = 'small' | 'default' | 'large';

interface Shared {
  max: number;
  /** The value the stars draw: the hovered one while the pointer is over an input. */
  shown: number;
  value: number | null;
  /** The steps a user can choose, ascending. Empty in display mode. */
  choices: number[];
  clearable: boolean;
  clearLabel: string;
  text: (value: number) => string;
  choose: (value: number | null) => void;
  hover: (value: number | null) => void;
  icon: ReactNode;
  emptyIcon: ReactNode;
  valueHidden: boolean;
  display: boolean;
}

const Context = createContext<Shared | null>(null);
function useRating(block: string) {
  const shared = useContext(Context);
  if (!shared) throw new Error(`StarRating.${block} must be rendered inside StarRating.Root.`);
  return shared;
}

export interface StarRatingRootProps {
  /** Controlled value, from 0 to `max`. `null` is no rating. Display mode draws any fraction. */
  value?: number | null | undefined;
  defaultValue?: number | null | undefined;
  /** Called with the chosen value, or `null` when a `clearable` rating is cleared. */
  onChange?: ((value: number | null) => void) | undefined;
  /** How many stars. */
  max?: number | undefined;
  /** What a user can choose: whole stars, or halves. */
  step?: 1 | 0.5 | undefined;
  /** Adds "no rating" as a choice: the first stop of the arrow keys, and a press on the chosen star. */
  clearable?: boolean | undefined;
  /** Display mode: a picture of the value with a text name, not a control. For tables and lists. */
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** Form field name. The value is sent as a number; no rating sends nothing. */
  name?: string | undefined;
  /** `small` is for table cells, `large` for a header. */
  size?: StarRatingSize | undefined;
  /** Shows placeholders in the final layout. */
  loading?: boolean | undefined;
  /** The text of a value: the name of the picture in display mode, and of each choice. */
  formatValue?: ((value: number, max: number) => string) | undefined;
  /** The name of the "no rating" choice. */
  clearLabel?: string | undefined;
  /** Shown in display mode when there is no value. */
  emptyLabel?: string | undefined;
  /** What a screen reader hears in display mode when there is no value. */
  noValueLabel?: string | undefined;
  /** Replaces the star, full and empty: any node. The full one is filled with the colour. */
  icon?: ReactNode | undefined;
  /** Replaces the empty star alone. */
  emptyIcon?: ReactNode | undefined;
  id?: string | undefined;
  /** Accessible name, when no `FormField` names it. In display mode the value's text is added. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const defaultFormat = (value: number, max: number) => `${value} of ${max}`;

function Root({
  value: valueProp,
  defaultValue,
  onChange,
  max = 5,
  step = 1,
  clearable = false,
  readOnly = false,
  disabled,
  invalid,
  required,
  name,
  size = 'default',
  loading = false,
  formatValue = defaultFormat,
  clearLabel = 'No rating',
  emptyLabel = '—',
  noValueLabel = 'No rating',
  icon,
  emptyIcon,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: StarRatingRootProps) {
  const ownId = useId();
  const ref = useRef<HTMLElement>(null);
  const [own, setOwn] = useState(defaultValue ?? null);
  const [hovered, setHovered] = useState<number | null>(null);
  const value = valueProp === undefined ? own : valueProp;
  const control = useFieldControl({ id, invalid, required, disabled });
  // One step of "show less": the value's text gives way before a star is cut.
  const valueHidden = useShrinkLevel(ref, 1) === 1;
  const text = (v: number) => formatValue(v, max);
  const shared: Shared = {
    max,
    shown: Math.min(max, Math.max(0, (control.disabled ? null : hovered) ?? value ?? 0)),
    value,
    choices: readOnly ? [] : Array.from({ length: Math.round(max / step) }, (_, i) => (i + 1) * step),
    clearable,
    clearLabel,
    text,
    choose: (next) => {
      setOwn(next);
      onChange?.(next);
    },
    hover: setHovered,
    icon,
    emptyIcon,
    valueHidden,
    display: readOnly,
  };
  const common = {
    'data-umbra': 'star-rating',
    'data-size': size,
    'data-mode': readOnly ? 'display' : 'input',
    style: { '--stars': max, ...style } as CSSProperties,
  };
  const rootClass = cx(styles.root, className);
  if (loading)
    return (
      <span {...common} className={rootClass} aria-busy="true" data-loading>
        <span data-part="skeleton" className={styles.skeleton}>
          <Skeleton shape="block" width="100%" height="100%" />
        </span>
      </span>
    );
  if (readOnly) {
    const missing = value === null || Number.isNaN(value);
    const named = [ariaLabel, missing ? noValueLabel : text(value)].filter(Boolean).join(': ');
    return (
      <span
        {...common}
        className={rootClass}
        ref={ref}
        id={control.id ?? ownId}
        role="img"
        aria-label={named}
        // Inside a field the name is the field's label and then the value.
        aria-labelledby={control.labelledBy && `${control.labelledBy} ${control.id ?? ownId}`}
        aria-describedby={control.describedBy}
        data-empty={missing || undefined}
        data-disabled={control.disabled || undefined}
      >
        {missing ? (
          <span data-part="empty" className={styles.missing}>
            {emptyLabel}
          </span>
        ) : (
          <Context value={shared}>{children}</Context>
        )}
      </span>
    );
  }
  return (
    <AriaRadioGroup
      {...common}
      ref={ref as React.RefObject<HTMLDivElement>}
      orientation="horizontal"
      value={value === null ? (clearable ? '0' : null) : String(value)}
      onChange={(next) => shared.choose(Number(next) || null)}
      isDisabled={control.disabled}
      isInvalid={control.invalid}
      isRequired={control.required}
      {...defined({
        className: rootClass,
        id: control.id,
        name,
        'aria-label': ariaLabel,
        'aria-labelledby': control.labelledBy,
        'aria-describedby': control.describedBy,
      })}
    >
      <Context value={shared}>{children}</Context>
    </AriaRadioGroup>
  );
}

/**
 * "No rating" as a choice. It is checked while there is no value, so a screen reader hears the state;
 * it is taken out of the form, so no rating sends nothing and does not satisfy `required`.
 */
function ClearChoice({ label }: { label: string }) {
  const input = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => input.current?.setAttribute('form', ''), []);
  return (
    <AriaRadio value="0" aria-label={label} inputRef={input} {...defined({ className: styles.clear })} />
  );
}

export interface StarRatingStarsProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** `StarRating.Star`s. Defaults to one per step of `max`. */
  children?: ReactNode | undefined;
}

/** The row of stars. In input mode it also holds the choices: one radio over each step. */
function Stars({ className, style, children }: StarRatingStarsProps) {
  const rating = useRating('Stars');
  return (
    <span data-part="stars" className={cx(styles.stars, className)} style={style}>
      {children ?? Array.from({ length: rating.max }, (_, index) => <Star key={index} index={index} />)}
      {!rating.display && (
        <span className={styles.choices}>
          {rating.clearable && <ClearChoice label={rating.clearLabel} />}
          {rating.choices.map((choice) => (
            <AriaRadio
              key={choice}
              value={String(choice)}
              aria-label={rating.text(choice)}
              {...defined({ className: styles.choice })}
              onHoverChange={(over) => rating.hover(over ? choice : null)}
            >
              {/* A press on the chosen star clears a clearable rating: a radio alone cannot be unchosen. */}
              <span
                className={styles.target}
                onClick={() => {
                  if (rating.clearable && choice === rating.value) rating.choose(null);
                }}
              />
            </AriaRadio>
          ))}
        </span>
      )}
    </span>
  );
}

export interface StarRatingStarProps {
  /** Position of the star, from 0: it is full when the value is above it. */
  index: number;
  /** How much of it is filled, from 0 to 1. Defaults to what the value gives. */
  fill?: number | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Replaces the icon of this star. */
  children?: ReactNode | undefined;
}

/** One star: the empty shape, and over it the full one, cut to the share that is filled. */
function Star({ index, fill, className, style, children }: StarRatingStarProps) {
  const rating = useRating('Star');
  const amount = Math.min(1, Math.max(0, fill ?? rating.shown - index));
  const full = children ?? rating.icon ?? <RawIcon name="star" />;
  return (
    <span
      data-part="star"
      data-fill={amount === 1 ? 'full' : amount === 0 ? 'empty' : 'partial'}
      aria-hidden="true"
      className={cx(styles.star, className)}
      style={{ '--fill': amount, ...style } as CSSProperties}
    >
      <span className={styles.glyph}>
        <span className={styles.empty}>{rating.emptyIcon ?? full}</span>
        <span className={styles.filled}>
          <span className={styles.full}>{full}</span>
        </span>
      </span>
    </span>
  );
}

export interface StarRatingValueProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Defaults to the value as a number. */
  children?: ReactNode | undefined;
}

/** The value as text beside the stars. It hides first when the rating does not fit. */
function Value({ className, style, children }: StarRatingValueProps) {
  const rating = useRating('Value');
  if (rating.valueHidden) return null;
  return (
    // In display mode the picture's name already says the value.
    <span
      data-part="value"
      aria-hidden={rating.display || undefined}
      className={cx(styles.value, className)}
      style={style}
    >
      {children ?? rating.value ?? '—'}
    </span>
  );
}

export interface StarRatingProps extends Omit<StarRatingRootProps, 'children'> {
  /** Shows the value as a number after the stars. */
  showValue?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        stars?: Part<StarRatingStarsProps> | undefined;
        star?: Part<StarRatingStarProps> | undefined;
        value?: Part<StarRatingValueProps> | undefined;
      }
    | undefined;
}

/**
 * A rating out of a number of stars. With `readOnly` it is a picture of any value, halves and other
 * fractions included; otherwise a control with the semantics of a radio group.
 */
export function StarRating({ showValue = false, parts, ...root }: StarRatingProps) {
  const max = root.max ?? 5;
  return (
    <Root {...root}>
      {renderPart(parts?.stars, {}, (p) => (
        <Stars {...p}>
          {Array.from({ length: max }, (_, index) => (
            <Fragment key={index}>
              {renderPart(parts?.star, { index }, (star) => (
                <Star {...star} />
              ))}
            </Fragment>
          ))}
        </Stars>
      ))}
      {showValue && renderPart(parts?.value, {}, (p) => <Value {...p} />)}
    </Root>
  );
}

/** Not a row of a menu: among actions that overflow it stays in the row (`ActionsOverflow`). */
StarRating.staysInRow = true;
StarRating.Root = Root;
StarRating.Stars = Stars;
StarRating.Star = Star;
StarRating.Value = Value;
