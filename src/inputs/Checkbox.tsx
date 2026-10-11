import { createContext, useContext, type ReactNode } from 'react';
import { Checkbox as AriaCheckbox, CheckboxGroup as AriaCheckboxGroup } from 'react-aria-components';
import { RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Checkbox.module.css';
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
import { FieldContext, noField, useFieldControl } from './useField';

export interface CheckboxRootProps extends BlockProps {
  /** Controlled state. */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Shows the "some, not all" mark, whatever `checked` is. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Focusable, but cannot be changed. */
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** The text of the required marker after the label. */
  requiredLabel?: string;
  /** `small` is for use inside table cells. Otherwise the size follows the density level. */
  size?: 'default' | 'small';
  /** Form field name. */
  name?: string;
  /** The form value when checked; inside a `CheckboxGroup`, the entry in the group's `value`. */
  value?: string;
  id?: string;
  /** Accessible name of a checkbox that has no visible label. */
  'aria-label'?: string;
}

/**
 * Internal: makes the checkboxes below take their state from a React Aria collection row. `List` sets it
 * to `selection`, so the checkbox of a row is the row's selection control.
 */
export const CheckboxSlotContext = createContext<string | undefined>(undefined);

function Root({
  checked,
  defaultChecked,
  onChange,
  indeterminate,
  disabled,
  readOnly,
  invalid,
  required,
  requiredLabel = 'Required',
  size = 'default',
  name,
  value,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: CheckboxRootProps) {
  const slots = useTextSlots();
  const slot = useContext(CheckboxSlotContext);
  const control = useFieldControl({
    id,
    disabled,
    required,
    invalid: invalid || slots.hasError,
    labelledBy: slots.labelledBy,
    describedBy: [...slots.describedBy, useContext(GroupDescribedBy)],
  });
  return (
    <AriaCheckbox
      slot={slot}
      data-umbra="checkbox"
      data-size={size}
      className={cx(styles.root, className)}
      style={style}
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      isIndeterminate={indeterminate}
      isDisabled={control.disabled}
      isReadOnly={readOnly}
      // Only when set here or by a field: a `false` would hide what the group says. In a required
      // group each box is required while none is checked, which is what holds the form back.
      isInvalid={control.invalid || undefined}
      isRequired={control.required || undefined}
      name={name}
      value={value}
      id={control.id}
      aria-label={ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={control.describedBy}
    >
      <TextSlotsProvider
        value={{ ...slots, marker: required && <Marker kind="required">{requiredLabel}</Marker> }}
      >
        {children}
      </TextSlotsProvider>
    </AriaCheckbox>
  );
}

/** The box. Without children it holds the check mark and the indeterminate mark. */
function Box({ className, style, children }: BlockProps) {
  return (
    <span data-part="box" aria-hidden="true" className={cx(styles.box, className)} style={style}>
      {children ?? (
        <>
          <span className={styles.check}>
            <RawIcon name="check" />
          </span>
          <span className={styles.dash}>
            <RawIcon name="indeterminate" />
          </span>
        </>
      )}
    </span>
  );
}

function Label(props: BlockProps) {
  return <SlotLabel {...props} className={cx(styles.text, props.className)} />;
}

function Description(props: BlockProps) {
  return <SlotDescription {...props} className={cx(styles.text, props.className)} />;
}

function ErrorText(props: BlockProps) {
  return <SlotError {...props} className={cx(styles.text, props.className)} />;
}

export interface CheckboxProps extends Omit<CheckboxRootProps, 'children'> {
  /** The label. */
  children?: ReactNode;
  /** A second line under the label. */
  description?: ReactNode;
  /** An error message under the checkbox, shown with an icon. Setting it makes the checkbox invalid. */
  error?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    box?: Part<BlockProps>;
    label?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
    error?: Part<{ children: ReactNode }>;
  };
}

/** A box that is checked or not: one yes-or-no choice, or one of several in a `CheckboxGroup`. */
export function Checkbox({ children, description, error, parts, ...root }: CheckboxProps) {
  return (
    <Root {...root} invalid={root.invalid || error != null}>
      {renderPart(parts?.box, {}, (p) => (
        <Box {...p} />
      ))}
      {children != null && renderPart(parts?.label, { children }, (p) => <Label>{p.children}</Label>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <Description>{p.children}</Description>
        ))}
      {error != null &&
        renderPart(parts?.error, { children: error }, (p) => <ErrorText>{p.children}</ErrorText>)}
    </Root>
  );
}

Checkbox.Root = Root;
Checkbox.Box = Box;
Checkbox.Label = Label;
Checkbox.Description = Description;
Checkbox.Error = ErrorText;

export interface CheckboxGroupRootProps extends BlockProps {
  /** Controlled: the `value` of every checked checkbox. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** `horizontal` puts the checkboxes on one line, wrapping when they do not fit. */
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** At least one checkbox must be checked. */
  required?: boolean;
  /** The text of the required marker after the group label. */
  requiredLabel?: string;
  /** Form field name of every checkbox in the group. */
  name?: string;
  id?: string;
  /** Accessible name of a group that has no visible label. */
  'aria-label'?: string;
}

function GroupRoot({
  value,
  defaultValue,
  onChange,
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
}: CheckboxGroupRootProps) {
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
    <AriaCheckboxGroup
      data-umbra="checkbox-group"
      data-orientation={orientation}
      className={cx(groupClass, className)}
      style={style}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
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
        {/* The group has taken the field around it; its checkboxes must not take it too. */}
        <FieldContext value={noField}>
          <GroupDescribedBy value={control.describedBy}>{children}</GroupDescribedBy>
        </FieldContext>
      </TextSlotsProvider>
    </AriaCheckboxGroup>
  );
}

function GroupLabel(props: BlockProps) {
  return <SlotLabel {...props} className={cx(groupLabelClass, props.className)} />;
}

export interface CheckboxGroupProps extends Omit<CheckboxGroupRootProps, 'children'> {
  /** The checkboxes. */
  children?: ReactNode;
  /** The group's label. */
  label?: ReactNode;
  /** A line under the label. */
  description?: ReactNode;
  /** An error message under the checkboxes, shown with an icon. Setting it makes the group invalid. */
  error?: ReactNode;
  /** Lays the checkboxes in a grid of at most this many columns; columns drop as the group narrows. */
  columns?: number;
  /** Replace or hide named pieces. */
  parts?: {
    label?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
    options?: Part<{ columns?: number; children: ReactNode }>;
    error?: Part<{ children: ReactNode }>;
  };
}

/** Several checkboxes that answer one question, with a shared label, description and error. */
export function CheckboxGroup({
  children,
  label,
  description,
  error,
  columns,
  parts,
  ...root
}: CheckboxGroupProps) {
  return (
    <GroupRoot {...root} invalid={root.invalid || error != null}>
      {label != null &&
        renderPart(parts?.label, { children: label }, (p) => <GroupLabel>{p.children}</GroupLabel>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <SlotDescription>{p.children}</SlotDescription>
        ))}
      {renderPart(parts?.options, { columns, children }, (p) => (
        <GroupOptions {...p} />
      ))}
      {error != null &&
        renderPart(parts?.error, { children: error }, (p) => <SlotError>{p.children}</SlotError>)}
    </GroupRoot>
  );
}

CheckboxGroup.Root = GroupRoot;
CheckboxGroup.Label = GroupLabel;
CheckboxGroup.Description = SlotDescription;
CheckboxGroup.Options = GroupOptions;
CheckboxGroup.Error = SlotError;
