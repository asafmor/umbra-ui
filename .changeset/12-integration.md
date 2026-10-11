---
'umbra-ui': minor
---

Every component passes `id`, `data-*` and `aria-*` to its root element. `Spotlight`: `backLabel` is now `previousLabel`; it follows a moving target every frame and no longer covers a target with no room beside it. `Planner` and `WeekStrip` show "+N" for items beyond `slotsPerDay` (`hiddenItemsLabel`). `MediaCard` has `selected`, and its actions and the `Planner` toolbar's move into a "more" menu (`moreLabel`). `useNarrow` is exported.

Fixed: controls in the popover of a layout-collapsed card now respond; a `Stepper`, `Slider` or field among overflowing actions stays in the row instead of breaking the menu; a content-sized card gives way before a collapsed header is cut; a `Sparkline` has a width in a hugging slot; Enter in a `DataTable` cell skips a disabled button; a field label focuses a `Stepper`; `HorizontalScroller` no longer double-wraps an `Item`.
