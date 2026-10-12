---
'umbra-ui': minor
---

Added `MeterList`: any of the four meters in aligned columns of labels, bars and values, with `labelWidth`, loading, empty and error states.

Fixed in charts and meters: a value that is not a finite number is "no value" instead of a crash or a blank chart, and a repeated id is left out, with a development warning; focus stays in a chart when it switches to loading or error; `aria-describedby` is kept; `PieIndicator` with `layout="block"` shows its value; an empty disc has a visible edge, and "no value" no longer looks like zero; `Heatmap` draws values below the first band and has crisp cell edges; `Scatter` lets a point under a bubble be hovered, leaves out points outside a set domain, and is much faster with 5,000 points; the last point of a `Sparkline` takes its band's colour; a chart beside other content in a modal no longer makes the body scroll; a cut meter label shows its text in a tooltip.

Changed: the edge of a `PieIndicator` is 1.5px in the muted text colour (`--umbra-pie-indicator-track-border-width`); `Scatter` draws all points in one order, so `data-series` is on each point's group.
