// What the keyboard grids share (src/table/grid.ts walks table rows, src/time/grid.ts walks days): what
// a cell and a control of a cell are, and the two listeners that are the same whatever is walked.
import { useEffect, type RefObject } from 'react';

export const CELL = '[data-cell]';
export const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
const WIDGET =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]';
/** Widgets that have no use for the arrow keys: from them, the arrows still move through the grid. */
export const SIMPLE_WIDGET = 'a, button, input[type="checkbox"], input[type="radio"]';

/**
 * The controls of a cell. Not one: a disabled control (the grid gives every control a `tabindex`, so
 * a disabled button would count by that), and what is hidden from assistive technology (a `Select` keeps a
 * native `<select>` there for forms and autofill).
 */
export const widgetsOf = (cell: Element) =>
  [...cell.querySelectorAll<HTMLElement>(WIDGET)].filter(
    (el) =>
      !el.matches(`${CELL}, :disabled, [aria-disabled="true"], [data-disabled]`) &&
      !el.closest('[aria-hidden="true"]'),
  );

/**
 * Keeps `pointer` (the last input was a pointer) and `hasFocus` (a press outside the grid gives the
 * focus up) current, and makes Escape or F2 on a control inside a cell return to the cell.
 */
export function useCellListeners(
  root: RefObject<HTMLElement | null>,
  pointer: RefObject<boolean>,
  hasFocus: RefObject<boolean>,
) {
  useEffect(() => {
    const down = (event: PointerEvent) => {
      pointer.current = true;
      if (!root.current?.contains(event.target as Node)) hasFocus.current = false;
    };
    // Heard on the window, on the way down: a tooltip that is open on the control takes Escape for
    // itself at the document.
    const key = (event: KeyboardEvent) => {
      pointer.current = false;
      if (event.key !== 'Escape' && event.key !== 'F2') return;
      const target = event.target as HTMLElement;
      const cell = target.closest?.<HTMLElement>(CELL);
      if (!cell || cell === target || !root.current?.contains(cell)) return;
      // A control that has something of its own open (a menu, a list) closes that first.
      if (target.getAttribute('aria-expanded') === 'true') return;
      cell.focus({ preventScroll: true });
      event.preventDefault();
    };
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key, true);
    };
  }, [root, pointer, hasFocus]);
}
