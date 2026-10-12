import { createContext, useContext, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { focusableIn } from '../internal/focus';
import { IconSlot, RawIcon } from '../provider/icons';
import { cx } from '../utils/parts';
import styles from './fieldParts.module.css';
import { useMounted } from './useField';

// Internal: the label, description and error text shared by FormField, the groups and the single
// controls, and the ids that tie them to the control for a screen reader.

export interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface TextSlots {
  labelId: string;
  descriptionId: string;
  errorId: string;
  setLabel: (mounted: boolean) => void;
  setDescription: (mounted: boolean) => void;
  setError: (mounted: boolean) => void;
  /** The label's id while a label block is rendered. */
  labelledBy: string | false;
  /** The ids of the description and error blocks that are rendered. */
  describedBy: (string | false)[];
  hasDescription: boolean;
  hasError: boolean;
  /** Shown after the label: the "required" or "optional" marker. */
  marker?: ReactNode | undefined;
  /** The label is a `<label>` for this id. */
  htmlFor?: string | undefined;
}

/**
 * The ids of a group's description and error. Each option of the group adds them to its own
 * description, so they are heard on the option that has focus.
 */
export const GroupDescribedBy = createContext<string | undefined>(undefined);

const TextSlotsContext = createContext<TextSlots | null>(null);
export const TextSlotsProvider = TextSlotsContext.Provider;

/** The ids of one control's text blocks, and which of them are rendered. */
export function useTextSlots(): TextSlots {
  const id = useId();
  const [hasLabel, setLabel] = useState(false);
  const [hasDescription, setDescription] = useState(false);
  const [hasError, setError] = useState(false);
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  return {
    labelId,
    descriptionId,
    errorId,
    setLabel,
    setDescription,
    setError,
    labelledBy: hasLabel && labelId,
    describedBy: [hasDescription && descriptionId, hasError && errorId],
    hasDescription,
    hasError,
  };
}

function useSlots(block: string) {
  const slots = useContext(TextSlotsContext);
  if (!slots) throw new Error(`${block} must be rendered inside its Root block.`);
  return slots;
}

/** The "required" or "optional" text after a label. `required` is hidden from screen readers: the control says it. */
export function Marker({ kind, children }: { kind: 'required' | 'optional'; children: ReactNode }) {
  return (
    <span
      data-part="marker"
      data-kind={kind}
      aria-hidden={kind === 'required' || undefined}
      className={styles.marker}
    >
      {children}
    </span>
  );
}

export function SlotLabel({ className, style, children }: BlockProps) {
  const slots = useSlots('Label');
  useMounted(slots.setLabel);
  const props = {
    id: slots.labelId,
    'data-part': 'label',
    className: cx(styles.label, className),
    style,
  };
  const content = (
    <>
      {children}
      {/* The space keeps the marker a separate word in the accessible name. */}
      {slots.marker && <> {slots.marker}</>}
    </>
  );
  return slots.htmlFor ? (
    <label
      {...props}
      htmlFor={slots.htmlFor}
      // A `<label>` only activates a native control. A control that is not one takes the focus here, as
      // a press on the label of an input gives it: the element itself (the value of a `Stepper`, a spin
      // button), or, for a group (radios, a `Slider`, a `StarRating`), its tab stop: the chosen option,
      // or else the first control in it.
      onClick={(event) => {
        const control = document.getElementById(slots.htmlFor!);
        if (event.defaultPrevented || !control || control.matches('button, input, select, textarea')) return;
        if (control.tabIndex >= 0) return control.focus();
        const inside = focusableIn(control).filter((el) => el.tabIndex >= 0);
        (inside.find((el) => el.matches('input:checked')) ?? inside[0])?.focus();
      }}
    >
      {content}
    </label>
  ) : (
    <span {...props}>{content}</span>
  );
}

export function SlotDescription({ className, style, children }: BlockProps) {
  const slots = useSlots('Description');
  useMounted(slots.setDescription);
  return (
    <span
      id={slots.descriptionId}
      data-part="description"
      className={cx(styles.description, className)}
      style={style}
    >
      {children}
    </span>
  );
}

/** The error text, with an icon so it does not depend on colour. */
export function SlotError({ className, style, children }: BlockProps) {
  const slots = useSlots('Error');
  useMounted(slots.setError);
  return (
    <span id={slots.errorId} data-part="error" className={cx(styles.error, className)} style={style}>
      <IconSlot>
        <RawIcon name="invalid" />
      </IconSlot>
      <span>{children}</span>
    </span>
  );
}

/** Holds the options of a group. `columns` lays them in a grid that drops columns as it narrows. */
export function GroupOptions({
  columns,
  className,
  style,
  children,
}: BlockProps & { columns?: number | undefined }) {
  return (
    <div
      data-part="options"
      data-columns={columns}
      className={cx(styles.options, className)}
      style={{ ...(columns && { ['--columns' as string]: columns }), ...style }}
    >
      {children}
    </div>
  );
}

export const groupClass = styles.group;
export const groupLabelClass = styles.groupLabel;
