---
'umbra-ui': minor
---

Added the Time group: `DateChip`, `ScheduleSlot`, `WeekStrip` and `Planner`. Dates are plain ISO text (`'2026-10-11'`, months `'2026-10'`); the first day of the week and all names come from the provider's locale, with `weekStartsOn` to override. `WeekStrip` and `Planner` are keyboard grids with one tab stop; `Planner` has month navigation, a toolbar, a side column per week (`renderWeek`) and loading, empty and error states. `@internationalized/date` is now a direct dependency.

`PieIndicator` and `DivergingMeter` join the meters in `umbra-ui`. `Sparkline` (with `sparklineColumn` for `DataTable`), `Heatmap` and `Scatter` join `umbra-ui/charts`; `Heatmap` and `Scatter` take a `backdrop` part and `axes={false}` to draw over a diagram.
