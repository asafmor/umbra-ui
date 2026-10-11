---
'umbra-ui': minor
---

**Foundation and layout.** `UmbraProvider` and `UmbraScope` set the brand colour, the context tint, the density (three levels), the icon map and the shortcut registry. The layout system fills the window and never scrolls the page: `AppShell`, `Page`, `Columns`, `Stack`, `Slot`, `Card`, `SectionTitle`, `ScrollArea` and `Accordion`. A stack that runs out of room collapses its lowest-priority cards to their headers, and below 1024 x 600 the columns become tabs. Basics: `Button`, `IconButton` and `Skeleton`. Every component is customised through the same four layers: tokens, props, parts and blocks.
