---
'umbra-ui': minor
---

**Inputs.** `TextField`, `SearchField`, `Select`, `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Toggle`, `FormField`, `SegmentedFilter`, `Tabs`, `Slider` (one thumb or a range), `Stepper` (through numbers or options), `StarRating` (display of any fraction, or a rating input), `SplitButton` (an action with a menu beside it) and `ColorScaleEditor` (edits a `thresholds` list). In a `<form>` every input with a `name` behaves as a native control: it sends its value, a reset brings the starting value back, `required` holds the form back and shows the browser's message in the `FormField`, and a press on the field's label gives the control the focus. Events are plain callbacks: `onPress` is called with no argument, `onChange` with the value.
