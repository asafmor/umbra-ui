# Dashboard example

An overview dashboard that fills the window and never scrolls.

- **Stats**: `SummaryTile` and `StatValue` with `TrendArrow`, `Sparkline`, `ProgressBar` and `LevelMeter`.
- **The bar**: a `ContextBlock` with a clock, and the `ShortcutsSheet` (the help button, or `?`).
- **A week** of deliveries in a `WeekStrip`.
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

## Run it here

```sh
npm install                    # at the repository root
npm run build                  # builds umbra-ui, which this example imports
npm run examples -- dashboard  # installs this example against that build, and builds it
npm run dev --prefix examples/dashboard
```

After a change to the library, run the second and third lines again: the example holds a copy of the
built package, not a link to the source.

## Use it as a template

The folder is a complete Vite app: its own `package.json`, `tsconfig.json` and `vite.config.ts`.

1. Copy the folder out of the repository (without `node_modules` and `dist`).
2. Swap the local dependency for the published package: `npm install umbra-ui@latest`. It replaces
   `"umbra-ui": "file:../.."` in `package.json` with the current version.
3. Delete `.npmrc`. It only matters for the `file:` dependency.
4. `npm install`, then `npm run dev`. `npm run build` typechecks and builds; `npm run preview` serves the build.

<!-- pre-release: remove at 0.1.0 -->

Until `0.1.0` is on npm, step 2 is `npm install github:asafmor/umbra-ui`.

<!-- /pre-release -->
