---
'umbra-ui': minor
---

**Time.** `DateChip`, `ScheduleSlot`, `WeekStrip` (seven days with their slots) and `Planner` (a month of days with a fixed number of slots each, month navigation, a toolbar, a side column per week through `renderWeek`, and loading, empty and error states). Dates are plain ISO text (`'2026-10-11'`, months `'2026-10'`); the first day of the week and every name come from the provider's locale, with `weekStartsOn` to override. `WeekStrip` and `Planner` are keyboard grids with one tab stop. A day with more items than `slotsPerDay` shows "+N", a button that opens the rest. `@internationalized/date` is a dependency.
