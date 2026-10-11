---
'umbra-ui': minor
---

`DataTable`, `List` and the charts take `height` (`"fill"`, `"content"` or pixels), so they work in flowing content, popovers and modals. `highlightChanges` on `StatValue`, `KeyValue`, `ValuePill`, `SummaryTile`, `ListItem`, `ProgressBar` and `LevelMeter`. A content-sized `Card` shows its content. A stack that cannot fit any card at its minimum keeps the highest-priority one open. Popovers and menus flip when their content would be cut. `Columns` and `Modal` follow the minimum window without an `AppShell`. Renamed: `label` to `aria-label` on the charts, `Menu`, `Popover` and `ScrollArea`; `Legend` `loadingCount` to `skeletonRows`; one `LinkRenderProps` type for every `renderLink`.
