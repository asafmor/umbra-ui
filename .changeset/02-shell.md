---
'umbra-ui': minor
---

**Shell.** `TopBar`, `PrimaryNav`, `SubNav`, `VerticalNav`, `PageHeader`, `PrimaryAction`, `HistoryButtons`, `ShortcutBar`, `ContextBlock` (the two-line status of a bar, with a time chip and an opt-in live clock; `variant="filled"` gives it a surface of its own) and `EntitySwitcher` (the current entity of a header, with steppers to its neighbours and a searchable picker). Navigation items that do not fit move into a "more" menu, and the colours of a bar are computed from the brand colour. `HistoryButtons` drive the browser history or an app's router. A `ContextBlock` writes its `time` in the browser unless `timeFormat.timeZone` is given, so the markup of a server and a browser in different time zones match.
