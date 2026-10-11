---
'umbra-ui': minor
---

Added `ContextBlock` (the two-line status of the top bar, with a time chip and an opt-in live clock), `EntitySwitcher` (the current entity of a header, with previous and next steppers and a searchable picker), `WidgetBoard` (a packed board of collapsible cards that scrolls inside itself) and `HorizontalScroller` (a row of cards that scrolls sideways inside itself). `SubNav` has a new `start` slot for an `EntitySwitcher`. A `ContextBlock` in the `TopBar`'s `context` slot gives up its second line and then its chip before the bar hides it.
