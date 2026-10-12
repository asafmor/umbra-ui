import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Checkbox as AriaCheckbox, CheckboxGroup as AriaCheckboxGroup } from 'react-aria-components';
import { RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import { useActionKind } from '../internal/contexts';
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
import { FieldContext, noField, ReportValidation, useFieldControl, useReport } from './useField';
import { defined } from '../utils/defined';
import { rootRender } from '../utils/passThrough';

export interface CheckboxRootProps extends BlockProps {
  /** Controlled state. */
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  onChange?: ((checked: boolean) => void) | undefined;
  /** Shows the "some, not all" mark, whatever `checked` is. */
  indeterminate?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Focusable, but cannot be changed. */
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** The text of the required marker after the label. */
  requiredLabel?: string | undefined;
  /** `small` is for use inside table cells. Otherwise the size follows the density level. */
  size?: 'default' | 'small' | undefined;
  /** Form field name. */
  name?: string | undefined;
  /** The form value when checked; inside a `CheckboxGroup`, the entry in the group's `value`. */
  value?: string | undefined;
  id?: string | undefined;
  /** Accessible name of a checkbox that has no visible label. */
  'aria-label'?: string | undefined;
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
  ...rest
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
  // The browser's message for a required box left unchecked when the form is submitted: the field
  // around the checkbox shows it. React Aria marks the box invalid but does not hand the message on.
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  useReport(message);
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const found = () => setMessage(el.validationMessage);
    const changed = () => el.validity.valid && setMessage(null);
    const reset = () => setMessage(null);
    el.addEventListener('invalid', found);
    el.addEventListener('change', changed);
    el.form?.addEventListener('reset', reset);
    return () => {
      el.removeEventListener('invalid', found);
      el.removeEventListener('change', changed);
      el.form?.removeEventListener('reset', reset);
    };
  }, []);
  return (
    <AriaCheckbox
      inputRef={input}
      {...rootRender('label', rest)}
      {...defined({ slot })}
      data-umbra="checkbox"
      data-size={size}
      {...defined({
        className: cx(styles.root, className),
        style,
        isSelected: checked,
        defaultSelected: defaultChecked,
        onChange,
        isIndeterminate: indeterminate,
      })}
      isDisabled={control.disabled}
      {...defined({
        isReadOnly: readOnly,
        isInvalid: control.invalid || undefined,
        isRequired: control.required || undefined,
        name,
        value,
        id: control.id,
        'aria-label': ariaLabel,
        'aria-labelledby': control.labelledBy,
        'aria-describedby': control.describedBy,
      })}
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
  children?: ReactNode | undefined;
  /** A second line under the label. */
  description?: ReactNode | undefined;
  /** An error message under the checkbox, shown with an icon. Setting it makes the checkbox invalid. */
  error?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        box?: Part<BlockProps> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        description?: Part<{ children: ReactNode }> | undefined;
        error?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** A box that is checked or not: one yes-or-no choice, or one of several in a `CheckboxGroup`. */
export function Checkbox({ children, description, error, parts, ...root }: CheckboxProps) {
  useActionKind('stays');
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

/** Not a row of a menu: among actions that overflow it stays in the row (`ActionsOverflow`). */
Checkbox.staysInRow = true;
Checkbox.Root = Root;
Checkbox.Box = Box;
Checkbox.Label = Label;
Checkbox.Description = Description;
Checkbox.Error = ErrorText;

export interface CheckboxGroupRootProps extends BlockProps {
  /** Controlled: the `value` of every checked checkbox. */
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  /** `horizontal` puts the checkboxes on one line, wrapping when they do not fit. */
  orientation?: 'vertical' | 'horizontal' | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  /** At least one checkbox must be checked. */
  required?: boolean | undefined;
  /** The text of the required marker after the group label. */
  requiredLabel?: string | undefined;
  /** Form field name of every checkbox in the group. */
  name?: string | undefined;
  id?: string | undefined;
  /** Accessible name of a group that has no visible label. */
  'aria-label'?: string | undefined;
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
  ...rest
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
      {...rootRender('div', rest)}
      data-umbra="checkbox-group"
      data-orientation={orientation}
      {...defined({ className: cx(groupClass, className), style, value, defaultValue, onChange })}
      isDisabled={control.disabled}
      {...defined({ isReadOnly: readOnly })}
      // Only when it is set: a `false` would tell React Aria that the app decides, and silence the
      // control's own validation (required, on submit).
      {...defined({ isInvalid: control.invalid || undefined })}
      isRequired={control.required}
      {...defined({
        name,
        id: control.id,
        'aria-label': ariaLabel,
        'aria-labelledby': control.labelledBy,
        'aria-describedby': control.describedBy,
      })}
    >
      <ReportValidation />
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
  children?: ReactNode | undefined;
  /** The group's label. */
  label?: ReactNode | undefined;
  /** A line under the label. */
  description?: ReactNode | undefined;
  /** An error message under the checkboxes, shown with an icon. Setting it makes the group invalid. */
  error?: ReactNode | undefined;
  /** Lays the checkboxes in a grid of at most this many columns; columns drop as the group narrows. */
  columns?: number | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        label?: Part<{ children: ReactNode }> | undefined;
        description?: Part<{ children: ReactNode }> | undefined;
        options?: Part<{ columns?: number | undefined; children: ReactNode }> | undefined;
        error?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
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
