import { useId, type ReactNode } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
import {
  Marker,
  SlotDescription,
  SlotError,
  SlotLabel,
  TextSlotsProvider,
  useTextSlots,
  type BlockProps,
} from './fieldParts';
import styles from './FormField.module.css';
import { FieldContext, useField, type FieldState } from './useField';

export interface FormFieldRootProps extends BlockProps {
  /**
   * `row`: label and description at the start, control at the end, as in a settings list.
   * `stacked`: label above the control. `inline`: label and control on one line, the description
   * and error under the control. `row` and `inline` stack when the field is narrow.
   */
  layout?: 'row' | 'stacked' | 'inline';
  /** The width of the label column of a `row` or `inline` field: a number of pixels, or any CSS width. */
  labelWidth?: number | string;
  /** Gives the field its own raised surface and padding, as the rows of a settings list have. */
  surface?: boolean;
  /** Marks the control invalid. Set by itself when the field has an error. */
  invalid?: boolean;
  /** Marks the control required and shows the required marker. */
  required?: boolean;
  /** Shows the optional marker. */
  optional?: boolean;
  /** The text of the required marker. */
  requiredLabel?: string;
  /** The text of the optional marker. */
  optionalLabel?: string;
  /** Disables the control. */
  disabled?: boolean;
  /** The id of the control. Generated when not set. */
  id?: string;
}

function Root({
  layout = 'row',
  labelWidth,
  surface = false,
  invalid = false,
  required = false,
  optional = false,
  requiredLabel = 'Required',
  optionalLabel = 'Optional',
  disabled = false,
  id,
  className,
  style,
  children,
}: FormFieldRootProps) {
  const auto = useId();
  const slots = useTextSlots();
  const field: FieldState = {
    id: id ?? `${auto}-control`,
    labelId: slots.labelId,
    descriptionId: slots.hasDescription ? slots.descriptionId : undefined,
    errorId: slots.hasError ? slots.errorId : undefined,
    invalid: invalid || slots.hasError,
    required,
    disabled,
  };
  const marker = required ? (
    <Marker kind="required">{requiredLabel}</Marker>
  ) : (
    optional && <Marker kind="optional">{optionalLabel}</Marker>
  );
  return (
    <div
      data-umbra="form-field"
      data-layout={layout}
      data-surface={surface || undefined}
      data-label-width={labelWidth !== undefined || undefined}
      data-invalid={field.invalid || undefined}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
      className={cx(styles.root, className)}
      style={{
        ...(labelWidth !== undefined && {
          ['--label-width' as string]: typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth,
        }),
        ...style,
      }}
    >
      <TextSlotsProvider value={{ ...slots, marker, htmlFor: field.id }}>
        <FieldContext value={field}>{children}</FieldContext>
      </TextSlotsProvider>
    </div>
  );
}

function Label(props: BlockProps) {
  return <SlotLabel {...props} className={cx(styles.label, props.className)} />;
}

function Description(props: BlockProps) {
  return <SlotDescription {...props} className={cx(styles.description, props.className)} />;
}

function ErrorText(props: BlockProps) {
  return <SlotError {...props} className={cx(styles.error, props.className)} />;
}

/** What a plain form element needs to belong to the field: spread it on an `<input>` or `<select>`. */
export interface FormFieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  required: boolean;
  disabled: boolean;
}

export interface FormFieldControlBlockProps extends Omit<BlockProps, 'children'> {
  /**
   * The control. An umbra-ui input picks up the field by itself. For a plain form element pass a
   * function and spread what it receives: `{(control) => <input {...control} />}`.
   */
  children?: ReactNode | ((control: FormFieldControlProps) => ReactNode);
}

function Control({ className, style, children }: FormFieldControlBlockProps) {
  const field = useField();
  return (
    <div data-part="control" className={cx(styles.control, className)} style={style}>
      {typeof children === 'function'
        ? children({
            id: field.id!,
            'aria-describedby': [field.descriptionId, field.errorId].filter(Boolean).join(' ') || undefined,
            'aria-invalid': field.invalid || undefined,
            required: field.required,
            disabled: field.disabled,
          })
        : children}
    </div>
  );
}

export interface FormFieldProps extends Omit<FormFieldRootProps, 'children'> {
  /** The control: an umbra-ui input, or a function for a plain form element. */
  children?: FormFieldControlBlockProps['children'];
  /** The label. A click on it focuses or toggles the control. */
  label?: ReactNode;
  /** A line that explains the setting. */
  description?: ReactNode;
  /** An error message, shown with an icon. Setting it makes the control invalid. */
  error?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    label?: Part<{ children: ReactNode }>;
    description?: Part<{ children: ReactNode }>;
    control?: Part<FormFieldControlBlockProps>;
    error?: Part<{ children: ReactNode }>;
  };
}

/** Pairs a label, a description and an error message with one control: a row of a form or settings list. */
export function FormField({ children, label, description, error, parts, ...root }: FormFieldProps) {
  return (
    <Root {...root} invalid={root.invalid || error != null}>
      {label != null && renderPart(parts?.label, { children: label }, (p) => <Label>{p.children}</Label>)}
      {description != null &&
        renderPart(parts?.description, { children: description }, (p) => (
          <Description>{p.children}</Description>
        ))}
      {renderPart(parts?.control, { children }, (p) => (
        <Control {...p} />
      ))}
      {error != null &&
        renderPart(parts?.error, { children: error }, (p) => <ErrorText>{p.children}</ErrorText>)}
    </Root>
  );
}

FormField.Root = Root;
FormField.Label = Label;
FormField.Description = Description;
FormField.Control = Control;
FormField.Error = ErrorText;
