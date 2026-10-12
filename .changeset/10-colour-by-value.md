---
'umbra-ui': minor
---

**Colour by value, one shape.** `ValuePill`, `ProgressBar`, `LevelMeter`, `PieIndicator`, `DivergingMeter`, `Slider`, `BarChart`, `DonutChart`, `Heatmap` and `Sparkline` take the same `thresholds`: an ascending list of `Threshold` (`{ from, tone?, color?, label? }`), or plain numbers as boundaries on the five-step value ramp, with `lowerIsBetter` to turn the ramp round. `ColorScaleEditor` edits that list. Every band has a second cue that is not colour (a pattern, a shape or its label) and sets `data-band`. Exported from `umbra-ui` and `umbra-ui/charts`: `Threshold`, `ThresholdTone`, `ThresholdList`, `ThresholdBand`, `resolveThreshold`, `rampThresholds`.
