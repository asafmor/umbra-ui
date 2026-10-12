# Milestone 2 (started 2026-10-11)

The record of Milestone 2: the starting state, the decisions made under the owner's delegation, and (added at the end) the independent reviews.

## Starting state (commit `90e62d5`)

| Check | Result |
|---|---|
| `npm ci`, lint, typecheck | pass; 48 doc samples compile |
| Unit tests | 109 passed, 14 files |
| Build, `check:package` | pass; tarball 414 files, 669 kB; `Card` 74.6 KB gzip, `Button` 37.5, `Skeleton` 0.5 |
| `release:check` | pass |
| `test:examples` | 33 passed |
| `test:visual` | 6334 passed, 11.2 min |
| Baselines | 354 stories, 4,281 images, 197 MB |

## Owner's delegation (2026-10-11)

The owner answered the plan's questions with: decide yourself, from the code and from what users of such a library expect, aim for the best experience, record any compromise in the component's documentation, and continue to completion without stopping. Specs are therefore approved under delegation; each open question is decided, the fuller option chosen, and recorded under "Resolved" in its spec.

| # | Question | Decision |
|---|---|---|
| 1 | Baseline trim | Per story: default density at 1920x1080, 1280x720 and 1024x600; compact at 1280x720; spacious at 1024x600 (the tightest combination). Tint images (1280x720, default density, three tints) for one story per component: the one tagged `tints`, else the first of its file; every full-page story is tagged. `narrow` stories: 900x560 at the default density. The no-page-scroll check and axe keep running at every size, density and tint, without images. |
| 2 | Thresholds | One exported type, `Threshold = { from: number; tone?: Tone; color?: string; label?: string }`, in an ascending list, for `ValuePill`, `ProgressBar`, `BarChart`, `DonutChart` and what `ColorScaleEditor` produces. `ValuePill` still accepts a plain `number[]` as shorthand for boundaries on the value ramp. |
| 3 | Token rule scope | A component's stylesheet declares no `--umbra-*` property at all, global or another component's. A container that needs a different default sets a private property and the reader falls back through it (`plan/decisions/07-customisation.md`). A check enforces it. **Done 2026-10-11**: 29 declarations became private properties, `scripts/check-tokens.mjs` is in `npm run lint`, and `tests/visual/tokens.spec.ts` proves each container lets the app's token through. |
| 4 | First day of the week | `@internationalized/date` becomes a direct dependency (it is already installed through React Aria, so nothing new is downloaded). `weekStartsOn` overrides the locale. |
| 5 | ShortcutsSheet key | `?`, as already recorded in `plan/interaction.md`. |
| 6 | Spotlight layer | A new token `layer.spotlight` between `modal` and `palette`: a spotlight can point at something inside a modal, and the command palette still opens on top. |
| 7 | Spec approval | No stop: specs are approved under delegation. |
| 8 | Milestone 0 leftovers | Taken with the open items: the three literal durations become tokens, and the generated tables get a defaults column. **Durations done 2026-10-11**: they were tokens already; a check now refuses a literal duration in a stylesheet. **Tables done 2026-10-11**: a Default column, and each token under the component whose name it carries. |
| 9 | Heatmap and Scatter | Both take a `backdrop` part: an app-supplied node drawn behind the plot. |
| 10 | WidgetBoard | A masonry of collapsible cards that scrolls inside itself. No drag to reorder. |
| 11 | Planner | The per-week side column is a render slot; a fixed number of slots per day; `onAction` per slot; no drag and no built-in copy and paste (the app's buttons go in the side column). |
| 12 | `Card` and the menu | The overflow menu is loaded with a dynamic `import()` the first time a header overflows. |

## Groups

| # | Group | Components |
|---|---|---|
| A | Time (`src/time/`) | DateChip, ScheduleSlot, WeekStrip, Planner |
| B | Data | SequenceDots, MediaCard, Comparison |
| C | Inputs | StarRating, SplitButton, Slider, Stepper, ColorScaleEditor |
| D | Meters and charts | PieIndicator, DivergingMeter, Sparkline, Heatmap, Scatter |
| E | Shell and layout | ContextBlock, EntitySwitcher, WidgetBoard, HorizontalScroller |
| F | Overlays | Spotlight, ShortcutsSheet |

## Integration pass (2026-10-11)

The 23 components were built by six agents that did not see each other's work. This pass compared them with each other and with tier 1, put them together, and fixed what that showed. Tests: `tests/visual/integration-tier2.spec.ts` (stories `Integration/Tier 2`) and `tests/visual/root-attributes.spec.ts`. Each fix that changes behaviour has a test that fails without it, except where the table says otherwise.

### Found and fixed

| Component | Finding | Fix |
|---|---|---|
| `Card` | **Nothing in the body of a layout-collapsed card answered a press or a key in its popover.** The body is moved there as DOM, into a popover in `<body>`, outside the element React renders into, so React delivered no event to it. Tier 1 had it too; its tests only looked. Found with a `Planner` in a collapsing stack. | The popover is rendered inside the provider's root (`plan/layout.md`, "Mechanism"). |
| `Card`, `SectionTitle`, `PageHeader`, `GroupHeader`, `TopBar` | **A `Stepper` or `Slider` among actions that overflow broke the page** when the "more" menu opened: a menu holds rows only. Tier 1 inputs had the same fault. | `staysInRow`: such a control stays in the row as the same element (decision 07, "Controls among actions that overflow"). Hosts always render through `ActionsOverflow`. |
| `Stack`, `Card` | A collapsed card was squeezed below its header (11 to 18px lost) while content-sized siblings kept their height. | A content-sized card gives way first (`plan/layout.md`, rule 3). |
| `Comparison` | In a content-sized card that was squeezed it stepped down to its strip and stayed there with room left over. | It keeps its rows there and the card scrolls. |
| `DataTable` | The grid counted a disabled button as a control of its cell (the grid gives it a `tabindex`), so Enter did not press the one enabled button beside it. Group A had fixed this in the grid of days only. | One `widgetsOf` for both grids (`src/internal/gridCells.ts`), with the listeners they share. |
| `Sparkline` | Zero pixels wide where the container is as wide as its content: the `trend` slot of a `SummaryTile`, the `trailing` slot of a list row. | A width of its own there (`--umbra-sparkline-width`, 4rem). |
| `HorizontalScroller` | The all-in-one wrapped a child that was an `Item` again: a list item in a list item. | Not wrapped twice. |
| `Planner`, `WeekStrip` | Items beyond `slotsPerDay` were dropped with no sign. | "+N" beside the date, named and with a tooltip (`hiddenItemsLabel`). |
| `Planner` toolbar, `MediaCard` | Actions were cut or squeezed when they did not fit; no "more" menu. | `ActionsRow` (`moreLabel`). Baselines changed: `time-planner--parts`, `data-mediacard--variants`, `data-mediacard--right-to-left`, all at spacious 1024x600. |
| `MediaCard` | No selected state. | `selected`: violet fill, a lighter edge, `aria-current`. |
| `Spotlight` | `backLabel` beside `nextLabel`; a target that moved with no event was followed late; with no room at either side the callout covered the target; a missing target was skipped silently. | `previousLabel`; followed every frame; below or above; a development warning (no browser test: the built Storybook is a production build). |
| `Stepper` (every control that is not native) | A press on the field label did not focus it. | The field label gives the focus (`src/inputs/fieldParts.tsx`). |
| Every component | `id`, `data-*` and `aria-*` given to a component were dropped. | Decision 07, "Root attributes". |
| `TopBar` | The search trigger had no `data-part`. | `data-part="search"`. |
| `useFitLevel` | A shared hook lived in `src/data/`. | `src/internal/useFitLevel.ts`. |
| `useNarrow` | An app could not ask whether the columns are tabs. | Exported from `umbra-ui`. |
| `List` (fix pass of review 1) | A `ListItem` placed directly in a `List` failed with an error from React when it held an SVG. | It is left out, with a development warning that names `List.Item`; the rows beside it are drawn. |
| `SummaryTile`, `MediaCard` (fix pass of review 1) | A few pixels tall in a column without a height (a `size="content"` stack). | A flex basis of `0%` (`plan/layout.md`, "Mechanism"). The fixed height in the "Content cards" story is no longer needed and was left as it is. |
| Storybook | No "Time" in the sidebar order. | Added, with "Integration". |
| `plan/interaction.md` | The table of who has which states did not list the 23. | Listed, with a row for inputs. |

### Looked at and left as it is, with the reason

| Subject | Finding | Reason |
|---|---|---|
| Names of props, parts, blocks, tokens, `data-` attributes | Compared with the "Prop names" table and tier 1. One rename (`Spotlight`). `onPress` and `onAction`, no `is` flags, `aria-label`, `formatValue`, `thresholds` and `lowerIsBetter`, `renderLink`, `headingLevel`, id lists and their callbacks, the data state props, kebab `data-umbra` and camelCase `data-part` all agree. | Recorded in decision 07: `skeletonItems` beside `skeletonRows`; `previousLabel`/`nextLabel` against `backLabel`/`forwardLabel`; `sm`/`md`/`lg` for marks against `default`/`small` for controls; `hidden<What>Label`. |
| Numbers and dates | Charts format through the provider's locale; meters and inputs write plain numbers unless `formatValue` is given. | The same split as tier 1 (`ProgressBar`, `ValuePill`). Dates all go through the locale. |
| Icons | No component of the 23 imports an icon directly; all come from the icon map. The inline SVG is data marks and the picture placeholder. | Nothing to fix. |
| Key caps | Menu, tooltip and search hints are quiet text in a `<kbd>`; the sheet and the palette draw caps (`Kbd`). | One source for the text (`keyCaps`, `formatKeys`); two looks on purpose: a hint beside a label, a cap where keys are the subject. |
| Tooltips | The 23 all use the shared `Tip` or `useHoverTip`. | Nothing to fix. |
| Shapes | `SequenceDots`, `SeriesMarker` and the charts' point cues are three vocabularies. | Three jobs (`plan/specs/SequenceDots.md`). |
| `bandColour.ts` | Beside the threshold resolver. | It turns a band into a CSS colour for the two inputs that paint with an inline style; the meters paint by `data-tone` in CSS. One user group, no copy. |
| Direction | `time/grid.ts` and `HorizontalScroller` read the computed direction of their element. | As `table/grid.ts` does: what is drawn, which is the rule. |
| `Heatmap`, `Scatter` | Shrink order. | Already the order of the four charts, from the same code; both specs say so. |
| `Slider`, `Stepper`, `ColorScaleEditor` | No `loading`. | Confirmed in the fix pass of review 1: no tier 1 input that holds a plain value has one (`TextField`, `Checkbox`, `Radio`, `Toggle`); `loading` is for a control that itself waits (`plan/interaction.md`). |
| `EntitySwitcher` | Steppers follow the picker's order, not the order of `items`. | One order for both, now stated in the spec. |
| `WidgetBoard` | No animated change of column. | Layout changes are instant during a resize, by rule. |
| `WidgetBoard` header, `Comparison` | No "more" menu. | Neither has a row of the app's actions. |
| `Comparison` strip | Empty room at both sides of the strip in a wide slot, and under it when it stands in for the table (examined in the fix pass of review 1). | One centred group on purpose: the names belong with the pair of values between them (`plan/specs/Comparison.md`, "Resolved"). |

### Open

| Subject | What is open | Why |
|---|---|---|
| Actions that overflow | Fixed (2026-10-11, review 3, F1). Only what can be a row of a menu moves into it; a control inside a component of the app, a `Tag`, a plain element and text stay in the row. Left: a component of the app that renders a button together with something that is no action is left out of the menu, with a development warning (the app's mistake; it cannot be drawn as a row). | Decision 07, "Controls among actions that overflow". |
| `List` | A `ListItem` placed directly in a `List` (instead of `List.Item`) fails with an error from React when it holds an SVG. No development warning. | Tier 1; found while writing the stories. |
| `SummaryTile` | In a `size="content"` slot it is a few pixels tall. | Found in the story; a fixed height works around it. Not looked into. |
| `Planner` | The side column's content is mounted again when the column collapses or opens. | It needs the content moved as `Card` does. The hidden items of a day were the second half of this row: since the fix pass of review 1 the "+N" is a button that opens them in a popover, each calling `onAction(id)`, reached from the grid with F2 and Enter. Slot placement (T-7) is fixed too. |
| `PieIndicator` | The root is a `div`. | React Aria's meter. |
| `StarRating` | Fixed (review 1): a press chooses the whole star, a 24px target; a half is a drag along the row, or the arrow keys. | Its spec. |
| `ColorScaleEditor` | Fixed (review 1): the rows scroll in a `ScrollArea`. | Its spec. |
| `WeekStrip` | No shrink by height. | The card scrolls; which line matters is the app's. |
| `HorizontalScroller` | The fade is a mask, not a part. | It is not an element; `fade` and its token cover it. |
| Not examined | `EntitySwitcher`'s caret at icon-only, the `Planner`'s first scroll in tab mode. | No fault showed in the compositions; not looked at one by one. |

## Review 1: time, data and inputs (2026-10-11)

An independent reviewer (with two sub-reviewers) checked the 12 components against their specs and the definition of done, in a browser. Verdict: six of the twelve were not done (DateChip, WeekStrip, Planner, SequenceDots, MediaCard, Slider); four findings were blockers. Status is filled in by the fix pass. "Harness" is a page that mounts the built `dist/` under development React with arbitrary props.

### Blockers

| Id | Component | Finding | Reproduce | Status |
|---|---|---|---|---|
| S-1 | SequenceDots | "Maximum update depth exceeded" and the tree unmounts when about 50 or more marks must be dropped (55 items in 100px is fine, 60 crashes; also a resize from 2000px to 100px with 100 items) | `<div style={{width:100}}><SequenceDots items={60 items} /></div>` | fixed: the number of marks to drop is counted from the measured widths in one step (`advance` of `useShrinkLevel`), not one mark per render; tested with 60, 500 and 5,000 items and resizes both ways |
| T-1 | Planner | "Next month" or "Previous month" disables itself under the focus at `maxMonth` or `minMonth`; focus lands on `<body>` | Story `time-planner--plain`: focus "Next month", Enter | fixed: the button that disables itself hands the focus to the other of the two (`leaveDisabled`, `src/internal/focus.ts`) |
| T-2 | WeekStrip, Planner | Focus in a grid cell while the component swaps to its error or empty state: focus goes to `<body>` | `<WeekStrip today="2026-10-14" onDayAction onRetry error={flag} />`, Tab, ArrowRight, set `flag`; same for Planner with `error`, and `empty` | fixed: the grid moves the focus to the first control of the state (Retry), or to the state itself, and back to the cell when the grid returns (`src/time/grid.ts`). `DataTable` keeps its header in such a change, and its grid already took the focus back |
| I-1 | Slider | Turning `readOnly` on for an uncontrolled slider discards the user's value (100 goes back to `defaultValue` 30; after `readOnly` off it is 0), with "changed from uncontrolled to controlled" | `<Slider defaultValue={30} readOnly={ro} />`, focus thumb, End, toggle `ro` on, Home, toggle off | fixed: the slider always gives React Aria the value, and holds an uncontrolled one itself |

### Major

| Id | Component | Finding | Reproduce | Status |
|---|---|---|---|---|
| T-3 | DateChip in WeekStrip, Planner | The day number is cut, so a wrong date is drawn ("Wed 14" reads "Wed 1"), over day widths of 60 to 78px depending on density and `slotSize`; it is in a committed baseline, and `time.spec.ts` claims "never cut" | Story `time-weekstrip--default`, 1024x600, spacious | fixed: the weekday gives way first and the number stays; steps sized for the spacious density (room inside a day: 68 and 52px, 56 and 44px for `small`); beyond them the weekday is shortened, never the number. 1px sweep at three densities and both sizes; baselines re-captured |
| T-4 | Planner | PageUp or PageDown from an outside-month day does nothing when the target is in the month shown; the other direction skips a month | Story `time-planner--default`: focus Sep 28, PageDown | fixed: a page towards the month shown moves to that day at once; a page towards the day's own month shows it and keeps the day, so one key never moves two months |
| T-5 | WeekStrip | Pressable cells under 24px at the default `slotSize="small"`: compact 60x20 stacked with no gap; header 21px (default), 22px (spacious) | `<WeekStrip slotsPerDay={2} onAction onDayAction />` in a 420px box | fixed: a cell that can be pressed is at least 24px high; the chip and slot keep their look, and a strip that is only read keeps its height |
| T-6 | Planner | With a side column the ARIA columns are off by one: 8 column headers, slot rows of 7 cells with no `aria-colindex`; a Monday slot sits under "Sunday" | Story `time-planner--default`, role dump | fixed: `aria-colcount` 8, `aria-colindex` on every header and cell, `aria-rowspan` on the side cell |
| T-7 | WeekStrip, Planner | An item whose `slot` index is past the last line becomes "+1" while a free slot is drawn beside it; `slot: 1.5` vanishes with no mark | Two items on one day with `slot: 0` and `slot: 2` | fixed: an item whose slot is not one of the day's (past the last line, not a whole number, taken) takes the first free slot; "+N" only for a full day |
| M-1 | MediaCard | With `onPress` the title never clamps: `titleLines` is ignored, no ellipsis, no tooltip (15 lines where the same card with `href` has 2) | `<div style={{width:220}}><MediaCard title={long} onPress={fn} /></div>` | fixed: the text of a button title is clamped inside the button (a button is one box that the heading's clamp does not reach); tooltip too |
| M-2 | MediaCard | The title tooltip on keyboard focus of the card's link is gone within about 10ms; hover works | Story `data-mediacard--links-and-actions`, the linked card at 260px with a long title, Tab to it | fixed: the clamped title was a scrollable box, the focus scrolled it and the scroll closed the tip; it is clipped now (`overflow: clip`). Open beside it: a tip of `useHoverTip` still closes when an ancestor really scrolls to bring the focused control into view |
| M-3 | MediaCard | In a column flex container without a height it collapses to its padding and hides everything (34px compact, 2px hero): in `Card > Stack > MediaCard` and in an app's own flex column | Harness; `size="content"` on the card avoids it | fixed in the CSS, not in `useFitLevel`: the cause is `flex: 1 1 0`, which is zero high in a column without a height; the basis is `0%` (the content's height there). The hook then never steps; its comment says what it needs. `Comparison` (`height: 100%`) was already right |
| M-4 | MediaCard | Loading does not hold the final layout in a content-sized place: compact 90px grows to 142px, hero 309 to 333, pair shrinks 82 to 74 | `loading` true then false, 320px wide | fixed: with the content's props, each piece is laid out unseen under a placeholder of its size; measured per variant |
| C-1 | Comparison | `variant="strip"` while loading draws the 5-row table skeleton (188px, then 36px); in a 120px slot it overflows by 68px | `<Comparison variant="strip" loading />` | fixed: a loading strip is the strip, with the two sides and placeholders for the values |
| C-2 | Comparison | A strip with a `summary` and `rows={[]}` shows "Nothing to compare" instead of the strip | `variant="strip" rows={[]} summary={{values:[1,2]}}` | fixed: a strip with a `summary` is not empty without rows |
| I-2 | Slider | The output never truncates, so a band label eats the track: with "100 · Very high" the track is 51px in a 200px slot, 0px at 130px, and the root overflows by 3px | Thresholds with labels "Low" / "Very high", `defaultValue={100}` | fixed: the output is cut with an ellipsis and a tooltip; the track keeps 48px |
| I-3 | Slider | Dragging across a band whose label has another length makes the value jump (1px moves give 61…69, 70, then 96) | Same thresholds, `defaultValue={60}`, 260px slot | fixed: the output keeps the width of its longest text, so the track does not change size in a drag |
| I-4 | Stepper | Native form reset does not reset it (a Slider in the same form resets) | Uncontrolled `Stepper name defaultValue={3}` in a form, ArrowUp, reset | fixed: one hook for a control that is not native (`src/inputs/formValue.tsx`); `forms.spec.ts` |
| I-5 | ColorScaleEditor | An unsorted list without `min` is collapsed: `[{from:60},{from:0},{from:30}]` becomes 60, 61, 62 | That `defaultValue`, no `min` | fixed: without `min` the bottom is the lowest `from` (`bottomOf`, unit test) |

### Minor

| Id | Component | Finding | Status |
|---|---|---|---|
| S-2 | SequenceDots | A `mark` part given as a function or a node logs React's missing-key warning | fixed: each mark is keyed by the component (unit test, `src/data/SequenceDots.test.tsx`) |
| S-3 | SequenceDots | `tone="accent"` marks are 2.56 to 2.59:1 against the card on all four tints | fixed: the lighter violet of a selected row's stripe, 3:1 or more on every tint (`--umbra-sequence-dots-accent-color`) |
| S-4 | SequenceDots | Skeleton size differs from the data: `sm` dots 56px loading, 48px loaded; with `onAction` 66x10 loading, 120x24 loaded | fixed: the placeholder is counted from the same private sizes as the marks; measured for 12 cases |
| S-5 | SequenceDots | The tooltip of a pressable mark is not its description (`aria-describedby` is null), and the summary holds labels only | fixed: a text tooltip is the button's `aria-describedby`, and is in the default summary in brackets |
| M-5 | MediaCard | Compact width steps fire at a card width of 254 and 194px, not 220 and 160 (the query measures the content box); hero at 222 and 162 | fixed in the spec, not the code: the thresholds are of the room inside the padding and border, which is what a container query measures; tested to the pixel |
| M-6 | MediaCard | Focus ring over a light picture (`behind`): 1.43:1 at the top edge | fixed: a dark band inside the ring when the picture is behind (`--umbra-media-card-focus-band`); 3:1 measured on every tint |
| M-7 | MediaCard | The article has no name while loading, or when `title` is replaced through `parts` (`aria-labelledby` points at a missing id); without a `title` an empty heading is rendered | fixed: `loadingLabel` names a loading card; `aria-labelledby` only while the title is in the card; no heading without a `title` |
| M-8 | MediaCard | With `meta`, `category` and `actions` hidden by `null` parts, an empty 28px footer row stays | fixed: an empty footer is not displayed |
| M-9 | MediaCard | `MediaCardActionsProps` is not exported though `parts.actions` uses it; the spec's props table lacks `selected` and `moreLabel` and still says "No `selected`"; no `selected` in the component's own stories | fixed: the type is exported, the spec lists `selected`, `moreLabel` and `loadingLabel`, a selected card is in the "States" story |
| C-3 | Comparison | Skeleton rows with bars are 26.3px, loaded rows 30px | fixed: a placeholder row holds a line of text and a bar of the bars' height |
| C-4 | Comparison | Very long values overflow and are clipped with no ellipsis or tooltip | fixed: a value is held to two fifths of the width and ends in an ellipsis, with a tooltip |
| C-5 | Comparison | The second side carries `data-part="opposite"`, not `side` as the anatomy names it | fixed: both are `data-part="side"`, with `data-side` |
| C-6 | Comparison, MediaCard stories | Sample icons use `EntityIcon name`, so headers read "Region A Region A" | fixed: the sample marks are decoration (`alt=""`); the spec says so for `icon` |
| T-8 | Time | A selected slot with `aria-label` does not say "Selected" | fixed: `selectedLabel` is added to the `aria-label` |
| T-9 | Time | Loading does not hold the layout without `slotsPerDay` | fixed: without `slotsPerDay`, loading keeps the lines of the items given, else those last shown, else two; the first load of an app is held by `slotsPerDay` (WeekStrip spec) |
| T-10 | Time | The `font` tokens do not resize `small` | fixed: the smaller font of `small` is the default of the token |
| T-11 | Time | `slot`, `placeholder` and `day` have no `data-part` | fixed: `data-part` `day`, `slot`, `placeholder` |
| T-12 | Time | `weekEmpty: null` leaves a blank row | fixed: no row, and the side cell spans the headers alone |
| T-13 | Time | An invalid `today`, `month` or `date` throws, while an invalid item date is dropped silently | fixed: one rule (`validDate`): a warning in development and a fallback, never a throw; the table is in the Planner spec, "Dates" |
| T-14 | Time | The two Shrinking stories are clipped at 1024x600 | fixed: the strips wrap side by side, the two planners give way together |
| T-15 | Time | Steps fire at 132/68/60/52px, not 128/64/56/48; `hiddenItemsLabel` and `moreLabel` are missing from the props tables of the specs | fixed: the spec was wrong (it gave the width of a day; a container query measures the room inside it, 4px less). The specs now state the room and the new steps of T-3; both props are in the tables |
| I-6 | SplitButton, Menu | Duplicate item ids unmount the tree when the menu opens | fixed: a repeated id gets a key of its own and a development warning (`src/internal/distinctIds.ts`) in `Menu`, `Select`, `SearchField`, `List`, `Tabs`, `SegmentedFilter` |
| I-7 | Stepper | `required` does not block submit | fixed: the browser validates the stepper; the field shows its message. Also `TextField`, `SearchField`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, which showed no message |
| I-8 | StarRating, Slider | A `FormField` label press focuses nothing | fixed: the field label gives the focus to the tab stop of a group (`fieldParts.tsx`); also `RadioGroup`, `CheckboxGroup`, `ColorScaleEditor` |
| I-9 | SplitButton | Drops `id` | fixed: the field id no longer replaces the given one with nothing |
| I-10 | StarRating | Without `name` it submits under a generated key | fixed: the generated name is taken out of what the form sends; also `RadioGroup` |
| I-11 | StarRating | The skeleton omits the value text | fixed: the blocks draw their placeholders, the value text keeps its room |
| I-12 | ColorScaleEditor | Its six `--umbra-color-scale-editor-*` tokens are missing from `docs/customisation-tables.md` | fixed: the generator took `--umbra-color-…` of a component for a global colour token |
| I-13 | Stepper | Shows a clamped value but submits the raw one | fixed: what is sent is what is shown |
| I-14 | Slider | The scrubber thumb target is 20px wide | fixed: a 24px target around the 6px bar |
| I-15 | Slider | Duplicate marks log a key error | fixed: marks are keyed by position |
| I-16 | SplitButton | `onPress` receives a press event | fixed, in `Button` too: the press event no longer reaches `onPress`. Still open in other groups: `MediaCard`, `ScheduleSlot` and `ContextBlock` hand `onPress` to a native `onClick` |
| I-17 | ColorScaleEditor | At 180px the colour select shows only its caret | fixed: the colour choice keeps 64px, the boundary field gives way first |
| X-1 | ScheduleSlot spec | "fixture chip" is a sport term in a spec | fixed: reworded |

### Test gaps named by the review

No test for more than about 50 marks in SequenceDots; none presses Previous/Next up to a month limit, swaps state with focus in the grid, or pages from an outside day; no "nothing moves" measurement for loading in any of the 12, and no strip-loading case; MediaCard has no focus tooltip test, no long title on a button card, and widths are checked only at 300/210/150px; Comparison's strip width steps (320, 260) are untested; shrink tests in the time and inputs files sample fixed widths only (no sweep or boundary); inputs have no native reset, `required` or `readOnly` toggling tests.

Inputs, closed in the fix pass: native reset, `required`, label press, a missing `name` and `disabled` for every named input (`tests/visual/forms.spec.ts`); `readOnly` toggling, a drag of one pixel at a time and a sweep of the slot width for `Slider` (`inputs-tier2.spec.ts`, "review 1").
Data group, closed in the fix pass (`tests/visual/data-tier2.spec.ts`, "review 1", on the story `Integration/Data cases`): 60, 500 and 5,000 marks and resizes both ways; "nothing moves" for 12 cases of SequenceDots, 5 of MediaCard and 4 of Comparison, the loading strip among them; the focus tooltip and the long title of a button card; the width steps of MediaCard and of the strip to the pixel, both ways.

### Verified correct

Tokens, parts and blocks of the data group (25 token values set on an ancestor applied); 1px shrink sweeps of the data group identical both ways and equal to a fresh mount; keyboard of the data group; 22 stories at four sizes and three densities, the other tints and right to left with no page scroll, no console output and axe clean; server rendering of all 12 components; no third-party type in any `dist/**/*.d.ts`; 12 sampled mutations all caught by the tests; locales, week starts, non-Latin digits, leap day and year boundary in the time group. Not verified: a real screen reader, Firefox and Safari, hydration.

## Review 2: meters, charts, shell, layout, overlays, the two pages, the cross-cutting fixes (2026-10-11)

An independent reviewer (with three sub-reviewers) checked 11 components, the planning and analysis pages, and four cross-cutting changes: (a) `useShrinkLevel` inside overlays, (b) the on-demand overflow menu, (c) the popover of a layout-collapsed card, (d) root attributes. Verdict: the milestone criterion is met (both pages fill every tested window with no page scroll), and the scope is not done: 7 blockers, 13 majors, about 35 minors. Status is filled in by the fix pass. "Harness" is a page that mounts the built `dist/`.

### Blockers

| Id | Component | Finding | Reproduce | Status |
|---|---|---|---|---|
| X-1 | `Card` popover, `Popover.Content` | A layout-collapsed card inside a `Modal`: pressing its header closes the whole modal, and each collapsed card already shows an empty 2px dialog. A stand-alone `Popover.Content` reads the modal's `OverlayTriggerStateContext` (`src/overlays/Popover.tsx`) and takes the modal's open state as its own: a plain `Popover.Content anchorRef open={false}` in a modal closes the modal on mount. Stray dialogs inside a `Popover` too | A `Stack` with a height in a modal, cards that collapse; a stand-alone `Popover.Content` in a modal | fixed: a content is under a root only when `Popover.Root` says so; one Escape closes one layer |
| OP-1 | `Planner` | The same as T-1 of review 1 | `pages-planning--planning`: focus "Next month", Enter | open |
| MC-1 | `Heatmap` | An `Infinity` value (or `steps={NaN}`) throws and unmounts the tree | `values:[[Infinity,1],[2,3]]` | fixed: a value that is not finite is no value, a bad `steps` is the default (plan/decisions/03-charts.md, "Invalid input") |
| MC-6 | `Heatmap`, `Scatter`, `LineChart` (shared `Frame`) | Focus drops to `<body>` when the plot has focus and the chart switches to `loading` or `error` | Focus the plot, set `loading` | fixed: the element that holds the plot's focus stays through loading and error, in the shared frame; tested on all seven charts |
| SL-2 | `EntitySwitcher` | Picker open with focus on a row; the app sets `loading` or shortens `items`: focus goes to `<body>` with the picker still open | 3 items, ArrowDown twice, `loading: true` | fixed: focus goes to the replacing row, the current row, the field or the picker |
| SL-7 | `HorizontalScroller` | A `next` or `previous` given as a function part loses focus to `<body>` when the end is reached (the story's "Own buttons" row) | Press the custom "next" to the end | fixed: `holdFocus`, for any button, the app's own included |
| X-2 | `ActionsOverflow` | If the menu chunk fails to load, the "more" button toggles `aria-expanded` and shows nothing: no error, no fallback, the actions are unreachable; a retry happens only on every second press | `route.abort()` on `Menu-*.js`, `layout-card-on-demand--fits-until-the-window-shrinks` at 700px | fixed: the actions open as a plain list (Popover API) when the menu cannot be loaded; every press asks again (`plan/specs/Card.md`) |

### Major

| Id | Component | Finding | Reproduce | Status |
|---|---|---|---|---|
| X-3 | Rows of actions with `staysInRow` controls | A 380px card with a `SearchField`, a `Select` and two buttons: the title shrinks to 0px, the select is cut, and the "more" button is clipped 56px outside the card; the search field never narrows; with seven kept controls a `Checkbox` label wraps one letter per line | Harness | fixed: title minimum, fields shrink to a minimum, then the controls wrap; in a card on a line under the title (decision 07). Open: `TopBar` (one line by design) and the rows of `MediaCard` and the `Planner` toolbar, where a control that does not fit is still clipped |
| SL-3 | `ContextBlock` in `TopBar` | With `live` and no `time`, the chip arrives after the bar measured and the bar never steps: a fresh load at 880px keeps both lines and the nav is cut; a 1px resize corrects it | Fresh load at 880px | fixed: the bar watches its slots and starts again when one grows |
| OP-2 | `Spotlight` and the shortcut registry | During a non-interactive tour, registry shortcuts still run; a modal they open lands under the dim with focus inside it | `pages-analysis--analysis`: Shift+T, then `?` | fixed: no registry shortcut while a spotlight is not interactive; a modal that opens closes the spotlight |
| OP-3 | Shortcut registry | `?` and every bare-key shortcut do nothing while focus is on a checkbox or a range input: `isTypingTarget` counts any `INPUT` | Focus a checkbox, press `?` | fixed: only controls that take text (`takesText`, unit-tested over every input type) |
| MC-2 | `PieIndicator` | `layout="block"` with `showValue` never shows the value at any width; the baseline shows it missing | `meters-pieindicator--variants` | fixed: the value has its own line there and is measured against it |
| MC-3 | `Heatmap` | With `thresholds`, a value below the first `from` is not drawn and is no keyboard stop | 6 values, 4 cells | fixed: drawn in the low colour, in no band, a keyboard stop |
| MC-4 | `Scatter`, `Heatmap` (`points`) | One `NaN` coordinate blanks the chart | One NaN point | fixed: the point is left out and does not stretch an axis |
| MC-5 | `Sparkline` | The last point is never coloured by its band: the `.marker` class fill beats the `fill` attribute | `thresholds` on a line | fixed: the colour is a style, which the class no longer beats |
| MC-7 | `Scatter` | A small point under a larger bubble of a later series cannot be hovered | Two series at (5,5), sizes 1 and 100 | fixed: one draw order across the series, largest first |
| SL-1 | `WidgetBoard` | Firefox: a board taller than about 10,000px loses its tail (120 widgets end at "Widget 50", 69 overlap); Chromium is fine | 120 widgets in Firefox | fixed: the script places the items, the grid has no rows; any height |
| SL-4 | `WidgetBoard` / content-sized `Card` | A caret collapse ends with one painted frame of the full-height card before the collapsed state (87 → 226 → 70px) | `layout-widgetboard--default`, press a caret | fixed: the body goes in the frame the animation ends (as O-1) |
| SL-5 | `HorizontalScroller` | ArrowRight on a `Select` trigger inside an item moves to the next item and also changes the select's value | An item holding a `Select` | fixed: a `Select` trigger keeps its arrow keys |
| SL-6 | `HorizontalScroller` | `--umbra-horizontal-scroller-button-size` does nothing | Set 51px, 36px drawn | fixed: the token sizes the buttons |

### Minor

| Id | Component | Finding | Status |
|---|---|---|---|
| X-4 | `ActionsOverflow` | A press kept while the chunk loads cannot be taken back: Escape, Tab away or a press elsewhere, and the menu still opens on arrival and takes the focus | fixed: Escape, focus leaving the button and a press elsewhere take the press back |
| X-5 | Root attributes | `SplitButton` drops `id` and `aria-describedby`; `ColorScaleEditor` drops `aria-describedby`; every chart drops `aria-describedby` in all data states | fixed for `SplitButton` (`id`, `aria-describedby`) and `ColorScaleEditor` (`aria-describedby`); the charts are another agent's |
| X-6 | `ContextBlock` | A fixed `time` rendered on a server in another time zone gives a hydration mismatch; the spec should name `timeFormat.timeZone` | fixed: without a time zone the time is written in the browser; same markup on both sides |
| X-7 | `thresholds.spec.ts` | Covers no tier 2 meter: a mutation of `PieIndicator` or `DivergingMeter` bands passes this file | fixed: a tier 2 story of the one list, and a test of the bands, colours and labels of `PieIndicator`, `DivergingMeter`, `Sparkline` and `Heatmap` |
| X-8 | `Card` popover | The app unmounts a collapsed card while its popover has focus: focus on `<body>` | fixed: the focus goes to the next tab stop of the stack (`focusNear`) |
| X-9 | `ActionsOverflow` | Menu open, row widened, Escape: focus goes to the first control of the row, not to an action that came back (matches the stated rule; noted) | fixed: the focus goes to the first action that came back |
| OP-4 | Analysis page | The fifth star of the "Rating" column is clipped in every row at 1920x1080 | fixed: the column is 108px; a display rating too narrow for its stars draws one star and the number |
| OP-5 | Analysis page | Annotation labels sit under bars and lines | fixed: labels are drawn last in the picture, above the marks, with the halo of the labels on marks |
| OP-6 | Planning page | At 900x560 spacious the month is not scrolled to today's week | fixed: today's week stays in view through the first sizes, until the user scrolls |
| OP-7 | Planning tour, step 2 | The ringed week is partly under the sticky weekday header | fixed: `scroll-padding-top` of the weekday names on the planner's scrolling element |
| OP-8 | `Spotlight` | With every target missing, `onStepChange(1)` fires after `onOpenChange(false)` | fixed: the target is not looked for after the spotlight has closed |
| OP-9 | `ShortcutsSheet` | The root carries `data-umbra="modal"`; nothing carries `shortcuts-sheet` | fixed: `shortcuts-sheet`; `ConfirmDialog` is `confirm-dialog` |
| OP-10 | `Spotlight` | `--umbra-spotlight-z-index` works but is missing from the generated table | fixed: the generator reads the base stylesheet |
| OP-11 | `ShortcutsSheet` | "arrowup" finds nothing; only "↑" does | fixed: a key is found by its name too, from its start |
| MC-8 | `sparklineColumn` | A `NaN` in a run breaks the sort | fixed: the last finite value |
| MC-9 | Charts in a `Modal` | With a sibling in the body, `height="fill"` gives 348px instead of 240 and the body scrolls | fixed: a modal body that holds a filling chart is a column (`Modal.module.css`); charts only |
| MC-10 | `Heatmap` | The cell edge measures 2.3 to 3.3:1 on fractional pixels, against the 4.1:1 the spec states | fixed: cells on whole pixels; each edge measured at 3:1 or more on the four tints |
| MC-11 | `PieIndicator` | The edge of an empty 16px disc is under 3:1 (2.78 at zero, 2.31 with no value); the two states look alike | fixed: a 1.5px edge in the muted text colour (3:1 or more as drawn); no value is a hollow dashed ring with a dash |
| MC-12 | `Scatter` | Points outside a narrowed domain are drawn over the tick labels; with `axes={false}` an edge point is cut in half | fixed: points outside a set domain are left out; without axes the scales stop a point short of the edge |
| MC-13 | `Heatmap` | Duplicate row or column names collapse onto one cell, silently | fixed: both are drawn, the later one as "A (2)", with a warning |
| MC-14 | `DivergingMeter` | `value={0.3} origin={0.1}` shows and speaks "+0.19999999999999998" | fixed: rounded to 12 significant digits |
| MC-15 | Both meters | For one pixel of width the label is cut while the value still shows | fixed: the label's own text is the measure |
| MC-16 | `Scatter`, `Heatmap` | 5,000 marks: 104 to 138ms per resize; Scatter with `labels` 357 to 458ms per resize and 143ms per arrow key | fixed: a key builds nothing again (a frame, was 143ms); labels are measured once and collisions use a grid. Open: a resize of 5,000 marks is still about 100 to 150ms, the cost of drawing 5,000 SVG nodes |
| MC-17 | Docs | The `valueDomain` doc says lowest and highest, the code rounds; `--umbra-sparkline-width` is missing from the spec's token list | fixed: the doc comment and the spec |
| SL-8 | `EntitySwitcher` | With a disabled current entity the steppers lose their place | fixed: the steppers go to the neighbours of the current entity |
| SL-9 | `EntitySwitcher` | No search field, opened while loading: when rows arrive focus stays on the dialog and arrows do nothing | fixed: the current row takes the focus when the rows arrive |
| SL-10 | `EntitySwitcher` | With text in the search, the first Escape only clears it (the spec says Escape closes) | fixed in the spec: the first Escape empties the field, the `SearchField` rule; code unchanged |
| SL-11 | `EntitySwitcher` | `--umbra-entity-switcher-picker-width` on an ancestor has no effect (the picker is in the provider root) | fixed for every popover: the overlay takes the tokens of its anchor (decision 07) |
| SL-12 | `EntitySwitcher` | An ungrouped entity after grouped ones reads as part of the last group | fixed: a line sets them apart |
| SL-13 | `ContextBlock` | The generated table says "Tokens: none of its own"; all 11 exist and work | fixed: the generator lists them |
| SL-14 | `ContextBlock` | The weight in the two font tokens is ignored | fixed: the font tokens are taken whole |
| SL-15 | `ContextBlock` | A plain block's hidden lines are in a hover-only tooltip: not reachable by keyboard | fixed: a tab stop while a bar hides a line |
| SL-16 | `WidgetBoard` | With `span` there are holes and widgets 6 and 7 sit above 5 | fixed: no widget above an earlier one of its column; the room above a spanning widget stays empty, by design |
| SL-17 | `WidgetBoard` | "Collapse all" drops ids the board does not know | fixed: unknown ids are kept |
| SL-18 | `WidgetBoard` | 400 widgets: worst frame 68ms on a caret, 159ms on "expand all" | fixed: one read pass a frame, only changed places written, observers kept; rendering 400 cards in React remains |
| SL-19 | `HorizontalScroller` | Arrow keys stop at an item whose first control is a `Toggle` | fixed: a checkbox or switch does not stop the arrow keys |
| SL-20 | Story | `shell-contextblock--shrink` scrolls its frame sideways by 8 to 16px at 1024x600 | fixed: the story's bars are no wider than the frame |

### Verified correct

`useShrinkLevel`: 1px sweeps of the TopBar with ContextBlock and EntitySwitcher identical both ways and equal to fresh loads, two resizes in one frame, menus held open through resizes, cold fonts, rows inside a Modal, a Popover and a collapsed card's popover (the one hole is SL-3). The on-demand menu on the good path. The collapsed card's popover on the page (controls respond, typed text survives a resize, focus returns, StrictMode clean). Root attributes in 97 of 100 cases. Server rendering and hydration of all 11 components (apart from X-6). No third-party type in `dist/**/*.d.ts`. 34 test mutations all caught (X-7 is the one gap). No page scroll in any story or page at four sizes and three densities with wheel, keys and tabbing; shrink steps without hysteresis; the heat scale's second cue always present; meter bands equal `ProgressBar`; Spotlight ring 17:1 and above. Not verified: a real screen reader, Safari, Firefox beyond SL-1, touch, development-only warnings.

## Owner's feedback from Storybook (2026-10-11)

Found by the owner while using the Storybook. Each is a requirement of the fix pass. Two change earlier decisions (O-2 and O-6); the change is recorded in `plan/components.md` under "Decisions" when it is built.

| Id | Where | Finding | Status |
|---|---|---|---|
| O-1 | `WidgetBoard` (analysis page) | Collapsing a card is not smooth: it flickers before closing (the same as SL-4) | fixed: the body goes in the frame the animation ends; cards keep their column while one moves |
| O-2 | `DataTable` (table page) | When the width cannot show every column, the user cannot choose which columns to show or hide, nor resize or reorder them. **Changes the decision "no end-user column editing"**: the table gets a column menu (show, hide, reorder, resize, reset), controlled by the app so it can save the choice | fixed 2026-10-11: columns button and menu, header menus, resize handles, `columnState` (`plan/specs/DataTable.md`, "Resolved") |
| O-3 | Table page, "Views" card (`VerticalNav`) | The items hug the left and leave the right of the card empty: they should fill the width | fixed: the nav fills its container; 240px only as a column of the page |
| O-4 | Selected and highlighted rows | The left edge stripe is unwanted on: the selected item of a `VerticalNav`, the highlighted row of the command palette, the selected option of an open `Select` or `Menu`. It stays on list items of the inbox kind and on table rows. The second cue that is not colour must remain (a check, a weight change) | open |
| O-5 | Inbox page, favourite button (`IconButton` toggle) | A pressed star is an outline star in an outlined box: it should be a filled, coloured star, and a pointer press should not leave a focus ring | fixed: accent colour and a filled icon, no box on `ghost`; `pressedIcon`; `Button` `pressed`. No focus ring after a pointer press was reproduced at the unfixed commit either: the ring seen was the outline of the pressed state |
| O-6 | Theming | Changing the brand colour changes little: everything stays purple and magenta. Brand and context should visibly drive the look. **Changes the decision "violet (selected) and magenta (primary action) are fixed"**: they become defaults derived from the brand, still overridable as tokens | open |
| O-7 | `LevelMeter` rows (list and detail page) | Each meter starts right after its label, so the meters do not line up: labels need their own column and the meters theirs | fixed: `MeterList` (plan/specs/MeterList.md), used on the detail screen and in the dashboard example |
| O-8 | Table page | The `ActionBar` of the selection is hidden under the table's summary row | fixed: the table is its own stacking context (`isolation: isolate`); the page and the example compose it rightly |
| O-9 | `ContextBlock` | An optional background, slightly lighter or darker than the bar it sits in, as in the source | fixed: `variant="filled"`, from the brand; `plain` stays the default |
| O-10 | Theming | One global setting for how opaque card backgrounds are over the app background | open |

## Review 3: the package, the checks, the docs, the examples, the open items (2026-10-11)

An independent reviewer re-proved each open item of Milestone 1 and checked the package, docs and examples at `9f0ad6f`. Verdict: **ready for the owner to consider a release, with gaps**; no blocker, four majors. Status is filled in by the fix pass.

| Id | Severity | Area | Finding | Status |
|---|---|---|---|---|
| F1 | major | `Card` actions | A `Tag` among a card's `actions` white-screens the app when the header overflows and "more" is pressed; an app component wrapping a `Select` vanishes from row and menu; no guide says what `actions` may hold | fixed: only what can be a row moves into the menu; everything else stays in the row; decision 07 and `plan/specs/Card.md` say what `actions` may hold |
| F2 | major | Types | `ColorScaleToneLabels` is a `Partial<Record<…>>`, so `toneLabels={{ accent: cond ? 'A' : undefined }}` fails under `exactOptionalPropertyTypes`: the only failure across 89 components and 5,034 optional members | fixed: a mapped type whose members accept `undefined` |
| F3 | major | Storybook on Pages | The published site holds the Milestone 1 state (354 stories): no tier 2 component and no new page, while README and `docs/browser-checks.md` send readers there | open |
| F4 | major | Tests | `playwright.examples.config.ts` sets `retries: process.env.CI ? 2 : 0` | fixed: `retries: 0`; three runs in a row, 42 of 42 each, nothing leaned on a retry. `reuseExistingServer: false`: with the port taken the run stops ("is already used") |
| F5 | minor | Check | `check-optional-props.mjs` misses `Partial<…>`, optional tuple members and class properties; the consumer check in `check:package` covers tier 1 components only | fixed: a second pass walks every export of the two entries by type (3,183 types): `Partial`, `Record` under `Partial`, tuples, classes, intersections, mapped types, generics, callbacks and re-exports are planted in a virtual file and must each be reported on every run. `check:package` generates a file from the exports: 474 components and blocks, each optional prop given `undefined`, with a control that must fail |
| F6 | minor | Server rendering | `<CommandPalette open>` or `defaultOpen` throws `document is not defined` in `renderToString` (`useReturnFocusOnClose`, `src/overlays/shared.ts`); the other 88 components render | fixed: no document read while rendering; `check:package` renders every overlay open on a server |
| F7 | minor | Check | `check-tokens.mjs` is fooled by a computed key, `setProperty(variable)`, `cssText`, a token read only in a comment, and an unused member of a scale | fixed: comments are removed first (the compiler does it for code); in code every `--umbra-` name outside `var()` and `getPropertyValue()` needs a row (computed keys, constants, `setProperty`, `cssText`); each scale lists the members its template builds. Seven plants, seven failures |
| F8 | minor | Check | `check-browsers.mjs` is a denylist: newer features with no row pass (`corner-shape`, `sibling-index()`, `if()`, `scroll-state()`, `moveBefore`, `popover="hint"`, iterator helpers) | fixed: for CSS an allowlist (`known`): at-rules, pseudo-classes, pseudo-elements, functions, properties, units and query features, generated from the stylesheets and looked up in browser-compat-data 8.1.5; a name not on it fails. 56 more rows with versions (CSS and JavaScript). Found on the way: `paint-order` (Chrome 123 on HTML text; used on SVG text only, noted). JavaScript stays a table: an allowlist of member names is not practical |
| F9 | minor | Docs | Recipe 18 says a label press does not focus a `Stepper` (it does); recipe 17 says a moved target is followed "at the next of those" (it is followed every frame) | fixed: both recipes say what happens (the label gives a `Stepper` the focus; the ring is placed every frame) |
| F10 | minor | Docs | Stale facts: README lists four charts (seven); "Chrome 111 is enough" beside the Popover API (114) marked required; `docs/releasing.md` "about 670 kB packed" (964) and "all `minor`" (five are patch); CONTRIBUTING "twelve images or more" (5); decision 06 "1,979 images, 92 MB" (2,882, 143 MB) | fixed: seven charts (the docs check now compares the row with the exports); Chrome 114; sizes left to the command that prints them or given with a date; five images per story; decision 06 dated |
| F11 | minor | Docs | `SequenceDots` is in no guide or recipe; `Comparison`, `SplitButton`, `ScheduleSlot` and `DateChip` have no sample | fixed: recipe 21 (`Comparison`, `SequenceDots`, `MeterList`, `DateChip`, `ScheduleSlot`, `SplitButton`, `ContextBlock variant="filled"`), compiled; form behaviour in recipe 18; `MeterList` in the README and the guide. The docs check fails when a component is missing from the README's overview |
| F12 | minor | Docs | Not told to users: `StarRating step={0.5}` pointer targets are 12 to 16px; `renderWeek` content loses its state when the Planner's side column collapses | fixed: both are in the recipes where the feature is shown (15: a press chooses the whole star, a drag or the arrow keys a half; 14: keep the state of `renderWeek` in the app) and in the changelog's "Known limits" |
| F13 | minor | Docs | README and "Server rendering" say to import from a `'use client'` file; "Debugging" says a Server Component can import directly (the second is true, checked in a Next.js 16.4 app) | fixed: README and "Server rendering" say a Server Component imports directly (every module starts with `'use client'`) |
| F14 | minor | Lint | One ESLint warning (`src/overlays/Spotlight.tsx`), and `eslint .` has no `--max-warnings 0` | fixed: the dependency is given; `eslint . --max-warnings 0` |
| F15 | minor | Example | `examples/advanced` `#/clients` at 1024 wide: the fifth star of "Rating" is cut by 8px | open |
| F16 | minor | Shortcut | `Alt+ArrowLeft` does nothing while focus is on a `PrimaryNav` link | fixed: an arrow key with Alt, Ctrl or Command is not the nav's |
| F17 | minor | Changelog | The rehearsed changelog reads as a diff against unreleased states ("`backLabel` is now `previousLabel`" for a new component; "was 75"); `rtl-and-maps.md` credits a Safari fallback that was removed | fixed: twelve changesets by area describe what `0.1.0` holds, all `minor`; the limits are one entry. `npm run release:check -- --changelog` prints the rehearsal |
| F18 | minor | Limit | `PACKED_LIMIT_KB` is still 1300; its comment says to lower it to measured plus a quarter (about 1205) once Milestone 2 is built | fixed: 1320 kB (1054 measured on 2026-10-12 with the table's column controls merged, plus a quarter; 1021 before them, so the projected 1300 was close). Ceilings for `DateChip`, `StarRating`, `MeterList`, `Sparkline`, `Spotlight`, `Planner`. `Planner` is not split: its month `Select` is drawn at first paint (decision 05) |
| F19 | minor | CI history | Two red runs on `main` (`50b4c55`, `853fe67`), the same screenshot; green since `16b7e04`; not in AGENTS.md "Known issues" | fixed: in AGENTS.md "Known issues" |
| F20 | minor | Small | README links a `CHANGELOG.md` that does not exist until release; the AGENTS.md repo map omits six test files; the dashboard example hard-codes a date beside a live clock; no tier 2 component has a size ceiling in `check:package` | fixed: the README links `.changeset` until the changelog exists (`release:check` guards the link both ways; a step in `docs/releasing.md`); the repo map lists every test file; the dashboard's date and week are today's, as its clock is; tier 2 ceilings (F18) |

### Open items of Milestone 1, as re-proven

| Item | Verdict |
|---|---|
| Optional props take `undefined` | Proven, one exception (F2); the check can be fooled (F5) |
| No component declares a public token | Proven in a browser (813 tokens set on the root across 9 stories and 79 component kinds); the check can be fooled (F7) |
| Tooltips inside a modal | Proven by the tests and CI |
| `Card` and the on-demand menu, size ceilings | Proven; the esbuild `splitting` regression is real (any import loads about 66 KB first) and the docs state it without a figure |
| Unused tokens | Proven |
| Baseline trim | Proven: the no-page-scroll check runs for every story at 3 sizes × 3 densities; a planted stray image fails |
| Browsers | Proven for what is listed (F8); 18 version claims match MDN's data |
| Source maps | Proven (729 positions, 135 modules; Vite and webpack checked) |
| Storybook on Pages | The address is filled in; the site is stale (F3) |

### Measured

| What | Number |
|---|---|
| One import, KB gzip, what loads first under Vite | `Skeleton` 0.6, `DateChip` 6.0, `Tag` 13.8, `ProgressBar` 19.4, `StarRating` 22.6, `Sparkline` 26.1, `Button` 27.3, `Card` 36.0, `Spotlight` 41.2, `Planner` 107.1 |
| Tarball | 570 files, 964 kB packed, 3,717 kB unpacked; maps are 59% packed |
| Baselines | 2,882 images, 143 MB |
| Stories and tests | 516 stories; 8,044 browser tests; 149 unit tests; 58 doc samples; 42 example tests |

Not verified: a complete local browser run under load (CI on `9f0ad6f` is green), Firefox and Safari, a registry install.

### Found by the fix pass of review 3 (2026-10-12)

| What | Done |
|---|---|
| A callback prop handed to an event handler as it is (`onClick={onPress}`) is called with the event: 15 public callbacks in 12 components (`MediaCard`, `ScheduleSlot`, `ContextBlock`, `ListItem`, `Link`, `GroupHeader`, `SummaryTile`, `SectionTitle` and `Card` `onOpen`, `PageHeader` `onBack`, `ActionBar` `onClear`, `ShortcutBar` `onEdit`, `Avatar` `onError`, the cells of the time grids) | fixed: each is wrapped; the third pass of `check-optional-props.mjs` fails on a prop that declares fewer parameters than the handler would pass (it found all 21 places, internal ones included) |
| `HistoryButtons`: "Back" at the first place and "Forward" at the last dropped the focus to `<body>` | fixed: `leaveDisabled`; `tests/visual/focus-kept.spec.ts` |
| `Stepper` at an end, the steppers of `EntitySwitcher`, the edge buttons of `HorizontalScroller`, Back and Next of a `Spotlight` tour | already kept the focus; now tested, by keyboard and by mouse |
| A popover that closes with nowhere to return the focus to (open from the start, or opened while another popover was still closing: the report about `EntitySwitcher`) left it on `<body>` | fixed in `Popover`: the focus goes to the trigger; two tests |
| A text that is not a date threw an error that began with the mark of a development warning (`[umbra-ui]`), which the package check takes for a warning left in a production bundle (seen once `DateChip` and `Planner` had size cases) | fixed: the message begins `umbra-ui:` |
| An internal tuple type with an optional member without `\| undefined` (`src/overlays/shared.ts`) | fixed |

Not done: `Planner` on demand (decision 05, "Sizes on 2026-10-12"). Left open: after `Tab` out of a picker that was open from the start, a second `Tab` left the focus on `<body>` in one probe (story `Shell/EntitySwitcher`, "Picker states"); seen, not investigated.

Seen on `main` at `50e2ddb` (the merge of the table's column controls), not caused by this branch and not fixed here: `tests/visual/modal-overlays.spec.ts` fails, 8 of 8. In the story `Overlays/Layers`, "Data in modal", the modal that is open from the start is removed about 30 ms after it mounts (it holds a `DataTable`). The same 8 fail in a clean checkout of `50e2ddb`; they passed on this branch before that merge.
