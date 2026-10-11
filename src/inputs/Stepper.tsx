import {
  createContext,
  useContext,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { rowKeys, useDirection } from '../internal/direction';
import { Icon } from '../provider/icons';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Stepper.module.css';
import { useFieldControl } from './useField';

/** One choice of a stepper in options mode. */
export interface StepperOption {
  id: string;
  label: ReactNode;
  /** The label as text, for a screen reader. Needed when `label` is not a string. */
  textValue?: string | undefined;
}

type Move = 'previous' | 'next' | 'first' | 'last' | 'pageUp' | 'pageDown';

interface Shared {
  /** How many positions there are, and the current one from 0 (-1 without a value). */
  count: number;
  index: number;
  label: ReactNode;
  text: string | undefined;
  /** `aria-valuenow`: the number itself, or the position from 1 in options mode. */
  now: number | undefined;
  bounds: [number, number];
  can: (move: 'previous' | 'next') => boolean;
  /** `spoken` also announces the new value: for a press of a button, which does not hold the focus. */
  go: (move: Move, spoken?: boolean) => void;
  valueId: string;
  control: ReturnType<typeof useFieldControl>;
  readOnly: boolean;
  ariaLabel: string | undefined;
  previousLabel: string;
  nextLabel: string;
  emptyLabel: string;
  indicator: boolean;
}

const Context = createContext<Shared | null>(null);
function useStepper(block: string) {
  const shared = useContext(Context);
  if (!shared) throw new Error(`Stepper.${block} must be rendered inside Stepper.Root.`);
  return shared;
}

const decimals = (step: number) => `${step}`.split('.')[1]?.length ?? 0;

export interface StepperRootProps<T extends string | number = string | number> {
  /** Options mode: the choices, in order. The value is the `id` of one. Leave it out for numeric mode. */
  options?: readonly StepperOption[] | undefined;
  /** Numeric mode: the lowest value. */
  min?: number | undefined;
  /** Numeric mode: the highest value. */
  max?: number | undefined;
  /** Numeric mode: the distance between two values. */
  step?: number | undefined;
  /** Controlled value: an option's `id`, or a number. `null` is no value. */
  value?: T | null | undefined;
  defaultValue?: T | null | undefined;
  onChange?: ((value: T) => void) | undefined;
  /** After the last comes the first, and the other way. Defaults to on for options and off for numbers. */
  wrap?: boolean | undefined;
  /** Numeric mode: the text of a value. */
  formatValue?: ((value: number) => string) | undefined;
  /** The row of segments that shows the position. Defaults to shown for up to 12 positions. */
  showIndicator?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Focusable, but cannot be changed. */
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** Form field name: the option's `id` or the number is sent. */
  name?: string | undefined;
  /** `small` is for table cells and dense toolbars. */
  size?: 'default' | 'small' | undefined;
  previousLabel?: string | undefined;
  nextLabel?: string | undefined;
  /** Shown while there is no value. */
  emptyLabel?: string | undefined;
  id?: string | undefined;
  /** Accessible name, when no `FormField` names it. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root<T extends string | number = string | number>({
  options,
  min = 0,
  max = 100,
  step = 1,
  value: valueProp,
  defaultValue,
  onChange,
  wrap = !!options,
  formatValue = String,
  showIndicator,
  disabled,
  readOnly = false,
  invalid,
  required,
  name,
  size = 'default',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  emptyLabel = '—',
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: StepperRootProps<T>) {
  const valueId = useId();
  const [own, setOwn] = useState<T | null>(defaultValue ?? null);
  const [spoken, setSpoken] = useState('');
  const value = valueProp === undefined ? own : valueProp;
  const control = useFieldControl({ id, invalid, required, disabled });

  // Both modes are a walk over positions 0 to count - 1.
  const count = options ? options.length : Math.max(1, Math.floor((max - min) / step + 1e-9) + 1);
  const valueAt = (i: number) =>
    (options ? options[i]!.id : Number((min + i * step).toFixed(decimals(step)))) as T;
  const textAt = (i: number) => {
    const option = options?.[i];
    if (!options) return formatValue(valueAt(i) as number);
    return option?.textValue ?? (typeof option?.label === 'string' ? option.label : option?.id);
  };
  const index =
    value === null
      ? -1
      : options
        ? options.findIndex((option) => option.id === value)
        : Math.min(count - 1, Math.max(0, Math.round(((value as number) - min) / step)));
  const locked = control.disabled || readOnly || count === 0;
  const target = (move: Move) => {
    const page = Math.max(1, Math.round(count / 10));
    const delta = { previous: -1, next: 1, pageDown: -page, pageUp: page, first: 0, last: 0 }[move];
    if (move === 'first') return 0;
    if (move === 'last') return count - 1;
    // Without a value, the first step in either direction lands on an end.
    if (index < 0) return delta > 0 ? 0 : wrap ? count - 1 : 0;
    const next = index + delta;
    if (wrap && Math.abs(delta) === 1) return (next + count) % count;
    return Math.min(count - 1, Math.max(0, next));
  };
  const shared: Shared = {
    count,
    index,
    label: index < 0 ? emptyLabel : options ? options[index]!.label : textAt(index),
    text: index < 0 ? undefined : textAt(index),
    now: index < 0 ? undefined : options ? index + 1 : (valueAt(index) as number),
    bounds: options ? [1, count] : [min, valueAt(count - 1) as number],
    can: (move) => !locked && (target(move) !== index || index < 0),
    go: (move, speak) => {
      if (locked) return;
      const next = target(move);
      if (next === index) return;
      setOwn(valueAt(next));
      onChange?.(valueAt(next));
      if (speak) setSpoken(textAt(next) ?? '');
    },
    valueId,
    control,
    readOnly,
    ariaLabel,
    previousLabel,
    nextLabel,
    emptyLabel,
    indicator: showIndicator ?? (count > 1 && count <= 12),
  };
  return (
    <div
      data-umbra="stepper"
      data-size={size}
      data-disabled={control.disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={control.invalid || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      <Context value={shared}>{children}</Context>
      {name && value !== null && (
        <input type="hidden" name={name} value={value} disabled={control.disabled} />
      )}
      {/* Heard after a press of Previous or Next, which does not move the focus to the value. */}
      <span role="status" className={styles.spoken}>
        {spoken}
      </span>
    </div>
  );
}

export interface StepperButtonProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Replaces the chevron. */
  children?: ReactNode | undefined;
}

function StepButton({
  move,
  className,
  style,
  children,
}: StepperButtonProps & { move: 'previous' | 'next' }) {
  const stepper = useStepper(move === 'next' ? 'Next' : 'Previous');
  return (
    // Not a tab stop: the value is the one stop, and the arrow keys do what these do.
    <AriaButton
      data-part={move}
      excludeFromTabOrder
      preventFocusOnPress
      aria-label={move === 'next' ? stepper.nextLabel : stepper.previousLabel}
      aria-controls={stepper.control.id ?? stepper.valueId}
      isDisabled={!stepper.can(move)}
      onPress={() => stepper.go(move, true)}
      {...defined({ className: cx(styles.button, className), style })}
    >
      {children ?? (
        <span className={move === 'previous' ? styles.flip : undefined}>
          <Icon name="chevronRight" />
        </span>
      )}
    </AriaButton>
  );
}

const Previous = (props: StepperButtonProps) => <StepButton {...props} move="previous" />;
const Next = (props: StepperButtonProps) => <StepButton {...props} move="next" />;

export interface StepperValueProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Replaces the text shown; the value a screen reader hears stays. */
  children?: ReactNode | undefined;
}

/** The value, and the one tab stop: a spin button that the arrow keys, Home and End change. */
function Value({ className, style, children }: StepperValueProps) {
  const stepper = useStepper('Value');
  const [before, after] = rowKeys(useDirection());
  const { control } = stepper;
  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, Move> = {
      [before]: 'previous',
      [after]: 'next',
      ArrowDown: 'previous',
      ArrowUp: 'next',
      PageDown: 'pageDown',
      PageUp: 'pageUp',
      Home: 'first',
      End: 'last',
    };
    const move = moves[event.key];
    if (!move || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    stepper.go(move);
  };
  return (
    <div
      id={control.id ?? stepper.valueId}
      role="spinbutton"
      tabIndex={control.disabled ? undefined : 0}
      data-part="value"
      data-empty={stepper.index < 0 || undefined}
      aria-label={stepper.ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={control.describedBy}
      aria-valuenow={stepper.now}
      aria-valuetext={stepper.text}
      aria-valuemin={stepper.bounds[0]}
      aria-valuemax={stepper.bounds[1]}
      aria-disabled={control.disabled || undefined}
      aria-readonly={stepper.readOnly || undefined}
      aria-invalid={control.invalid || undefined}
      aria-required={control.required || undefined}
      onKeyDown={onKeyDown}
      className={cx(styles.value, className)}
      style={style}
    >
      <span className={styles.text}>{children ?? stepper.label}</span>
    </div>
  );
}

export interface StepperIndicatorProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** One segment per position. The current one is brighter and taller, so it does not depend on colour. */
function Indicator({ className, style }: StepperIndicatorProps) {
  const stepper = useStepper('Indicator');
  if (!stepper.indicator) return null;
  return (
    <span data-part="indicator" aria-hidden="true" className={cx(styles.indicator, className)} style={style}>
      {Array.from({ length: stepper.count }, (_, i) => (
        <span key={i} data-part="segment" data-current={i === stepper.index || undefined} />
      ))}
    </span>
  );
}

export interface StepperProps<T extends string | number = string | number> extends Omit<
  StepperRootProps<T>,
  'children'
> {
  /** Replace or hide named pieces. */
  parts?:
    | {
        previous?: Part<StepperButtonProps> | undefined;
        value?: Part<StepperValueProps> | undefined;
        next?: Part<StepperButtonProps> | undefined;
        indicator?: Part<StepperIndicatorProps> | undefined;
      }
    | undefined;
}

/**
 * Previous and next around one value, with a row of segments for the position. It walks through a list
 * of options (`options`), or through numbers (`min`, `max`, `step`).
 */
export function Stepper<T extends string | number = string | number>({ parts, ...root }: StepperProps<T>) {
  return (
    <Root {...root}>
      {renderPart(parts?.previous, {}, (p) => (
        <Previous {...p} />
      ))}
      {renderPart(parts?.value, {}, (p) => (
        <Value {...p} />
      ))}
      {renderPart(parts?.next, {}, (p) => (
        <Next {...p} />
      ))}
      {renderPart(parts?.indicator, {}, (p) => (
        <Indicator {...p} />
      ))}
    </Root>
  );
}

Stepper.Root = Root;
Stepper.Previous = Previous;
Stepper.Value = Value;
Stepper.Next = Next;
Stepper.Indicator = Indicator;
