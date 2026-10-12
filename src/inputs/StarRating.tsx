import {
  createContext,
  Fragment,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { RawIcon } from '../provider/icons';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import { useActionKind } from '../internal/contexts';
import styles from './StarRating.module.css';
import { ReportValidation, useFieldControl, useUnnamedGroup } from './useField';
import { passThrough, rootRender } from '../utils/passThrough';

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
  /** A display too narrow for its row of stars: one star and the value as a number. */
  compact: boolean;
  display: boolean;
  loading: boolean;
  step: number;
  disabled: boolean;
  /** A drag along the stars: on from its start until just after it ends. */
  setDragged: (on: boolean) => void;
  isDragged: () => boolean;
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
  ...rest
}: StarRatingRootProps) {
  const ownId = useId();
  const ref = useRef<HTMLElement>(null);
  const [own, setOwn] = useState(defaultValue ?? null);
  const [hovered, setHovered] = useState<number | null>(null);
  const dragged = useRef(false);
  const value = valueProp === undefined ? own : valueProp;
  const control = useFieldControl({ id, invalid, required, disabled });
  useUnnamedGroup(ref, readOnly || loading ? 'none' : name);
  // "Show less": the value's text gives way first. A display that still does not fit (a narrow table
  // cell) then draws one star and the value as a number, instead of a row cut at its end. An input
  // keeps its stars: each is a choice.
  const level = useShrinkLevel(ref, readOnly ? 2 : 1);
  const valueHidden = level >= 1;
  const compact = readOnly && level === 2;
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
    compact,
    display: readOnly,
    loading,
    step,
    disabled: control.disabled,
    setDragged: (on) => {
      dragged.current = on;
    },
    isDragged: () => dragged.current,
  };
  const common = {
    'data-umbra': 'star-rating',
    'data-size': size,
    'data-mode': readOnly ? 'display' : 'input',
    'data-compact': compact ? '' : undefined,
    'data-step': step === 0.5 ? 'half' : undefined,
    style: { '--stars': max, ...style } as CSSProperties,
  };
  const rootClass = cx(styles.root, className);
  if (loading)
    return (
      <span {...passThrough(rest)} {...common} className={rootClass} aria-busy="true" data-loading>
        {/* The blocks draw their placeholders, so the value text keeps its room too. */}
        <Context value={shared}>{children}</Context>
      </span>
    );
  if (readOnly) {
    const missing = value === null || Number.isNaN(value);
    const named = [ariaLabel, missing ? noValueLabel : text(value)].filter(Boolean).join(': ');
    return (
      <span
        {...passThrough(rest)}
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
      {...rootRender('div', rest)}
      {...common}
      ref={ref as React.RefObject<HTMLDivElement>}
      orientation="horizontal"
      value={value === null ? (clearable ? '0' : null) : String(value)}
      // The press that ends a drag is on the star the drag began on: the drag has already chosen.
      onChange={(next) => dragged.current || shared.choose(Number(next) || null)}
      isDisabled={control.disabled}
      // Only when it is set: a `false` would silence the group's own validation (required, on submit).
      {...defined({ isInvalid: control.invalid || undefined })}
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
      <ReportValidation />
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
  const row = useRef<HTMLSpanElement>(null);
  const press = useRef<number | null>(null);
  if (rating.loading)
    return (
      <span data-part="skeleton" className={cx(styles.skeleton, className)} style={style}>
        <Skeleton shape="block" width="100%" height="100%" />
      </span>
    );
  if (rating.compact)
    return (
      <span data-part="stars" className={cx(styles.stars, className)} style={style}>
        <Star index={0} fill={1} />
        <span data-part="value" aria-hidden="true" className={styles.value}>
          {rating.value}
        </span>
      </span>
    );
  // Half steps: a press chooses the whole star, so every pointer target is a star, 24px or more. A
  // half is chosen by dragging along the row (and by the arrow keys): the value follows the pointer in
  // half steps, as a slider does, and is taken where the pointer is let go.
  const under = (x: number) => {
    const box = row.current!.getBoundingClientRect();
    const rtl = getComputedStyle(row.current!).direction === 'rtl';
    const share = (rtl ? box.right - x : x - box.left) / box.width;
    const value = Math.ceil((share * rating.max) / rating.step) * rating.step;
    return Math.min(rating.max, Math.max(rating.step, value));
  };
  const halves = rating.step < 1 && !rating.display && !rating.disabled;
  const drag = halves
    ? {
        // While it goes down: React Aria's press on a star keeps the event from coming up.
        onPointerDownCapture: (event: PointerEvent) => {
          press.current = event.clientX;
        },
        onPointerMove: (event: PointerEvent) => {
          if (press.current === null) return;
          if (!rating.isDragged() && Math.abs(event.clientX - press.current) < 4) return;
          rating.setDragged(true);
          rating.hover(under(event.clientX));
        },
        onPointerUp: (event: PointerEvent) => {
          press.current = null;
          if (!rating.isDragged()) return;
          const value = under(event.clientX);
          rating.choose(value);
          rating.hover(null);
          // Once the press that ends the drag is over: the focus goes to the value the drag chose.
          setTimeout(() => {
            rating.setDragged(false);
            row.current?.querySelector<HTMLElement>(`input[value="${value}"]`)?.focus();
          });
        },
        onPointerLeave: () => {
          if (press.current === null) return;
          press.current = null;
          rating.setDragged(false);
          rating.hover(null);
        },
      }
    : {};
  return (
    <span ref={row} data-part="stars" className={cx(styles.stars, className)} style={style} {...drag}>
      {children ?? Array.from({ length: rating.max }, (_, index) => <Star key={index} index={index} />)}
      {!rating.display && (
        <span className={styles.choices}>
          {rating.clearable && <ClearChoice label={rating.clearLabel} />}
          {rating.choices.map((choice) => (
            <AriaRadio
              key={choice}
              value={String(choice)}
              aria-label={rating.text(choice)}
              data-half={!Number.isInteger(choice) || undefined}
              {...defined({ className: styles.choice })}
              // A half is not a pointer target: hovering shows the whole star a press would choose.
              onHoverChange={(over) => rating.isDragged() || rating.hover(over ? Math.ceil(choice) : null)}
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
  if (rating.loading)
    return (
      <span data-part="value" className={cx(styles.value, styles.pending, className)} style={style}>
        {/* The text itself, unseen, keeps the room it will take. */}
        <span>{children ?? rating.value ?? rating.max}</span>
        <Skeleton width="100%" />
      </span>
    );
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
  useActionKind('stays');
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
