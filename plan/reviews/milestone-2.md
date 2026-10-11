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
