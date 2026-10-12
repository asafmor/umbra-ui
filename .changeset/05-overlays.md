---
'umbra-ui': minor
---

**Overlays.** `Popover`, `Tooltip`, `Menu`, `Modal`, `ConfirmDialog`, `CommandPalette`, `ActionBar`, `Spotlight` (a coach mark, or a tour of several steps, that dims everything but one element and follows it as it moves) and `ShortcutsSheet` (the keyboard help, opened with `?`, listing the provider's shortcuts in groups with a search). Popovers and menus flip when their content would be cut. Overlays opened from inside a modal are drawn inside it, tooltips included. The layers are tokens (`--umbra-layer-*`): a spotlight is above a modal and below the command palette. Focus returns to what opened an overlay, and to the trigger when there is nothing else to return to.
