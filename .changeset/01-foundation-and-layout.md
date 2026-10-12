---
'umbra-ui': minor
---

**Foundation and layout.** `UmbraProvider` and `UmbraScope` set the brand colour, the context tint, the density (three levels), the locale, the icon map and the shortcut registry. The layout system fills the window and never scrolls the page: `AppShell`, `Page`, `Columns`, `Stack`, `Slot`, `Card`, `SectionTitle`, `ScrollArea`, `Accordion`, `WidgetBoard` (a packed board of collapsible cards) and `HorizontalScroller` (a row that scrolls sideways inside itself). A stack that runs out of room collapses its lowest-priority cards to their headers, and below 1024 x 600 the columns become tabs (`useNarrow` tells an app when). Header actions that do not fit move into a "more" menu: buttons and menus move, anything else stays in the row. Basics: `Button`, `IconButton` and `Skeleton`.

Every component is customised through the same four layers: tokens, props, parts and blocks. A `--umbra-*` token set on any ancestor reaches every component inside it, and follows a trigger into its popover, menu or list. Every root takes `className`, `style`, `id`, `data-*` and `aria-*`. Right to left follows `dir`, whatever the page's `lang`.
