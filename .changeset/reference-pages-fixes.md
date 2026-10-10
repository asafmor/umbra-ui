---
'umbra-ui': patch
---

Fixes found while building the reference pages: a `List` built from `renderItem` no longer logs a key warning; a `Banner` in a row (a `Slot`, a card footer) takes the row's width instead of collapsing; the selection column of a `DataTable` draws no ellipsis beside its checkbox at the spacious density; a grouped, virtualised `DataTable` first measured in a hidden tab panel no longer updates without end.
