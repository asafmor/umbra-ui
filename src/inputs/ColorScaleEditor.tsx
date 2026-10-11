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
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
} from 'react-aria-components';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { focusableIn } from '../internal/focus';
import { bandPattern, toFraction } from '../meters/scale';
import { RawIcon } from '../provider/icons';
import { defined } from '../utils/defined';
import { cx, renderPart, type Part } from '../utils/parts';
import type { Threshold, ThresholdTone } from '../utils/thresholds';
import { bandColour } from './bandColour';
import styles from './ColorScaleEditor.module.css';
import { addStop, boundsOf, moveStop, normalizeStops, removeStop, sameStops, type Scale } from './colorScale';
import { Select, type SelectEntry } from './Select';
import { TextField } from './TextField';
import { FieldContext, noField, useFieldControl } from './useField';

/** A change the editor tells a screen reader about. `index` counts the stops from 0. */
export interface ColorScaleChange {
  type: 'add' | 'remove' | 'reset';
  index?: number | undefined;
}

/** The names of the colour choices: the tones a threshold can have, a free colour, and none. */
export type ColorScaleToneLabels = Partial<Record<ThresholdTone | 'custom' | 'default', string>>;

const toneNames: Required<ColorScaleToneLabels> = {
  'ramp-1': 'Ramp 1 (lowest)',
  'ramp-2': 'Ramp 2',
  'ramp-3': 'Ramp 3',
  'ramp-4': 'Ramp 4',
  'ramp-5': 'Ramp 5 (highest)',
  neutral: 'Neutral',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  accent: 'Accent',
  custom: 'Custom colour',
  default: 'No colour',
};
const ramp = ['ramp-1', 'ramp-2', 'ramp-3', 'ramp-4', 'ramp-5'] as const;
const tones = ['neutral', 'info', 'success', 'warning', 'danger', 'accent'] as const;
const lookOf = (stop: Threshold) => (stop.color ? 'custom' : (stop.tone ?? 'default'));
/** What a native colour field can show: `#rrggbb`. Anything else starts from a mid grey. */
const hex = (color: string | undefined) => (color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#808080');

interface Shared {
  stops: Threshold[];
  scale: Scale;
  format: (value: number) => string;
  names: Required<ColorScaleToneLabels>;
  disabled: boolean;
  labels: {
    stop: string;
    from: string;
    color: string;
    name: string;
    remove: string;
    add: string;
    reset: string;
    track: string;
  };
  canAdd: boolean;
  canRemove: boolean;
  /** `undefined` when there is nothing to reset to. */
  canReset: boolean | undefined;
  change: (stops: Threshold[]) => void;
  add: () => void;
  remove: (index: number) => void;
  reset: () => void;
}

const Context = createContext<Shared | null>(null);
function useEditor(block: string) {
  const shared = useContext(Context);
  if (!shared) throw new Error(`ColorScaleEditor.${block} must be rendered inside ColorScaleEditor.Root.`);
  return shared;
}

export interface ColorScaleEditorRootProps {
  /** Controlled value: the stops, ascending. The `thresholds` of every component that colours by value. */
  value?: readonly Threshold[] | undefined;
  /** The stops to start from, and what the reset button goes back to (in controlled use too). */
  defaultValue?: readonly Threshold[] | undefined;
  onChange?: ((value: Threshold[]) => void) | undefined;
  /** The bottom of the scale: the `from` of the first stop. Defaults to the first stop's own `from`. */
  min?: number | undefined;
  /** The top of the scale. */
  max?: number | undefined;
  /** The distance between two boundaries. */
  step?: number | undefined;
  /** Fewest stops: the remove buttons are disabled at this number. */
  minStops?: number | undefined;
  /** Most stops: the add button is disabled at this number. */
  maxStops?: number | undefined;
  /** Preview only: the row of swatches, with nothing to edit. */
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Form field name: the value is sent as JSON. */
  name?: string | undefined;
  /** The text of a boundary. */
  formatValue?: ((value: number) => string) | undefined;
  /** The word for one stop: "Stop 2". */
  stopLabel?: string | undefined;
  /** Names the boundary field of a stop. */
  fromLabel?: string | undefined;
  /** Names the colour choice of a stop. */
  colorLabel?: string | undefined;
  /** Names the label field of a stop, and is its placeholder. */
  nameLabel?: string | undefined;
  removeLabel?: string | undefined;
  addLabel?: string | undefined;
  resetLabel?: string | undefined;
  /** Names the track with the boundary handles. */
  trackLabel?: string | undefined;
  /** The names of the colour choices. */
  toneLabels?: ColorScaleToneLabels | undefined;
  /** What a screen reader hears after a stop is added or removed, and after a reset. */
  formatAnnouncement?: ((change: ColorScaleChange) => string) | undefined;
  id?: string | undefined;
  /** Accessible name, when no `FormField` names it. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const defaultAnnouncement = ({ type, index = 0 }: ColorScaleChange) =>
  type === 'reset' ? 'Scale reset' : `Stop ${index + 1} ${type === 'add' ? 'added' : 'removed'}`;

function Root({
  value,
  defaultValue,
  onChange,
  min,
  max = 100,
  step = 1,
  minStops = 2,
  maxStops = 8,
  readOnly = false,
  disabled,
  invalid,
  name,
  formatValue = String,
  stopLabel = 'Stop',
  fromLabel = 'From',
  colorLabel = 'Colour',
  nameLabel = 'Label',
  removeLabel = 'Remove',
  addLabel = 'Add stop',
  resetLabel = 'Reset',
  trackLabel = 'Boundaries',
  toneLabels,
  formatAnnouncement = defaultAnnouncement,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: ColorScaleEditorRootProps) {
  const root = useRef<HTMLDivElement>(null);
  const control = useFieldControl({ id, invalid, disabled });
  const [own, setOwn] = useState(defaultValue ?? []);
  const [spoken, setSpoken] = useState('');
  const given = value ?? own;
  const scale: Scale = { min: min ?? given[0]?.from ?? 0, max, step };
  const stops = normalizeStops(given, scale);

  // Focus is never lost: a button that removes its own row, or disables itself, hands the focus on.
  // It names the places to try, in order; the first one that can take the focus gets it.
  type Places = (scope: HTMLElement) => (HTMLElement | null | undefined)[];
  const focusNext = useRef<Places | undefined>(undefined);
  useLayoutEffect(() => {
    const places = focusNext.current;
    focusNext.current = undefined;
    if (!places || !root.current) return;
    const target = places(root.current).find((place) => place && !place.matches(':disabled'));
    (target ?? focusableIn(root.current)[0])?.focus();
  });
  const rowOf = (scope: HTMLElement, index: number) =>
    scope.querySelector<HTMLElement>(`[data-part="stop"][data-index="${index}"]`);
  const addButton = (scope: HTMLElement) => scope.querySelector<HTMLElement>('[data-part="actions"] button');

  const change = (next: Threshold[]) => {
    setOwn(next);
    onChange?.(next);
  };
  const tell = (event: ColorScaleChange) => setSpoken(formatAnnouncement(event));
  const shared: Shared = {
    stops,
    scale,
    format: formatValue,
    names: { ...toneNames, ...toneLabels },
    disabled: control.disabled,
    labels: {
      stop: stopLabel,
      from: fromLabel,
      color: colorLabel,
      name: nameLabel,
      remove: removeLabel,
      add: addLabel,
      reset: resetLabel,
      track: trackLabel,
    },
    canAdd: stops.length < maxStops && !!addStop(stops, scale),
    canRemove: stops.length > minStops,
    canReset: defaultValue && !sameStops(stops, normalizeStops(defaultValue, scale)),
    change,
    add: () => {
      const added = addStop(stops, scale);
      if (!added) return;
      change(added.stops);
      tell({ type: 'add', index: added.index });
      focusNext.current = (scope) => [rowOf(scope, added.index)?.querySelector('input')];
    },
    remove: (index) => {
      change(removeStop(stops, index, scale));
      tell({ type: 'remove', index });
      const stays = Math.min(index, stops.length - 2);
      // The remove button of the row that takes its place, which is the last button of that row.
      focusNext.current = (scope) => [
        [...(rowOf(scope, stays)?.querySelectorAll<HTMLElement>('button') ?? [])].at(-1),
        addButton(scope),
      ];
    },
    reset: () => {
      if (!defaultValue) return;
      change(normalizeStops(defaultValue, scale));
      tell({ type: 'reset' });
      focusNext.current = (scope) => [addButton(scope)];
    },
  };
  return (
    <div
      ref={root}
      id={control.id}
      role="group"
      aria-disabled={control.disabled || undefined}
      data-umbra="color-scale-editor"
      data-readonly={readOnly || undefined}
      data-disabled={control.disabled || undefined}
      data-invalid={control.invalid || undefined}
      aria-label={ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={control.describedBy}
      className={cx(styles.root, className)}
      style={style}
    >
      {/* The controls inside are named here, not by the field around the editor. */}
      <FieldContext value={noField}>
        <Context value={shared}>{children}</Context>
      </FieldContext>
      {name && <input type="hidden" name={name} value={JSON.stringify(stops)} disabled={control.disabled} />}
      <span role="status" className={styles.spoken}>
        {spoken}
      </span>
    </div>
  );
}

export interface ColorScaleBlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** A chip of a stop's colour, with the pattern the meters draw over it: the cue that is not colour. */
function Chip({ stop, index, count }: { stop: Threshold; index: number; count: number }) {
  return (
    <span
      data-part="chip"
      data-pattern={bandPattern({ cue: index, count })}
      data-look={lookOf(stop)}
      className={styles.chip}
      style={{ '--paint': bandColour(stop) } as CSSProperties}
    />
  );
}

/** The row of numbered swatches: each stop's colour and pattern, its boundary, and its label. */
function Preview({ className, style }: ColorScaleBlockProps) {
  const editor = useEditor('Preview');
  return (
    <ol data-part="preview" className={cx(styles.preview, className)} style={style}>
      {editor.stops.map((stop, index) => (
        <li key={index} data-part="swatch" data-band={index} className={styles.swatch}>
          <Chip stop={stop} index={index} count={editor.stops.length} />
          <span data-part="from" className={styles.from}>
            {editor.format(stop.from)}
          </span>
          {stop.label && (
            <span data-part="label" className={styles.label}>
              {stop.label}
            </span>
          )}
          <span className={styles.spoken}>
            , {lookOf(stop) === 'custom' ? stop.color : editor.names[lookOf(stop) as ThresholdTone]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The scale as a bar of bands, with one handle on each boundary: drag it, or use the arrow keys. */
function Track({ className, style }: ColorScaleBlockProps) {
  const editor = useEditor('Track');
  const { stops, scale } = editor;
  const at = (value: number) => toFraction(value, scale.min, scale.max);
  const bands = stops.map((stop, index) => (
    <span
      key={index}
      data-part="band"
      data-pattern={bandPattern({ cue: index, count: stops.length })}
      data-look={lookOf(stop)}
      className={styles.band}
      style={
        {
          '--from': at(stop.from),
          '--to': at(stops[index + 1]?.from ?? scale.max),
          '--paint': bandColour(stop),
        } as CSSProperties
      }
    />
  ));
  const moved = (values: number[]) => {
    const index = values.findIndex((v, i) => v !== stops[i + 1]!.from);
    if (index >= 0) editor.change(moveStop(stops, index + 1, values[index]!, scale));
  };
  if (stops.length < 2)
    return (
      <div data-part="track" className={cx(styles.track, className)} style={style}>
        <div className={styles.rail}>
          <span className={styles.bands}>{bands}</span>
        </div>
      </div>
    );
  return (
    <AriaSlider<number[]>
      data-part="track"
      aria-label={editor.labels.track}
      minValue={scale.min}
      maxValue={scale.max}
      step={scale.step}
      value={stops.slice(1).map((stop) => stop.from)}
      onChange={moved}
      isDisabled={editor.disabled}
      {...defined({ className: cx(styles.track, className), style })}
    >
      <AriaSliderTrack {...defined({ className: styles.rail })}>
        <span className={styles.bands}>{bands}</span>
        {stops.slice(1).map((_, i) => (
          <AriaSliderThumb
            key={i}
            index={i}
            data-part="handle"
            aria-label={`${editor.labels.stop} ${i + 2}`}
            {...defined({ className: styles.handle })}
          />
        ))}
      </AriaSliderTrack>
    </AriaSlider>
  );
}

function Stop({ index }: { index: number }) {
  const editor = useEditor('Stops');
  const { stops, scale, labels, names, disabled } = editor;
  const stop = stops[index]!;
  const [low, high] = boundsOf(stops, index, scale);
  // What is typed is kept until it is a boundary the scale allows; leaving the field settles it.
  const [draft, setDraft] = useState<string>();
  const named = (what: string) => `${labels.stop} ${index + 1}: ${what}`;
  const update = (patch: Partial<Threshold>) =>
    editor.change(stops.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const typed = (text: string) => {
    setDraft(text);
    const number = Number(text);
    if (text.trim() !== '' && number >= low && number <= high)
      editor.change(moveStop(stops, index, number, scale));
  };
  const settle = () => {
    if (draft !== undefined && draft.trim() !== '' && !Number.isNaN(Number(draft)))
      editor.change(moveStop(stops, index, Number(draft), scale));
    setDraft(undefined);
  };
  const swatch = (color: string | undefined) => (color === undefined ? {} : { color });
  const options: SelectEntry[] = [
    {
      type: 'section',
      options: ramp.map((id) => ({ id, label: names[id], ...swatch(bandColour({ tone: id })) })),
    },
    {
      type: 'section',
      options: tones.map((id) => ({ id, label: names[id], ...swatch(bandColour({ tone: id })) })),
    },
    {
      type: 'section',
      options: [
        { id: 'custom', label: names.custom, ...swatch(stop.color) },
        { id: 'default', label: names.default },
      ],
    },
  ];
  const look = lookOf(stop);
  return (
    <div
      role="group"
      aria-label={`${labels.stop} ${index + 1}`}
      data-part="stop"
      data-index={index}
      className={styles.stop}
    >
      <span className={styles.number} aria-hidden="true">
        <Chip stop={stop} index={index} count={stops.length} />
        {index + 1}
      </span>
      <span
        className={styles.fromField}
        onBlur={settle}
        onKeyDown={(event) => {
          if (event.key === 'Enter') settle();
        }}
      >
        <TextField
          type="number"
          aria-label={named(labels.from)}
          value={draft ?? String(stop.from)}
          onChange={typed}
          // The first stop is the bottom of the scale.
          readOnly={index === 0}
          invalid={draft !== undefined && !(Number(draft) >= low && Number(draft) <= high)}
          disabled={disabled}
        />
      </span>
      <span className={styles.colorField}>
        <Select
          aria-label={named(labels.color)}
          fullWidth
          options={options}
          value={look}
          disabled={disabled}
          onChange={(id) => {
            if (id === 'custom') update({ color: hex(stop.color), tone: undefined });
            else if (id === 'default') update({ color: undefined, tone: undefined });
            else if (id) update({ tone: id as ThresholdTone, color: undefined });
          }}
        />
        {look === 'custom' && (
          <input
            type="color"
            data-part="color"
            aria-label={named(names.custom)}
            value={hex(stop.color)}
            disabled={disabled}
            onChange={(event) => update({ color: event.target.value })}
            className={styles.color}
          />
        )}
      </span>
      <span className={styles.nameField}>
        <TextField
          aria-label={named(labels.name)}
          placeholder={labels.name}
          value={stop.label ?? ''}
          onChange={(text) => update({ label: text || undefined })}
          disabled={disabled}
        />
      </span>
      <IconButton
        icon={<RawIcon name="close" />}
        label={named(labels.remove)}
        disabled={disabled || !editor.canRemove}
        onPress={() => editor.remove(index)}
      />
    </div>
  );
}

/** One row per stop: its boundary, its colour, its label, and a button that removes it. */
function Stops({ className, style }: ColorScaleBlockProps) {
  const editor = useEditor('Stops');
  return (
    <div data-part="stops" className={cx(styles.stops, className)} style={style}>
      {editor.stops.map((_, index) => (
        <Stop key={index} index={index} />
      ))}
    </div>
  );
}

/** Add a stop, and go back to `defaultValue`. */
function Actions({ className, style }: ColorScaleBlockProps) {
  const editor = useEditor('Actions');
  return (
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      <Button disabled={editor.disabled || !editor.canAdd} onPress={editor.add}>
        {editor.labels.add}
      </Button>
      {editor.canReset !== undefined && (
        <Button variant="ghost" disabled={editor.disabled || !editor.canReset} onPress={editor.reset}>
          {editor.labels.reset}
        </Button>
      )}
    </div>
  );
}

export interface ColorScaleEditorProps extends Omit<ColorScaleEditorRootProps, 'children'> {
  /** Replace or hide named pieces. */
  parts?:
    | {
        preview?: Part<ColorScaleBlockProps> | undefined;
        track?: Part<ColorScaleBlockProps> | undefined;
        stops?: Part<ColorScaleBlockProps> | undefined;
        actions?: Part<ColorScaleBlockProps> | undefined;
      }
    | undefined;
}

/**
 * Edits a scale of value bands and their colours: the `thresholds` that `ValuePill`, `ProgressBar`,
 * `LevelMeter`, `BarChart` and `DonutChart` take. With `readOnly` it is the preview row alone.
 */
export function ColorScaleEditor({ parts, ...root }: ColorScaleEditorProps) {
  return (
    <Root {...root}>
      {renderPart(parts?.preview, {}, (p) => (
        <Preview {...p} />
      ))}
      {!root.readOnly && (
        <>
          {renderPart(parts?.track, {}, (p) => (
            <Track {...p} />
          ))}
          {renderPart(parts?.stops, {}, (p) => (
            <Stops {...p} />
          ))}
          {renderPart(parts?.actions, {}, (p) => (
            <Actions {...p} />
          ))}
        </>
      )}
    </Root>
  );
}

ColorScaleEditor.Root = Root;
ColorScaleEditor.Preview = Preview;
ColorScaleEditor.Track = Track;
ColorScaleEditor.Stops = Stops;
ColorScaleEditor.Actions = Actions;
