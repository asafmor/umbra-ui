---
'umbra-ui': minor
---

**One `thresholds` shape.** `ValuePill`, `ProgressBar`, `LevelMeter`, `BarChart` and `DonutChart` take the same `thresholds`: an ascending list of `Threshold` (`{ from, tone?, color?, label? }`), or plain numbers as boundaries on the value ramp. New exports from `umbra-ui` and `umbra-ui/charts`: `Threshold`, `ThresholdTone`, `ThresholdList`, `ThresholdBand`, `resolveThreshold`, `rampThresholds`. Every band sets `data-band`, and a free `color` gets a pattern by position.

Renamed: `ProgressBar` `invert` → `lowerIsBetter`; `ValuePill` `ramp="lower-is-better"` → `lowerIsBetter`; `LevelMeter` `zones` → `thresholds` (entries lose `to`); the type `Zone` is removed (use `Threshold`).

Changed: `BarThreshold` extends `Threshold` (`color` is optional, `tone` is accepted); `DonutChart` `thresholds` takes the shared list; `DonutTone` and `MeterTone` include every threshold tone (`accent` is new on the meters).

Added: `lowerIsBetter` on `LevelMeter`, `BarChart` and `DonutChart`; `tone`, `color`, `band` and `title` on `ValuePill.Root`.
