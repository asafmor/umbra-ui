import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import styles from './fieldParts.module.css';
import { useReport } from './useField';

/**
 * Internal: the form side of a control that is not a native one and is not drawn by React Aria (a
 * `Stepper`, a `ColorScaleEditor`). A text input nobody sees or reaches carries the value, so the
 * browser does for it what it does for an input: it sends the value under the name, holds the form back
 * while a required value is missing, and tells it about a reset. A hidden input (`type="hidden"`) does
 * the first only.
 *
 * Returns the input to render inside the control, whether the browser found the value missing, and the
 * id of the message when no field around the control shows it.
 */
export function useFormValue(options: {
  name: string | undefined;
  /** The value as it is sent. Empty is no value: nothing is sent. */
  value: string;
  required?: boolean | undefined;
  disabled: boolean;
  /** A native reset of the form: go back to the starting value. */
  onReset: () => void;
  /** The element that takes the focus when this is the first invalid control of the form. */
  control: () => HTMLElement | null | undefined;
}) {
  const { name, value, required = false, disabled } = options;
  const input = useRef<HTMLInputElement>(null);
  const messageId = useId();
  const [message, setMessage] = useState<string | null>(null);
  // The message goes as soon as there is a value again.
  if (message && (!required || value !== '')) setMessage(null);
  const inField = useReport(message);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = () => {
      setMessage(null);
      latest.current.onReset();
    };
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, []);
  return {
    invalid: !!message,
    describedBy: message && !inField ? messageId : undefined,
    input: (
      <>
        <input
          ref={input}
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.formValue}
          name={value === '' ? undefined : name}
          value={value}
          // The control changes the value; nobody types here.
          onChange={() => {}}
          required={required}
          disabled={disabled}
          onInvalid={(event) => {
            // No bubble of the browser: the field shows the message, as for every other control.
            event.preventDefault();
            const self = event.currentTarget;
            setMessage(self.validationMessage);
            const first = [...(self.form?.elements ?? [])].find(
              (el) => 'validity' in el && !(el as HTMLInputElement).validity.valid,
            );
            if (first === self) latest.current.control()?.focus();
          }}
        />
        {message && !inField && (
          <span id={messageId} hidden>
            {message}
          </span>
        )}
      </>
    ),
  };
}
