# 03 — Charts: own SVG with small math helpers

**Decided** 2026-10-10.

- Radar, line, bar and donut are drawn by the library as SVG. Only `d3-scale` and `d3-shape` are used, for scales and path math.
- Reason: the source charts are small and KPI-style; drawing them ourselves gives full control of the look and of how each chart sheds detail (axes, labels, legend) as its slot shrinks.
- Charts follow the same rules as other components: tokens for colour, `loading` skeleton, empty state, non-colour fallback for series (pattern, marker shape or direct label).
- Charts ship from a separate entry, `umbra-ui/charts`.
- Later tier: heatmap and scatter.

## Invalid input (2026-10-11)

One rule for every chart and every meter, for input an app should not give. Never a crash, and never a blank chart: what cannot be drawn is left out, the rest is drawn, and development builds warn once per case (`src/utils/finite.ts`).

| Input | Result |
|---|---|
| A value that is not a finite number: `NaN`, `Infinity`, `-Infinity` (and `null` or `undefined`, which are allowed) | "No value". A chart leaves the point, bar, segment or cell out, breaks the line there, and keeps it out of the scale. A meter is empty and says "No value" |
| A position that is not one: an `x` of a `Scatter` or a numeric or time `LineChart` that is not finite, an invalid date | The point is not drawn, and does not stretch the axis |
| A `size` of a `Scatter` point that is not finite | A plain point |
| A point of a `Heatmap` (`points`) with such a position or `value` | It adds nothing to its cell |
| A count that is not a number (`steps`, `bins`) | The default |
| A second series or segment with an id already used | Left out: the first is drawn |
| A second row or column of a `Heatmap` with a name already used | Both are drawn: the later one is named "A (2)" (names are labels there, not ids) |
| A `Scatter` point outside an `xDomain` or `yDomain` the app set | Not drawn, as a `Heatmap` leaves out points outside its domains |

The warning is not a thrown error on purpose: one bad number from a server must not take the page down.

**Rejected**: wrapping a chart library (hard to match the look and shrink rules; heavy). visx (more dependencies for little gain at four chart types).
