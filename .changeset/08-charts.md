---
'umbra-ui': minor
---

**Charts**, from `umbra-ui/charts` so that an app without charts loads no chart code: `LineChart`, `BarChart`, `DonutChart`, `RadarChart`, `Sparkline`, `Heatmap` and `Scatter`, with a shared interactive `Legend` and a marker that is not colour for every series. `Heatmap` and `Scatter` take a `backdrop` part and `axes={false}` to draw over a diagram. Charts are read from their data by a screen reader, have keyboard access to their points, and take `loading`, `empty` and `error`.
