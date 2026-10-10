import { CircleAlert } from 'lucide-react';
import { createContext, useContext, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Input as AriaInput,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
} from 'react-aria-components';
import { ButtonBase } from '../basics/Button';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import type { BlockProps } from './fieldParts';
import styles from './TextField.module.css';
import { useFieldControl } from './useField';

interface TextFieldContextValue {
  multiline: boolean;
  rows: number;
  placeholder?: string;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  canClear: boolean;
  clear: () => void;
}
const TextFieldContext = createContext<TextFieldContextValue | null>(null);
function useTextField() {
  const field = useContext(TextFieldContext);
  if (!field) throw new Error('TextField blocks must be rendered inside <TextField.Root>.');
  return field;
}

export interface TextFieldRootProps extends BlockProps {
  /** Controlled text. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Several lines: a text area of `rows` lines. */
  multiline?: boolean;
  /** Visible lines of a `multiline` field. */
  rows?: number;
  type?: 'text' | 'number' | 'password' | 'email' | 'url';
  placeholder?: string;
  disabled?: boolean;
  /** Focusable and selectable, but cannot be changed. */
  readOnly?: boolean;
  /** Shows the danger border and an error icon. Put the message in the `error` of a `FormField`. */
  invalid?: boolean;
  required?: boolean;
  /** `small` is for use inside table cells. Otherwise the height follows the density level. */
  size?: 'default' | 'small';
  /** Form field name. */
  name?: string;
  /** The browser's autofill hint, for example `email` or `off`. */
  autoComplete?: string;
  maxLength?: number;
  id?: string;
  /** Accessible name of a field that has no `FormField` label. */
  'aria-label'?: string;
}

function Root({
  value,
  defaultValue = '',
  onChange,
  multiline = false,
  rows = 3,
  type = 'text',
  placeholder,
  disabled,
  readOnly,
  invalid,
  required,
  size = 'default',
  name,
  autoComplete,
  maxLength,
  id,
  'aria-label': ariaLabel,
  className,
  style,
  children,
}: TextFieldRootProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const control = useFieldControl({ id, disabled, invalid, required });
  const change = (next: string) => {
    setUncontrolled(next);
    onChange?.(next);
  };
  return (
    <AriaTextField
      data-umbra="text-field"
      data-size={size}
      data-multiline={multiline || undefined}
      className={cx(styles.root, className)}
      style={style}
      value={current}
      onChange={change}
      type={type}
      isDisabled={control.disabled}
      isReadOnly={readOnly}
      isInvalid={control.invalid}
      isRequired={control.required}
      name={name}
      autoComplete={autoComplete}
      maxLength={maxLength}
      id={control.id}
      aria-label={ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={control.describedBy}
      // A click on the padding, the prefix or the suffix puts the caret in the field.
      onClick={(event) => {
        if (!(event.target as Element).closest('button, a, input, textarea')) inputRef.current?.focus();
      }}
    >
      <TextFieldContext
        value={{
          multiline,
          rows,
          placeholder,
          inputRef,
          canClear: current !== '' && !control.disabled && !readOnly,
          clear: () => {
            change('');
            inputRef.current?.focus();
          },
        }}
      >
        {children}
      </TextFieldContext>
    </AriaTextField>
  );
}

/** The text box itself: an `<input>`, or a `<textarea>` in a `multiline` field. */
function Input({ className, style }: Omit<BlockProps, 'children'>) {
  const { multiline, rows, placeholder, inputRef } = useTextField();
  const shared = { 'data-part': 'input', className: cx(styles.input, className), style, placeholder };
  return multiline ? (
    <AriaTextArea {...shared} rows={rows} ref={inputRef as RefObject<HTMLTextAreaElement>} />
  ) : (
    <AriaInput {...shared} ref={inputRef as RefObject<HTMLInputElement>} />
  );
}

/** Text or an icon before the text: a unit, a currency sign, a search icon. */
function Prefix({ className, style, children }: BlockProps) {
  return (
    <span data-part="prefix" className={cx(styles.affix, className)} style={style}>
      {children}
    </span>
  );
}

/** Text, an icon or a small control after the text. */
function Suffix({ className, style, children }: BlockProps) {
  return (
    <span data-part="suffix" className={cx(styles.affix, className)} style={style}>
      {children}
    </span>
  );
}

/** The icon an invalid field shows, so the state does not depend on the border colour. */
function InvalidIcon({ className, style, children }: BlockProps) {
  return (
    <span data-part="invalidIcon" className={cx(styles.invalidIcon, className)} style={style}>
      <IconSlot>{children ?? <CircleAlert />}</IconSlot>
    </span>
  );
}

export interface TextFieldClearProps {
  /** Accessible name of the button. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** The button that empties the field. It is rendered only while there is text to clear. */
function Clear({ label = 'Clear', className, style }: TextFieldClearProps) {
  const { canClear, clear } = useTextField();
  if (!canClear) return null;
  return (
    <span data-part="clear" className={cx(styles.clear, className)} style={style}>
      <ButtonBase umbra="icon-button" variant="ghost" size="small" iconOnly label={label} onPress={clear}>
        <Icon name="close" />
      </ButtonBase>
    </span>
  );
}

export interface TextFieldProps extends Omit<TextFieldRootProps, 'children'> {
  /** Text or an icon before the text. */
  prefix?: ReactNode;
  /** Text, an icon or a small control after the text. */
  suffix?: ReactNode;
  /** Shows a button that empties the field while it holds text. */
  clearable?: boolean;
  /** Accessible name of the clear button. */
  clearLabel?: string;
  /** Replace or hide named pieces. */
  parts?: {
    prefix?: Part<{ children: ReactNode }>;
    input?: Part<Omit<BlockProps, 'children'>>;
    invalidIcon?: Part<BlockProps>;
    clear?: Part<TextFieldClearProps>;
    suffix?: Part<{ children: ReactNode }>;
  };
}

/** A box for typing one line of text, or several with `multiline`. */
export function TextField({ prefix, suffix, clearable = false, clearLabel, parts, ...root }: TextFieldProps) {
  return (
    <Root {...root}>
      {prefix != null &&
        renderPart(parts?.prefix, { children: prefix }, (p) => <Prefix>{p.children}</Prefix>)}
      {renderPart(parts?.input, {}, (p) => (
        <Input {...p} />
      ))}
      {renderPart(parts?.invalidIcon, {}, (p) => (
        <InvalidIcon {...p} />
      ))}
      {clearable && renderPart(parts?.clear, { label: clearLabel }, (p) => <Clear {...p} />)}
      {suffix != null &&
        renderPart(parts?.suffix, { children: suffix }, (p) => <Suffix>{p.children}</Suffix>)}
    </Root>
  );
}

TextField.Root = Root;
TextField.Prefix = Prefix;
TextField.Input = Input;
TextField.InvalidIcon = InvalidIcon;
TextField.Clear = Clear;
TextField.Suffix = Suffix;
