import { createElement, type JSX, type ReactElement } from 'react';

const handedOn = (key: string) => key === 'id' || key.startsWith('data-') || key.startsWith('aria-');

/**
 * What every component hands on to its root element, whatever its own props are: `id`, and every
 * `data-*` and `aria-*` attribute (plan/decisions/07-customisation.md, "Root attributes"). A test hook,
 * the target of a `Spotlight`, an `aria-describedby`: none needs a wrapper element.
 *
 * Spread first on the root, before the component's own attributes, so `data-umbra`, the state
 * attributes and the ARIA the component manages itself always win.
 */
export function passThrough(props: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([key, value]) => value !== undefined && handedOn(key)),
  );
}

/**
 * The same for a root that React Aria draws, which hands on `data-*` by itself but only the `aria-*`
 * it knows. Spread on the React Aria element: `<AriaSwitch {...rootRender('label', rest)} …>`. With
 * something to hand on it is a `render` that draws the element React Aria expects (`tag`), with the
 * attributes first; with nothing it is empty, and React Aria draws the element itself. An `id` is also
 * given to React Aria as its prop, because it points at the element by its id (a pending button). So
 * this is not for a root whose `id` React Aria moves to an inner element (a radio's input).
 */
export function rootRender(tag: keyof JSX.IntrinsicElements, props: object) {
  const attributes = passThrough(props);
  if (Object.keys(attributes).length === 0) return {};
  return {
    ...(typeof attributes.id === 'string' && { id: attributes.id }),
    render: (dom: object): ReactElement =>
      createElement(tag, {
        ...attributes,
        ...Object.fromEntries(Object.entries(dom).filter(([, value]) => value !== undefined)),
      }),
  };
}

/** `props` without what `passThrough` takes: for an inner block, once the root has the attributes. */
export function withoutPassThrough<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !handedOn(key))) as T;
}

/** The one of them TypeScript does not accept by itself (it lets any `data-*` and `aria-*` through). */
export interface RootAttributes {
  /** The `id` of the root element. */
  id?: string | undefined;
}
