import { createContext, useContext, useLayoutEffect } from 'react';

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
  report?: (message: string | null) => void;
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
  id?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  labelledBy?: string | false;
  describedBy?: (string | false | undefined)[];
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

/** Internal: tells a Root that an optional block is rendered, for as long as it is. */
export function useMounted(set: (mounted: boolean) => void) {
  useLayoutEffect(() => {
    set(true);
    return () => set(false);
  }, [set]);
}
