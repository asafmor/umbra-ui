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
| `Slider`, `Stepper`, `ColorScaleEditor` | No `loading`. | Inputs (`plan/interaction.md`). |
| `EntitySwitcher` | Steppers follow the picker's order, not the order of `items`. | One order for both, now stated in the spec. |
| `WidgetBoard` | No animated change of column. | Layout changes are instant during a resize, by rule. |
| `WidgetBoard` header, `Comparison` | No "more" menu. | Neither has a row of the app's actions. |

### Open

| Subject | What is open | Why |
|---|---|---|
| Actions that overflow | A marked control inside a component of the app arrives in the menu. `Stepper` and `Slider` draw nothing there; the other marked controls (`Select`, `TextField`, `SearchField`, `Toggle`, `Checkbox`, `SegmentedFilter`, `StarRating`, `ColorScaleEditor`, `EntitySwitcher`) are not guarded, and an unmarked component with an icon or a styled element (a `Tag`) still breaks the menu. | The row cannot see into a component. A full fix renders the kept controls from a context, in every control. |
| `List` | A `ListItem` placed directly in a `List` (instead of `List.Item`) fails with an error from React when it holds an SVG. No development warning. | Tier 1; found while writing the stories. |
| `SummaryTile` | In a `size="content"` slot it is a few pixels tall. | Found in the story; a fixed height works around it. Not looked into. |
| `Planner` | The side column's content is mounted again when the column collapses or opens. The hidden items of a day cannot be activated (a name and a tooltip only). | The first needs the content moved as `Card` does. The second needs a popover of slots. |
| `PieIndicator` | The root is a `div`. | React Aria's meter. |
| `StarRating` | Half-step pointer targets under 24px. | See its spec. |
| `ColorScaleEditor` | Its rows scroll with the browser's scrollbar. | See its spec. |
| `WeekStrip` | No shrink by height. | The card scrolls; which line matters is the app's. |
| `HorizontalScroller` | The fade is a mask, not a part. | It is not an element; `fade` and its token cover it. |
| Not examined | `EntitySwitcher`'s caret at icon-only, the `Planner`'s first scroll in tab mode, the empty space of the `Comparison` strip. | No fault showed in the compositions; not looked at one by one. |

## Review 1: time, data and inputs (2026-10-11)

An independent reviewer (with two sub-reviewers) checked the 12 components against their specs and the definition of done, in a browser. Verdict: six of the twelve were not done (DateChip, WeekStrip, Planner, SequenceDots, MediaCard, Slider); four findings were blockers. Status is filled in by the fix pass. "Harness" is a page that mounts the built `dist/` under development React with arbitrary props.

### Blockers

| Id | Component | Finding | Reproduce | Status |
|---|---|---|---|---|
| S-1 | SequenceDots | "Maximum update depth exceeded" and the tree unmounts when about 50 or more marks must be dropped (55 items in 100px is fine, 60 crashes; also a resize from 2000px to 100px with 100 items) | `<div style={{width:100}}><SequenceDots items={60 items} /></div>` | open |
| T-1 | Planner | "Next month" or "Previous month" disables itself under the focus at `maxMonth` or `minMonth`; focus lands on `<body>` | Story `time-planner--plain`: focus "Next month", Enter | open |
| T-2 | WeekStrip, Planner | Focus in a grid cell while the component swaps to its error or empty state: focus goes to `<body>` | `<WeekStrip today="2026-10-14" onDayAction onRetry error={flag} />`, Tab, ArrowRight, set `flag`; same for Planner with `error`, and `empty` | open |
| I-1 | Slider | Turning `readOnly` on for an uncontrolled slider discards the user's value (100 goes back to `defaultValue` 30; after `readOnly` off it is 0), with "changed from uncontrolled to controlled" | `<Slider defaultValue={30} readOnly={ro} />`, focus thumb, End, toggle `ro` on, Home, toggle off | open |

### Major

| Id | Component | Finding | Reproduce | Status |
|---|---|---|---|---|
| T-3 | DateChip in WeekStrip, Planner | The day number is cut, so a wrong date is drawn ("Wed 14" reads "Wed 1"), over day widths of 60 to 78px depending on density and `slotSize`; it is in a committed baseline, and `time.spec.ts` claims "never cut" | Story `time-weekstrip--default`, 1024x600, spacious | open |
| T-4 | Planner | PageUp or PageDown from an outside-month day does nothing when the target is in the month shown; the other direction skips a month | Story `time-planner--default`: focus Sep 28, PageDown | open |
| T-5 | WeekStrip | Pressable cells under 24px at the default `slotSize="small"`: compact 60x20 stacked with no gap; header 21px (default), 22px (spacious) | `<WeekStrip slotsPerDay={2} onAction onDayAction />` in a 420px box | open |
| T-6 | Planner | With a side column the ARIA columns are off by one: 8 column headers, slot rows of 7 cells with no `aria-colindex`; a Monday slot sits under "Sunday" | Story `time-planner--default`, role dump | open |
| T-7 | WeekStrip, Planner | An item whose `slot` index is past the last line becomes "+1" while a free slot is drawn beside it; `slot: 1.5` vanishes with no mark | Two items on one day with `slot: 0` and `slot: 2` | open |
| M-1 | MediaCard | With `onPress` the title never clamps: `titleLines` is ignored, no ellipsis, no tooltip (15 lines where the same card with `href` has 2) | `<div style={{width:220}}><MediaCard title={long} onPress={fn} /></div>` | open |
| M-2 | MediaCard | The title tooltip on keyboard focus of the card's link is gone within about 10ms; hover works | Story `data-mediacard--links-and-actions`, the linked card at 260px with a long title, Tab to it | open |
| M-3 | MediaCard | In a column flex container without a height it collapses to its padding and hides everything (34px compact, 2px hero): in `Card > Stack > MediaCard` and in an app's own flex column | Harness; `size="content"` on the card avoids it | open |
| M-4 | MediaCard | Loading does not hold the final layout in a content-sized place: compact 90px grows to 142px, hero 309 to 333, pair shrinks 82 to 74 | `loading` true then false, 320px wide | open |
| C-1 | Comparison | `variant="strip"` while loading draws the 5-row table skeleton (188px, then 36px); in a 120px slot it overflows by 68px | `<Comparison variant="strip" loading />` | open |
| C-2 | Comparison | A strip with a `summary` and `rows={[]}` shows "Nothing to compare" instead of the strip | `variant="strip" rows={[]} summary={{values:[1,2]}}` | open |
| I-2 | Slider | The output never truncates, so a band label eats the track: with "100 · Very high" the track is 51px in a 200px slot, 0px at 130px, and the root overflows by 3px | Thresholds with labels "Low" / "Very high", `defaultValue={100}` | open |
| I-3 | Slider | Dragging across a band whose label has another length makes the value jump (1px moves give 61…69, 70, then 96) | Same thresholds, `defaultValue={60}`, 260px slot | open |
| I-4 | Stepper | Native form reset does not reset it (a Slider in the same form resets) | Uncontrolled `Stepper name defaultValue={3}` in a form, ArrowUp, reset | open |
| I-5 | ColorScaleEditor | An unsorted list without `min` is collapsed: `[{from:60},{from:0},{from:30}]` becomes 60, 61, 62 | That `defaultValue`, no `min` | open |

### Minor

| Id | Component | Finding | Status |
|---|---|---|---|
| S-2 | SequenceDots | A `mark` part given as a function or a node logs React's missing-key warning | open |
| S-3 | SequenceDots | `tone="accent"` marks are 2.56 to 2.59:1 against the card on all four tints | open |
| S-4 | SequenceDots | Skeleton size differs from the data: `sm` dots 56px loading, 48px loaded; with `onAction` 66x10 loading, 120x24 loaded | open |
| S-5 | SequenceDots | The tooltip of a pressable mark is not its description (`aria-describedby` is null), and the summary holds labels only | open |
| M-5 | MediaCard | Compact width steps fire at a card width of 254 and 194px, not 220 and 160 (the query measures the content box); hero at 222 and 162 | open |
| M-6 | MediaCard | Focus ring over a light picture (`behind`): 1.43:1 at the top edge | open |
| M-7 | MediaCard | The article has no name while loading, or when `title` is replaced through `parts` (`aria-labelledby` points at a missing id); without a `title` an empty heading is rendered | open |
| M-8 | MediaCard | With `meta`, `category` and `actions` hidden by `null` parts, an empty 28px footer row stays | open |
| M-9 | MediaCard | `MediaCardActionsProps` is not exported though `parts.actions` uses it; the spec's props table lacks `selected` and `moreLabel` and still says "No `selected`"; no `selected` in the component's own stories | open |
| C-3 | Comparison | Skeleton rows with bars are 26.3px, loaded rows 30px | open |
| C-4 | Comparison | Very long values overflow and are clipped with no ellipsis or tooltip | open |
| C-5 | Comparison | The second side carries `data-part="opposite"`, not `side` as the anatomy names it | open |
| C-6 | Comparison, MediaCard stories | Sample icons use `EntityIcon name`, so headers read "Region A Region A" | open |
| T-8 | Time | A selected slot with `aria-label` does not say "Selected" | open |
| T-9 | Time | Loading does not hold the layout without `slotsPerDay` | open |
| T-10 | Time | The `font` tokens do not resize `small` | open |
| T-11 | Time | `slot`, `placeholder` and `day` have no `data-part` | open |
| T-12 | Time | `weekEmpty: null` leaves a blank row | open |
| T-13 | Time | An invalid `today`, `month` or `date` throws, while an invalid item date is dropped silently | open |
| T-14 | Time | The two Shrinking stories are clipped at 1024x600 | open |
| T-15 | Time | Steps fire at 132/68/60/52px, not 128/64/56/48; `hiddenItemsLabel` and `moreLabel` are missing from the props tables of the specs | open |
| I-6 | SplitButton, Menu | Duplicate item ids unmount the tree when the menu opens | open |
| I-7 | Stepper | `required` does not block submit | open |
| I-8 | StarRating, Slider | A `FormField` label press focuses nothing | open |
| I-9 | SplitButton | Drops `id` | open |
| I-10 | StarRating | Without `name` it submits under a generated key | open |
| I-11 | StarRating | The skeleton omits the value text | open |
| I-12 | ColorScaleEditor | Its six `--umbra-color-scale-editor-*` tokens are missing from `docs/customisation-tables.md` | open |
| I-13 | Stepper | Shows a clamped value but submits the raw one | open |
| I-14 | Slider | The scrubber thumb target is 20px wide | open |
| I-15 | Slider | Duplicate marks log a key error | open |
| I-16 | SplitButton | `onPress` receives a press event | open |
| I-17 | ColorScaleEditor | At 180px the colour select shows only its caret | open |
| X-1 | ScheduleSlot spec | "fixture chip" is a sport term in a spec | open |

### Test gaps named by the review

No test for more than about 50 marks in SequenceDots; none presses Previous/Next up to a month limit, swaps state with focus in the grid, or pages from an outside day; no "nothing moves" measurement for loading in any of the 12, and no strip-loading case; MediaCard has no focus tooltip test, no long title on a button card, and widths are checked only at 300/210/150px; Comparison's strip width steps (320, 260) are untested; shrink tests in the time and inputs files sample fixed widths only (no sweep or boundary); inputs have no native reset, `required` or `readOnly` toggling tests.

### Verified correct

Tokens, parts and blocks of the data group (25 token values set on an ancestor applied); 1px shrink sweeps of the data group identical both ways and equal to a fresh mount; keyboard of the data group; 22 stories at four sizes and three densities, the other tints and right to left with no page scroll, no console output and axe clean; server rendering of all 12 components; no third-party type in any `dist/**/*.d.ts`; 12 sampled mutations all caught by the tests; locales, week starts, non-Latin digits, leap day and year boundary in the time group. Not verified: a real screen reader, Firefox and Safari, hydration.
