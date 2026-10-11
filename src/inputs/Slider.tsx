import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Slider as AriaSlider,
  SliderOutput as AriaSliderOutput,
  SliderStateContext,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
} from 'react-aria-components';
import { bandBoundaries, bandPattern, toFraction } from '../meters/scale';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import { resolveThreshold, type ThresholdBand, type ThresholdList } from '../utils/thresholds';
import { useInOverflowMenu } from '../internal/contexts';
import { bandColour } from './bandColour';
import styles from './Slider.module.css';
import { useFieldControl } from './useField';

/** One number, or the two ends of a range. */
export type SliderValue = number | readonly [number, number];

/** A tick on the track, with an optional label under it. */
export interface SliderMark {
  value: number;
  label?: ReactNode | undefined;
}

interface Shared {
  range: boolean;
  min: number;
  max: number;
  marks: SliderMark[];
  boundaries: number[];
  band: ThresholdBand | undefined;
  /** The text of one value. */
  format: (value: number) => string;
  /** The text of one thumb for a screen reader: its value, and the band's label. */
  spoken: (value: number) => string;
  /** The text of the whole value, as the output shows it. */
  text: (values: readonly number[]) => string;
  name: string | undefined;
  /** The id of the label of the field around the slider. */
  labelledBy: string | undefined;
  readOnly: boolean;
  invalid: boolean;
  bubble: boolean;
  startLabel: string;
  endLabel: string;
}

const Context = createContext<Shared | null>(null);
function useSlider(block: string) {
  const shared = useContext(Context);
  const state = useContext(SliderStateContext);
  if (!shared || !state) throw new Error(`Slider.${block} must be rendered inside Slider.Root.`);
  return { ...shared, state };
}

export interface SliderRootProps<T extends SliderValue = SliderValue> {
  /** Controlled value: a number, or `[from, to]` for a range with two thumbs. */
  value?: T | undefined;
  defaultValue?: T | undefined;
  /** Called while the value changes. */
  onChange?: ((value: T) => void) | undefined;
  /** Called once when a drag or a key press ends. */
  onChangeEnd?: ((value: T) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** `scrubber`: a thin track with the value in a box before it, for a position on a timeline. */
  variant?: 'default' | 'scrubber' | undefined;
  /** `small` is for table cells and dense toolbars. */
  size?: 'default' | 'small' | undefined;
  /** Ticks on the track: values, or values with a label. */
  marks?: readonly (number | SliderMark)[] | undefined;
  /** Colours the fill by the band the value is in, with the band's pattern and label. One thumb only. */
  thresholds?: ThresholdList | undefined;
  /** The scale is one where low is good: the looks of the bands are mirrored. */
  lowerIsBetter?: boolean | undefined;
  /** The text of a value: in the output, the bubble and for a screen reader. */
  formatValue?: ((value: number) => string) | undefined;
  /** Shows the value over the thumb while it is hovered, focused or dragged. */
  bubble?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Focusable, but cannot be changed. */
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Form field name. A range sends two values under it. */
  name?: string | undefined;
  /** The name of the first thumb of a range. */
  startLabel?: string | undefined;
  /** The name of the second thumb of a range. */
  endLabel?: string | undefined;
  id?: string | undefined;
  /** Accessible name, when no `FormField` names it. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root<T extends SliderValue = SliderValue>({
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'horizontal',
  variant = 'default',
  size = 'default',
  marks,
  thresholds,
  lowerIsBetter,
  formatValue = String,
  bubble = false,
  disabled,
  readOnly = false,
  invalid,
  name,
  startLabel = 'From',
  endLabel = 'To',
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: SliderRootProps<T>) {
  const control = useFieldControl({ id, invalid, disabled });
  const range = Array.isArray(value ?? defaultValue);
  // Read-only: the value is held where it is, and the thumbs stay focusable.
  const [held] = useState(defaultValue ?? (min as SliderValue));
  const shared = (values: readonly number[]): Shared => {
    const band =
      thresholds && !range ? resolveThreshold(values[0], thresholds, { lowerIsBetter }) : undefined;
    return {
      range,
      min,
      max,
      marks: (marks ?? []).map((mark) => (typeof mark === 'number' ? { value: mark } : mark)),
      boundaries: range ? [] : bandBoundaries(thresholds, min, max),
      band,
      format: formatValue,
      spoken: (v) => [formatValue(v), band?.label].filter(Boolean).join(', '),
      text: (all) => [all.map(formatValue).join(' – '), band?.label].filter(Boolean).join(' · '),
      name,
      labelledBy: control.labelledBy,
      readOnly,
      invalid: control.invalid,
      bubble,
      startLabel,
      endLabel,
    };
  };
  return (
    <AriaSlider<number | number[]>
      data-umbra="slider"
      data-variant={variant}
      data-size={size}
      data-range={range || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={control.invalid || undefined}
      minValue={min}
      maxValue={max}
      step={step}
      orientation={orientation}
      isDisabled={control.disabled}
      {...defined({
        className: cx(styles.root, className),
        style,
        id: control.id,
        value: (readOnly ? (value ?? held) : value) as number | number[] | undefined,
        defaultValue: defaultValue as number | number[] | undefined,
        onChange: readOnly ? undefined : (onChange as ((value: number | number[]) => void) | undefined),
        onChangeEnd: readOnly ? undefined : (onChangeEnd as ((value: number | number[]) => void) | undefined),
        'aria-label': ariaLabel,
        'aria-labelledby': control.labelledBy,
        'aria-describedby': control.describedBy,
      })}
    >
      {({ state }) => <Context value={shared(state.values)}>{children}</Context>}
    </AriaSlider>
  );
}

export interface SliderTrackProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** `Slider.Thumb`s. Defaults to one, or two for a range. */
  children?: ReactNode | undefined;
}

/** The rail with its fill and ticks, and the thumbs on it. A press on it moves the nearest thumb. */
function Track({ className, style, children }: SliderTrackProps) {
  const slider = useSlider('Track');
  const at = slider.state.values.map((_, i) => slider.state.getThumbPercent(i));
  const from = slider.range ? at[0]! : 0;
  const to = slider.range ? at[1]! : at[0]!;
  const band = slider.band;
  return (
    <AriaSliderTrack data-part="track" {...defined({ className: cx(styles.track, className), style })}>
      <span data-part="rail" className={styles.rail}>
        <span
          data-part="fill"
          data-band={band?.index}
          data-pattern={band ? bandPattern(band) : undefined}
          className={styles.fill}
          style={{ '--from': from, '--to': to, '--paint': band && bandColour(band) } as CSSProperties}
        />
        {/* Where a band starts: a cue of the bands that does not depend on colour. */}
        {slider.boundaries.map((fraction) => (
          <span
            key={`band-${fraction}`}
            data-part="boundary"
            className={styles.boundary}
            style={{ '--at': fraction } as CSSProperties}
          />
        ))}
        {slider.marks.map((mark) => (
          <span
            key={mark.value}
            data-part="tick"
            className={styles.tick}
            style={{ '--at': toFraction(mark.value, slider.min, slider.max) } as CSSProperties}
          />
        ))}
      </span>
      {children ?? slider.state.values.map((_, index) => <Thumb key={index} index={index} />)}
    </AriaSliderTrack>
  );
}

export interface SliderThumbProps {
  /** Which thumb of a range: 0 or 1. */
  index?: number | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Drawn inside the thumb. */
  children?: ReactNode | undefined;
}

/** A thumb: the handle a pointer drags, and the slider a keyboard and a screen reader meet. */
function Thumb({ index = 0, className, style, children }: SliderThumbProps) {
  const slider = useSlider('Thumb');
  const input = useRef<HTMLInputElement>(null);
  const value = slider.state.values[index] ?? slider.min;
  const spoken = slider.spoken(value);
  // React Aria writes the value text from a number format; ours comes from `formatValue` and the band.
  useLayoutEffect(() => {
    input.current?.setAttribute('aria-valuetext', spoken);
    if (slider.readOnly) input.current?.setAttribute('aria-readonly', 'true');
    else input.current?.removeAttribute('aria-readonly');
    // React Aria names a thumb by the slider's group, whose own name comes from the field's label: a
    // name is not followed through two references. So the thumb points at the field's label itself,
    // and a thumb of a range at its own name after it.
    if (slider.labelledBy && input.current)
      input.current.setAttribute(
        'aria-labelledby',
        slider.range ? `${slider.labelledBy} ${input.current.id}` : slider.labelledBy,
      );
  });
  return (
    <AriaSliderThumb
      index={index}
      inputRef={input}
      data-part="thumb"
      isInvalid={slider.invalid}
      {...defined({
        className: cx(styles.thumb, className),
        style,
        name: slider.name,
        'aria-label': slider.range ? (index === 0 ? slider.startLabel : slider.endLabel) : undefined,
      })}
    >
      {children}
      {slider.bubble && (
        <span data-part="bubble" aria-hidden="true" className={styles.bubble}>
          {slider.format(value)}
        </span>
      )}
    </AriaSliderThumb>
  );
}

export interface SliderOutputProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Defaults to the value through `formatValue`, and the band's label. */
  children?: ReactNode | undefined;
}

/** The value as text. It hides when the slider is too narrow for it. */
function Output({ className, style, children }: SliderOutputProps) {
  const slider = useSlider('Output');
  return (
    <AriaSliderOutput data-part="output" {...defined({ className: cx(styles.output, className), style })}>
      {children ?? slider.text(slider.state.values)}
    </AriaSliderOutput>
  );
}

export interface SliderMarksProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The labels of the marks, under the track. They hide first when the slider narrows. */
function Marks({ className, style }: SliderMarksProps) {
  const slider = useSlider('Marks');
  if (!slider.marks.some((mark) => mark.label != null)) return null;
  return (
    // Decorative: a thumb says its value and its band.
    <span data-part="marks" aria-hidden="true" className={cx(styles.marks, className)} style={style}>
      {slider.marks.map((mark) => {
        const at = toFraction(mark.value, slider.min, slider.max);
        return (
          mark.label != null && (
            <span
              key={mark.value}
              data-part="markLabel"
              data-edge={at === 0 ? 'start' : at === 1 ? 'end' : undefined}
              className={styles.markLabel}
              style={{ '--at': at } as CSSProperties}
            >
              {mark.label}
            </span>
          )
        );
      })}
    </span>
  );
}

export interface SliderProps<T extends SliderValue = SliderValue> extends Omit<
  SliderRootProps<T>,
  'children'
> {
  /** Shows the value as text beside the track. */
  showValue?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        track?: Part<SliderTrackProps> | undefined;
        output?: Part<SliderOutputProps> | undefined;
        marks?: Part<SliderMarksProps> | undefined;
      }
    | undefined;
}

/**
 * Chooses a number, or a range with two thumbs, by dragging along a track. The `scrubber` variant is a
 * position on a timeline.
 */
export function Slider<T extends SliderValue = SliderValue>({
  showValue = true,
  parts,
  ...root
}: SliderProps<T>) {
  if (useInOverflowMenu()) return null;
  return (
    <Root {...root}>
      {showValue && renderPart(parts?.output, {}, (p) => <Output {...p} />)}
      {renderPart(parts?.track, {}, (p) => (
        <Track {...p} />
      ))}
      {renderPart(parts?.marks, {}, (p) => (
        <Marks {...p} />
      ))}
    </Root>
  );
}

/** Not a row of a menu: among actions that overflow it stays in the row (`ActionsOverflow`). */
Slider.staysInRow = true;
Slider.Root = Root;
Slider.Track = Track;
Slider.Thumb = Thumb;
Slider.Output = Output;
Slider.Marks = Marks;
