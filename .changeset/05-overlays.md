---
'umbra-ui': minor
---

**Overlays.** `Popover`, `Tooltip`, `Menu`, `Modal`, `ConfirmDialog`, `CommandPalette`, `ActionBar`, `Spotlight` (a coach mark, or a tour of several steps, that dims everything but one element and follows it as it moves) and `ShortcutsSheet` (the keyboard help, opened with `?`, listing the provider's shortcuts in groups with a search). Popovers and menus flip when their content would be cut. Overlays opened from inside a modal are drawn inside it, tooltips included. The layers are tokens (`--umbra-layer-*`): a spotlight is above a modal and below the command palette. Focus returns to what opened an overlay, and to the trigger when there is nothing else to return to.

A popover without a trigger keeps its own state inside a modal. The "more" menu of a row of actions is loaded on demand and opens as a plain list when its code cannot be loaded; controls that stay in a header shrink and wrap instead of being cut. A floating `ActionBar` sits above a table's summary row. Bare-key shortcuts work from a checkbox, radio or slider, and not during a non-interactive `Spotlight`; a modal that opens closes an open `Spotlight`. A `ShortcutsSheet` panel carries `data-umbra="shortcuts-sheet"` and a `ConfirmDialog` `confirm-dialog`.
