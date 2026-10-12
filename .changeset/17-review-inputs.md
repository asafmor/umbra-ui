---
'umbra-ui': patch
---

Inputs behave as native controls in a form: `Stepper` and `ColorScaleEditor` reset and validate, a required control shows its message in its `FormField`, a field label focuses a group's control, a radio group or `StarRating` without `name` sends nothing, `Select` keeps its value after a reset. `Slider`: the value survives `readOnly` toggling and the output has a fixed width. `StarRating` with half steps: a press chooses the whole star, a drag a half. `onPress` of `Button` and `SplitButton` is called with no argument. Rows with a repeated id are drawn, with a development warning. Among actions that overflow, only buttons and menus move into the "more" menu; anything else stays in the row. `ColorScaleToneLabels` accepts `undefined` members.
