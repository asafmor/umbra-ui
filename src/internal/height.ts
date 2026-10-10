/**
 * How a component that fills its slot gets its height. `DataTable`, `List` and the charts share it.
 *
 * - `fill` (the default): the height of its parent, scrolling or shrinking inside. In a parent with no
 *   height of its own (flowing content in a card body, a popover, a modal body, an accordion panel) it
 *   falls back to the height of its content, so it is never zero pixels tall.
 * - `content`: always the height of its content, whatever the parent is. Two tables can then flow one
 *   after another in one scrolling card body.
 * - a number: that many pixels.
 *
 * The content height of a table or list is all of its rows; of a chart, `--umbra-chart-content-height`.
 * The fallback of `fill` is plain CSS (a percentage height computes to `auto` in such a parent), so
 * nothing is measured.
 */
export type FillHeight = 'fill' | 'content' | number;

/** The attribute and style of the root. Each component's CSS has `[data-height='content'] { height: auto }`. */
export const heightProps = (height: FillHeight = 'fill') => ({
  'data-height': typeof height === 'number' ? 'fixed' : height,
  style: typeof height === 'number' ? { height } : undefined,
});
