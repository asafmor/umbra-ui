---
'umbra-ui': minor
---

Fixed: collapsing a content-sized card no longer flashes at full height. `WidgetBoard` works at any height (it lost its tail in Firefox), keeps column order with `span`, keeps unknown ids on "Collapse all", and does less work per frame. `VerticalNav` fills the width of a card or modal side; it keeps its 240px beside other content in a row. `EntitySwitcher` keeps focus when its list changes and steps correctly from a disabled current entity. `HorizontalScroller` leaves arrow keys to a `Select`, moves on from a `Toggle`, keeps focus when a custom button goes, and honours `--umbra-horizontal-scroller-button-size`. `TopBar` re-measures when slot content grows. `ContextBlock` font tokens keep their weight, and a plain block is a tab stop while a bar hides its lines. A `--umbra-*` token set on any ancestor of a trigger now reaches its popover, menu, select list or suggestions.

Added: `ContextBlock` `variant="filled"` with `--umbra-context-block-bg`, `-padding-x`, `-padding-y`, `-radius`; the provider sets `--umbra-color-brand-inset` with a `brand`.

Changed: `ContextBlock` `time` without `timeFormat.timeZone` is written in the browser, so server and client markup match; give a `timeZone` to have it in the first paint.
