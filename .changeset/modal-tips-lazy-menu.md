---
'umbra-ui': patch
---

Tooltips the library opens by itself (truncated text, `DataTable` cells and header hints, meters) now work inside a `Modal`, can be hovered, and Escape dismisses them without closing the modal.

`Card`, `SectionTitle`, `PageHeader`, `TopBar` and `GroupHeader` load their overflow menu on demand, and a `Card` collapsed by a `Stack` loads its popover on demand. Under Vite and Rollup a `Card` costs 35 KB gzip at first load (was 75) and a `Button` 27 KB (was 37). esbuild without splitting keeps one file; with `splitting: true` it puts shared code in a chunk that loads first.

Choosing a row in a submenu of an anchored or context `Menu` now closes the whole menu.
