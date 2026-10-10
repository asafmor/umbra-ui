export interface CollapseItem {
  id: string;
  /** The height the item needs to stay open. */
  min: number;
  /** The height of its header when collapsed, or null when it cannot collapse. */
  header: number | null;
  /** Higher stays open longer. Ties collapse from the end of the source order. */
  priority: number;
}

/**
 * Layout rule 3 (plan/layout.md): when the items of a Stack cannot all keep their minimum height, the
 * lowest-priority ones collapse to their header until the rest fit. The highest-priority card is the
 * last to go, and it stays open when it cannot keep its minimum even with every other card collapsed:
 * it takes the space that is left and scrolls inside, so a column is not left with headers only. It
 * collapses too only when that space is less than one and a half times its header, which is no room
 * for content.
 * Returns the ids to collapse, and whether the rest now fit (when they do, each open item is held at
 * its minimum height or more; when they do not, the minimums are dropped).
 */
export function collapseToFit(available: number, gap: number, items: CollapseItem[]) {
  const collapsed = new Set<string>();
  const needed = () =>
    items.reduce((sum, item) => sum + (collapsed.has(item.id) ? item.header! : item.min), 0) +
    gap * Math.max(0, items.length - 1);
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.header !== null && item.header < item.min)
    .sort((a, b) => a.item.priority - b.item.priority || b.index - a.index);
  for (const { item } of candidates.slice(0, -1)) {
    if (needed() <= available) break;
    collapsed.add(item.id);
  }
  const last = candidates.at(-1)?.item;
  if (last && needed() > available) {
    const left = available - (needed() - last.min);
    if (left < 1.5 * last.header!) collapsed.add(last.id);
  }
  return { collapsed, fits: needed() <= available };
}
