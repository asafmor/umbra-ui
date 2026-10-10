import { createContext, useContext, type ReactNode } from 'react';
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';
import { cx, renderPart, type Part } from '../utils/parts';
import {
  GroupDescribedBy,
  GroupOptions,
  groupClass,
  groupLabelClass,
  Marker,
  SlotDescription,
  SlotError,
  SlotLabel,
  TextSlotsProvider,
  useTextSlots,
  type BlockProps,
} from './fieldParts';
import styles from './Radio.module.css';
import { FieldContext, noField, useFieldControl } from './useField';

export type RadioVariant = 'default' | 'card';

const VariantContext = createContext<RadioVariant>('default');

export interface RadioRootProps extends BlockProps {
  /** What the group's `value` is when this option is chosen. */
  value: string;
  disabled?: boolean;
  /** Accessible name of an option that has no visible label. */
  'aria-label'?: string;
}

function Root({ value, disabled, 'aria-label': ariaLabel, className, style, children }: RadioRootProps) {
  const slots = useTextSlots();
  const describedBy = [...slots.describedBy, useContext(GroupDescribedBy)].filter(Boolean).join(' ');
  return (
    <AriaRadio
      data-umbra="radio"
      data-variant={useContext(VariantContext)}
      className={cx(styles.root, className)}
      style={style}
      value={value}
      isDisabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={slots.labelledBy || undefined}
      aria-describedby={describedBy || undefined}
    >
      <TextSlotsProvider value={slots}>{children}</TextSlotsProvider>
    </AriaRadio>
  );
}

/** The ring; it holds a dot while the option is chosen. */
function Mark({ className, style, children }: BlockProps) {
  return (
    <span data-part="mark" aria-hidden="true" className={cx(styles.mark, className)} style={style}>
      {children ?? <span className={styles.ring} />}
    </span>
  );
}

/** An icon or a small image; shown by the `card` variant. */
function Media({ className, style, children }: BlockProps) {
  return (
    <span data-part="media" aria-hidden="true" className={cx(styles.media, className)} style={style}>
      {children}
    </span>
  );
}

function Label(props: BlockProps) {
  return <SlotLabel {...props} className={cx(styles.label, props.className)} />;
}

function Description(props: BlockProps) {
  return <SlotDescription {...props} className={cx(styles.description, props.className)} />;
}

export interface RadioProps extends Omit<RadioRootProps, 'children'> {
  /** The label; the title of a `card` option. */
  children?: ReactNode;
  /** A second line under the label. */
  description?: ReactNode;
  /** An icon or a small image, shown by the `card` variant. It hides when the card is narrow. */
  media?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    mark?: Part<BlockProps>;
    media?: Part<{ children: ReactNode }>;
    label?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
  };
}

/** One option of a `RadioGroup`. */
export function Radio({ children, description, media, parts, ...root }: RadioProps) {
  const card = useContext(VariantContext) === 'card';
  return (
    <Root {...root}>
      {renderPart(parts?.mark, {}, (p) => (
        <Mark {...p} />
      ))}
      {card &&
        media != null &&
        renderPart(parts?.media, { children: media }, (p) => <Media>{p.children}</Media>)}
      {children != null && renderPart(parts?.label, { children }, (p) => <Label>{p.children}</Label>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <Description>{p.children}</Description>
        ))}
    </Root>
  );
}

Radio.Root = Root;
Radio.Mark = Mark;
Radio.Media = Media;
Radio.Label = Label;
Radio.Description = Description;

export interface RadioGroupRootProps extends BlockProps {
  /** Controlled: the `value` of the chosen option. */
  value?: string | null;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** `default`: a dot and a label. `card`: a bordered tile with a title, a description and an icon. */
  variant?: RadioVariant;
  /** The direction of the options, and of the arrow keys that move between them. */
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** The text of the required marker after the group label. */
  requiredLabel?: string;
  /** Form field name. */
  name?: string;
  id?: string;
  /** Accessible name of a group that has no visible label. */
  'aria-label'?: string;
}

function GroupRoot({
  value,
  defaultValue,
  onChange,
  variant = 'default',
  orientation = 'vertical',
  disabled,
  readOnly,
  invalid,
  required,
  requiredLabel = 'Required',
  name,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: RadioGroupRootProps) {
  const slots = useTextSlots();
  const control = useFieldControl({
    id,
    disabled,
    required,
    invalid: invalid || slots.hasError,
    labelledBy: slots.labelledBy,
    describedBy: slots.describedBy,
  });
  return (
    <AriaRadioGroup
      data-umbra="radio-group"
      data-variant={variant}
      className={cx(groupClass, className)}
      style={style}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      orientation={orientation}
      isDisabled={control.disabled}
      isReadOnly={readOnly}
      isInvalid={control.invalid}
      isRequired={control.required}
      name={name}
      id={control.id}
      aria-label={ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={control.describedBy}
    >
      <TextSlotsProvider
        value={{ ...slots, marker: required && <Marker kind="required">{requiredLabel}</Marker> }}
      >
        <VariantContext value={variant}>
          {/* The group has taken the field around it; nothing inside it should take it too. */}
          <FieldContext value={noField}>
            <GroupDescribedBy value={control.describedBy}>{children}</GroupDescribedBy>
          </FieldContext>
        </VariantContext>
      </TextSlotsProvider>
    </AriaRadioGroup>
  );
}

function GroupLabel(props: BlockProps) {
  return <SlotLabel {...props} className={cx(groupLabelClass, props.className)} />;
}

export interface RadioGroupProps extends Omit<RadioGroupRootProps, 'children'> {
  /** The options. */
  children?: ReactNode;
  /** The group's label. */
  label?: ReactNode;
  /** A line under the label. */
  description?: ReactNode;
  /** An error message under the options, shown with an icon. Setting it makes the group invalid. */
  error?: ReactNode;
  /**
   * Lays the options in a grid of at most this many columns; columns drop as the group narrows.
   * `card` options are always in a grid, of one column by default.
   */
  columns?: number;
  /** Replace or hide named pieces. */
  parts?: {
    label?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
    options?: Part<{ columns?: number; children: ReactNode }>;
    error?: Part<{ children: ReactNode }>;
  };
}

/** A choice of exactly one option among a few, all visible at once. */
export function RadioGroup({
  children,
  label,
  description,
  error,
  columns,
  parts,
  ...root
}: RadioGroupProps) {
  const grid = columns ?? (root.variant === 'card' ? 1 : undefined);
  return (
    <GroupRoot {...root} invalid={root.invalid || error != null}>
      {label != null &&
        renderPart(parts?.label, { children: label }, (p) => <GroupLabel>{p.children}</GroupLabel>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <SlotDescription>{p.children}</SlotDescription>
        ))}
      {renderPart(parts?.options, { columns: grid, children }, (p) => (
        <GroupOptions {...p} />
      ))}
      {error != null &&
        renderPart(parts?.error, { children: error }, (p) => <SlotError>{p.children}</SlotError>)}
    </GroupRoot>
  );
}

RadioGroup.Root = GroupRoot;
RadioGroup.Label = GroupLabel;
RadioGroup.Description = SlotDescription;
RadioGroup.Options = GroupOptions;
RadioGroup.Error = SlotError;
