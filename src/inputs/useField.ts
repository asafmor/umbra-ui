import { createContext, useContext, useEffect, useLayoutEffect, type RefObject } from 'react';
import { FieldErrorContext } from 'react-aria-components';

/**
 * Internal: what a `FormField` tells the control inside it. Outside a field every id is `undefined`
 * and every flag is `false`, so a control can read it without checking where it is.
 */
export interface FieldState {
  /** The id the control's focusable element takes; the field's `<label>` points to it. */
  id: string | undefined;
  /** The id of the field's label, for `aria-labelledby` on controls that are not a native input. */
  labelId: string | undefined;
  /** Set only while the field shows a description. */
  descriptionId: string | undefined;
  /** Set only while the field shows an error. */
  errorId: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /**
   * For a control that validates itself (a required `Select` on submit): the message to show as the
   * field's error, or null to take it away. The field shows it only while it has no error of its own.
   */
  report?: ((message: string | null) => void) | undefined;
}

export const noField: FieldState = {
  id: undefined,
  labelId: undefined,
  descriptionId: undefined,
  errorId: undefined,
  invalid: false,
  required: false,
  disabled: false,
};

/**
 * Internal: `FormField` provides it. A control that holds other controls (a group) consumes the field
 * itself and provides `noField` to its children, so they do not all take the same id.
 */
export const FieldContext = createContext<FieldState>(noField);

/** Internal: the `FormField` around the calling control. */
export const useField = () => useContext(FieldContext);

const ids = (...list: (string | false | undefined)[]) => list.filter(Boolean).join(' ') || undefined;

/**
 * Internal: a control's own settings merged with the field around it. `labelledBy` and `describedBy`
 * are the control's own label, description and error ids; the field's come first.
 */
export function useFieldControl(own: {
  id?: string | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  labelledBy?: string | false | undefined;
  describedBy?: (string | false | undefined)[] | undefined;
}) {
  const field = useField();
  return {
    id: own.id ?? field.id,
    labelledBy: ids(field.labelId, own.labelledBy),
    describedBy: ids(field.descriptionId, field.errorId, ...(own.describedBy ?? [])),
    invalid: !!own.invalid || field.invalid,
    required: !!own.required || field.required,
    disabled: !!own.disabled || field.disabled,
  };
}

/**
 * Internal: hands the control's own validation message (the browser's, for a required control left
 * empty when the form is submitted) to the field around it, which shows it as its error. Returns false
 * when there is no field to take it: the control then carries the message itself.
 */
export function useReport(message: string | null) {
  const report = useField().report;
  useEffect(() => {
    report?.(message);
    return () => report?.(null);
  }, [report, message]);
  return !!report;
}

/** Internal: for a control React Aria validates. Rendered inside it, it reports what React Aria found. */
export function ReportValidation() {
  const validation = useContext(FieldErrorContext);
  useReport(validation?.isInvalid ? (validation.validationErrors[0] ?? null) : null);
  return null;
}

/**
 * Internal: a group of radios without a `name` sends nothing. React Aria gives its radios a generated
 * name, which they need to be one group for the browser; that entry is taken out of what the form sends.
 */
export function useUnnamedGroup(group: RefObject<HTMLElement | null>, name: string | undefined) {
  useEffect(() => {
    const input = name ? null : group.current?.querySelector('input');
    const form = input?.form;
    if (!input || !form) return;
    const drop = (event: FormDataEvent) => event.formData.delete(input.name);
    form.addEventListener('formdata', drop);
    return () => form.removeEventListener('formdata', drop);
  }, [group, name]);
}

/** Internal: tells a Root that an optional block is rendered, for as long as it is. */
export function useMounted(set: (mounted: boolean) => void) {
  useLayoutEffect(() => {
    set(true);
    return () => set(false);
  }, [set]);
}
