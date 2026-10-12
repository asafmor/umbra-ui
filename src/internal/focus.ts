// Focus is never lost: a component that removes or replaces the element the user is on moves focus
// somewhere sensible first (plan/interaction.md, "Keyboard").

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

/** The elements inside `scope` that can take focus and are drawn, in document order. */
export const focusableIn = (scope: ParentNode) =>
  [...scope.querySelectorAll<HTMLElement>(focusable)].filter(
    (el) => !el.closest('[inert], [hidden]') && el.getClientRects().length > 0,
  );

/** True when focus is on nothing: on `<body>`, or on an element that has left the document. */
export const focusLost = () => {
  const active = document.activeElement;
  return !active || active === document.body || !active.isConnected;
};

const nameOf = (el: Element) => el.getAttribute('aria-label') ?? el.textContent ?? '';

/**
 * For "the element the user is on is about to be removed or rendered again". Call it before the change,
 * while focus is still inside `scope`, and call what it returns once the change has been drawn. If focus
 * has been dropped by then, it goes to the first of these that exists: the same element, the element
 * that replaced it (same `id`, same `data-id`, or same name), `fallback`, the first focusable element
 * of `scope`. When focus was not inside `scope`, nothing happens.
 */
export function holdFocus(scope: HTMLElement | null, fallback?: () => HTMLElement | null | undefined) {
  const active = document.activeElement;
  if (!scope || !(active instanceof HTMLElement) || active === document.body || !scope.contains(active)) {
    return () => {};
  }
  const { id } = active;
  const dataId = active.closest<HTMLElement>('[data-id]')?.dataset.id;
  const name = nameOf(active);
  return () => {
    if (!focusLost()) return;
    const candidates = focusableIn(scope);
    const target =
      candidates.find((el) => el === active) ??
      (id ? candidates.find((el) => el.id === id) : undefined) ??
      (dataId !== undefined
        ? candidates.find((el) => el.closest<HTMLElement>('[data-id]')?.dataset.id === dataId)
        : undefined) ??
      (name ? candidates.find((el) => nameOf(el) === name) : undefined) ??
      fallback?.() ??
      candidates.find((el) => el.tabIndex >= 0) ??
      candidates[0];
    target?.focus({ preventScroll: true });
  };
}

/**
 * For a control that disables itself when pressed ("Next" at the last month): a disabled control cannot
 * hold the focus, and the browser drops it to `<body>`. Call it after every render with the control
 * that was pressed. Once that control is disabled and the focus is still on it or on nothing, the
 * focus goes to `target`. It returns true while there is still something to wait for: the control is
 * enabled and the user has not moved on.
 */
export function leaveDisabled(control: Element | null, target: () => HTMLElement | null | undefined) {
  if (!(control instanceof HTMLElement) || control === document.body || !control.isConnected) return false;
  if (document.activeElement !== control && !focusLost()) return false;
  if (!control.matches(':disabled, [aria-disabled="true"]')) return true;
  target()?.focus({ preventScroll: true });
  return false;
}

/**
 * Moves focus to `target` when the element that has it is `leaving` or inside it. For a control that
 * removes itself when pressed ("Clear selection" in a bar that then goes away).
 */
export function moveFocusFrom(leaving: Element | null, target: HTMLElement | null | undefined) {
  if (leaving && target && leaving.contains(document.activeElement)) target.focus({ preventScroll: true });
}

/**
 * For an element that is about to leave the page with the focus inside it (or inside `also`, a panel
 * of its own that is rendered elsewhere): the focus moves to the nearest control that stays. That is
 * the next tab stop after the element in its parent, or else the last one before it; with none there,
 * the same in the parent's parent, and so on. Call it while the element is still in the page.
 */
export function focusNear(leaving: Element, also?: Element | null) {
  const active = document.activeElement;
  const gone = (el: Element | null) => !!el && (leaving.contains(el) || !!also?.contains(el));
  if (!gone(active)) return;
  for (let scope = leaving.parentElement; scope; scope = scope.parentElement) {
    const stops = focusableIn(scope).filter((el) => el.tabIndex >= 0 && !gone(el));
    const next =
      stops.find((el) => leaving.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) ??
      stops.at(-1);
    if (next) return next.focus({ preventScroll: true });
  }
}
