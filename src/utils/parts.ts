import type { ReactNode } from 'react';

/**
 * A replaceable piece of a component: a node replaces it, `null` hides it, and a function receives the
 * default part's props and returns what to render (plan/decisions/07-customisation.md).
 */
export type Part<P = object> = ReactNode | ((props: P) => ReactNode);

export function renderPart<P>(override: Part<P> | undefined, props: P, fallback: (props: P) => ReactNode) {
  if (override === undefined) return fallback(props);
  return typeof override === 'function' ? override(props) : override;
}

export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(' ') || undefined;
}
