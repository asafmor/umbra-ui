# 03 — Charts: own SVG with small math helpers

**Decided** 2026-10-10.

- Radar, line, bar and donut are drawn by the library as SVG. Only `d3-scale` and `d3-shape` are used, for scales and path math.
- Reason: the source charts are small and KPI-style; drawing them ourselves gives full control of the look and of how each chart sheds detail (axes, labels, legend) as its slot shrinks.
- Charts follow the same rules as other components: tokens for colour, `loading` skeleton, empty state, non-colour fallback for series (pattern, marker shape or direct label).
- Charts ship from a separate entry, `umbra-ui/charts`.
- Later tier: heatmap and scatter.

**Rejected**: wrapping a chart library (hard to match the look and shrink rules; heavy). visx (more dependencies for little gain at four chart types).
