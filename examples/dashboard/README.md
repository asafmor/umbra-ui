# Dashboard example

An overview dashboard that fills the window and never scrolls. Copy it as a starting point.

- **Stats**: `SummaryTile` and `StatValue` with `TrendArrow`, `ProgressBar` and `LevelMeter`.
- **Charts** from `umbra-ui/charts`: a line chart and a bar chart that share one interactive `Legend`,
  and a donut chart.
- **Data**: a small sortable `DataTable` whose columns hide by priority, a `List`, a `Banner`.
- **Switchers** for the density level and the context tint, in the `SubNav`.
- **Command palette** (the search button, or Ctrl+K / ⌘K) with the app's commands and shortcuts
  (Shift+R refreshes, Shift+D changes the density).
- **Stack collapse**: make the window low (1024 x 600) and the cards with the lowest `priority`
  collapse to their headers; a chart card asks for more room with `minHeight`.
- Below 1024 x 600 the three columns become tabs.

The sample data in `src/data.ts` is invented and the same on every run.

```sh
npm install        # at the repository root
npm run build      # builds umbra-ui, which this example imports
npm run dev -w examples/dashboard
```
