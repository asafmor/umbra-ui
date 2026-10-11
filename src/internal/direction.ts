import { useLocale } from 'react-aria-components';

export type Direction = 'ltr' | 'rtl';

/**
 * The text direction, from the one source every part of the library reads: the provider's resolved
 * locale (plan/specs/UmbraProvider.md, "Direction"). React Aria reads the same one.
 */
export const useDirection = (): Direction => useLocale().direction;

/** The arrow keys that move to the previous and the next item of a horizontal row, as it is drawn. */
export const rowKeys = (direction: Direction) =>
  direction === 'rtl' ? (['ArrowRight', 'ArrowLeft'] as const) : (['ArrowLeft', 'ArrowRight'] as const);
